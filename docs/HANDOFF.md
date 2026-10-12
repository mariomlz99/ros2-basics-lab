# Supported behavior and native handoff

## Workstation

The in-memory filesystem starts with `/home/student`, `/opt/ros/jazzy`, `/tmp` and `/etc`. Paths support home expansion, relative components and root clamping. Terminals share files and the graph but own their working directory, history, environment and foreground task. The Jazzy base environment is available initially; workspace overlays must be sourced separately in each terminal.

Shell commands: `pwd`, `cd`, `ls` (`-a`, `-l`), `mkdir` (`-p`), `touch`, `cat`, `cp` (`-r`), `mv`, `rm` (`-r`, `-f`), `tree`, `echo`, `clear`, `history`, `which`, `printenv`, and controlled `source`. Quotes, simple environment expansion and unquoted `*`/`?` wildcard paths work. Quoted wildcards stay literal, and `*` does not match hidden files. `echo text > file` creates or overwrites a file; `echo text >> file` appends; `echo -n` omits the redirected newline. Other output redirection, pipes, input redirection, command substitution, sudo and arbitrary native programs are unsupported and rejected. Bounded scripts and CLI topic job control are described below; this is not a complete Bash implementation.

The terminal supports `nano <file>` as a bounded in-terminal editor: Ctrl+O then Enter writes the current filename, Ctrl+S saves directly, and Ctrl+X exits with a save/discard choice. `gedit <file>` opens the workspace editor; both modify the same virtual filesystem. Conflicting edits from another editor are rejected before overwriting. `nano ~/.bashrc` and `gedit ~/.bashrc` work, and each new terminal executes its supported startup commands. `source ~/.bashrc` updates the current shell; restoring a saved terminal preserves its existing environment. These are teaching editors, not the native applications; Vim is not implemented.

Use Ctrl+Shift+V to paste in the terminal. The terminal supports Ctrl+C, history arrows, cursor editing, Ctrl+A/E/U/K/W/L, Tab path completion and Ctrl+D to close an empty terminal. Closing a terminal stops its processes and subscriptions.

CMake files have local command and argument completion, package/target/source-file suggestions, variable completion, syntax colors and call help. Use Ctrl+Space, Tab and Esc. This assistance reads the current file and workspace; it is not a CMake language server or native configure step. The editor disables browser spelling and requests that writing-assistant extensions ignore code.

## Packages and builds

New `ament_cmake` packages preserve the native Jazzy `CMakeLists.txt` template, including comments, warning settings, target settings and the lint/testing block. The browser recognizes this stock configuration; it does not run CMake or linters, reproduce warning flags, or support arbitrary conditional logic. The C++ runtime uses C++17. Lesson replacement examples remain concise edited configurations. Existing files are never rewritten automatically. Verify template parity with `source /opt/ros/jazzy/setup.bash; python3 scripts/capture-cmake-templates.py --check --build`.

The course uses `~/ros2_ws`, but builds discover packages recursively below the current terminal directory. Folders marked `COLCON_IGNORE` are skipped. Package names come from package.xml. An empty build creates build/install/log spaces and reports zero packages; unknown `--packages-select` names produce warnings. Building from src/ creates src/build and src/install, so the setup file to source depends on where you built. The model retains one current install record per package name; full native overlay precedence between multiple versions of the same package is not implemented. `ros2 pkg create` supports `ament_python`, `ament_cmake`, dependencies, node name and the Apache-2.0 template license. The package parser reads beginner metadata and dependencies, rejecting malformed or unsupported configuration.

`colcon build` and `colcon build --packages-select ...` validate current files. Python checks actual syntax in CPython without executing package modules. Imports and entry-point lookup happen when the installed executable runs. C++ uses actual Clang/LLD diagnostics. A failed first build produces no installed package; a failed rebuild preserves the last successful installation. Successful builds create virtual build/install/log directories and setup scripts. Source edits mark the workspace as needing a rebuild but leave the installed program runnable. A successful rebuild replaces that installation. Builds at different directory levels remain separate; AMENT_PREFIX_PATH selects the installed package. Re-sourcing a prefix already present does not reorder it.

