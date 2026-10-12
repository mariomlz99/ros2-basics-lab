# Active audit record | 12 October 2026

Mario cancelled the handoff and asked to continue on this PC. This is an active
review, not a release approval. No changes from the audit branches are deployed.
Original dirty working copies remain untouched. DDS/RMW internals stay outside
scope and are not release blockers.

## Current results

- Endpoint destruction passes native and browser Python/C++ checks in both
  products: independent publishers/subscribers count 2 → 1 → 0.
- All 148 built-in Python imports and C++ headers/constructors passed; nested
  Path/GetPlan round trips, timers and service destruction pass both products.
- Image-driven steering and stopping pass both products and languages. Current
  Python image-to-command median is 24–25 ms, p95 33 ms; C++ median 18–19 ms,
  p95 24–26 ms. The robot stops at x≈2.22 m with front range≈0.66 m.
- The original C++ decoder reached x≈2.79 m with a 463 ms latency sample.
  Bulk byte decoding, typed image storage, direct Python conversion and avoiding
  redundant byte-range checks fix that measured defect. Resolution remains
  320×240. Validation of shape, size and ordinary arrays remains enforced.
- Strict feedback tests compare all 230400 displayed/published bytes, steering
  in both directions, stale frames, wrong topics, repair and the velocity
  watchdog. The final steady-state p95 regression guard is 100 ms.
- Each product passed 18 target/lifecycle cycles per language: centered, left,
  right, turned away, removed and occluded targets, live target changes, source
  restart, terminal closure and rapid simulator toggles. Startup cancellation
  and resource cleanup also pass. These runs preceded the final byte-validation
  speedup; repeat the target matrix on the built candidate.
- Deliberately slow callbacks pass four interruption cycles per language per
  product: bounded queues, responsive browser, no output after process Stop.
  This exposed a missing C++ clock binding, now fixed. Wall/monotonic clock tests,
  memory bounds and real std::chrono execution pass.
- Exact-byte browser regressions pass both products/languages: full-image
  decoding, UUID fixed arrays, dynamic/empty byte arrays and rejected bad fields.
- All 40 Lab / 42 KineNest model test FILES pass. These are file-level counts.
- Both products pass 19 real-program checker attacks/repairs per language,
  covering empty/print-only code, unexecuted source, wrong topics, external CLI
  traffic, constant parameters/services, valid alternatives, launch and Reset.
- UI state audit passes both products: dirty drafts/conflicts, save/reload,
  theme/locale/language changes, history, six terminals, Back/Forward, Free Lab
  isolation and keyboard resizing. Responsive simulator tests also passed six
  Chrome widths in both products and four Firefox widths in Lab.

KineNest has the TF & Odometry coming-soon card and axis icon before Communication
& QoS. Its README and current product docs have been shortened and corrected.
The existing Actions curriculum remains separate from Lab's native-handoff unit.

## Retained earlier evidence

All 147 Lab guided pages per language previously passed fresh-profile visible
walkthroughs, reload/history, Reset and cleanup. All six Playground sections and
Free Lab passed both languages. Both products passed 18 build-failure cases,
22 Python/21 C++ causality checks and 16 mixed-runtime stress cycles. Native Jazzy
comparisons cover exported workspaces, shell, build boundaries, sensor readers,
interfaces, endpoint counts and nested runtime behavior.

Other fixes retained in the audit branch include Python packaging/runtime
separation, bounded CMake/colcon/setup.cfg validation, generated custom-interface
installation entries, successful-command checker evidence, evidence autosave,
pending-command cancellation and export-acknowledgement reset.

## Remaining work

1. Build both candidates; rerun visible Units 1–7 and all Playground/Free Lab
   paths with the current artifacts. KineNest Unit 7 includes Actions; Lab Unit 7
   exports source for native ROS 2.
2. Finish current built asset/MIME/subpath/reload/cache checks and the final
   sensor target matrix. Confirm no runtime downloads for Python-free browsing
   and no C++ compiler download for Python-only use.
3. Re-fetch and review remote changes, validate the standalone public artifact,
   then perform authorized publication and verify the actual live deployment.
4. Report commits, tree status, coverage, severity counts, fixes, limitations and
   readiness. Do not return YES before the full adversarial review passes.

## Where to work

Standalone: `.worktrees/ros2-basics-lab-analysis`, source URL
`http://127.0.0.1:8033/ros2-basics-lab/`.
KineNest: `.worktrees/ros2learn-cmake-parity`, source URL
`http://127.0.0.1:8034/basics.html`.
Both branches are `audit/student-readiness`.

Latest evidence is in each candidate's ignored `artifacts/audit/`. Regression
scripts include `sensor-feedback-check.mjs`, `target-lifecycle-check.mjs`,
`slow-sensor-check.mjs`, `byte-runtime-check.mjs`, `checker-runtime-check.mjs`,
`nested-runtime-check.mjs`, `course-audit.mjs`, `ui-state-audit.mjs`,
`installed-cpp-check.mjs` and `compiler-failure-check.mjs`.

Build the Lab with `npm run build:public`; never deploy KineNest's build to the
Lab's GitHub Pages repository. Keep previous immutable asset versions for open
tabs. No subagents have been used or authorized.
