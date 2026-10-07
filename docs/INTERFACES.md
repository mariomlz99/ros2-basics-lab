# Canonical interface registry

`src/interfaces/builtin.js` contains Jazzy message/service records and the Fibonacci action transcribed from the locally installed upstream `.msg` and `.srv` definitions. Definitions follow the installed files under `/opt/ros/jazzy/share`. Fibonacci includes `order`, result `sequence`, and feedback `partial_sequence`.

Installed source package versions used for this snapshot:

| Packages | Version | Declared upstream license |
| --- | --- | --- |
| builtin_interfaces, action_msgs, rcl_interfaces | 2.0.3 | Apache License 2.0 |
| std_msgs, geometry_msgs, sensor_msgs, nav_msgs, std_srvs | 5.3.6 | Apache License 2.0 |
| example_interfaces | 0.12.0 | Apache License 2.0 |
| unique_identifier_msgs | 2.5.0 | BSD |

These are upstream ROS interface definitions maintained by their ROS contributors, including Open Source Robotics Foundation. Package versions and license labels above come from the installed package.xml files. The UUID record is the standard `uint8[16] uuid` field declaration.

The registry is shared by CLI inspection, Python classes, C++ headers and runtime validation. Service request and response constants are separate. CLI inspection expands nested fields. Coverage of an interface does not imply implementation of the corresponding ROS action, navigation, sensor driver or middleware API.

Custom interfaces use this registry after a successful build. Their deliberately bounded scalar syntax is described in SUPPORTED.md.
