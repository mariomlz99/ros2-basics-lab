"""Build and run the Unit 7 workspace exports with native Jazzy."""
import json
import os
from pathlib import Path
import shlex
import signal
import subprocess
import tarfile
import tempfile
import time

evidence = Path('artifacts/audit').resolve()
reports = []
for index, language in enumerate(('python', 'cpp')):
    root = Path(tempfile.mkdtemp(prefix='ros2-export-' + language + '-'))
    with tarfile.open(evidence / ('native-' + language + '.tar')) as archive:
        archive.extractall(root, filter='data')
    workspace = root / 'ros2_ws'
    env = os.environ.copy()
    env.update(ROS_DOMAIN_ID=str(194 + index), ROS_AUTOMATIC_DISCOVERY_RANGE='LOCALHOST', ROS_LOG_DIR=str(root / 'ros-logs'))
    for name in ('AMENT_PREFIX_PATH', 'CMAKE_PREFIX_PATH', 'COLCON_PREFIX_PATH'):
        env.pop(name, None)
    def command(args, overlay=True):
        return ['bash', '-c', 'source /opt/ros/jazzy/setup.bash\n' + ('source install/setup.bash\n' if overlay else '') + 'exec ' + shlex.join(args)]
    def run(args, overlay=True, timeout=120):
        p = subprocess.run(command(args, overlay), cwd=workspace, env=env, capture_output=True, text=True, timeout=timeout)
        if p.returncode:
            raise RuntimeError(shlex.join(args) + '\n' + p.stdout + p.stderr)
        return p.stdout + p.stderr
    build = run(['colcon', 'build'], overlay=False, timeout=240)
    processes = []
    def start(args, name):
        path = root / (name + '.log')
        output = path.open('w')
        process = subprocess.Popen(command(args), cwd=workspace, env=env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
        processes.append((process, output))
        return path
    def until(path, text):
        for _ in range(150):
            if text in path.read_text():
                return
            time.sleep(0.1)
        raise AssertionError(str(path) + '\n' + path.read_text())
    try:
        service_pkg = 'py_service' if language == 'python' else 'cpp_service'
        server = start(['ros2', 'run', service_pkg, 'server'], 'server')
        call = run(['ros2', 'service', 'call', '/add_two_ints', 'example_interfaces/srv/AddTwoInts', '{a: 7, b: 8}'], timeout=30)
        assert 'sum=15' in call, call
        client = run(['ros2', 'run', service_pkg, 'client'], timeout=30)
        assert '5' in client, client
        launch = start(['ros2', 'launch', 'my_first_package', 'system.launch.py'], 'launch')
        until(launch, 'I heard:')
        assert 'Launched' in launch.read_text(), launch.read_text()
        status = start(['ros2', 'run', 'my_first_package', 'status'], 'status')
        message = run(['ros2', 'topic', 'echo', '/student_status', '--once'], timeout=30)
        assert 'Ada' in message, message
        report = dict(language=language, root=str(root), passed=True, build=build, call=call, client=client, launch=launch.read_text(), custom_message=message)
        reports.append(report)
        print('PASS native exported ' + language + ': build, service client/call, launch/remapping/parameter, custom message', flush=True)
    finally:
        for process, output in processes:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGINT)
                try:
                    process.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGTERM)
                    process.wait(timeout=5)
            output.close()
        (evidence / 'native-export.json').write_text(json.dumps(reports, indent=2))
