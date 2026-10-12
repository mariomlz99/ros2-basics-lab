# ROS 2 audit remote continuation checkpoint

Saved 12 October 2026 at Mario's explicit request to leave this terminal and
resume from remote/the same computer. This file supersedes the earlier paused
checkpoint, whose evidence remains in checkpoints/2026-10-12-ros2-audit/.
Read the root AUDIT-RESUME.md for the exact new commit IDs and backup location.
No audit fixes have been pushed or deployed. Student readiness remains NO.

## Immediate next task: C++ image latency

The user explicitly prioritizes minimum image latency, even at the cost of a
simpler environment or lower image resolution. They requested extensive
Start/Stop tests with different targets. Do NOT declare this fixed from model
tests alone. Test real browser C++ and Python workers and measured robot motion.

A new end-to-end controller in scripts/sensor-feedback-fixtures.mjs subscribes
to Image and LaserScan, segments the obstacle's brown pixels, steers toward the
centroid, drives at 0.6 m/s, and commands zero linear speed when front range is
at most 0.7 m. No special learner API is used. The browser harness is
scripts/sensor-feedback-check.mjs. It tests both steering directions, fresh
frames, pixel-for-pixel display/publication equality, stopping distance,
wrong-topic no-motion, stale-image rejection, recovery, bounded callback queues,
Stop, and the 2-second velocity watchdog.

Python passed. C++ initially appeared to pass a weak stopping test, but actual
pose proved unacceptable latency. It reached x about 2.81 m rather than roughly
2.2 m, near the obstacle's collision boundary. The stronger test reproduces:

    Image/command latency missed the stopping distance
    x = 2.7934352419299464, front = 0.476638525724411, latencyMs = 463

The fixed obstacle starts at x=3.0. Camera offset=0.10 m; LiDAR offset=0.12 m;
robot radius=0.18 m. The image is RGB8, 320x240, 230400 bytes, published at 10 Hz.
An earlier C++ result at x=2.81 was NOT acceptable controller performance.
Do not cite old sensor-feedback*.json passed=true as proof of adequate latency.
Those artifacts predate strict latency/stopping assertions.

Root cause identified: generated C++ Image decoding makes one WASM/JS import
per byte, including string construction and field-path parsing each time.
A minimal optimization is now implemented in BOTH candidate worktrees:

- src/interfaces/registry.js generates one bulk copy for uint8/byte/char arrays.
- src/cpp/types.hpp declares the internal kn_field_bytes_copy import.
- src/cpp/worker.js implements that import through copyByteField.
- src/cpp/protocol.js validates type, length, destination bounds and each byte,
  then copies the whole array into WASM memory once.
- Fixed-size generated arrays now reject wrong lengths before indexing.
- tests/cpp-byte-transfer.test.js verifies exact bytes, offsets, typed/empty
  arrays, invalid bytes/paths/sizes, and no memory writes on rejected inputs.
- npm run bundle:installation regenerated canonical runtime assets in both.

IMPORTANT: the optimization has NOT YET BEEN RUN in a real browser at this
checkpoint. The complete model suites pass (39 Lab / 41 KineNest test FILES).
First resume action: run the strict C++ browser reproducer, then Python and both
languages in KineNest. The strict harness now requires x<=2.5, front>=0.4, and
image-to-command p95<=250 ms. This threshold is a regression guard, not a claim
that 250 ms is the ideal latency. Measure actual p50/p95/max, seek materially
lower latency, and reduce rendering/resolution if needed and measured useful.
Avoid concurrent heavy compiles during latency measurements.

Commands, after starting dev servers if needed:

    cd /home/mari0/Desktop/ROS_COURSE_2627/.worktrees/ros2-basics-lab-analysis
    PORT=8033 npm run dev
    LAB_LANGUAGE=cpp node scripts/sensor-feedback-check.mjs
    node scripts/sensor-feedback-check.mjs

    cd /home/mari0/Desktop/ROS_COURSE_2627/.worktrees/ros2learn-cmake-parity
    PORT=8034 npm run dev
    LAB_URL=http://127.0.0.1:8034/basics.html node scripts/sensor-feedback-check.mjs

Scripts run headless Chrome via Playwright and may need approved sandbox
escalation. Do not bypass permission boundaries. Use real toolchain compilation.
Both URLs run source, not the last built dist. Last dist artifacts are stale.
The runtime header catalog already includes types.hpp; no new header path was
introduced. Do not hand-copy interface bindings outside the canonical registry.
Existing old installed WASM imports remain compatible with the extended worker.

## Latest user requirements, in order

1. Continue BOTH reviews from AUDIT-RESUME.md, comprehensively, fixing real bugs
   and adding regressions. The endpoint 2 -> 1 -> 0 defect must be fixed.
