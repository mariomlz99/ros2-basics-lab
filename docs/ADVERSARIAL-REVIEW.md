# Student readiness audit | 12 October 2026

Status: active review on this PC; the user cancelled the handoff. See AUDIT-HANDOFF.md and the root AUDIT-RESUME.md for current commits and exact verification state. Both use the isolated `audit/student-readiness` branches.
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
| Model suite | All 40 Lab / 42 KineNest test files passed | Final built validation |
| Units 1–7 | All 147 guided pages per language followed in fresh browser profiles; commands, supplied files, checks, cleanup, reset and reload/history passed | Complete mistake/recovery and checker attack matrix per unit |
| Unit 1 | Native 15-command parity; successful-command evidence rejects literals/comments/failures; browser rerun passes | Wider per-exercise matrix |
| Python | Real packaging/runtime boundary, syntax, imports, pub/sub, custom messages, parameters, services and launch passed | Wider valid alternatives and repeated lifecycle stress |
| C++ | Real compile/run, failed rebuild recovery, pub/sub, interfaces, parameters, services and launch passed | Wider valid alternatives and repeated lifecycle stress |
| Interfaces | All 148 built-in Python imports / C++ headers and constructors passed in browser and native Python/g++ | Additional nested payload behavior |
| Build/source | 18 adversarial build cases, 22 Python/21 C++ causality checks both products; native exported workspaces both languages passed | Changed decoder integration and final built checks |
| Graph | Duplicate names; same-node 2/2 -> 1/1 -> 0/0 endpoints; native parity; 16 mixed worker cycles per product passed | Varied-target sensor Start/Stop and final generation extension |
| Playground | All six sections in Python/C++; command walkthrough, sensors, TF, readers, cleanup; current standalone built artifact passed | More wrong/partial code and long runtime stress |
| Preparation | All six positions retain selection; three repeated preparations; single prompt; real skeleton run; explicit reference reveal passed in both projects | No open reproduced defect |
| Free Lab | Both languages in both built projects: real hello, separate environments, independent save/reload/reset, zero Twist, 20 start/stop cycles per language, mobile layout passed | Long mixed workload stress |
| UI | Simulator six Chrome/four Firefox widths; dirty edits/conflicts; theme/language during execution passed | Complete revised Back/Forward, isolation and keyboard audit |
| Learner copy | Standalone Units 1–7 × two code languages × three UI languages (42 combinations) passed scope scan on rebuilt preview | Shared copy review where applicable |
| Pages | Live baseline and local prefixed public build: navigation/reload and 8 runtime assets/MIME passed; runtimes remain lazy | Full live course review after validated deployment |
| Storage | No cookies, Set-Cookie headers or service workers observed; browser session database present | No open reproduced defect |

The first combined course artifact records one Python Unit 5 checker failure.
The targeted rerun after the parameter-evidence fix passed; retain both pieces
of evidence (`artifacts/audit/course-python-cpp.json` and `course-python.json`).
Other initial walkthrough failures were harness assertions (terminal history
selection and launch reference text), corrected before the successful reruns.

## Current open defect and continuation results

The former endpoint-count defect is fixed and passed native plus real Python/C++
checks in both products, including 2/2 -> 1/1 -> 0/0 independent destruction.

**MAJOR, fixed and verified:** C++ image feedback previously reached x=2.79 m
with a 463 ms sample. Bulk byte decoding, compact Python transfer and typed-byte
validation now give Python p95=33 ms and C++ p95=24–26 ms in both products. Both
stop at x≈2.22 m. Exact full-image byte checks, 18 varied-target cycles per
language/product and slow-callback interruption pass. Browser clocks now also
support real C++ std::chrono wall/monotonic readings. See the active audit record.

This continuation also fixed Python timer/service lifecycle and nested typed
payloads, inspectable custom-interface overlay bindings, bounded CMake/colcon/
setup.cfg validation, Unit 1 successful-command evidence, evidence autosave,
pending commands after Reset/close/lesson restore, and stale export completion
on lesson reset. These fixes have reproductions and regression coverage.

18 browser build-failure/recovery cases and 22 Python/21 C++ build-causality
checks passed both products. Native exported workspaces both languages built
and ran services, launch and custom messages. Mixed Python/C++/sensor stress
passed 16 cycles per product with zero remaining workers or graph resources.

The simulator responsive layout passes six Chrome widths in both products and
four native Firefox widths in Lab. KineNest now includes TF & Odometry before
Communication & QoS as a coming-soon card, with an axis icon and seven locales.
Em dashes in visible guidance were reduced. Latest complete model runs pass
40 Lab and 42 KineNest test FILES. Current dist/live builds remain older.

Image feedback, varied-target lifecycle and UI/navigation checks pass. Both products
also pass 19 real-program checker attacks/repairs per language. Rebuilt/static/
live validation remains in progress.
The handoff is the authoritative detailed evidence/remaining-work ledger.

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
Current source changes are under active validation; see the audit record.

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
