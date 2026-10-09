# Standalone lab restored — 9 October 2026

The user confirmed that classroom development continues in `ros2-basics-lab/`, with shared bug fixes carried into `ros2learn/`. KineNest keeps its separate “Build it. Run it. Understand it.” product homepage.

Restored https://mariomlz99.github.io/ros2-basics-lab/ from the latest local source checkpoint `e3c8415`, using `npm run build:public`. Deployment commit `ba1c9d7` replaces the KineNest artifact previously published there. GitHub Pages run `37910132768` succeeded; live build-info and homepage verified. All 15 automated tests passed, and the topics lesson Chrome check passed both locally and on the live site. KineNest was not deployed or modified in this restoration.

Always publish this lab's own public artifact to the lab deployment repository. The earlier local-review notes below describe the restored source checkpoint.

# Local review checkpoint — 9 October 2026

Resume the ROS 2 Basics Lab classroom review at the terminal-topics lesson, then continue publisher/subscriber coding. The user asked to pause until tomorrow and save everything locally. This checkpoint supersedes older status notes below.

Both `ros2-basics-lab` and `ros2learn` contain the shared fixes. No remote push or deployment was performed in this review session. Keep future exercise changes mirrored between the two projects, with native Jazzy comparisons and realistic failure behavior (see AGENTS.md).

Completed:
- Populated simulated /opt/ros/jazzy, /bin, /lib from canonical interfaces/runtime assets; saved-session upgrades preserve user edits.
- Shell PATH/executable handling, per-terminal startup/.bashrc, setup/local_setup and workspace overlay behavior; wrong-directory colcon builds retain their actual build/install location, with previous successful executables surviving source edits and failed rebuilds.
- New lesson/unit 3: “Talking ROS 2: Topics & Terminals”, before publisher/subscriber coding. Covers String/Twist, once, continuous/default 1 Hz, fixed-count/rate publishing, matching subscribers, hz, Ctrl+C and volatile no-replay behavior. Seven lessons/units; saved selection/progress migrated.
- Native Jazzy usage/help for supported incomplete topic commands, including missing pub arguments/options; full reference help does not imply all native options (e.g. QoS) are implemented.
- CLI pub/echo nodes are hidden from default node list; --all/-a reveals them. --count-nodes/-c honors visibility. Lesson corrected.
- Original interface text, comments, blank lines and nested indentation captured from native Jazzy for all supported interfaces: 147 Basics Lab / 148 Kinenest. Three display modes: default, --all-comments, --no-comments. Original sources also populate simulated share files. Custom scalar messages preserve comments.
- Bash-style completion: first Tab completes a common prefix; second lists candidates; 100+ matches asks “Display all N possibilities? (y or n)”. Alphabetically ordered vertical columns fit terminal width, with --More-- paging (Space/Enter/q), cancellation and command preservation. Applied to ROS and filesystem completion.

Verification completed:
- Latest full npm test and npm run build pass in both repositories.
- Native terminal/build and topic communication checks passed; native hidden-node visibility verified.
- Native text comparison covers every supported interface and all three display modes; native topic help captures match Jazzy.
- Chrome checks pass in both projects: topics-lesson-check.mjs, topic-help-check.mjs, completion-check.mjs. Earlier real Python/C++ runtime and course checks passed; full Python course acceptance rerun after lesson insertion passed.
- Not all native Bash/ROS options are simulated. New lesson prose may fall back to English in other UI locales; a translation review remains useful.

Local URLs (restart servers if needed):
- Basics Lab: http://127.0.0.1:8017/ros2-basics-lab/ — run npm run dev in ros2-basics-lab.
- Kinenest: http://127.0.0.1:8024/basics.html — run PORT=8024 npm run dev in ros2learn.

Browser workspace state autosaves per browser profile and site origin; it is distinct from these source checkpoints. Running processes do not resume automatically after reload. Preserve the same local ports/origins when returning.

Maintenance commands:
- npm test; npm run build
- node scripts/completion-check.mjs
- node scripts/topics-lesson-check.mjs
- node scripts/topic-help-check.mjs
- For Kinenest browser scripts: LAB_URL=http://127.0.0.1:8024/basics.html
- source /opt/ros/jazzy/setup.bash; python3 scripts/capture-interface-text.py --check
- source /opt/ros/jazzy/setup.bash; python3 scripts/capture-topic-help.py --check


