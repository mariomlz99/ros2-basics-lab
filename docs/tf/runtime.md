# Live TF runtime

`Runtime.publish()` feeds `/tf` and `/tf_static` `TFMessage` publications into
`runtime.tf`. No robot pose is stored by the visualizer or language APIs.
`TransformStore` composes full quaternions, including the existing camera optical
frame and rolling wheel frames, even though the lesson emphasizes planar x/y/yaw.

- `tf.edges()` returns `{parent, child, static, transform, publisher}` records.
- `tf.snapshot()` returns `{revision, edges}`.
- `tf.lookup(target, source)` returns a `TransformStamped` expressing the source
  frame in target coordinates.
- `tf.transformPoint(target, pointStamped)` returns a `PointStamped` in the target
  frame. `applyTransform()` and `quaternionYaw()` are shared view helpers.

Python and C++ workers receive versioned copies of these published transforms.
The browser event loop delivers each update before the next worker callback;
there is no separate simulation or interpolation in a worker. A running program
can observe the previous publication until its next callback, as ordinary topic
delivery is asynchronous. Comparisons use the exact observed revision and an
absolute numerical tolerance of `1e-10` for geometry; the UI rounds to three decimal
places (lesson program output uses two).

`RuntimeAdapter` verifies successful operations against the corresponding
dispatched snapshot before recording `runtime.tfEvidence`. Evidence belongs to
the executing adapter and deduplicates repeated observations. Each run also has
an opaque worker proof, captured before learner code starts and held privately
by `TransformClient`. It is sent only with the initial snapshot and is omitted
from stored checker evidence. A copied result submitted through `emit_json`
cannot impersonate a successful TF operation. These checks validate supported
learner behavior; they are not an anti-tampering boundary against modifying the
browser's JavaScript runtime or developer tools. A new run on the
same adapter clears its old evidence; the course additionally checks current
installed source and latest program ownership. Stop releases listener endpoints
and worker updates; Reset clears transforms and evidence. Publisher removal
removes its live transform entries. Explicit evidence invalidation advances the
snapshot revision floor so a queued pre-reset callback cannot restore old proof.

Supported lesson APIs are `Buffer`, `TransformListener`, latest-time
`lookup_transform` / `lookupTransform`, and `Buffer.transform(PointStamped,
target)`. Historical timestamps, blocking transform waits, a transform cache,
and listener threads are deliberately unsupported and diagnosed. Python exposes
`TransformException`; C++ lookup failures stop the program with a clear message,
following the platform's existing worker error model. The lesson C++ source uses
an uncaught lookup, which is also valid on native Jazzy. No `tf2_echo` executable
or free `do_transform_point` API is advertised.

Multiple listeners may share a buffer. C++ tracks their lifetimes with a count;
destroying one listener does not disable another. Listeners cannot be copied.

The installed Python modules, canonical C++ headers, package metadata, indexes
and explicitly simulated libraries are generated under `/opt/ros/jazzy`.
`npm run bundle:installation` regenerates inspectable runtime source assets.

Reference syntax and source/target ordering were checked against the official
[Jazzy Python listener tutorial source](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials/Intermediate/Tf2/Writing-A-Tf2-Listener-Py.rst),
[Jazzy Python Buffer interface](https://github.com/ros2/geometry2/blob/jazzy/tf2_ros_py/tf2_ros/buffer_interface.py),
and locally installed native Jazzy `tf2_ros` headers. The generated lesson
packages are also compiled and run unchanged against native Jazzy by
`scripts/native-tf-lessons.mjs`.

Regression coverage:

- `tests/tf-runtime.test.js`: deterministic robot poses, mounts, full optical
  rotation, inverse/point composition, invalid/disconnected frames, lifecycle,
  verified owner evidence, and inspectable installation.
- `scripts/tf-runtime-check.mjs`: real Pyodide and compiled C++ execution of the
  actual lesson sources, starter failures, successful lookup/point use, moved
  pose, reset pose, alternative node/timer, Stop, rerun, and Reset.
- `tests/tf-adversarial.test.js`: 512 seeded poses checked against independent
  planar equations, malformed batches, disconnected frames and replay attacks.
- `scripts/tf-adversarial-runtime.mjs` and `scripts/native-tf-review.mjs`:
  unchanged learner-shaped probes in both languages, 11 poses, seven lookup
  pairs and the target point. Printed browser/native values agree within
  `1e-9`; equivalent quaternion signs are accepted as the same orientation.
- `npm run test:tf-review`: checker attacks, language parity, saved sessions,
  French/Dutch responsive checks and 55 navigation/run/reset cycles.

The standalone Lab uses the same supported TF runtime and five exercises as KineNest. Its public artifact is still produced by `npm run build:public`; TF is appended at lesson index 9, preserving existing course, Playground and Free Lab indices.
