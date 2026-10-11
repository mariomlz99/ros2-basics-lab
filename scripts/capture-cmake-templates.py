#!/usr/bin/env python3
"""Source Jazzy first. Capture/check real ros2pkg output; --build also builds/runs it."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
parser.add_argument('--build', action='store_true')
args = parser.parse_args()
destination = Path(__file__).resolve().parents[1] / 'tests/fixtures/native-cmake-templates.json'
cases = []
with tempfile.TemporaryDirectory(prefix='jazzy-cmake-templates-') as directory:
    root = Path(directory)
    (root / 'src').mkdir()
    for node in [None, 'hello']:
        for dependencies in [[], ['rclcpp', 'std_msgs']]:
            name = 'cmake_' + ('node' if node else 'empty') + ('_deps' if dependencies else '')
            command = ['ros2', 'pkg', 'create', '--build-type', 'ament_cmake', '--license', 'Apache-2.0']
            if node:
                command += ['--node-name', node]
            command += [name]
            if dependencies:
                command += ['--dependencies', *dependencies]
            subprocess.run(command, cwd=root / 'src', check=True, capture_output=True, text=True)
            cases.append(dict(name=name, node=node, dependencies=dependencies, command=' '.join(command),
                              cmake=(root / 'src' / name / 'CMakeLists.txt').read_text()))
            duplicate = subprocess.run(command, cwd=root / 'src', capture_output=True, text=True)
            assert duplicate.returncode != 0
            assert (root / 'src' / name / 'CMakeLists.txt').read_text() == cases[-1]['cmake']
    if args.build:
        built = subprocess.run(['colcon', 'build'], cwd=root / 'src', capture_output=True, text=True)
        assert built.returncode == 0, built.stdout + built.stderr
        assert not (root / 'install/setup.bash').exists(), 'Build from src must install under src'
        wrong = subprocess.run(['bash', '-c', 'source install/setup.bash'], cwd=root, capture_output=True)
        assert wrong.returncode != 0
        for case in cases:
            if not case['node']:
                continue
            run = subprocess.run(['bash', '-c', 'source src/install/setup.bash\nros2 run "$1" hello',
                                  'cmake-parity', case['name']], cwd=root, capture_output=True, text=True)
            assert run.returncode == 0, run.stdout + run.stderr
            assert run.stdout == f"hello world {case['name']} package\n", run.stdout
        print('PASS native colcon build for four templates and both hello executables')
record = dict(distribution='jazzy', cases=cases)
if args.check:
    assert json.loads(destination.read_text()) == record, 'Native CMake templates differ from fixtures'
    print('PASS native Jazzy CMake templates: all four variants match fixtures byte for byte')
else:
    destination.write_text(json.dumps(record, indent=2) + '\n')
    print(f'Captured {len(cases)} native Jazzy CMake templates')
