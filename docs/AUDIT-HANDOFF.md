# Resume the ROS 2 Basics Lab adversarial audit

Checkpoint: 12 October 2026, requested by Mario before moving to remote access.
The user asked to save and resume later. No test is intentionally left running.
Development/preview servers may remain running for convenience.

## Objective and constraints

Continue the complete 17-part user audit, not merely the last bug. Audit every
Unit 1–7 exercise and every playground exercise in BOTH Python and C++. Cover
visible success instructions, likely mistakes, recovery, reset, reload/history,
checkers, shell/filesystem, package/build/install/source causality, graph/process
cleanup, interfaces, services/parameters/launch, UI, stress, and static hosting.
Use real Pyodide/CPython and real Clang/LLD/WASM, and native Jazzy comparisons
where available. Do not redesign the human-reviewed curriculum. Add meaningful
regressions for nontrivial fixes; valid alternative programs must work too.
Keep the audit within the beginner concepts. The user's explicit exclusions
of middleware internals and curriculum expansion remain in force.

Work locally on the dedicated candidates. Mirror shared fixes to KineNest.
The standalone Pages deployment must contain its own `npm run build:public`
artifact, never a KineNest build. Earlier deployment authorization exists, but
publish only after validation. Preserve KineNest's product homepage and separate
curriculum. The Lessons/Exercises division is lower priority. Follow AGENTS.md:
virtual installation coverage must derive from canonical catalogs, regenerate
installation source assets after runtime changes, and preserve saved user edits.
No subagents were used; do not delegate without explicit authorization.

## Locations and branches

Workspace: `/home/mari0/Desktop/ROS_COURSE_2627`

- Standalone candidate: `.worktrees/ros2-basics-lab-analysis`, branch
  `audit/student-readiness`; inspect its HEAD for the checkpoint commit.
- KineNest candidate: `.worktrees/ros2learn-cmake-parity`, same branch name;
  latest implementation commit before this checkpoint: `6fd4b03`.
- Artifact-only Pages checkout: `.worktrees/ros2-basics-lab-pages-reference`.
  Latest fetched `origin/main`: `9866aa7`; live source inspected: `6ea6241`.
- Original `ros2-basics-lab` and `ros2learn` working copies were not changed.
  Each retains a modified `src/python/worker.js` and untracked
  `scripts/python-build-parity.mjs`, `tests/python-build.test.js`.
  Their fixes were adopted/committed in the candidate branches. Preserve the
  originals; do not reset/clean them when finishing or merging.

Development URLs:
- Standalone: `http://127.0.0.1:8033/ros2-basics-lab/`
- KineNest: `http://127.0.0.1:8034/basics.html`

Built previews:
- Standalone: `http://127.0.0.1:8031/ros2-basics-lab/`, source `be7aa35`,
  public artifact, asset version `e3b1a76d309f`.
- KineNest: `http://127.0.0.1:8032/basics.html`, source `6fd4b03`,
  asset version `ddff5485d063`.
- The documentation/reproducer commits after those builds do not change app
  behavior. Build again after the next implementation change.

No audit changes have been pushed or deployed. Fetch again before eventual
publication: the Pages remote moved externally during this session.

## Read first and evidence

Read standalone `docs/ADVERSARIAL-REVIEW.md` for architecture, findings,
coverage, limitations and the current NO readiness verdict. It deliberately
separates completed walkthroughs from remaining adversarial coverage.

Latest model results: standalone 107 passed; KineNest 112 passed. Built Free Lab
passed both languages in both projects (isolation, persistence, reset, separate
terminal environments, zero Twist, 20 simulator cycles per language, mobile).
Latest standalone built playground passed all six sections in both languages.
Rendered Units 1–7 copy passed 42 combinations (2 code languages × 3 UI locales).
All 148 built-in Python/C++ bindings passed real browser and native compilation.

Local `artifacts/audit/` retains reports, generated native fixtures and exports.
The combined course report has an old failing Python Unit 5 entry; the targeted
`course-python.json` rerun supersedes it after the checker fix. Do not erase
that history or treat old failure screenshots as unresolved without checking.
Use `.tar` native exports; old `.zip` names were a harness naming mistake.

Real versus modeled: Python and C++ execute real code; the filesystem, bounded
shell/build/install/launch and ROS graph are browser models. Free Lab uses the
same capabilities as the course with isolated saved state, not a hidden runtime.