---

## Earlier checkpoint history

# Local checkpoint — 7 October 2026

Workspace: `/home/mari0/Desktop/ROS_COURSE_2627/ros2-basics-lab`.

The previous session stopped before writing a checkpoint. Its saved changes have now been completed and validated. This is an independent, static ROS workstation; the original KineNest checkout remains untouched. No backend, remote repository or public deployment has been created.

## Current result

Six lessons cover environment, workspace/build/source, pub/sub, parameters/custom messages, services/launch and native transition. Python and C++ execute through real browser runtimes on one shared graph. Optional robotics uses that same graph.

The Diepenbeek design has no KineNest logo, personal credit footer or donation links. Light/dark themes remain, with EN/FR/NL as the only interface languages. Lesson explanations and workstation controls are translated. Commands, source code and runtime diagnostics are preserved. Theme and language changes preserve running state and persist as preferences.

Final integration includes collapsible workspace folders, editor highlighting/diagnostics, terminal editing, nested interface inspection, response constants, metadata failure checks, dependency invalidation, build progress and retained authentic compiler diagnostics. README.md, HANDOFF.md and INTERFACES.md document supported behavior, static hosting, provenance and native transition.

## Validation

- Unit tests pass, including malformed metadata, missing dependencies/sources/install targets, compiler error propagation, reset snapshots, and consumer invalidation after dependency edits.
- Production build passes with relative asset paths for `/ros2-basics-lab/`.
- Chrome real-runtime suite passes Python↔C++ communication, both languages’ custom messages, live parameters, services/clients, launch/remapping, cleanup, actual Python syntax failure and actual C++ field-error diagnostics.
- Fresh-profile visible Python and C++ course walkthroughs pass through the optional playground. Lesson 1 downloads neither Python nor the C++ toolchain.
- EN/FR/NL and light/dark preference checks pass on source and production builds; switching preserves terminal text and commands. A 390px mobile layout check passes. Screenshots are in ignored artifacts/screenshots/.
- Native Jazzy reference validation passed in the prior implementation session. Its build and runtime logs remain in artifacts/native/ros2_ws/log/. Native validation was not repeated for this UI-focused completion.

## Resume guidance

Use README.md commands to start or validate the app. Learner files are intentionally in memory and must be exported before reload. Supported API boundaries are in HANDOFF.md. Full Bash/CMake/colcon, DDS/RMW and arbitrary ROS APIs are not implemented. Firefox, Safari and physical mobile devices are not yet validated; mobile checking used Chrome viewport emulation.

The local candidate is ready for review. Public repository creation or deployment remains a separate, unperformed step.

## Inspection follow-up

Added real `echo >`/`>>` file writes and quote-aware `*`/`?` pathname expansion, including `rm -rf *`. The prompt retains its green color during editing and the cursor uses an explicit blinking green block. Long command groups initially show four commands with an expansion button. Lesson 1 shows the workspace files/editor.

The header uses official KU Leuven and UHasselt image assets (sources recorded beside the assets). Locale order is EN, NL, FR. Lesson 4 uses the neutral greeting “Hello”.

The graph now includes modeled CLI-daemon publishers on `/rosout` and `/parameter_events`, backed by canonical rcl_interfaces schemas, with real Python/C++ logger and parameter events. Endpoint cleanup preserves only the base publishers. Bare ROS subcommands show usage; typos report the supported choices. Unit and real-runtime suites pass.

## Editor and colcon follow-up

Added bounded nano (Ctrl+O/Enter, Ctrl+S, Ctrl+X with save/discard) and gedit opening the shared workspace editor, with stale-write protection and refresh of clean buffers. .bashrc can be edited but is still not executed at terminal startup. Terminal titles now include 🐧.

Compared empty and unknown-selection builds with local native Jazzy: empty builds create build/install/log and return a zero-package summary. Browser discovery now follows cwd recursively, skips COLCON_IGNORE, binds installed packages to the actual build directory and produces per-package failure reports/logs. It no longer tells students which directory to build from. One current install record per package remains a documented limitation. Native handoff link/button spacing was corrected.

Navigation is split into LESSONS (six lessons) and EXERCISES (optional playground), translated in EN/NL/FR. Desktop/mobile spacing checks, editor save/discard/shared-file checks, Ctrl+Shift+V paste, unit tests, visible Python course and both-language real-runtime suite pass.

