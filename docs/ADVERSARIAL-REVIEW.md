# Student readiness audit | 12 October 2026

Resumed final release verification on the isolated `audit/student-readiness` candidates. The
original `ros2-basics-lab/` and `ros2learn/` working copies, including their
preexisting Python changes, remain untouched. No audit candidate has been
published yet. The readiness verdict remains **NO until final release checks**.

## Evidence and scope

This record reconciles the saved checkpoint with the resumed checks. Reports
are in each candidate's `artifacts/audit/`; immutable earlier evidence is under
`checkpoints/2026-10-12-ros2-audit-evening-pause/evidence/` in the parent workspace.
A test-file count is not an assertion count. Browser walkthroughs, actual runtime
attacks, model tests and native comparisons are separate forms of evidence.

Both source candidates retain the beginner course and shared runtime fixes.
Lab Unit 7 is the browser-to-native handoff; KineNest Unit 7 is its existing
Actions unit. KineNest keeps “Build it. Run it. Understand it.” and the TF &
Odometry coming-soon card before Communication & QoS. DDS, RMW, native
network discovery, RTPS and middleware internals are excluded from this audit.

## Exercise coverage

Each guided page was followed in a fresh profile through its visible commands
and file controls. The complete built reports contain 294 Lab pages (147 per
language) and 324 KineNest pages (162 per language). Each unit includes observed
output, the visible checker, process cleanup, session reload/history and Reset.
The strengthened KineNest Actions checker was then verified on a rebuilt
artifact in both languages, 22 pages each, in `course-python-cpp-units-7.json`.
Subset reruns now write separate reports, preserving the full-course evidence.

| Unit | Pages per language | Mistakes, recovery and checker evidence |
| --- | ---: | --- |
| 1. Environment | 17 | Native 15-command comparison; literal/comment/failed-command attacks rejected; successful inspection survives save/reload; independent terminal environments; startup/reset races |
| 2. Topics and terminals | 29 | All commands and three terminals; once/count/rate/wait/no-replay behavior; wrong types/topics/options, interrupted waiters and incomplete publication counts; print-only and stale-reset attacks |
| 3. Workspace and packages | 17 | Missing per-terminal source and recovery; real build/install required; wrong-directory build retained; source edits, failed rebuild, missing executable/module, deleted/recreated build/install/source trees; alternate package names |
| 4. Publishers and subscribers | 23 | Real Python/C++ workers; empty/print-only/unexecuted source, wrong topic, external CLI, stopped or edited programs rejected; alternate node/topic names pass after repair |
| 5. Messages and parameters | 31 | Built custom-interface overlay required; CLI publication and unexecuted source rejected; constant output cannot satisfy parameter change; repaired programs, nested types and alternate names pass |
| 6. Services and launch | 23 | Varied AddTwoInts requests reject constant replies; program client plus terminal call required; alternate launch/remaps with real child delivery pass; Stop removes children and late responses |
| 7. Lab native handoff | 7 | Exported Python/C++ workspaces actually built and ran under native Jazzy; fresh/reset unit cannot reuse a previous export acknowledgement |
| 7. KineNest Actions | 22 | Wrong Fibonacci payloads, CLI-only client and prior-server evidence rejected; repaired real clients pass; success/cancel/reject, final Stop, new run and Reset checked in both languages; all four server/client language pairings pass |

`course-python-cpp.json` is the latest complete walkthrough, not the early
failed run. Historical failure screenshots and the immutable earlier checkpoint
are retained; they do not represent unresolved current failures. The original
Unit 5 parameter-checker defect was repaired. Other early walkthrough failures
included obsolete harness assumptions. The first new Python-loading harness
used KineNest's instruction selector on Lab and timed out before any commands;
its corrected Lab/KineNest selector and six-command assertion now pass both.

The actual-program checker matrix has 19 attacks/repairs per language/product
(76 total), plus seven Actions cases per language (14). Model regressions cover
additional shell and terminal-topic attacks. Playground and Free Lab are
ungraded; no checker requirements have been invented for either.