## Exact stopping point: endpoint lifecycle defect

A new standalone `scripts/endpoint-lifecycle-check.mjs` is committed as an
explicit failing reproducer. Python creates one node with two publishers and
two subscriptions on `/shared`. Output proves four deliveries:

    0:payload0
    1:payload0
    0:payload1
    1:payload1

But `ros2 topic info /shared` reports publisher/subscription counts of 1/1.
The script fails its assertion as intended. It closes its browser and resets
its isolated Lab in finally blocks. The C++ fixture is written but NOT RUN yet.
No fix for this issue is implemented. Run C++ independently with:

    LAB_LANGUAGE=cpp node scripts/endpoint-lifecycle-check.mjs

The script next changes a `phase` parameter to destroy one publisher and one
subscription, verifies the survivor, then destroys the rest and checks cleanup.
Python currently lacks `Node.destroy_publisher`; C++ Publisher has no cleanup
emission. Verify these natively and fix alongside endpoint identity if confirmed.

Relevant files: `src/runtime/graph.js` stores publisher/subscriber node IDs in
Sets, collapsing multiple endpoints in one node. Adapter publisher events lack
endpoint IDs. Python `src/python/compat.py` and C++ `src/cpp/compat.hpp` emit
publisher creation without identity/destruction. Subscription IDs already
exist, but graph counts collapse by node. Preserve node list/info semantics,
independent peer cleanup, CLI jobs and simulator counts when introducing proper
endpoint identity. Do not blindly copy whole graph/compat files to KineNest;
it has additional action support. Regenerate installation assets in both repos.

Potential follow-ups discovered by reading, NOT confirmed bugs yet:
- Python `destroy_timer(timer_object)` appears to expect an internal string key,
  unlike native API. The object's cancel closure currently passes that key.
- Python service request/response reconstruction may not restore nested typed
  fields. Test real nested interfaces before changing it.
- `Runtime.publish` creates a topic before validating a message; test whether
  rejected messages can leave empty graph entries.

## Remaining review (do not claim complete)

1. Finish endpoint counts/lifecycle in Python and C++, native parity and model
   regression, then mirror to KineNest.
2. Complete each unit's error/recovery matrix: malformed metadata, dependencies,
   wrong build type/directory, duplicates, missing/renamed source, syntax/CMake
   errors, console scripts, install rules, stale install, partial rebuild,
   missing source/wrong terminal environment, deletion of build/install/log.
3. Complete checker attacks for all graded exercises, especially Units 1–3/7:
   print-only/empty/constant code, stale evidence, CLI doing the work, wrong
   topic/type/node, editor-only text, and valid alternative implementations.
4. More nested message/service behavior and supported API alternatives.
5. Longer concurrent Python/C++ Run/Stop/Reset/close/switch stress, worker/memory
   growth, late callbacks, crashes and rerun. Multiple publishers must produce
   consistent counts, duplicate deliveries and combined frequency.
6. Playground partial/wrong solutions and longer mixed sensor/process stress.
   Keep all motion/TF signs and metre-scale scene, LiDAR and camera consistent.
7. Browser Back/Forward, theme/language switching while running, editor dirty
   state/errors, terminal long output/history, small screens and keyboard use.
8. Build and run exported Unit 7 workspaces on native Jazzy, both languages.
9. Final rebuilt prefixed candidate verification and full live exercise testing
   after validated publication. Preserve separate standalone/KineNest products.
10. Final concise report with commits, per-area status, confirmed/fixed defects,
    regression evidence, limitations and remaining blockers. Classify findings
    BLOCKER/MAJOR/MINOR/LIMITATION. READY YES only after complete review passes.

Do not repeat already-passed broad tests without a relevant change or concern.
Use targeted tests first, then affected full suites. Most browser scripts accept
LAB_URL; `course-audit.mjs` also accepts LAB_LANGUAGE and zero-based AUDIT_UNITS.
Browser/native commands may need sandbox escalation; use the provided tools.

## Resume instruction

“Resume the full ROS 2 Basics Lab adversarial audit from AUDIT-HANDOFF.md.
Preserve both candidate branches and original dirty files. Start with the
reproduced endpoint lifecycle/count defect; test Python and C++, mirror shared
fixes to KineNest, and complete the remaining audit before declaring readiness.”