Supported CMake calls are `cmake_minimum_required`, `project`, `find_package(... REQUIRED)`, `add_executable`, `ament_target_dependencies`, `install(TARGETS ... DESTINATION lib/${PROJECT_NAME})`, `install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})`, and `ament_package`. Executables have one source file each. Interface packages additionally accept the demonstrated `rosidl_generate_interfaces` form. Arbitrary CMake, external libraries, colcon plugins and arbitrary setup.py execution are not supported.

## ROS communication

Topic echo distinguishes an undiscovered type (native warning followed by an error), a discovered custom type unavailable in the terminal (native invalid-type error), and an explicitly supplied available type (waits silently for messages). After adding an interface package, re-source the receiving terminal even if it previously sourced the workspace. Native fixtures: `scripts/capture-topic-echo.py`; matching lab cases: `tests/topic-echo-parity.test.js`.

Use `ros2 --help` or a subcommand’s `--help` for exact CLI forms. The modeled CLI includes package creation/listing/executables, node inspection, topic list/type/info/echo/hz/pub, interface list/show, scalar parameters, services, run and declarative launch. Topic publishers, echo subscriptions and launch children are owned by their terminal and removed on stop. Python and C++ processes exchange messages on the same graph. The base channels `/rosout` (`rcl_interfaces/msg/Log`) and `/parameter_events` (`rcl_interfaces/msg/ParameterEvent`) have a modeled, hidden CLI-daemon publisher. Running nodes add their own publishers and produce real logger messages and parameter declaration/change events. Echo stays silent until an event occurs. Stopping a node or CLI subscription removes its endpoints; the base publisher remains. This models the standard CLI environment without running a native daemon.

The canonical interface registry supplies standard message/service fields, arrays, constants, defaults, generated teaching types and validation. JavaScript numbers restrict exact integers to the safe-integer range. Custom `.msg` files support scalar bool, int32, int64, float32, float64 and string fields; arbitrary rosidl syntax is not implemented.

The beginner APIs include node creation, publishers, subscriptions, timers, scalar parameters, services and asynchronous clients. Launch safely parses the shown `LaunchDescription`/`Node` form with package, executable, name, namespace, parameters and remappings. It does not execute arbitrary launch Python. Native DDS discovery, RMW, QoS guarantees, actions, full ROS APIs and native Linux processes are outside this lab’s contract.

The optional playground creates robot, LiDAR and camera endpoints only when explicitly started. It has its own saved workspace and graph, separate from the graded course. LiDAR no-return readings use range_max; a two-second command timeout stops the robot. This is a teaching simulation, not a physics or sensor accuracy model.

## Native ROS 2 Jazzy

On an Ubuntu 24.04 system with Jazzy and colcon installed, export the source workspace from the lab. Unpack `ros2-basics-workspace.tar` in your home directory, then:

```sh
source /opt/ros/jazzy/setup.bash
cd ~/ros2_ws
colcon build
source install/setup.bash
ros2 run my_first_package talker
```

In another terminal, source both setup scripts and run `ros2 run my_first_package listener`. These are the package and executable names created by Units 4–6 in either language. Package files are ordinary ROS source files; exported build artifacts are deliberately omitted.

To regenerate the complete reference workspace from this repository:

```sh
node scripts/native-reference.mjs
source /opt/ros/jazzy/setup.bash
cd artifacts/native/ros2_ws
colcon build
source install/setup.bash
python3 ../../../scripts/native-check.py
```

Run the native validation with no conflicting course nodes active. The script starts and cleans up its own processes. Reference examples were validated against local Jazzy in the preceding implementation session: mixed-language pub/sub, parameters, Python/C++ services and clients, launch/remapping and StudentStatus. Arbitrary learner changes can use APIs outside the browser subset and require independent native validation.

## UI and persistence

English, French and Dutch cover lesson explanations and workstation controls. Commands, source code and runtime diagnostics retain their original text. Switching languages or themes preserves live workstation state. Workspaces, installed Python/C++ artifacts, terminal environments/history, lesson positions, completion progress and workspace-editor drafts autosave to IndexedDB. Save session requests an immediate save. Running processes and Python interpreter variables are not resumed; save nano buffers before leaving. Browser storage is scoped to the site origin and browser profile and may be cleared; source export provides a portable copy. The playground has its own files, terminals and graph; returning to the course restores the separate course workspace. Workspace reset requests confirmation, and lesson reset restores the snapshot from first entering that lesson.


