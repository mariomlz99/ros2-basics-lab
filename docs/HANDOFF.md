# Supported behavior and native handoff

## Workstation

The in-memory filesystem starts with `/home/student`, `/opt/ros/jazzy`, `/tmp` and `/etc`. Paths support home expansion, relative components and root clamping. Terminals share files and the graph but own their working directory, history, environment and foreground task. The Jazzy base environment is available initially; workspace overlays must be sourced separately in each terminal.

Shell commands: `pwd`, `cd`, `ls` (`-a`, `-l`), `mkdir` (`-p`), `touch`, `cat`, `cp` (`-r`), `mv`, `rm` (`-r`, `-f`), `tree`, `echo`, `clear`, `history`, `which`, `printenv`, and controlled `source`. Quotes, simple environment expansion and unquoted `*`/`?` wildcard paths work. Quoted wildcards stay literal, and `*` does not match hidden files. `echo text > file` creates or overwrites a file; `echo text >> file` appends; `echo -n` omits the redirected newline. Other output redirection, pipes, input redirection, substitution, background jobs, sudo and arbitrary shell scripts are unsupported and rejected. This is not Bash.

The terminal supports `nano <file>` as a bounded in-terminal editor: Ctrl+O then Enter writes the current filename, Ctrl+S saves directly, and Ctrl+X exits with a save/discard choice. `gedit <file>` opens the workspace editor; both modify the same virtual filesystem. Conflicting edits from another editor are rejected before overwriting. `nano ~/.bashrc` and `gedit ~/.bashrc` work, and each new terminal executes its supported startup commands. `source ~/.bashrc` updates the current shell; restoring a saved terminal preserves its existing environment. These are teaching editors, not the native applications; Vim is not implemented.

Use Ctrl+Shift+V to paste in the terminal. The terminal supports Ctrl+C, history arrows, cursor editing, Ctrl+A/E/U/K/W/L, Tab path completion and Ctrl+D to close an empty terminal. Closing a terminal stops its processes and subscriptions.

## Packages and builds

The course uses `~/ros2_ws`, but builds discover packages recursively below the current terminal directory. Folders marked `COLCON_IGNORE` are skipped. Package names come from package.xml. An empty build creates build/install/log spaces and reports zero packages; unknown `--packages-select` names produce warnings. Building from src/ creates src/build and src/install, so the setup file to source depends on where you built. The model retains one current install record per package name; full native overlay precedence between multiple versions of the same package is not implemented. `ros2 pkg create` supports `ament_python`, `ament_cmake`, dependencies, node name and the Apache-2.0 template license. The package parser reads beginner metadata and dependencies, rejecting malformed or unsupported configuration.

`colcon build` and `colcon build --packages-select ...` validate current files. Python parses actual Python syntax in CPython and verifies callable entry points. C++ uses actual Clang/LLD diagnostics. A failed first build produces no installed package; a failed rebuild preserves the last successful installation. Successful builds create virtual build/install/log directories and setup scripts. Source edits mark the workspace as needing a rebuild but leave the installed program runnable. A successful rebuild replaces that installation. Builds at different directory levels remain separate; AMENT_PREFIX_PATH selects the installed package. Re-sourcing a prefix already present does not reorder it.

Supported CMake calls are `cmake_minimum_required`, `project`, `find_package(... REQUIRED)`, `add_executable`, `ament_target_dependencies`, `install(TARGETS ... DESTINATION lib/${PROJECT_NAME})`, `install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})`, and `ament_package`. Executables have one source file each. Interface packages additionally accept the demonstrated `rosidl_generate_interfaces` form. Arbitrary CMake, external libraries, colcon plugins and arbitrary setup.py execution are not supported.

## ROS communication

Use `ros2 --help` or a subcommand’s `--help` for exact CLI forms. The modeled CLI includes package creation/listing/executables, node inspection, topic list/type/info/echo/hz/pub, interface list/show, scalar parameters, services, run and declarative launch. Topic publishers, echo subscriptions and launch children are owned by their terminal and removed on stop. Python and C++ processes exchange messages on the same graph. The base channels `/rosout` (`rcl_interfaces/msg/Log`) and `/parameter_events` (`rcl_interfaces/msg/ParameterEvent`) have a modeled, hidden CLI-daemon publisher. Running nodes add their own publishers and produce real logger messages and parameter declaration/change events. Echo stays silent until an event occurs. Stopping a node or CLI subscription removes its endpoints; the base publisher remains. This models the standard CLI environment without running a native daemon.

The canonical interface registry supplies standard message/service fields, arrays, constants, defaults, generated teaching types and validation. JavaScript numbers restrict exact integers to the safe-integer range. Custom `.msg` files support scalar bool, int32, int64, float32, float64 and string fields; arbitrary rosidl syntax is not implemented.

The beginner APIs include node creation, publishers, subscriptions, timers, scalar parameters, services and asynchronous clients. Launch safely parses the shown `LaunchDescription`/`Node` form with package, executable, name, namespace, parameters and remappings. It does not execute arbitrary launch Python. Native DDS discovery, RMW, QoS guarantees, actions, full ROS APIs and native Linux processes are outside this lab’s contract.

The optional playground creates robot, LiDAR and camera endpoints only when explicitly started. It uses the course graph. LiDAR no-return readings use range_max; a two-second command timeout stops the robot. This is a teaching simulation, not a physics or sensor accuracy model.

## Native ROS 2 Jazzy

On an Ubuntu 24.04 system with Jazzy and colcon installed, export the source workspace from the lab. Unpack `ros2-basics-workspace.tar` in your home directory, then:

```sh
source /opt/ros/jazzy/setup.bash
cd ~/ros2_ws
colcon build
source install/setup.bash
ros2 run py_pubsub talker
```

In another terminal, source both setup scripts and run `ros2 run cpp_pubsub listener` (if both packages were created). The C++/Python pairing can be reversed. Package files are ordinary ROS source files; exported build artifacts are deliberately omitted.

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