## Ecosystem, lifecycle and UI coverage

| Area | Verified evidence | Final verification status |
| --- | --- | --- |
| Models | 41 Lab / 43 KineNest test files pass after the shared output fix; installation asset consistency checked | Built flood/recovery/Stop passes both languages/products |
| Shell/filesystem | Native command/listing parity; relative/absolute paths, metadata, redirection, variables, shared files, independent cwd/environment; pending commands canceled on Reset/close/restore | No reproduced open defect |
| Build/install/source | 18 failure/recovery cases per product; 22 Python and 21 C++ causal checks per product; actual browser compilation; no-install CMake targets; native exported projects | No reproduced open defect |
| Installation | All 148 built-in Python bindings and C++ headers/constructors exercised in browser and native Python/g++; canonical registry/catalog; generated underlay and custom overlay files; restoration fills missing generated files and preserves edits | No reproduced open defect |
| Nested runtime | Path/PoseStamped and GetPlan request/response types, republishing and destruction verified in real Python/C++ and native Jazzy | No reproduced open defect |
| Graph/processes | Duplicate process names; independent same-node endpoint counts 2/2 → 1/1 → 0/0; native comparison; launch children, terminal close, Stop, Reset and loading interruption | 48 cycles/product at 1500 ms dwell passed before the final output fix |
| Playground | All six sections, both products/languages; visible instructions and real sensor readers; preparation retains selection and one prompt; source/display camera equality; Twist/watchdog, LiDAR, odometry and existing TF | Final built strict feedback passes both products/languages |
| Camera/timing | All 230400 image bytes, patterned/fixed/dynamic/empty arrays and malformed-data rejection; strict image-driven stop x=2.2168 m, front range ≈0.6632 m | Final builds: Lab Python/C++ p95 27/20 ms; KineNest 26/19 ms; all bytes match; 100 ms guard unchanged |
| Target lifecycle | Built Lab 36 cycles, highest cycle p95 Python 60/C++ 34 ms; rebuilt K 36 cycles, Python/C++ 33 ms; six target situations, live retarget/removal, source/process restarts, 8 startup cancellations/language, zero leftover workers/graph resources | All stored cycles satisfy 100 ms; lifecycle harness guard tightened from 250 to 100 ms |
| Slow consumers | Deliberate 350 ms callbacks; four interruption cycles/language/product; two in flight plus two latest slots across two subscriptions; bounded queues, responsive main thread, no late output | No reproduced open defect |
| Free Lab | Both languages/products: real hello, per-terminal sourcing, independent course/playground/free persistence and Reset, zero Twist, 20 simulator toggles/language, mobile layout | Final visible output stress: 30 seconds/language/product, 1200–1233 log events and 297–302 image callbacks, Stop/close/reload/Reset isolation pass |
| UI/layout | Dirty drafts/conflicts, theme/language while running, six terminals, history/Back/Forward, keyboard resizing; six Chrome widths/products and four Firefox Lab widths; seven locales for K upcoming cards | Built layout/product smoke plus 30 theme/viewport changes per sustained-output run pass; transcript 80000 chars and scrollback 2000 rows bounded |
| Runtime loading/cache | Both built products: real Python-only hello, pub/sub callbacks, save/reload; five Python assets and zero C++ toolchain/worker requests; installed C++ without compiler cache; compiler worker failure recovery; both open C++ sessions survive asset rebuild | No reproduced open defect |
| Public Pages/storage | Local standalone public build under /ros2-basics-lab/; 12 assets/MIME, nine navigation entries/reloads, real 404, no cookies/Set-Cookie/service workers; navigation does not eagerly fetch runtimes | Final committed artifact and actual live validation pending |

## Findings and regressions

Count each defect group once across products. Confirmed product findings:
**24 MAJOR, 4 MINOR, 0 BLOCKER**, all locally fixed and verified. The two
new output fixes pass actual Python/C++ flood, recovery and Stop checks in both products.
This count does not convert unfinished deployment verification into a product
bug. No reproduced product defects remain open. Final built verification passes;
actual live validation is still required before a release readiness claim.

