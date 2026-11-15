# KineNest findings: ROS 2 Basics Lab counterpart review

Updated 2026-11-15. Mario authorized this local review before the next KineNest
validation batch. This course remains a separate, reduced beginner course.
The initial review was local. Mario subsequently authorized publishing these
corrections after online validation; the release checks below gate that update.

## Preserved baseline

- Published-repository checkout: `e20668c65a3a03a00484dfbf434e96bc220b78a9`.
- Originally clean, detached HEAD; work is on `audit/kinenest-findings-2027`.
- Frozen entry point: `assets/86b2f81499e5/src/app.js`.
- Its build records source commit `d8d8461f1b9f3ed76c8804c04f85bc8a83ee7ee2`,
  built 2026-10-30. That source commit is not the published-repository HEAD.
- External checkpoint: `../checkpoints/PRE_BASICS_FINDINGS_2027/`, containing
  the verified Git bundle, refs, clean status, diffs, build identity and hashes.

This is a published distribution checkout. Its original build scripts, package
manifest and test suite are absent. At baseline, all 122 root `src/` files were
byte-identical to the active asset tree. Root `src/` edits alone do not change
the application loaded by the frozen `index.html`.

All historical assets remain intact. The release candidate appends asset version
`de4f27f7e298`, updates its entry point and records the previous build identity.
The initial isolated preview is described below.
The local pinned artifact has been inspected; this review does not establish
what the live GitHub Pages origin currently serves.

## Findings and applicability

| Finding | Classification | Result in this course |
| --- | --- | --- |
| CAMERA-2027-001: short foreground box hides taller wall | KINENEST_ONLY defect; shared sensor coverage | Active Lab renderer already composites surfaces from far to near. Independent camera tests pass; no renderer patch needed. |
| CAMERA-2027-002: projected wall edge rounds outside pixel centers | KINENEST_ONLY defect; shared sensor coverage | Active Lab renderer already has pixel-center bounds. Independent camera tests pass. |
| LINUX-001/002/003/006/009 | KINENEST_ONLY current defects | Sampled counterpart cases already corrected in the shipped, dormant Linux checker. |
| LINUX-004/005/007/008/010 | SHARED_IMPLEMENTATION, dormant in Lab | Cross-terminal/stale environment evidence, absence-only removal, HOME-root changes and mutation bypasses reproduce in dormant Linux code. Recorded here; the Linux course is not activated or merged. |
| L10N-2027-001 | SHARED_CONCEPT, dormant in Lab | Linux title/prose translations are absent, but those lessons are not served by this reduced course. Active Lab locales are EN/NL/FR. KineNest's six-locale Linux translation file is not imported. |
| QA-2027-001 | SHARED_CONCEPT | Missing KineNest acceptance paths do not prove the same Lab coverage. Add the scoped executable regressions below; original Lab browser/native suites are not present in this distribution. |
| SHELL-2027-001, P2 | SHARED_IMPLEMENTATION, FIXED_LOCAL | Active ROS environment checker rejected successful absolute executable paths, full environment inspection and supported ROS global options. Reproduced independently in both projects, then repaired with repository-specific execution metadata. |
| SHELL-2027-002, P1 | SHARED_IMPLEMENTATION, FIXED_LOCAL | `ros2 node list --h` returned help but earned graph credit in both projects. Help aliases are excluded. Lab additionally records expanded help flags so `--*` cannot bypass the check. |

Static traversal from the frozen `app.js` reached 100 JavaScript files with no
unresolved literal imports. `linux-course.js` was not reachable. The active
course has seven ROS lessons ending in browser-to-native transfer, plus optional
Playground and Free Lab. It does not contain KineNest's separate Linux, TF or
Actions curriculum. Before activating or importing the dormant Linux module,
its unresolved checker defects and required translations must be repaired and
re-certified. Their presence here is not a claim of release readiness.

## Local repair

