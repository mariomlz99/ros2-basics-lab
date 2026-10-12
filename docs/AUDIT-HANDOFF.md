# Audit checkpoint | 12 October 2026, approximately 16:00 Brussels

PAUSED AT USER REQUEST: “please dump all the checkpoints i need to close the pc fast”.
The earlier instruction to continue on this PC has been superseded. Save and stop.
No push, merge or deployment has been performed. No subagents used or authorized.
The saved commits and checksums are in manifest.json. Source edits include an
Actions checker fix still awaiting complete final verification; do not call it released.

## Locations and preservation

- Standalone candidate: .worktrees/ros2-basics-lab-analysis, audit/student-readiness.
- KineNest candidate: .worktrees/ros2learn-cmake-parity, audit/student-readiness.
- Original ros2-basics-lab/ at 6ea62412 and ros2learn/ at 3b7f0006 remain untouched.
  Both contain preexisting modified src/python/worker.js and untracked
  scripts/python-build-parity.mjs plus tests/python-build.test.js. Never reset/clean.
- Pages artifact checkout: .worktrees/ros2-basics-lab-pages-reference. Clean but
  one commit behind fetched origin/main 9866aa77952f1e0a516f5dee319fbff7dfda54d9.
- KineNest origin/main 1f2744e6975b6f60e1fc4e748453e68a51e9cab9 is an ancestor
  of the candidate. Re-fetch before integration/publication.
- Latest live Lab inspected: source 6ea62412fa3ee1dbca5b824d97706b95ede331ab,
  publicBuild true, assetVersion 7b3a6474757d, built 2026-10-11T22:46:47.755Z.
- Current local dist Lab: source 6fbbcb2bc6701a2b3d0b48a2feb77ddb4e16b2be,
  publicBuild true, assetVersion 931f640ae38a. K dist: source
  bae2dbd5c5c6de2cf112e7eedc3f58b8c10534f3, assetVersion 62f566e8dc97.
  K dist does NOT contain the latest Actions checker fix. Rebuild after verifying it.

## What passed since the previous checkpoint

The formerly unverified image fix is now MEASURED AND PASSED. Keep the distinction
between earlier weak baseline tests and these strict actual feedback tests.

- Real image-driven steering/stopping, both products and languages, full 320x240:
  Lab Python median 24 / p95 33 / max 36 ms; C++ 18 / 24 / 26 ms.
  K Python 25 / 33 / 39 ms; C++ 19 / 26 / 39 ms.
  Both stop at x=2.2168 m, front range about 0.6632 m. Regression p95 guard 100 ms.
  Earlier C++ baseline was x=2.79 m and a 463 ms image-to-command sample.
- Full 230400 camera bytes verified against display and through real Python/C++
  callbacks; patterned byte decoding, fixed UUID arrays, dynamic/empty arrays,
  rejected malformed byte data and real C++ system/steady clocks all passed.
- Typed-byte registry validation median improved about 44 ms to 0.015 ms.
  Python direct JsProxy conversion, typed sensor storage, C++ bulk decoding and
  skipping redundant scalar checks ONLY for guaranteed typed-byte storage retain
  shape, bounds and ordinary-array validation. C++ WASI clock binding added.
- Source target matrix: 18 cycles/language/product, 72 total, passed centered,
  left/right, turned away, removed/occluded targets, source/process restart,
  close-terminal, rapid simulator toggles and startup cancellation.
- Latest BUILT LAB target matrix additionally passed 36 cycles (18/language).
  Typical cycle p95 16-37 ms, first Python cold cycle 60 ms. Zero leaked resources.
  K final built matrix remains to rerun after rebuilding the checker fix.
- Deliberately 350 ms slow callbacks: four interruption cycles/language/product,
  bounded queues (two in flight/two latest for two subscriptions), responsive main
  thread, Stop/close during callback, no late output or leftover graph/workers.
- Full current built guided walkthrough: Lab 14 unit/language runs, 294 pages;
  K 14 runs, 324 pages including Actions. Fresh profiles, visible commands/files,
  actual output, completion, cleanup, Reset and reload/history all passed.
  K Actions walkthrough must be rerun AFTER the newest checker change.
- All six built Playground sections and real sensor readers passed both products
  and languages. Built Free Lab passed both languages/products: real hello,
  per-terminal sourcing, save/reload/reset isolation, mobile, zero Twist and
  20 simulator Start/Stop cycles per language.
- 19 actual-program checker attacks/repairs per language/product, 76 total:
  empty/print-only/unexecuted source, wrong topic, external CLI, constant parameter
  and service values, custom-message use, alternate names, launch, Stop and Reset.
- UI state audit passed both products: dirty drafts/conflicts, save/reload,
  preferences while running, six terminals, history, Back/Forward, Free Lab and
  keyboard resizing. Simulator layout: six Chrome widths both products, four
  Firefox widths Lab. K upcoming cards passed seven locales and three widths.
- Built K product smoke passed after correcting outdated expected card count
  and obsolete forbidden LESSONS/EXERCISES assertions. Four future cards now.
- Lab prefixed public Pages/storage check passed 12 runtime assets/MIME,
  all nine nav entries/reloads, real 404, publicBuild=true, no eager runtime
  downloads on navigation, zero cookies/Set-Cookie/service workers.
- Lab rebuild-session check just PASSED: an open C++ session survives another
  asset version, old workers remain available, new tabs use the new version.
  K equivalent remains to rerun with --kinenest.
- Installed C++ without compiler/linker cache, compiler worker failure recovery,
  nested Path/GetPlan actual workers passed both products.
