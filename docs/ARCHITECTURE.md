# Architecture

Independent static application extracted from the KineNest source snapshot recorded in EXTRACTION.json. The source checkout is read-only and is not a dependency at runtime or build time.

The lab owns its virtual filesystem, per-terminal shell environment, package model and beginner curriculum. Execution workers reuse the proven lazy Pyodide and Clang/LLD/WASM loaders. Worker adapters connect real learner code to one shared educational ROS graph. ProcessManager owns worker termination and launch groups. No backend, host shell execution, DDS or native ROS installation is implied.

The extracted compatibility layers contain older API internals; only the documented beginner subset will be exposed. Robotics is opt-in and will never populate the required course graph.
