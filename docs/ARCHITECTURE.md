# Architecture

The landing page opens BASICS. `src/app.js` owns the UI and saved workspaces; `src/units.js` defines the six units and playground. `src/units/` supplies guided steps, prerequisites and behavior checks. Visible examples in `src/examples.js` and `src/action-examples.js` are also the build/runtime test inputs.

The causal chain is files → package metadata → build → installed artifacts → sourced terminal → process → shared graph. `Lab` connects the filesystem, shell, workspace, builder and process manager. Terminals share files and a graph while retaining independent shell environments. BASICS and Playground use independent Lab instances and saved slots.

Python workers run CPython/Pyodide with a bounded rclpy compatibility API. C++ workers run Clang/LLD and execute WebAssembly with a bounded rclcpp API. InterfaceRegistry supplies matching Python classes, C++ headers, CLI inspection and wire validation. RuntimeAdapter registers nodes, publishers, subscriptions, timers, services and actions on a browser graph. Stopping a process cleans up its owned endpoints and pending work.

Actions use explicit server registration, per-goal ownership and typed goal/feedback/result payloads. Server callbacks execute in the chosen language worker. The transport enforces acceptance, cancellation and terminal states. Fibonacci is the supplied action interface. No action server runs until the user starts its executable.

Autosave stores versioned records in IndexedDB. Installed C++ bytes are recompiled into WebAssembly modules on restore. Running processes are never serialized. Build output versions executable assets by content hash; HTML points to that version so releases do not mix worker/header generations.

This is not Linux, DDS, RMW or a native ROS executor. See SUPPORTED.md for supported boundaries.