Later lessons can be started independently using Prepare this lesson. It creates prerequisite packages from the visible examples, builds them with the real browser runtimes, and sources the result without awarding earlier lesson completion. Existing packages are preserved; errors in existing student work remain errors to fix.

`python3`, `python3 script.py [args]`, `python3 -c "code"`, and `python3 --version` use a CPython/Pyodide worker. The interactive interpreter supports multiline input, exit() and Ctrl+D. Ctrl+C can terminate a busy interpreter. Text files under the virtual home directory synchronize back to the workspace; simultaneous edits in another editor are kept instead of overwritten. Binary-file persistence, native OS processes and arbitrary pip installs are not supported. Standard-library imports and Pyodide-distributed packages, including NumPy, run in the browser. Python package builds and ROS node workers load supported imported packages on demand. Use ros2 run for the modeled ROS graph APIs.

Tab completion includes ROS verbs, sourced package executables and launch files, and live graph names. Unsourced terminal environments do not receive workspace executable suggestions.

Terminal parity checks live in `tests/terminal-semantics.test.js`; `bash scripts/native-terminal-check.sh` verifies the corresponding workflows using native Jazzy in a temporary workspace. The shell supports assignments, export/unset, comments, source, executable lookup through PATH or explicit paths, chmod for executable bits, and bounded Bash scripts. Pipes, control-flow syntax, command substitution and arbitrary native binaries remain explicitly unsupported.


### Optional robotics mini-exercises

The playground has an introduction, independent odometry/TF/LiDAR/camera exercises,
and an optional Python/C++ sensor-reader package. The required seven lessons remain
robot-free. A fresh playground must be started explicitly. Each mini-exercise explains
terminal ownership, observations, and stopping motion before resetting the pose.

The standard topics are `/cmd_vel` (`geometry_msgs/msg/Twist`), `/odom`
(`nav_msgs/msg/Odometry`), `/tf` and `/tf_static` (`tf2_msgs/msg/TFMessage`),
`/scan` and `/camera/image_raw`. Dynamic TF and odometry use the same robot pose;
the frames are `odom → base_link → laser_link` and
`odom → base_link → camera_link → camera_optical_frame`. Mount heights and camera
projection share the sensor catalog. Camera optical axes follow ROS conventions.
Fixed transforms use modeled transient-local retention while the publisher lives.
Inspection uses standard `ros2 topic echo --once`, composite/scalar `--field`, and
explicit `--qos-durability transient_local --qos-reliability reliable` for static TF.

The robot model advances at 20 Hz; camera, scan, odometry and dynamic TF publish at
10 Hz while the tab is active. These are browser scheduling targets, not real-time
guarantees. Stamps use the browser wall clock. Odometry is ideal simulator pose,
with zero covariance; no wheel noise, localization, drift, DDS transport or Gazebo
physics is implied. The browser currently teaches TF by inspecting its standard
messages, not by providing a complete tf2 buffer, tf2_echo executable or RViz.
QoS support here models the retained latest sample for each static publisher;
it does not model network loss or every DDS QoS policy. Array-valued `--field`
selection is not modeled; the full scan message exposes its ranges.

The native reference capture (`scripts/capture-playground-native.py`, after sourcing
Jazzy) runs every inspection command with native messages on a private ROS domain,
checks velocity/stop commands, and composes the tree with native tf2.
`native-sensor-readers.py` also creates temporary native workspaces, builds the
exact visible Python/C++ reader sources and checks both execution and the
expected failure before sourcing. The inspection outputs
are compared verbatim by `tests/playground-native.test.js`. The browser check
`scripts/playground-exercises-check.mjs` follows every guided page, builds and runs
both sensor readers with real Python/Clang workers, checks sensor cadence, and
checks that leaving the playground stops its simulator. These checks do not claim
that an arbitrary physical robot will have the same topic names or geometry.

### Free Lab

Free Lab uses the same supported filesystem, terminal, build and runtime implementation without a checker. Its workspace saves and resets independently from the course and Playground. Enable the optional robotics tools when needed.