2. Add a KineNest coming-soon TF & Odometry unit before DDS/Communication & QoS,
   with a small logo. This is a placeholder, not a new curriculum implementation.
3. Fix confusing simulator cards when Chrome or Firefox becomes narrow.
4. Reduce use of em dashes generally, including learner text and our replies.
5. Test sensor-image-in-the-loop to verify effective operation.
6. Prioritize minimum image latency, accepting reduced scene quality if needed.
7. Extensively test Start and Stop, including different targets.
8. Save EVERYTHING exactly at this state so remote continuation is possible;
   provide a full resume prompt for the same computer.

The exact latest messages are saved in the root checkpoint conversation notes.
The root RESUME-AUDIT-PROMPT.md is the full copyable continuation prompt.

## Worktrees and product constraints

Workspace: /home/mari0/Desktop/ROS_COURSE_2627

- Standalone candidate: .worktrees/ros2-basics-lab-analysis
- KineNest candidate: .worktrees/ros2learn-cmake-parity
- Both branches: audit/student-readiness
- Pages artifact checkout: .worktrees/ros2-basics-lab-pages-reference
- Candidate pre-session commits: 088708d (Lab), a9d3aab (KineNest).
- Latest fetched Pages origin/main: 9866aa77952f1e0a516f5dee319fbff7dfda54d9.
- Latest fetched KineNest origin/main: 1f2744e6975b6f60e1fc4e748453e68a51e9cab9.
- Live Pages build-info checked this session: source
  6ea62412fa3ee1dbca5b824d97706b95ede331ab, assetVersion 7b3a6474757d,
  builtAt 2026-10-11T22:46:47.755Z, publicBuild true.
- Original Lab HEAD 6ea6241 and KineNest HEAD 3b7f000 are untouched.
  BOTH original worktrees retain modified src/python/worker.js and untracked
  scripts/python-build-parity.mjs, tests/python-build.test.js. Preserve them.
- No subagents used or authorized. Do not spawn them without authorization.
- Native ROS 2 Jazzy is installed under /opt/ros/jazzy on this machine.
  Tests use isolated temporary native workspaces and ROS_DOMAIN_ID values.
- All simulated paths (/opt/ros/jazzy, /bin, /usr/bin, /lib) are virtual.
  Never modify host files to satisfy a browser shell command.

Classroom development belongs in the standalone lab; mirror shared bug fixes
into KineNest. Preserve KineNest actions and its separate homepage:
“Build it. Run it. Understand it.” Do not replace its independent curriculum
with the standalone course. Pages must use the Lab npm run build:public artifact.
Prior deployment authorization exists in the handoff, but only publish after
validation and re-fetch first: remotes changed externally earlier in the audit.

DDS, RMW, discovery protocols and middleware internals are explicitly OUT OF
SCOPE. Their absence is not a defect or release blocker. No new fake APIs or
middleware redesign. Official ROS 2 Jazzy beginner workflows/native execution
are the reference, not Rolling. docs.ros.org was blocked by the web tool;
official ros2/ros2_documentation jazzy raw files and rclpy jazzy sources worked.

## Fixes completed during this continuation

Shared in both candidates unless specified:

1. Endpoint identity/counts: multiple publishers/subscriptions from one node no
   longer collapse into one Set entry. Independent endpoint destruction gives
   2/2 -> 1/1 -> 0/0 while preserving deliveries. Python destroy_publisher and
   C++ Publisher destruction emit cleanup. Rejected publications create no
   empty ghost topic. Native + real Python/C++ tests passed in BOTH projects.
2. Python Timer handles support cancel/is_canceled/reset/destroy_timer, with
   ownership checks and cancelled callback suppression. Repeated timer events
   dispose previous schedules. Native parity and real workers passed.
3. Nested Python message arrays and service request/responses reconstruct actual
   generated ROS classes instead of namespaces/dicts. Real Path/PoseStamped/
   GetPlan programs passed Python/C++, browser/native, in both products.
4. Python/C++ service destruction removes endpoints and rejects pending calls.
   Process/node/Stop cleanup and timer cleanup have model regressions.
5. Build validation: unsupported colcon options after --packages-select reject;
   supported CMake forms validate their arguments; repeated
   ament_target_dependencies accumulates dependencies; setup.cfg accepts native
   whitespace/sections and rejects invalid layout instead of substring matching.
6. Unit 1 checker now needs successful completed shell commands, rejecting
   print-only literals/comments and failed commands. Legitimate alternate
   printenv/variable expansion works. Evidence persists and resets correctly.
