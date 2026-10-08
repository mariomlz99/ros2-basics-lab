#!/usr/bin/env bash
# Native counterpart of tests/terminal-semantics.test.js; never writes to /opt.
set -eo pipefail
source /opt/ros/jazzy/setup.bash
work=$(mktemp -d /tmp/ros-terminal-mirror.XXXXXX)
printf 'Native mirror workspace: %s\n' "$work"
mkdir -p "$work/src/terminal_mirror/src"
cat > "$work/src/terminal_mirror/package.xml" <<'XML'
<package format="3"><name>terminal_mirror</name><version>0.0.0</version><description>Native terminal parity check</description><maintainer email="student@example.com">Student</maintainer><license>Apache-2.0</license><buildtool_depend>ament_cmake</buildtool_depend><export><build_type>ament_cmake</build_type></export></package>
XML
cat > "$work/src/terminal_mirror/CMakeLists.txt" <<'CMAKE'
cmake_minimum_required(VERSION 3.8)
project(terminal_mirror)
find_package(ament_cmake REQUIRED)
add_executable(hello src/hello.cpp)
install(TARGETS hello DESTINATION lib/${PROJECT_NAME})
ament_package()
CMAKE
write_program() { printf '#include <iostream>\nint main(){std::cout << "%s" << std::endl;}\n' "$1" > "$work/src/terminal_mirror/src/hello.cpp"; }
write_program original
cd "$work"
colcon build > initial-build.log 2>&1
source install/setup.bash
[[ $(ros2 run terminal_mirror hello) == original ]]
write_program edited
[[ $(ros2 run terminal_mirror hello) == original ]]
printf 'PASS native: source edits preserve the installed executable\n'
printf 'invalid C++\n' > src/terminal_mirror/src/hello.cpp
if colcon build > failed-build.log 2>&1; then echo 'Expected a failed build'; exit 1; fi
[[ $(ros2 run terminal_mirror hello) == original ]]
printf 'PASS native: a failed rebuild preserves the installed executable\n'
write_program rebuilt
colcon build > rebuilt.log 2>&1
[[ $(ros2 run terminal_mirror hello) == rebuilt ]]
write_program nested
cd src
colcon build > nested-build.log 2>&1
[[ $(ros2 run terminal_mirror hello) == rebuilt ]]
source install/setup.bash
[[ $(ros2 run terminal_mirror hello) == nested ]]
source "$work/install/local_setup.bash"
[[ $(ros2 run terminal_mirror hello) == nested ]]
unset AMENT_PREFIX_PATH
source "$work/install/local_setup.bash"
[[ $(ros2 run terminal_mirror hello) == rebuilt ]]
printf 'PASS native: build location and sourced prefix select different installed executables\n'
source /opt/ros/jazzy/setup.bash
PATH=/usr/bin:/bin
if command -v ros2 >/dev/null; then echo 'ROS unexpectedly found'; exit 1; fi
/opt/ros/jazzy/bin/ros2 --help > /dev/null
source /opt/ros/jazzy/setup.bash
[[ $(command -v ros2) == /opt/ros/jazzy/bin/ros2 ]]
printf 'PASS native: PATH lookup, absolute execution and sourcing\n'
printf 'export MIRROR_STARTUP=loaded\n' > "$work/bashrc"
[[ $(bash --noprofile --rcfile "$work/bashrc" -ic 'echo "$MIRROR_STARTUP"' 2> "$work/bashrc-stderr.log") == loaded ]]
printf 'PASS native: interactive shell reads its startup file\n'
