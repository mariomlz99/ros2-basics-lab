#!/usr/bin/env python3
"""Capture native Jazzy echo failures and custom-interface delivery in a private domain."""
import argparse
import json
import os
from pathlib import Path
import random
import signal
import subprocess
import sys
import tempfile
import time

parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
fixture = project / 'tests/fixtures/native-topic-echo.json'
files = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {customFiles} from './src/examples.js'; console.log(JSON.stringify(customFiles()));"], cwd=project))
message = next(Path(name).stem for name in files if name.endswith('.msg'))
message_type = 'tutorial_interfaces/msg/' + message
topic = '/student_status'
env = dict(os.environ, ROS_DOMAIN_ID=str(random.randrange(120,180)),
           ROS_AUTOMATIC_DISCOVERY_RANGE='LOCALHOST', PYTHONUNBUFFERED='1')
processes = []
cases = {}

def capture(key, command, environment=env):
    result = subprocess.run(command, env=environment, capture_output=True, text=True, timeout=20)
    cases[key] = dict(command=' '.join(command), stdout=result.stdout, stderr=result.stderr, code=result.returncode)
    return result

def stop(process):
    if process.poll() is None:
        process.send_signal(signal.SIGINT)
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()

with tempfile.TemporaryDirectory(prefix='jazzy-echo-parity-') as directory:
    root = Path(directory)
    try:
        capture('absent', ['ros2','topic','echo','/prova'])
        capture('explicit_invalid', ['ros2','topic','echo',topic,'missing/msg/Status'])
        waiting = subprocess.Popen(['ros2','topic','echo','/not_started','std_msgs/msg/String'],
                                   env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        processes.append(waiting)
        time.sleep(2)
        assert waiting.poll() is None, 'Explicit known type must wait without a publisher'
        stop(waiting)
        out, err = waiting.communicate()
        assert not out.strip() and not err.strip(), (out, err)
        for name, content in files.items():
            target = root / 'src/tutorial_interfaces' / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
        built = subprocess.run(['colcon','build'], cwd=root, env=env, capture_output=True, text=True)
        assert built.returncode == 0, built.stdout + built.stderr
        exported = subprocess.check_output(['bash','-c','source "$1"\nenv -0','echo-parity',str(root/'install/setup.bash')], env=env)
        sourced = dict(item.decode().split('=',1) for item in exported.split(b'\0') if item)
        program = f'''import rclpy
from tutorial_interfaces.msg import {message}
rclpy.init()
node = rclpy.create_node('echo_parity_publisher')
publisher = node.create_publisher({message}, '{topic}', 10)
message = {message}(name='Ada', counter=7, ready=True)
timer = node.create_timer(0.1, lambda: publisher.publish(message))
print('READY', flush=True)
rclpy.spin(node)
'''
        publisher = subprocess.Popen([sys.executable,'-u','-c',program], env=sourced,
                                     stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        processes.append(publisher)
        assert publisher.stdout.readline().strip() == 'READY'
        time.sleep(1)
        capture('custom_unsourced', ['ros2','topic','echo',topic])
        capture('custom_explicit_unsourced', ['ros2','topic','echo',topic,message_type])
        result = capture('custom_sourced', ['ros2','topic','echo',topic,'--once'], sourced)
        assert result.returncode == 0 and 'name: Ada' in result.stdout, result
        stop(publisher)
        time.sleep(1)
        capture('custom_stopped', ['ros2','topic','echo',topic], sourced)
    finally:
        for process in processes:
            stop(process)

record = dict(distribution='jazzy', messageType=message_type, topic=topic,
              typedWithoutPublisher='waits silently', cases=cases)
if args.check:
    assert json.loads(fixture.read_text()) == record, json.dumps(record,indent=2)
else:
    fixture.write_text(json.dumps(record,indent=2)+'\n')
print('PASS native echo: absent topic, explicit type waiting, unavailable custom types, sourced delivery and stopped publisher')
print(json.dumps(cases,indent=2))
