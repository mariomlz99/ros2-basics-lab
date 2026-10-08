#!/usr/bin/env python3
"""Capture Jazzy argparse text without starting nodes. Source Jazzy first.
Run from the project root. --check compares committed captures to local ROS.
"""
import json, os, pathlib, subprocess, sys
commands = [['topic', '--help']]
for verb in ['echo', 'pub', 'hz', 'info', 'type', 'list']:
    commands.append(['topic', verb, '--help'])
    if verb != 'list': commands.append(['topic', verb])
commands += [['topic', 'pub', '/example'], ['topic', 'echo', '--once'], ['topic', 'echo', '--h'], ['node', 'list', '--help']]
for flag in ['--rate', '-r', '--times', '-t', '--wait-matching-subscriptions', '-w', '--keep-alive']:
    commands.append(['topic', 'pub', flag])
captures = {}
for args in commands:
    result = subprocess.run(['ros2', *args], capture_output=True, text=True,
                            env=dict(os.environ, COLUMNS='80', LC_ALL='C.UTF-8'), timeout=10)
    assert result.returncode == (0 if args[-1] in ['--help','--h'] else 2), (args, result)
    captures[' '.join(args)] = {'status': result.returncode, 'text': (result.stdout + result.stderr).rstrip('\n')}
path = pathlib.Path('src/native-topic-help.js')
content = '// Generated from native ROS 2 Jazzy by scripts/capture-topic-help.py (COLUMNS=80).\n'
content += '// Reference help includes native options beyond the simulator implementation.\n'
content += 'export const nativeTopicHelp = ' + json.dumps(captures, ensure_ascii=False, indent=2) + ';\n'
if '--check' in sys.argv:
    assert path.read_text() == content, 'Native Jazzy help differs; inspect before regenerating.'
    print('PASS: all topic help and incomplete-command captures match native Jazzy')
else:
    path.write_text(content)
    print('Captured', len(captures), 'native topic help/error responses in', path)