7. Autosave now notices newly completed command evidence even if history was
   saved while the command was pending. Browser race test passed both products.
8. Custom-interface install overlays now contain inspectable generated headers,
   Python modules, CMake config and explicitly simulated libraries. Registry
   generation is shared with compilation. Upgrades preserve edited files and
   add missing ones. Nothing leaks into /opt/ros/jazzy.
9. Terminal close/Reset cancel pending startup commands and child shells. Lesson
   restore also invalidates pending commands without closing the reusable
   terminal. Runtime reset in KineNest also resets the daemon flag. Regressions
   and 16-cycle mixed real Python/C++/sensor stress passed before the final
   command-generation extension; recheck that extension in browser as needed.
10. Lesson/unit snapshots now include export acknowledgement. Lab Unit 7
    restarting no longer keeps a later export as already completed. Model test
    reproduced failure then passes; mirrored snapshot behavior in KineNest.
11. Simulator layout now responds to available panel width: 3 columns when
    wide; world above camera/LiDAR in medium widths; stacked below 560px.
    Captions and Enlarge use separate grid cells. Chrome passed six widths in
    both projects. Native Firefox passed four widths and Start/Stop in Lab.
    scripts/playground-responsive-check.mjs and firefox-layout-check.mjs retain
    screenshots. Resizer now measures actual displayed canvas height.
12. KineNest-only: TF & Odometry coming-soon card 03 added, ahead of
    Communication & QoS 04, with coordinate-axis icon. Seven translations and
    1280/899/390 layouts passed. A final small heading-alignment CSS correction
    was made after screenshots; visually recheck the next built preview.
13. Visible em dashes changed to colons in app instructions, topics lesson,
    shell help and matching translations. No command flags/operators altered.
14. C++ bulk image decode optimization described above: implemented, model
    tested, real browser validation PENDING. Treat it as open until measured.

## Tests and evidence from this continuation

Local artifacts/audit and artifacts/screenshots contain the results. They are
ignored by Git and therefore copied separately into the portable checkpoint.

- npm test: latest checkpoint passes all 39 Lab / 41 KineNest test files.
  These are file-level aggregate counts, not individual assertion totals.
  checkpoint-model-tests.log is copied into each artifacts/audit directory.
- endpoint-lifecycle-check.mjs: Python/C++ both products passed. Native
  native-endpoint-lifecycle.py also passed (counts, deliveries, timer handles).
- nested-runtime-check.mjs: Python/C++ both products passed.
- adversarial-build-check.mjs: 18 malformed metadata/build/source cases,
  failure -> no new install/run -> repair/build -> terminal source isolation,
  passed both products with real browser toolchains.
- build-causality-check.mjs: 22 Python and 21 C++ checks, both products passed:
  wrong directory, stale successful install, failure/repair, partial rebuild,
  duplicate package, unsupported option, missing console module, missing
  executable install, deletion/recreation of src/build/install/log.
- mixed-runtime-stress.mjs: 16 concurrent Python/C++/sensor cycles per product,
  close during startup every fourth cycle, resource/worker counts return to 0,
  final Reset race passes. No unbounded callback queue/evidence observed.
- native-export-check.py: exported Unit 7 workspaces both languages colcon-built
  and ran service client/server/CLI, launch pub/sub, custom StudentStatus.
- native-runtime-behavior.py: same nested message/service/timer fixtures native
  in both languages; setup.cfg whitespace and repeated CMake dependency parity.
- course-audit.mjs latest targeted rerun AUDIT_UNITS=0,3,4,5: Units 1/4/5/6
  Python AND C++ all pass. It overwrote the current course-python-cpp.json with
  the subset. Full prior all-147-page evidence remains in the earlier backup.
- editor-feedback.mjs: Lab nano save/discard, gedit, refresh, clipboard and
  language changes pass. K script was given LAB_URL support, not rerun yet.
- session-race-check.mjs: both products pass the new evidence-autosave race.
- playground-responsive-check.mjs: six Chrome widths, both products pass.
- firefox-layout-check.mjs: actual Firefox/geckodriver, four widths, Lab passes.
- upcoming-card-check.mjs: K homepage module order/icon/status, 7 locales,
  3 sizes pass. Small subsequent alignment change pending visual recheck.
- sensor-feedback-check.mjs: Python effective feedback passed. C++ strict
  stopping test FAILS before latest bulk-copy fix. Current model suites include
  the fix, but the browser test has not yet been rerun. See immediate next task.

