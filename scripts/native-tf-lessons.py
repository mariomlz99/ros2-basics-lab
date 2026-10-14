"""Exercise generated lesson executables against native Jazzy publishers."""
import json
import math
import os
import pathlib
import re
import signal
import subprocess
import sys
import time

root, artifacts = map(pathlib.Path, sys.argv[1:3])
os.environ['ROS_DOMAIN_ID'] = '173'
os.environ['ROS_LOG_DIR'] = str(root / 'ros-log')

import rclpy
from rclpy.node import Node
from tf2_ros import StaticTransformBroadcaster, TransformBroadcaster
from geometry_msgs.msg import TransformStamped

rclpy.init()
node = Node('tf_native_lesson_fixture')
static = StaticTransformBroadcaster(node)
dynamic = TransformBroadcaster(node)


def frame(parent, child, x, y, yaw):
    value = TransformStamped()
    value.header.frame_id = parent
    value.child_frame_id = child
    value.header.stamp = node.get_clock().now().to_msg()
    value.transform.translation.x = float(x)
    value.transform.translation.y = float(y)
    value.transform.rotation.z = math.sin(yaw / 2)
    value.transform.rotation.w = math.cos(yaw / 2)
    return value


static.sendTransform(frame('base_link', 'laser_link', .12, 0, 0))
node.create_timer(.05, lambda: dynamic.sendTransform(frame('odom', 'base_link', .5, -.25, math.pi / 2)))
results = []
cases = [
    ('lookup', r'x = 0\.12, y = 0\.00 m'),
    ('point', r'x = 1\.25, y = -0\.50 m'),
    ('wrong_lookup', r'laser.*(?:does not exist|exist)'),
]
try:
    for language in ['python', 'cpp']:
        for executable, expected in cases:
            workspace = root / language
            log_path = artifacts / f'native-{language}-{executable}.log'
            with log_path.open('w') as output:
                # Pass the workspace as argv, not interpolated shell code.
                process = subprocess.Popen(
                    ['bash', '-c', 'source "$1/install/setup.bash" && exec ros2 run tf_lab "$2"',
                     'tf-native', str(workspace), executable],
                    stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
                try:
                    deadline = time.monotonic() + 8
                    while time.monotonic() < deadline:
                        rclpy.spin_once(node, timeout_sec=.05)
                        if re.search(expected, log_path.read_text()):
                            break
                        if process.poll() is not None:
                            break
                finally:
                    if process.poll() is None:
                        os.killpg(process.pid, signal.SIGINT)
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        os.killpg(process.pid, signal.SIGKILL)
                        process.wait()
            log = log_path.read_text()
            result = {'language': language, 'executable': executable,
                      'expected': expected, 'passed': bool(re.search(expected, log)),
                      'output': log}
            results.append(result)
            print(('PASS' if result['passed'] else 'FAIL') + f' native {language} {executable}', flush=True)
            if not result['passed']:
                print(log, flush=True)
finally:
    node.destroy_node()
    rclpy.shutdown()

(artifacts / 'native-lessons.json').write_text(json.dumps({
    'robot_pose': {'x': .5, 'y': -.25, 'yaw': math.pi / 2},
    'world_target': {'x': 1, 'y': 1, 'z': 0},
    'cases': results,
}, indent=2))
assert all(result['passed'] for result in results), 'A native TF lesson failed'