- Most recent FULL model suites: 40 Lab / 42 K TEST FILES passed BEFORE latest
  K Actions fix. Targeted Actions tests passed after the initial fix (9 checker
  cases + 4 action cases); subsequent program-client ownership requirement needs
  full suite rerun. Do not mistake file-level test count for assertions.
- K README/current product docs are now deliberately minimal, per user request.
  TF & Odometry coming-soon card precedes Communication & QoS with an axis icon.
  Visible em dashes reduced. Standalone README/HANDOFF corrected too.

## Immediate unfinished work: KineNest Actions checker

Found two MAJOR checker defects: status codes accepted incorrect Fibonacci data,
and a fresh server run reused old completion evidence. Reproduced with failing
model regressions, then implemented the following minimal K-only correction:

- src/runtime/actions.js captures bounded immutable request/payload evidence,
  action type and server/client owner. Event cap 200, arrays >64 not retained in
  evidence (live runtime payload unchanged). Existing action lifecycle unchanged.
- src/units/action-checks.js checks current installed server ownership, proper
  Fibonacci prefixes/result length for requested order, valid cancellation and
  invalid-goal rejection. Program client ownership is required for success/cancel,
  so CLI cannot replace the required student clients. Existing translated labels
  retained. Stop preserves completion because the visible final step stops the
  server; a fresh server invalidates the old events by ownership.
- src/units/checks.js delegates only Actions to this helper.
- tests/checker-adversarial.test.js adds wrong-output and old-run reproductions;
  tests/actions.test.js checks immutable/bounded evidence.
- scripts/action-checker-runtime-check.mjs executes bad/repaired real servers in
  both languages, valid CLI-only result rejection, genuine clients, Stop, rerun,
  Reset. Python all SEVEN cases PASSED. C++ was in progress at pause; see final
  SESSION-STATUS.txt and saved action-checker-*.json for exact completion status.

Next: finish real C++ checker test, add/verify CLI-only model regression if useful,
run npm test in K, run existing scripts/actions.mjs cross-language combinations,
rebuild and rerun visible Actions Unit 7 (AUDIT_UNITS=6). Preserve the full course
report first: course-audit currently overwrites course-python-cpp.json on subsets.
Do NOT add Actions curriculum/runtime to Lab; this is K's existing separate unit.

## Remaining release audit work

1. Finish Actions fix verification above, commit if more edits and rebuild K.
2. Run K built target-lifecycle matrix and strict sensor feedback in built apps
   as appropriate; run latency tests alone (avoid simultaneous compiler load).
3. K rebuild-session-check --kinenest; explicitly verify a Python-only runtime
   exercise does not fetch /wasm-clang/. Existing pages test covers navigation,
   not actual Python execution. Add a request observer to a focused browser run.
4. Finish coverage ledger/severity counts in docs/ADVERSARIAL-REVIEW.md. Its older
   remaining-column rows are stale; use this checkpoint plus actual artifacts.
   Original native parity, 148 interfaces, 18 build cases, 22 Python/21 C++ causal
   checks, 16 mixed stress cycles/product and endpoint 2->1->0 evidence remain.
5. Re-fetch/review remote changes, prepare final committed standalone PUBLIC
   artifact, then authorized publication and actual live course/asset verification.
   Pages checkout must fast-forward to origin/main before stage-pages.mjs.
   stage-pages validates publicBuild and correct remote, retains prior asset
   versions for open tabs. NEVER publish KineNest build to Lab Pages.
6. Final report commits/remote/deployed/tree status, exercise-by-exercise and
   beginner coverage, all ecosystems, latency/lifecycle, bug counts/regressions,
   intentional limitations. Readiness remains NO until complete review passes.

## Restart commands

Use Node >=22. Dependencies are installed on this PC. Browser scripts use system
Google Chrome via Playwright and need the normal browser execution permission.
Do not expect prior terminal/process session IDs to survive a PC shutdown.

Lab worktree:
    PORT=8033 node scripts/serve.mjs
    npm run build:public
    PORT=8031 node scripts/serve.mjs --built
    LAB_URL=http://127.0.0.1:8031/ros2-basics-lab/ node scripts/course-audit.mjs

K worktree:
    PORT=8034 node scripts/serve.mjs
    LAB_URL=http://127.0.0.1:8034/basics.html node scripts/action-checker-runtime-check.mjs
    npm test
    LAB_URL=http://127.0.0.1:8034/basics.html node scripts/actions.mjs
    npm run build
    PORT=8032 node scripts/serve.mjs --built
    AUDIT_UNITS=6 LAB_URL=http://127.0.0.1:8032/basics.html node scripts/course-audit.mjs
    LAB_URL=http://127.0.0.1:8032/basics.html node scripts/target-lifecycle-check.mjs
    node scripts/rebuild-session-check.mjs --kinenest

Both target-lifecycle and strict sensor-feedback accept LAB_URL; sensor-feedback
accepts LAB_LANGUAGE=python or cpp. Run realistic browser timing checks alone.
Detailed runtime evidence is copied into this checkpoint's evidence/ directories.
Git bundles contain committed source, not node_modules or generated dist.

## User requirements that persist

Continue fixes rather than merely writing a review. Preserve original dirty trees.
Image latency/reliability and varied-target Start/Stop have highest priority.
Fresh student-visible exercise paths plus meaningful mistakes/recovery, actual
behavior, honest limitations and beginner Jazzy/native parity. Shared fixes go to
both products, with inspectable /opt/ros/jazzy installation generated from canonical
registries; regenerate installation assets after runtime source edits.
DDS/RMW internals are explicitly OUT OF SCOPE and not release blockers.
Keep K docs minimal, avoid em dashes, no unrequested subagents.
The last ETA given was 60-90 minutes before this pause, conditional on findings;
reassess after resuming rather than treating it as a deadline or guarantee.