| ID | Severity | Fixed behavior | Regression/evidence |
| --- | --- | --- | --- |
| M01 | MAJOR | Python packaging validates syntax without executing entry-module imports | python-build tests and actual/native packaging checks |
| M02 | MAJOR | Missing Python console-script module fails at execution, not package metadata inspection | build-failures and build-causality |
| M03 | MAJOR | CMake target without install rule compiles but is unavailable to ros2 run | build-failures and adversarial-build |
| M04 | MAJOR | Background topic jobs own independent nodes/endpoints and cleanup | job-control and terminal semantics |
| M05 | MAJOR | Communication/parameter/service/launch checks require appropriate current program-owned observations | checker-adversarial and 76 real-program cases |
| M06 | MAJOR | Installed C++ executes without fetching/requiring cached compiler and linker | installed-cpp browser check |
| M07 | MAJOR | C++ boolean arrays compile and encode correctly | every-standard-interface browser/native check |
| M08 | MAJOR | Separate processes may share a node display name and stop independently | duplicate-publishers and native-duplicate-nodes |
| M09 | MAJOR | Playground preparation preserves selected exercise and avoids repeated prompts | playground-preparation, six positions and repeated preparations |
| M10 | MAJOR | Simulator startup preflights types; stop/reset are idempotent with coherent collision rollback | playground model and browser lifecycle tests |
| M11 | MAJOR | Multiple same-node endpoints count and dispose independently | endpoint-lifecycle model/browser/native 2/2 → 1/1 → 0/0 |
| M12 | MAJOR | Python timer/service destruction removes callbacks and pending work | python-compat, native-runtime-behavior and nested-runtime |
| M13 | MAJOR | Nested Python message/service fields retain generated types and can be republished | nested-runtime, python-compat and native comparisons |
| M14 | MAJOR | Custom generated bindings/libraries are inspectable in the workspace overlay and restore safely | custom-installation and ecosystem coverage |
| M15 | MAJOR | Modeled CMake/colcon arguments are validated; repeated dependencies and valid setup.cfg spacing work | build-failures, adversarial-build, build-causality |
| M16 | MAJOR | Unit 1 requires successful shell inspections, rejecting literals/comments/failed commands | shell-checker-evidence and visible walkthrough |
| M17 | MAJOR | Pending terminal commands cannot write after close, Reset or lesson restoration | terminal-lifecycle and session-race |
| M18 | MAJOR | Successful shell-check evidence participates in autosave and session restoration | shell-checker-evidence, course reload/history and UI state |
| M19 | MAJOR | Full camera feedback is fast enough to stop meaningfully; typed byte paths retain shape/bounds checks | strict sensor-feedback, byte-runtime, target/slow-sensor matrices |
| M20 | MAJOR | C++ wall and monotonic clocks return usable timestamps | wasi-clock tests and real C++ image timing |
| M21 | MAJOR | K Actions reject wrong Fibonacci data and CLI substitution for required program clients | action-checker-runtime, checker-adversarial and rebuilt Unit 7 |
| M22 | MAJOR | K Actions cannot reuse prior server-run completion; final visible Stop preserves earned evidence | action-checker-runtime and checker-adversarial |
| M23 | MAJOR | ROS logger traffic now shares the worker stdout limit before entering the UI queue; protocol payloads/lifecycle remain intact | worker-output model tests (five cases), real Python/C++ flood/recovery checks |
| M24 | MAJOR | C++ unterminated stdout retains at most 4000 characters instead of the entire stream | actual worker parser regression, 8 MiB no-newline browser fixture |
| N01 | MINOR | Sensor mounts, wheel transforms and metre-scale visuals use consistent geometry | playground geometry, sensor/readout and native reader comparisons |
| N02 | MINOR | Lab native-handoff translations stay within the agreed beginner scope | rendered lesson-copy scan, 42 combinations |
| N03 | MINOR | Simulator layout adapts to its actual panel width | Chrome/Firefox responsive checks |
| N04 | MINOR | Reset native-handoff lesson clears its prior export acknowledgement | checker-adversarial and course Reset |

