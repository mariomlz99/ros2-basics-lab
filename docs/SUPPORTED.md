# Supported behavior

## Workstation

The in-memory filesystem starts with `/home/learner`, `/opt/ros/jazzy`, `/tmp` and `/etc`. Paths support home expansion, relative components and root clamping. Terminals share files and the graph but own their working directory, history, environment and foreground task. The Jazzy base environment is available initially; workspace overlays must be sourced separately in each terminal.

Shell commands: `pwd`, `cd`, `ls` (`-a`, `-l`), `mkdir` (`-p`), `touch`, `cat`, `cp` (`-r`), `mv`, `rm` (`-r`, `-f`), `tree`, `echo`, `clear`, `history`, `which`, `printenv`, and controlled `source`. Quotes, simple environment expansion and unquoted `*`/`?` wildcard paths work. Quoted wildcards stay literal, and `*` does not match hidden files. `echo text > file` creates or overwrites a file; `echo text >> file` appends; `echo -n` omits the redirected newline. Other output redirection, pipes, input redirection, substitution, background jobs, sudo and arbitrary shell scripts are unsupported and rejected. This is not Bash.

The terminal supports `nano <file>` as a bounded in-terminal editor: Ctrl+O then Enter writes the current filename, Ctrl+S saves directly, and Ctrl+X exits with a save/discard choice. `gedit <file>` opens the workspace editor; both modify the same virtual filesystem. Conflicting edits from another editor are rejected before overwriting. `nano ~/.bashrc` and `gedit ~/.bashrc` work, but this lab still does not execute .bashrc startup commands. These are teaching editors, not the native applications; Vim is not implemented.

Use Ctrl+Shift+V to paste in the terminal. The terminal supports Ctrl+C, history arrows, cursor editing, Ctrl+A/E/U/K/W/L, Tab path completion and Ctrl+D to close an empty terminal. Closing a terminal stops its processes and subscriptions.

## Packages and builds

BASICS uses `~/ros2_ws`, but builds discover packages recursively below the current terminal directory. Folders marked `COLCON_IGNORE` are skipped. Package names come from package.xml. An empty build creates build/install/log spaces and reports zero packages; unknown `--packages-select` names produce warnings. Building from src/ creates src/build and src/install, so the setup file to source depends on where you built. The model retains one current install record per package name; full native overlay precedence between multiple versions of the same package is not implemented. `ros2 pkg create` supports `ament_python`, `ament_cmake`, dependencies, node name and the Apache-2.0 template license. The package parser reads beginner metadata and dependencies, rejecting malformed or unsupported configuration.

`colcon build` and `colcon build --packages-select ...` validate current files. Python parses actual Python syntax in CPython and verifies callable entry points. C++ uses actual Clang/LLD diagnostics. Failed packages are unavailable to run. Successful builds create virtual build/install/log directories and setup scripts. Source edits or changed workspace dependencies invalidate the browser install and require rebuilding. Unlike native ROS, the browser explicitly rejects an outdated install instead of running the older binary.

Supported CMake calls are `cmake_minimum_required`, `project`, `find_package(... REQUIRED)`, `add_executable`, `ament_target_dependencies`, `install(TARGETS ... DESTINATION lib/${PROJECT_NAME})`, `install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})`, and `ament_package`. Executables have one source file each. Interface packages additionally accept the demonstrated `rosidl_generate_interfaces` form. Arbitrary CMake, external libraries, colcon plugins and arbitrary setup.py execution are not supported.

## ROS communication

Use `ros2 --help` or a subcommand’s `--help` for exact CLI forms. The modeled CLI includes package creation/listing/executables, node inspection, topic list/type/info/echo/hz/pub, interface list/show, scalar parameters, services, run and declarative launch. Topic publishers, echo subscriptions and launch children are owned by their terminal and removed on stop. Python and C++ processes exchange messages on the same graph. The base channels `/rosout` (`rcl_interfaces/msg/Log`) and `/parameter_events` (`rcl_interfaces/msg/ParameterEvent`) have a modeled, hidden CLI-daemon publisher. Running nodes add their own publishers and produce real logger messages and parameter declaration/change events. Echo stays silent until an event occurs. Stopping a node or CLI subscription removes its endpoints; the base publisher remains. This models the standard CLI environment without running a native daemon.

The canonical interface registry supplies standard message/service fields, arrays, constants, defaults, generated teaching types and validation. JavaScript numbers restrict exact integers to the safe-integer range. Custom `.msg` files support scalar bool, int32, int64, float32, float64 and string fields; arbitrary rosidl syntax is not implemented.

The beginner APIs include node creation, publishers, subscriptions, timers, scalar parameters, services and asynchronous clients. Launch safely parses the shown `LaunchDescription`/`Node` form with package, executable, name, namespace, parameters and remappings. It does not execute arbitrary launch Python. Native DDS discovery, RMW, QoS guarantees, full ROS APIs and native Linux processes are outside this lab’s contract.

The playground creates robot, LiDAR and camera endpoints only when explicitly started. It uses the module graph. LiDAR no-return readings use range_max; a two-second command timeout stops the robot. This is a teaching simulation, not a physics or sensor accuracy model.

## Actions

Python and C++ action servers use timers to remain responsive, with callback-based clients. The browser supports the displayed ActionServer/ActionClient and rclcpp_action subset, including goal acceptance/rejection, feedback, results, cancellation and cleanup. Futures are callback-based; Python action execution may await a rclpy.task.Future. Blocking waits, native threads, general executor behavior, arbitrary action definitions and advanced action options are not implemented. Runtime checks cover mixed-language communication; see RELEASE.md for native evidence.

## UI and persistence

English, Dutch, French, Spanish, German, Portuguese and Italian cover unit explanations and workstation controls. Commands, source code and runtime diagnostics retain their original text. Switching languages or themes preserves live workstation state. Workspaces, installed Python/C++ artifacts, terminal environments/history, unit positions, completion progress and workspace-editor drafts autosave to IndexedDB. Save session requests an immediate save. Running processes and Python interpreter variables are not resumed; save nano buffers before leaving. Browser storage is scoped to the site origin and browser profile and may be cleared; source export provides a portable copy. The playground has its own files, terminals and graph; returning to the module restores the separate BASICS workspace. Workspace reset requests confirmation, and unit reset restores the snapshot from first entering that unit.


Later units can be started independently using Prepare this unit. It creates prerequisite packages from the visible examples, builds them with the real browser runtimes, and sources the result without awarding earlier unit completion. Existing packages are preserved; errors in existing learner work remain errors to fix.

`python3`, `python3 script.py [args]`, `python3 -c "code"`, and `python3 --version` use a CPython/Pyodide worker. The interactive interpreter supports multiline input, exit() and Ctrl+D. Ctrl+C can terminate a busy interpreter. Text files under the virtual home directory synchronize back to the workspace; simultaneous edits in another editor are kept instead of overwritten. Binary-file persistence, native OS processes and arbitrary pip installs are not supported. Standard-library imports and Pyodide-distributed packages, including NumPy, run in the browser. Python package builds and ROS node workers load supported imported packages on demand. Use ros2 run for the modeled ROS graph APIs.

Tab completion includes ROS verbs, sourced package executables and launch files, and live graph names. Unsourced terminal environments do not receive workspace executable suggestions.
