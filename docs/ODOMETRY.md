# Odometry notebook — local development, 14 October 2026

The fifth Frames & TF exercise, **Odometry | motion detective**, connects a
published pose to a recorded path, distance from the starting point, heading,
and velocity expressed in the body and odom frames. The same exercise, files,
commands and notebook are available in the standalone Lab's Playground.

## Implemented

- [x] Forward/reverse experiment: travelled path increases while displacement can return to zero.
- [x] Turn-in-place and arc experiments; quaternion-to-yaw interpretation; body versus odom velocity.
- [x] Read-only notebook built from `/playground` publications on `/odom`, with no second robot state or extra ROS endpoints.
- [x] Mark a new measurement origin without moving the robot. Reset/start begin a new recording; Stop labels the last sample as paused.
- [x] Bounded 600-point trace; total sampled distance survives display truncation. A sample-history gap explicitly begins a new recording.
- [x] Independent `odom_lab` Python/C++ readers, using existing canonical `nav_msgs/msg/Odometry` bindings. Packages install in the workspace overlay.
- [x] Six translated KineNest locales, responsive notebook and light/dark styling. The standalone Lab uses its existing English/French/Dutch locale selection.
- [x] Existing guided-page positions stay stable: the new exercise is appended. Existing TF reference programs, checkers and saved workspaces are preserved.

The notebook is a transient observation tool; its trace is not saved across page
reloads or TF navigation. Exercise source files still use normal workspace
autosave. The exercise is exploratory and does not award a completion badge.

## Extension points

| File | Responsibility |
| --- | --- |
| `src/playground/odometry-lesson.js` | Shared exercise and unchanged Python/C++ sources |
| `src/playground/odometry-trace.js` | Pure message-to-measurement accumulator |
| `src/playground/odometry-view.js` | Published-sample notebook, SVG trace and lifecycle |
| `src/playground/odometry-translations.js` | Prose and UI translations |
| `kinenest-tf/src/tf/lesson.js`, `visualizer.js` | KineNest feature integration |
| `src/app.js`, `src/playground/lessons.js` | Shared Playground integration |

Useful next developments, **not implemented**:

- An explicitly separate wheel-odometry estimator with calibrated wheel radius/track and controlled slip; preserve the current ideal-pose reference.
- Drift and covariance experiments that distinguish estimated pose from ground truth; do not label zero covariance as real certainty.
- A student-written distance accumulator with execution-based checks for reverse motion, resets and timestamp discontinuities.
- Export recorded observations as a portable experiment log, including sample timestamps and frame names.
- A separate `map → odom` localization lesson once that runtime behavior exists.

No new ROS API or runtime header was introduced. The installation catalog already
provides the message, Python module and C++ header used by the readers. No host
ROS files are modified.

## Verification and reproduction

With a local server running:

```sh
npm test
npm run build
npm run test:odometry
source /opt/ros/jazzy/setup.bash
npm run test:odometry:native
```

`LAB_URL` selects a different local origin. Standalone Lab uses
`npm run build:public` for its publishable artifact.

Browser checks execute every shared command and both readers with the real
browser runtimes. They cover wrong nested fields, missing overlay sourcing,
building inside `src`, workspace installation, out/back motion, in-place turns,
arcs, reset, mark, pause, cleanup, supported locales and four viewport widths.
Native checks build the exact reader sources and verify the same topic commands,
reader output and failure cases in temporary Jazzy workspaces. Native velocity
commands reach a subscriber fixture; they do not claim a native physics simulation.

Evidence lives in `artifacts/odometry/` (browser/native JSON, native build logs,
desktop/mobile/dark screenshots). The workspace-wide checkpoint at
`checkpoints/2026-10-14-odometry/` from the workspace root records exact checkout
locations, final validation and remaining work.

## Semantics and references

The message assigns pose to `header.frame_id` and twist to `child_frame_id`.
See the [official Jazzy Odometry definition](https://github.com/ros2/common_interfaces/blob/jazzy/nav_msgs/msg/Odometry.msg).
The lesson follows [REP 103 coordinate conventions](https://github.com/ros-infrastructure/rep/blob/master/rep-0103.rst)
and [REP 105 odom semantics](https://github.com/ros-infrastructure/rep/blob/master/rep-0105.rst).
The browser publishes ideal integrated pose and zero covariance; real odometry
can drift. Path length sums chords between sampled positions and approximates
curves. `/odom` does not itself publish a TF relationship: the simulator separately
publishes `/tf`. Reset pose is a deliberate teaching discontinuity.

## Verification completed on 14 October

- KineNest feature: **174/174** unit tests; installation-source consistency; build.
- Audited standalone Lab: **144/144** unit tests; installation-source consistency; `build:public`.
- Both products: real browser execution of every new command, Python/C++ reader output matching native values, wrong-field and overlay/build-location failures, notebook lifecycle, gap recovery, supported locales and widths 1440/820/390/320.
- Native Jazzy: both unchanged reader packages compile/run; all shared topic commands and meaningful failure cases pass.
- Existing KineNest TF visual regression: passed.
- Original older checkouts: targeted odometry and playground regression files pass; their unrelated Python build work remains uncommitted and untouched.

This is a local development checkpoint. Nothing was merged, pushed or deployed.
