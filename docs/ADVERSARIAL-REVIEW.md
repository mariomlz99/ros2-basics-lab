# Student readiness audit — 12 October 2026

Baseline: local `6ea6241`, Pages artifact `cfbf9d5` (source `97dbdda`).
Work is isolated on `audit/student-readiness`; the live deployment is unchanged.

## Scope and evidence rules

Audit Units 1–7 without redesign, plus each optional playground exercise. Run
Python and C++ in their actual browser runtimes. Separate model tests, visible
student walkthroughs, and native Jazzy comparisons. A passing pre-existing
suite alone does not establish exercise completion or student readiness.

Keep command/file/build/install/source/process/graph causality. Review only
beginner concepts in the course; middleware internals are outside this audit.

## Baseline architecture

Static browser application: virtual filesystem → shell → package metadata →
modeled build/install → terminal environment → Python/WASM workers → graph.
Python runs in Pyodide CPython; C++ runs through Clang/LLD and WebAssembly.
The installation catalog derives runtime files from canonical interfaces and
runtime source assets, with additional inspectable native reference inventory.
Course and playground have separate workspaces. Free Lab requires a third
independent scope, including persistence and reset.

## Coverage ledger

| Area | Current audit evidence | Status |
| --- | --- | --- |
| Baseline model suite | 87 tests passed | Passed |
| Unit 1 environment | Pending current walkthrough/mistakes/reset | Pending |
| Unit 2 terminal topics | Pending current walkthrough/mistakes/reset | Pending |
| Unit 3 workspace/packages | Pending both languages | Pending |
| Unit 4 publisher/subscriber | Pending both languages and checker attacks | Pending |
| Unit 5 interfaces/parameters | Pending both languages and checker attacks | Pending |
| Unit 6 services/launch | Pending both languages and checker attacks | Pending |
| Unit 7 native transition | Pending export/native verification | Pending |
| Playground intro/odom/TF/LiDAR/camera/readers | Prior tests exist; current audit pending | Pending |
| Free Lab isolation/reset/persistence | Not implemented | Pending |
| Live Pages/assets/deep links | Latest remote fetched; browser checks pending | Pending |
| Build failures/stale installs/runtime recovery | Targeted reproduction pending | Pending |
| Process/stress/UI/session checks | Pending | Pending |

## Findings

- **MAJOR, fixed locally:** Python packaging imported entry points and loaded runtime dependencies. A top-level print ran during colcon build. Native Jazzy did not. Adopted the existing uncommitted worker correction into the isolated candidate without changing the original working files. Regression: `python-build.test.js`, `python-build-parity.mjs` (native and real Pyodide passed).
- **MAJOR, fixed locally:** CMake targets without install rules incorrectly failed compilation. They now compile, but are absent from installed executables. Regression: `build-failures.test.js`; native `native-build-boundaries.py` passed.
- **MAJOR, fixed locally:** Python console scripts pointing at absent modules incorrectly failed packaging. They now resolve during execution, where CPython supplies the error. Native boundary comparison and model regression added.

## Verdict

ROS 2 BASICS LAB READY FOR STUDENT USE: NO — audit in progress.
