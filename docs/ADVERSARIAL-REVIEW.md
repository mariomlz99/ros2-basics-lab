# Student readiness audit | 12 October 2026

Status: in progress. Local candidate: `be7aa35`; shared KineNest candidate:
`6fd4b03`. Both use the isolated `audit/student-readiness` branches.
Original working copies and their uncommitted changes are preserved.
The latest inspected Pages artifact is `9866aa7` (source `6ea6241`);
this audit candidate has not been published.

## Scope and evidence rules

Audit Units 1–7 without redesign, plus every optional playground exercise.
Exercise Python and C++ in the real browser runtimes. Distinguish model tests,
visible student walkthroughs, and native Jazzy comparisons. Keep the review
within the beginner concepts taught by the course.

## Architecture and realism

Static application: virtual filesystem → shell → package metadata → modeled
build/install → per-terminal environment → real Python/WASM workers → modeled
ROS graph. Python uses Pyodide CPython; C++ uses Clang/LLD and WebAssembly.
Shell, CMake, colcon and launch are bounded models, not native Linux processes.
Browser timers and worker scheduling differ from a native workstation.
Installation entries derive from the canonical interface/runtime catalogs.
Course, Playground and Free Lab have independent saved workspace scopes.

## Coverage ledger

| Area | Evidence to date | Remaining |
| --- | --- | --- |
| Model suite | Lab 107 / KineNest 112 passed | Extend for new defects |
| Units 1–7 | All 147 guided pages per language followed in fresh browser profiles; commands, supplied files, checks, cleanup, reset and reload/history passed | Complete mistake/recovery and checker attack matrix per unit |
| Unit 1 | Native Bash/Jazzy comparison of all 15 commands passed | Additional checker bypass attempts |
| Python | Real packaging/runtime boundary, syntax, imports, pub/sub, custom messages, parameters, services and launch passed | Wider valid alternatives and repeated lifecycle stress |
| C++ | Real compile/run, failed rebuild recovery, pub/sub, interfaces, parameters, services and launch passed | Wider valid alternatives and repeated lifecycle stress |
| Interfaces | All 148 built-in Python imports / C++ headers and constructors passed in browser and native Python/g++ | Additional nested payload behavior |
| Build/source | Native boundary checks; unsourced second terminal; compiled-but-uninstalled target; missing Python entry module; installed C++ runs without compiler cache passed | Full invalid build matrix and native exported workspace run |
| Graph | Duplicate-name processes, combined publisher rates, independent stop, background jobs, Ctrl+C/job control passed | Multiple endpoints inside one node; longer race/stress runs |
| Playground | All six sections in Python/C++; command walkthrough, sensors, TF, readers, cleanup; current standalone built artifact passed | More wrong/partial code and long runtime stress |
| Preparation | All six positions retain selection; three repeated preparations; single prompt; real skeleton run; explicit reference reveal passed in both projects | No open reproduced defect |
| Free Lab | Both languages in both built projects: real hello, separate environments, independent save/reload/reset, zero Twist, 20 start/stop cycles per language, mobile layout passed | Long mixed workload stress |
| UI | Responsive 960/700/390 layouts, keyboard resize/persistence, terminal job control passed | Back/Forward and theme/language changes during execution |
| Learner copy | Standalone Units 1–7 × two code languages × three UI languages (42 combinations) passed scope scan on rebuilt preview | Shared copy review where applicable |
| Pages | Live baseline and local prefixed public build: navigation/reload and 8 runtime assets/MIME passed; runtimes remain lazy | Full live course review after validated deployment |
| Storage | No cookies, Set-Cookie headers or service workers observed; browser session database present | No open reproduced defect |

The first combined course artifact records one Python Unit 5 checker failure.
The targeted rerun after the parameter-evidence fix passed; retain both pieces
of evidence (`artifacts/audit/course-python-cpp.json` and `course-python.json`).
Other initial walkthrough failures were harness assertions (terminal history
selection and launch reference text), corrected before the successful reruns.

## Confirmed findings and local fixes

- **MAJOR:** Python packaging executed entry modules. Build now performs CPython syntax validation; imports execute at run time. Native and real Pyodide regression passed.
- **MAJOR:** An absent Python console-script module failed at packaging instead of execution. Corrected to match native behavior.
- **MAJOR:** Compiled CMake targets without install rules failed the build. They now compile successfully and remain unavailable to `ros2 run`.
- **MAJOR:** Background topic jobs shared terminal-derived identities. They now have independent nodes, endpoints and cleanup.
- **MAJOR:** Course checks accepted terminal-only traffic or stale program evidence. Current executable ownership and observed callbacks now gate relevant checks; parameter checks require a matching output change.
- **MAJOR:** Installed C++ programs unnecessarily needed cached compiler/linker files. They now execute existing modules without loading Clang/LLD.
- **MAJOR:** C++ boolean-array encoding failed real compilation. Fixed and checked with every standard binding, including native compilation.
- **MAJOR:** Two processes with the same node name were rejected/merged. Independent identities preserve duplicate display names and independent lifecycle; native parity and Python/C++ repeated publisher tests passed.
- **MAJOR:** Playground preparation jumped to the introduction and repeated terminal prompts. It now preserves the current exercise and redraws the prompt once.
- **MAJOR:** Simulator start could leave partial graph state after a type error. Start is preflighted; stop/reset are idempotent. Velocity limits and collision rollback keep pose/wheels coherent.
- **MINOR:** Sensor mounts, wheel transforms and metre-scale visuals were inconsistent. Geometry, dynamic left/right wheel frames, floor scale and sensor readouts now share tested conventions.
- **MINOR:** Unit 7 translations retained excluded terminology. Source and translations are corrected; the rebuilt preview passed the rendered-copy scan.
- **FEATURE:** Free Lab provides an isolated, resettable workspace with the same Python/C++ environment and optional simulator, without a graded checker.
- **LIMITATION:** One program currently supports only one node object for a given node name; separate processes may share names. Topic type conflicts are explicitly rejected by the supported graph model.
- **LIMITATION:** Parameter evidence checks observed behavior; they are not a formal proof that arbitrary student code derives every output from a parameter.

Shared implementation fixes and their regressions have been committed to the
KineNest audit branch. Its product homepage and independent curriculum remain.
The unused robotics navigation entry is removed from its Linux module.

## Regression entry points

`npm test`; `scripts/browser.mjs`; `scripts/course-audit.mjs`;
`scripts/playground-exercises-check.mjs`; `scripts/playground-preparation-check.mjs`;
`scripts/free-lab-check.mjs`; `scripts/duplicate-publishers-check.mjs`;
`scripts/installed-cpp-check.mjs`; `scripts/interface-runtime-check.mjs`;
`scripts/pages-storage-check.mjs`; `scripts/lesson-copy-check.mjs`.
Native comparisons include `native-build-boundaries.py`, `python-build-parity.mjs`,
`native-duplicate-nodes.py`, `native-sensor-readers.py`, `lesson-one-parity.mjs`.

## Verdict

ROS 2 BASICS LAB READY FOR STUDENT USE: NO | complete adversarial review pending.
This is an evidence checkpoint, not a claim of a completed audit.
