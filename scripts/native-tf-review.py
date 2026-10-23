"""Native tf2 is the independent oracle for the exact browser probe sources."""
import json, os, pathlib, re, signal, subprocess, sys, time
root, artifacts = map(pathlib.Path, sys.argv[1:3])
os.environ['ROS_DOMAIN_ID'] = '174'
os.environ['ROS_LOG_DIR'] = str(root / 'logs')
import rclpy
from rclpy.node import Node
from tf2_ros import StaticTransformBroadcaster, TransformBroadcaster
from geometry_msgs.msg import TransformStamped
scenarios = json.loads((root / 'scenarios.json').read_text())
rclpy.init()
node = Node('native_tf_review_fixture')
static, dynamic = StaticTransformBroadcaster(node), TransformBroadcaster(node)
def message(value):
    result = TransformStamped()
    result.header.frame_id = value['header']['frame_id']
    result.child_frame_id = value['child_frame_id']
    result.header.stamp = node.get_clock().now().to_msg()
    for field in ['translation', 'rotation']:
        for key, number in value['transform'][field].items():
            setattr(getattr(result.transform, field), key, float(number))
    return result
static.sendTransform([message(t) for t in scenarios['static']['transforms']])
current = scenarios['cases'][0]
timer = node.create_timer(.05, lambda: dynamic.sendTransform([message(t) for t in current['dynamic']['transforms']]))
def agrees(actual, expected):
    if len(actual) != len(expected):
        return False
    if len(actual) == 7:
        translation = all(abs(a-b) < 1e-9 for a,b in zip(actual[:3], expected[:3]))
        # q and -q encode exactly the same orientation; native tf2 may choose either.
        rotation = min(max(abs(a-b) for a,b in zip(actual[3:], expected[3:])), max(abs(a+b) for a,b in zip(actual[3:], expected[3:]))) < 1e-9
        return translation and rotation
    return all(abs(a-b) < 1e-9 for a,b in zip(actual, expected))
results = []
try:
    for language in ['python', 'cpp']:
        current = scenarios['cases'][0]
        command = ['python3', str(root / 'probe.py')] if language == 'python' else [str(root / 'install/tf_probe/lib/tf_probe/probe')]
        log_path = artifacts / ('native-review-' + language + '.log')
        with log_path.open('w') as log:
            process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                for index, current in enumerate(scenarios['cases']):
                    offset = log_path.stat().st_size
                    deadline = time.monotonic() + 12
                    matched = False
                    while time.monotonic() < deadline:
                        rclpy.spin_once(node, timeout_sec=.05)
                        values = {tag: [float(x) for x in numbers.split()] for tag, numbers in re.findall(r'CHECK (\w+) ([^\n]+)', log_path.read_text()[offset:])}
                        matched = all(tag in values and agrees(values[tag], expected) for tag, expected in current['expected'].items())
                        if matched or process.poll() is not None:
                            break
                    results.append({'language': language, 'index': index, 'pose': current['pose'], 'passed': matched, 'values': values})
                    print(('PASS' if matched else 'FAIL') + f' native {language} pose {index}', flush=True)
                    if not matched:
                        raise AssertionError(log_path.read_text()[offset:])
            finally:
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGINT)
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
finally:
    node.destroy_node()
    rclpy.shutdown()
    (artifacts / 'native-review.json').write_text(json.dumps(results, indent=2))
