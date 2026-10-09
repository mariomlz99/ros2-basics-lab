# Architecture

Independent static application extracted from the KineNest source snapshot recorded in EXTRACTION.json. The source checkout is read-only and is not a dependency at runtime or build time.

The lab owns its virtual filesystem, per-terminal shell environment, package model and beginner curriculum. Execution workers reuse the proven lazy Pyodide and Clang/LLD/WASM loaders. Worker adapters connect real learner code to one shared educational ROS graph. ProcessManager owns worker termination and launch groups. No backend, host shell execution, DDS or native ROS installation is implied.

The extracted compatibility layers contain older API internals; only the documented beginner subset will be exposed. Robotics is opt-in and will never populate the required course graph.

### Long directory listings

`ls -l` / `ls -la` render virtual owner/group, permissions, directory link counts,
UTF-8 byte sizes, modification times and aligned columns. `-a` includes `.` and
`..`; directory operands show `total` in 1 KiB units. Allocation is modeled in
4 KiB blocks (directories use 4096 bytes; short captured symlinks use no data
blocks), not a measurement of browser storage. The default virtual umask is
022. Native reference files retain captured modes/sizes; timestamps describe
the virtual filesystem. Existing sessions acquire missing metadata without
changing file contents. `touch`, writes, copies, moves and removals update the
appropriate metadata. `scripts/native-ls-parity.mjs` compares controlled
fixtures with GNU ls, normalizing account names and column padding.
