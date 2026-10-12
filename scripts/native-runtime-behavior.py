"""Run the same nested-type/lifecycle fixtures natively and check build alternatives."""
import json
import os
from pathlib import Path
import shlex
import signal
import subprocess
import time

evidence = Path('artifacts/audit').resolve()
reports = []
for index, exported in enumerate(json.loads((evidence / 'native-export.json').read_text())):
    language = exported['language']
    workspace = Path(exported['root']) / 'ros2_ws'
    env = os.environ.copy()
    env.update(ROS_DOMAIN_ID=str(196 + index), ROS_AUTOMATIC_DISCOVERY_RANGE='LOCALHOST', PYTHONUNBUFFERED='1', ROS_LOG_DIR=str(workspace / 'native-logs'))
    def command(args):
        return ['bash', '-c', 'source /opt/ros/jazzy/setup.bash\nsource install/setup.bash\nexec ' + shlex.join(args)]
    def run(args, cwd=workspace, timeout=120):
        p = subprocess.run(command(args), cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
        if p.returncode:
            raise RuntimeError(shlex.join(args) + '\n' + p.stdout + p.stderr)
        return p.stdout + p.stderr
    if language == 'python':
        path = workspace / 'src/my_first_package/setup.cfg'
        path.write_text(path.read_text().replace('=$base', ' = $base'))
    else:
        path = workspace / 'src/my_first_package/CMakeLists.txt'
        path.write_text(path.read_text().replace('ament_target_dependencies(talker rclcpp std_msgs tutorial_interfaces)', 'ament_target_dependencies(talker rclcpp)\nament_target_dependencies(talker std_msgs tutorial_interfaces)'))
    alternative = run(['colcon', 'build', '--packages-select', 'my_first_package'])
    run(['ros2', 'pkg', 'create', 'nested_pkg', '--build-type', 'ament_python' if language == 'python' else 'ament_cmake', '--node-name', 'probe', '--dependencies', 'rclpy' if language == 'python' else 'rclcpp', 'nav_msgs', 'geometry_msgs'], cwd=workspace / 'src')
    path = workspace / 'src/nested_pkg' / ('nested_pkg/probe.py' if language == 'python' else 'src/probe.cpp')
    path.write_text((evidence / ('nested-probe.py' if language == 'python' else 'nested-probe.cpp')).read_text())
    build = run(['colcon', 'build', '--packages-select', 'nested_pkg'])
    log = workspace / 'nested.log'
    output = log.open('w')
    process = subprocess.Popen(command(['ros2', 'run', 'nested_pkg', 'probe']), cwd=workspace, env=env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
    def until(text):
        for _ in range(150):
            if text in log.read_text():
                return
            time.sleep(0.1)
        raise AssertionError(log.read_text())
    try:
        until('NESTED_MESSAGE_OK')
        until('NESTED_SERVICE_OK')
        run(['ros2', 'param', 'set', '/nested_probe', 'phase', '1'])
        until('CLEANUP_OK')
        time.sleep(0.5)
        before = log.read_text().count('NESTED_MESSAGE_OK')
        time.sleep(0.7)
        assert log.read_text().count('NESTED_MESSAGE_OK') == before
        assert process.poll() is None
        reports.append(dict(language=language, passed=True, output=log.read_text(), build=build, alternative=alternative))
        print('PASS native ' + language + ': typed messages/services, explicit cleanup, valid build alternative', flush=True)
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGINT)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=5)
        output.close()
        (evidence / 'native-runtime-behavior.json').write_text(json.dumps(reports, indent=2))