A new scripts/ui-state-audit.mjs ran successfully through dirty edit protection,
draft reload/Revert, conflicting editor writes, live theme/locale/code-language
and lesson changes, six-terminal limit, closing a publisher, and history keys.
It then stopped on a HARNESS navigation issue: local docs/HANDOFF.md downloads
instead of rendering. The script now navigates to build-info.json for Back/
Forward, but this revised script has NOT RUN. Remaining portions include Back/
Forward persistence, Free Lab reset isolation, lesson Reset and keyboard view
resizing. Rerun BOTH products; do not claim them passed from this partial run.
The local source server may not have root build-info.json, which returns a 404
page; that still supplies a navigation entry, but prefer an existing navigable
resource if this causes problems. No product fix was inferred from that harness.

Sensor queue semantics: one running + one replaceable latest callback per
subscription. When only a sensor publisher stops, at most two already offered
image callbacks may finish. Test bounded drain, then zero further callbacks.
Stopping the student PROCESS itself must prevent late callbacks immediately.
Do not misclassify a bounded in-flight callback as a leak. At the same time,
measure image age and actual stopping distance: bounded queues alone did not
make the old C++ byte decoder fast enough.

## Previous coverage retained (do not repeat blindly)

Before this continuation: all 147 guided pages per code language across Units
1-7 passed fresh-profile visible success walkthroughs, reset/reload/history and
cleanup. All six playground sections passed both languages. Free Lab passed
both languages in both built products, including isolation and simulator loops.
All 148 built-in Python imports and C++ headers/constructors passed native and
real browser checks. Unit 1 native terminal parity and 42 rendered course copy
combinations passed. Pages subpath assets/MIME/lazy runtime/storage checks passed
on the prior public build and baseline live site. This is not a blanket pass of
all remaining adversarial matrices or the current changed candidate.

## Outstanding work after image latency

1. Extensive Start/Stop/Reset/rapid restart under sensor feedback with different
   targets: obstacle centered/left/right, moved/removed/occluded, robot poses,
   wrong topic/type, no image reads, deliberately slow callback, no target,
   fresh versus queued frames, stopped process, sensor source stopped/restarted,
   close terminal, scope switching. Validate displayed RGB, messages, commands,
   odometry/TF, actual robot motion, resource and worker cleanup. Repeat Python
   and C++; both products. User explicitly requires this breadth.
2. Broaden/check latency p50/p95/max under load and warm/cold start. Use bounded
   fresh delivery and preserve lazy C++ toolchain loading. Do not accept a
   collision rollback as proof that the student's controller stopped in time.
3. Rerun all 148 C++ interface compile checks after changed generated array
   decoding, plus nested services, installed binaries, compiler failure/retry,
   and installation catalog checks. Native-source fixtures remain unchanged.
4. Finish ui-state-audit.mjs in both products and adversarial editor diagnostics,
   long output, small screens, keyboard controls, Back/Forward, reload while
   running, theme/locale changes. Preserve dirty data and explicit Reset scope.
5. Complete remaining checker attacks/error/recovery per exercise, especially
   Units 2/3/7, and valid alternate programs. Playground is currently UNGRADED;
   do not invent a graded checker merely for this audit. K actions are separate.
6. Build public Lab and separate KineNest candidates after commit, run prefixed
   built previews, workers/assets/deep links/404/MIME/cache tests. Current dist
   predates these changes. No deployment until validated.
7. Fetch latest remotes, review compatibility with intervening changes, publish
   the correct standalone public artifact only when ready, then exercise the
   actual live Pages site. Do not claim live verification from local results.
8. Final report requested by user: commits (local/remote/deployed), tree status,
   units/exercises/beginner journey, shell/filesystem/terminals, build/CMake/
   package/install/source, graph/topics/interfaces/params/services/run/launch,
   Python/C++, playground, Free Lab/isolation, Pages/subpath/assets, severity
   counts/fixes/regressions, limitations, and explicit readiness YES/NO.
   YES only when the COMPLETE exercise-by-exercise adversarial review passes.

## Practical cautions

- Do not search giant src/native-installation-parts or installation-assets.js
  indiscriminately; compressed single-line data produces huge outputs.
- Some old browser scripts are stale (6 versus 7 units, 1 versus 2 exercises,
  hardcoded 8017, old headings). Inspect and update harness expectations before
  calling a failure a product regression. Keep valid tests meaningful.
- cpp/types.hpp and registry have shared fixes; K cpp/worker.js and compat.hpp
  contain additional action support. Never blindly overwrite K files with Lab.
- Source restore preserves successful stale installs after failed rebuild,
  matching measured native behavior. Do not erase the last successful install.
- Both original dirty worktrees must stay untouched. Candidate commits and
  portable backups are the safe handoff. Do not clean/reset originals.
- Communicate progress roughly every minute; no repetitive permission prompts.
  Continue autonomous debugging when resumed. No broad middleware scope growth.
