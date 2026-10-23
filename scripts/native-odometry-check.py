import json, math, os, pathlib, signal, subprocess, sys, threading, time
import rclpy
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist

root, out = map(pathlib.Path, sys.argv[1:])
rclpy.init()
node = rclpy.create_node('odometry_parity_fixture')
pub = node.create_publisher(Odometry, '/odom', 10)
received = []
sub = node.create_subscription(Twist, '/cmd_vel', lambda msg: received.append(msg), 10)
pose = [0.4, -0.2, math.pi / 2, 0.2]
def publish():
    msg = Odometry()
    msg.header.stamp = node.get_clock().now().to_msg()
    msg.header.frame_id = 'odom'
    msg.child_frame_id = 'base_link'
    msg.pose.pose.position.x, msg.pose.pose.position.y = pose[:2]
    msg.pose.pose.orientation.z = math.sin(pose[2] / 2)
    msg.pose.pose.orientation.w = math.cos(pose[2] / 2)
    msg.twist.twist.linear.x = pose[3]
    pub.publish(msg)
timer = node.create_timer(0.05, publish)
thread = threading.Thread(target=rclpy.spin, args=(node,), daemon=True)
thread.start()
records = []
def execute(command, timeout=12, overlay=None):
    script = command
    if overlay:
        script = 'source ' + str(overlay / 'install/setup.bash') + '\n' + command
    process = subprocess.Popen(['bash', '-c', script], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, start_new_session=True)
    try:
        output, _ = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGINT)
        try:
            output, _ = process.communicate(timeout=4)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            output, _ = process.communicate()
    records.append(dict(command=command, code=process.returncode, output=output))
    return process.returncode, output
try:
    for command in json.loads((root / 'commands.json').read_text()):
        continuous = 'pub --rate' in command
        code, output = execute(command, timeout=3 if continuous else 12)
        if continuous:
            assert 'publishing #' in output, (command, output)
        else:
            assert code == 0, (command, output)
        if '--field header.frame_id' in command: assert 'odom' in output
        if '--field child_frame_id' in command: assert 'base_link' in output
        if '--field pose.pose.position' in command: assert 'x: 0.4' in output and 'y: -0.2' in output
    assert received, 'Velocity publications never reached the native subscriber'
    code, output = execute('ros2 topic echo /odom --once --field pose.position')
    assert code != 0 and 'Invalid field' in output, output
    for language in ['python', 'cpp']:
        ws = root / language
        _, output = execute('ros2 run odom_lab reader', timeout=3, overlay=ws)
        assert 'x=0.400 y=-0.200 yaw=1.571 v=0.200' in output, output
        code, output = execute('ros2 run odom_lab reader')
        assert code != 0 and 'not found' in output, output
        result = subprocess.run(['colcon', 'build', '--packages-select', 'odom_lab'], cwd=ws / 'src', capture_output=True, text=True, timeout=120)
        assert result.returncode == 0, result.stdout + result.stderr
        assert (ws / 'src/install/setup.bash').exists()
    (out / 'native.json').write_text(json.dumps(records, indent=2) + '\n')
    print('PASS native commands, both unchanged readers, wrong field, unsourced overlay and src build location')
finally:
    rclpy.shutdown()
    thread.join(timeout=3)
    node.destroy_node()
    subprocess.run(['ros2', 'daemon', 'stop'], capture_output=True, timeout=10)
