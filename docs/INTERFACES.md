# Canonical interface registry

`src/interfaces/builtin.js` contains 147 Jazzy message/service records transcribed from the locally installed upstream `.msg` and `.srv` definitions. `scripts/import-jazzy-interfaces.py` regenerates this file from `/opt/ros/jazzy/share`; it is a maintenance tool, not an application dependency.

Installed source package versions used for this snapshot:

| Packages | Version | Declared upstream license |
| --- | --- | --- |
| builtin_interfaces, action_msgs, rcl_interfaces | 2.0.3 | Apache License 2.0 |
| std_msgs, geometry_msgs, sensor_msgs, nav_msgs, std_srvs | 5.3.6 | Apache License 2.0 |
| example_interfaces | 0.12.0 | Apache License 2.0 |
| unique_identifier_msgs | 2.5.0 | BSD |

These are upstream ROS interface definitions maintained by their ROS contributors, including Open Source Robotics Foundation. Package versions and license labels above come from the installed package.xml files. The UUID record is the standard `uint8[16] uuid` field declaration.

The registry is shared by CLI inspection, Python classes, C++ headers and runtime validation. Service request and response constants are separate. CLI inspection expands nested fields. Coverage of an interface does not imply implementation of the corresponding ROS action, navigation, sensor driver or middleware API.

Custom interfaces use this registry after a successful build. Their deliberately bounded scalar syntax is described in HANDOFF.md.

`src/interfaces/native-text.js` preserves the original installed source text and native `ros2 interface show` output (default, `--all-comments`, and `--no-comments`). This includes upstream comments, blank lines, constants, nested definitions and tab indentation. Simulated `/opt/ros/jazzy/share` interface files use the same original sources. After adding or updating a built-in interface, source Jazzy and run `python3 scripts/capture-interface-text.py`; `--check` verifies all captures against the local installation. Tests require native text coverage for every built-in interface. Generated bindings still use the parsed schema.