Audit infrastructure corrections are separate: subset reports no longer replace
the complete walkthrough, and the target matrix now enforces the same 100 ms
limit as the strict feedback check. The Python network observer's initial Lab
selector error was a harness error, not a product defect. The first C++ flood
fixture did not explicitly flush its iostream before logger messages consumed
the output budget; it now flushes the no-newline stream and terminating newline
before the logger burst. This fixture correction does not relax its assertions. Free Lab and KineNest's
requested coming-soon card are features, not defect counts.

## Intentional limitations and parity references

The browser models shell, package/build/install/source, launch and ROS graph
behavior. Learner Python runs in Pyodide CPython; C++ runs compiled WebAssembly.
The supported installation is inspectable, including clearly marked simulated
binaries. It does not execute host commands or promise native functionality
merely because a modeled binary exists. Unsupported build/shell/runtime options
remain explicit. C++ native threads and exceptions are unsupported. Browser
scheduling is not a real-time guarantee; callbacks use bounded latest-message
queues. Topic type conflicts and multiple same-named node objects inside one
program are rejected; separate processes can use duplicate display names.
Checkers validate observed behavior rather than proving arbitrary code correct.

Fresh reference review used the official Jazzy documentation source for
[per-terminal environment setup](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials/Beginner-CLI-Tools/Configuring-ROS2-Environment.rst),
[workspace build and overlay sourcing](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials/Beginner-Client-Libraries/Creating-A-Workspace/Creating-A-Workspace.rst),
and [action goal/feedback/result and cancellation](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.rst).
The rendered documentation site denied automated access, so its official Jazzy
source branch was read. This does not broaden the explicitly excluded scope.
Existing native Jazzy evidence is retained; unchanged tests were not blindly rerun.

## Final built verification

The resumed checks tested Lab source `ac425cf`, public assets `fa5a84708f8b`,
and KineNest source `89a194b`, assets `836933e97cf5`. The final worker changes
were present in both builds. No additional product defect was reproduced.

- Strict image-feedback tests ran separately from other browser workloads.
  Both languages/products retain correct opposite steering, meaningful stopping,
  full display/image equality, stale-frame rejection, wrong-topic failure and
  repair, velocity watchdog and clean shutdown.
- Actual worker flood tests pass in both languages/products: Python 40 logger
  events; C++ 8 MiB without a newline yields one 4000-character line and 39
  logger events in the same budget. Later timer output resumes; Stop is quiet.
- Affected visible course walkthroughs are repeated after the worker fix:
  Lab Units 4–6 and KineNest Units 4–7, both languages. Reports include checkers,
  process cleanup, save/reload/history and Reset; full-course evidence is retained.
- `free-lab-output-stress.mjs` drives actual Free Lab terminals while 100-message
  logger bursts run every 50 ms and full camera images arrive. Four 30-second
  runs cover theme changes, resizing, bounded transcript/scrollback, Stop,
  rerun/terminal close, reload and isolated Reset. Every final worker/process/
  node/listener/timer/service/parameter count is zero. This is distinct from
  the earlier 48-cycle model-engine soak; it verifies the visible Free Lab UI.

Logs: `final-built-sensor.log`, `final-built-output.log`,
`final-built-course.log`, `final-free-lab-output.log`. Structured reports retain
the associated sensor, output, per-unit and Free Lab measurements.

## Release state

The remotes were refreshed again: KineNest `origin/main` remains `1f2744e`
and is an ancestor of its candidate; Pages `origin/main` remains `9866aa7`.
The original dirty working copies are preserved. Source and local built checks
are complete; standalone public artifact publication and live validation follow.
KineNest retains its separate source and product deployment.