## Guided lesson and clipboard follow-up

The six lessons now default to one command or source file per step, with Back/Next, remembered positions per lesson/programming language, and an optional complete lesson overview. Introductory commands include observation prompts. Navigation does not execute commands or count as lesson completion; the final checks still inspect lab state. The scrollable lesson panel and running workspace are preserved. The full-course acceptance runner explicitly uses overview mode; terminal-feedback checks guided navigation and completion behavior.

Within the terminal, Ctrl+C copies selected text, otherwise interrupts. Ctrl+Shift+C copies selected text and prevents the browser inspector shortcut; without a selection it does nothing. Browser clipboard behavior and interruption were checked with Chrome. Removed the initial Ready footer; later actionable status messages remain. Build, 25 model tests, terminal-feedback and built-site preferences/mobile checks pass.

## Continued classroom inspection

Lesson checks offer a next-lesson button; completing all six offers the optional exercises. The final lesson alone does not claim the entire course is complete. Lesson 1 compares nano, gedit and native Vim. Lesson 2 establishes home explicitly, returns from src with cd .., explains tree versus changing directories, and gives executable discovery its own explanation. Package creation reports metadata and actual generated files for both build types, with a native-style duplicate-directory error.

Workspace columns and height have pointer/keyboard dividers with remembered sizes; terminal heights can be resized, and narrow screens retain stacked resizable panels. Restore layout resets sizes without resetting lab state. Build, package-generation tests, terminal completion-flow checks and built-site layout/mobile/preferences checks pass.


## Saved sessions, independent exercises and Python CLI

Nested workspace src checks are no longer tied to ~/ros2_ws. Browser sessions autosave files, installed artifacts, shell environments/history, positions and progress, with an explicit Save session button. C++ artifacts serialize as Wasm bytes and recompile to modules on restore. Real Python and C++ publisher execution after reload passes. Prepare this lesson creates/builds prerequisites without completing earlier lessons or overwriting existing package sources. ROS Tab completion uses each terminal’s sourced packages and live graph.

python3 supports scripts, -c, version and an interactive CPython prompt. NumPy and other available Pyodide packages load on demand; standard libraries execute normally. Browser checks cover NumPy calculations, shared text writes, exit and interrupting an executing infinite loop. The home-directory text filesystem is synchronized; binary files and native pip/system processes are outside the supported contract.

The playground now has separate saved files, terminal views and runtime graph. Robot, camera and LiDAR canvases show previews before Start, live streams persist across guided exercise steps, and returning to the course restores its independent workspace. Browser checks cover actual moving camera images and both workspaces after reload. Copy buttons show Copied! temporarily after successful clipboard writes.

Hosting remains local only. User states university logos will not be published; public branding will be decided later. Future release locks should exclude unreleased lesson content from public builds/repositories, rather than rely on client-side flags. No release gating has been added yet.

Lesson source actions now distinguish Add file, Open file and explicit confirmed replacement. Missing packages offer a jump to their creation command. Guided source examples open automatically; repeated refreshes preserve button DOM until file state changes. Lesson 5 browser checks pass.


## Playground geometry and first public preview

Each sensor view now has Enlarge/Restore controls; a keyboard/pointer divider resizes the stream area above the lesson/editor. Restore layout resets these sizes too. Camera rendering uses the same obstacle and enclosing walls as the world and LiDAR, without phantom coloured beacons. LiDAR handedness, 2 Hz scan timing and physical sensor placement were corrected. Collision tests verify clearance and camera message/pixel agreement; example readers now distinguish front distance from nearest return.

The user authorized a first GitHub Pages deployment for colleague review. build:public removes university logos/assets and excludes internal checkpoint/extraction notes. Deployable public files retain licensing notices and handoff documentation.

First public deployment is live at https://mariomlz99.github.io/ros2-basics-lab/ . Public artifact repository: https://github.com/mariomlz99/ros2-basics-lab (main, deployment commit 65e76b7). Source revision in build-info.json: 9981e1d. GitHub Pages workflow 37660907091 succeeded. Live Chrome checks passed for EN/NL/FR and mobile layout, absent logos, real C++ build/run and restored artifacts, Python/NumPy, playground streams/resizing, clipboard, separate saved workspaces and lesson 5 file actions. Both browser feedback runners now accept LAB_URL for live verification. The development repository remains local; the public repository holds the generated public site, not internal checkpoints.
