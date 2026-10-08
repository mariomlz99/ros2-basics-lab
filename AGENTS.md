# ROS ecosystem installation invariant

The user requires the browser's simulated filesystem to represent the complete supported ROS ecosystem, not empty directory placeholders. Apply this to both `ros2-basics-lab/` and `ros2learn/` when transferring shared fixes.

- Every built-in package, message, service, action, command, Python module, C++ header and modeled library must have its corresponding inspectable installation entries under `/opt/ros/jazzy` (`share`, `bin`, `lib`, `include`, resource indexes, and environment/setup files as appropriate).
- Keep `/bin`, `/usr/bin`, and `/lib` consistent with the supported simulated system commands and runtime libraries. These are virtual paths; do not modify the host installation.
- Derive installed interfaces and bindings from the canonical interface registry. Register new runtime headers in `src/runtime-catalog.js`, used by both compilation and installation generation. Regenerate runtime source assets with `npm run bundle:installation` after editing runtime sources.
- Extend the installation catalog and coverage tests whenever adding ecosystem functionality. Do not maintain a separate hand-copied list of messages or omit action result/feedback sections.
- Saved-session restoration must add newly supported files and update unedited generated files while preserving user edits and workspaces.
- Student-created packages belong in their workspace install overlay, not the built-in `/opt/ros/jazzy` underlay.
- Native binaries are simulated, clearly identified inspectable artifacts; their presence must not imply unsupported runtime functionality.

# Exercise parity

Every exercise step added or verified must have a matching ROS 2 Basics Lab case: the same commands, generated files, expected results, and relevant failure cases. Preserve meaningful mistakes such as building from the wrong directory. Verify behavior against native Bash/ROS when available, and keep shared corrections aligned with Kinenest.

- Preserve original interface comments and formatting: after adding/updating built-ins, source native Jazzy and run `python3 scripts/capture-interface-text.py`. Keep CLI inspection and simulated installation files aligned with these captures; tests require coverage for every built-in.