Only `src/runtime/shell-evidence.js` and small execution-evidence additions in
`src/shell.js` change application behavior. Lab's `command`/`operands` metadata
is used here; KineNest's counterpart uses `resolvedWords`. The filesystem and
shell implementations were not replaced with copies from KineNest.

The checker distinguishes installed executables from learner scripts with the
same filename. It retains literal/comment/redirection rejection for environment
inspection. Whole-environment output requires evidence that the actual exported
ROS distribution was inspected; a newline in another variable cannot forge it.
The additional evidence consists of booleans, with no extra file-content copy.

Session schema, storage keys, saved files and completion badges are unchanged.
Original exact-command evidence remains readable. Old whole-environment records
lacking the new inspection evidence cannot acquire newly broadened credit;
re-running the command records it. Session restoration tests use real Lab
capture/restore functions, but do not exercise browser IndexedDB transactions.
Older wildcard graph commands lacking expanded evidence also need replay; their
raw spelling cannot establish whether they expanded into help. New valid
wildcard listings remain accepted.

## Executable evidence

Requires Node 22. No new dependencies or credentials are needed:

```sh
node --test --experimental-test-isolation=none tests/*.test.mjs
```

`shared-shell-evidence.test.mjs` calls the actual first lesson's checker. It
covers the displayed commands, absolute executable paths, equivalent forms,
help aliases, wildcard-expanded help, failures/recovery, forged output, scripts,
saved records and reset. `shared-simulator.test.mjs` adds independent geometry:
960 LiDAR rays, six directed 3D TF point transforms, analytic motion/watchdog,
674 camera pixels, plus coherent moving/reset sensor acquisitions.

The final root source run passes **18 tests** (12 shell/checker cases and six
simulator cases), with no failures or skips. This is scoped regression coverage,
not certification of every course exercise.

To examine the unchanged frozen sensor implementation:

```sh
LAB_SOURCE_ROOT=assets/86b2f81499e5/src node --test --experimental-test-isolation=none tests/shared-simulator.test.mjs
```

Logs, initial failing cases, review failures, independent review and final
results are retained outside the repositories in
`../audit/basics-findings-2027/`. The initial applicability audit is retained in
`../audit/2027-batch02/basics-counterpart-independent-audit.{mjs,json}`.
Passing Node tests are not browser, native Jazzy or Python/C++ worker certification.

## Local preview and publication boundary

```sh
node scripts/prepare-local-preview.mjs
```

This creates a fresh ignored `artifacts/local-preview-*` directory and prints
its location and asset hash. It copies the complete source tree, verifies all
file hashes, rewrites only the preview entry point and records a derived build
identity. It does not fetch, push, publish, modify the original entry point or
overwrite historical assets. No source-repository commit is invented.

The preview's exact source tree can be tested by setting `LAB_SOURCE_ROOT` to
its printed `assets/<version>/src` directory and running the full test command.
Serve it on a separate loopback port, or use a fresh browser context, to avoid
sharing saved learner state with another local Lab instance. A different URL
path on the same origin does not isolate IndexedDB.

This preview is for local review, not a production deployment package: historical
cached assets remain in the original checkout. Publication is explicitly
authorized by Mario. The release candidate preserves
the existing distribution and all retained assets. `scripts/verify-distribution.mjs`
checks source/asset identity and compares every retained file with the baseline
Git blob. The GitHub Actions review runs Node checks plus real Chrome/Firefox
terminal, checker, IndexedDB and responsive checks on the review branch before
main is advanced. The same workflow checks the served asset version and live
course after publication. Native Jazzy and Python/C++ worker recertification
remain outside this small shell/checker release.

From a normal authenticated workstation terminal, `bash scripts/publish-reviewed.sh`
pushes the immutable candidate to the review branch, waits for its validation,
then fast-forwards main and waits for live checks. Any failed check stops the
sequence. It never force-pushes. This agent session's GitHub connection rejected
writes with HTTP 403, and terminal Git could not resolve GitHub; neither failed
attempt changed the remote repository. The user has already authorized publication.
