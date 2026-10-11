// Curated Jazzy interface schemas, transcribed from installed upstream .msg/.srv files.
// See NOTICE and docs/INTERFACES.md for upstream attribution. Canonical source.
export const BUILTIN = {
  "builtin_interfaces/msg/Duration": {
    "fields": [
      {
        "type": "int32",
        "name": "sec"
      },
      {
        "type": "uint32",
        "name": "nanosec"
      }
    ]
  },
  "builtin_interfaces/msg/Time": {
    "fields": [
      {
        "type": "int32",
        "name": "sec"
      },
      {
        "type": "uint32",
        "name": "nanosec"
      }
    ]
  },
  "std_msgs/msg/Bool": {
    "fields": [
      {
        "type": "bool",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Byte": {
    "fields": [
      {
        "type": "byte",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/ByteMultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "byte[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Char": {
    "fields": [
      {
        "type": "char",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/ColorRGBA": {
    "fields": [
      {
        "type": "float32",
        "name": "r"
      },
      {
        "type": "float32",
        "name": "g"
      },
      {
        "type": "float32",
        "name": "b"
      },
      {
        "type": "float32",
        "name": "a"
      }
    ]
  },
  "std_msgs/msg/Empty": {
    "fields": []
  },
  "std_msgs/msg/Float32": {
    "fields": [
      {
        "type": "float32",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Float32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "float32[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Float64": {
    "fields": [
      {
        "type": "float64",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Float64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "float64[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Header": {
    "fields": [
      {
        "type": "builtin_interfaces/Time",
        "name": "stamp"
      },
      {
        "type": "string",
        "name": "frame_id"
      }
    ]
  },
  "std_msgs/msg/Int16": {
    "fields": [
      {
        "type": "int16",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int16MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int16[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int32": {
    "fields": [
      {
        "type": "int32",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int32[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int64": {
    "fields": [
      {
        "type": "int64",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int64[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int8": {
    "fields": [
      {
        "type": "int8",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/Int8MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int8[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/MultiArrayDimension": {
    "fields": [
      {
        "type": "string",
        "name": "label"
      },
      {
        "type": "uint32",
        "name": "size"
      },
      {
        "type": "uint32",
        "name": "stride"
      }
    ]
  },
  "std_msgs/msg/MultiArrayLayout": {
    "fields": [
      {
        "type": "MultiArrayDimension[]",
        "name": "dim"
      },
      {
        "type": "uint32",
        "name": "data_offset"
      }
    ]
  },
  "std_msgs/msg/String": {
    "fields": [
      {
        "type": "string",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt16": {
    "fields": [
      {
        "type": "uint16",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt16MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint16[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt32": {
    "fields": [
      {
        "type": "uint32",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint32[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt64": {
    "fields": [
      {
        "type": "uint64",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint64[]",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt8": {
    "fields": [
      {
        "type": "uint8",
        "name": "data"
      }
    ]
  },
  "std_msgs/msg/UInt8MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint8[]",
        "name": "data"
      }
    ]
  },
  "geometry_msgs/msg/Accel": {
    "fields": [
      {
        "type": "Vector3",
        "name": "linear"
      },
      {
        "type": "Vector3",
        "name": "angular"
      }
    ]
  },
  "geometry_msgs/msg/AccelStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Accel",
        "name": "accel"
      }
    ]
  },
  "geometry_msgs/msg/AccelWithCovariance": {
    "fields": [
      {
        "type": "Accel",
        "name": "accel"
      },
      {
        "type": "float64[36]",
        "name": "covariance"
      }
    ]
  },
  "geometry_msgs/msg/AccelWithCovarianceStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "AccelWithCovariance",
        "name": "accel"
      }
    ]
  },
  "geometry_msgs/msg/Inertia": {
    "fields": [
      {
        "type": "float64",
        "name": "m"
      },
      {
        "type": "geometry_msgs/Vector3",
        "name": "com"
      },
      {
        "type": "float64",
        "name": "ixx"
      },
      {
        "type": "float64",
        "name": "ixy"
      },
      {
        "type": "float64",
        "name": "ixz"
      },
      {
        "type": "float64",
        "name": "iyy"
      },
      {
        "type": "float64",
        "name": "iyz"
      },
      {
        "type": "float64",
        "name": "izz"
      }
    ]
  },
  "geometry_msgs/msg/InertiaStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Inertia",
        "name": "inertia"
      }
    ]
  },
  "geometry_msgs/msg/Point": {
    "fields": [
      {
        "type": "float64",
        "name": "x"
      },
      {
        "type": "float64",
        "name": "y"
      },
      {
        "type": "float64",
        "name": "z"
      }
    ]
  },
  "geometry_msgs/msg/Point32": {
    "fields": [
      {
        "type": "float32",
        "name": "x"
      },
      {
        "type": "float32",
        "name": "y"
      },
      {
        "type": "float32",
        "name": "z"
      }
    ]
  },
  "geometry_msgs/msg/PointStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Point",
        "name": "point"
      }
    ]
  },
  "geometry_msgs/msg/Polygon": {
    "fields": [
      {
        "type": "Point32[]",
        "name": "points"
      }
    ]
  },
  "geometry_msgs/msg/PolygonInstance": {
    "fields": [
      {
        "type": "geometry_msgs/Polygon",
        "name": "polygon"
      },
      {
        "type": "int64",
        "name": "id"
      }
    ]
  },
  "geometry_msgs/msg/PolygonInstanceStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/PolygonInstance",
        "name": "polygon"
      }
    ]
  },
  "geometry_msgs/msg/PolygonStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Polygon",
        "name": "polygon"
      }
    ]
  },
  "geometry_msgs/msg/Pose": {
    "fields": [
      {
        "type": "Point",
        "name": "position"
      },
      {
        "type": "Quaternion",
        "name": "orientation"
      }
    ]
  },
  "geometry_msgs/msg/Pose2D": {
    "fields": [
      {
        "type": "float64",
        "name": "x"
      },
      {
        "type": "float64",
        "name": "y"
      },
      {
        "type": "float64",
        "name": "theta"
      }
    ]
  },
  "geometry_msgs/msg/PoseArray": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Pose[]",
        "name": "poses"
      }
    ]
  },
  "geometry_msgs/msg/PoseStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Pose",
        "name": "pose"
      }
    ]
  },
  "geometry_msgs/msg/PoseWithCovariance": {
    "fields": [
      {
        "type": "Pose",
        "name": "pose"
      },
      {
        "type": "float64[36]",
        "name": "covariance"
      }
    ]
  },
  "geometry_msgs/msg/PoseWithCovarianceStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "PoseWithCovariance",
        "name": "pose"
      }
    ]
  },
  "geometry_msgs/msg/Quaternion": {
    "fields": [
      {
        "type": "float64",
        "name": "x",
        "default": 0
      },
      {
        "type": "float64",
        "name": "y",
        "default": 0
      },
      {
        "type": "float64",
        "name": "z",
        "default": 0
      },
      {
        "type": "float64",
        "name": "w",
        "default": 1
      }
    ]
  },
  "geometry_msgs/msg/QuaternionStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Quaternion",
        "name": "quaternion"
      }
    ]
  },
  "geometry_msgs/msg/Transform": {
    "fields": [
      {
        "type": "Vector3",
        "name": "translation"
      },
      {
        "type": "Quaternion",
        "name": "rotation"
      }
    ]
  },
  "geometry_msgs/msg/TransformStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string",
        "name": "child_frame_id"
      },
      {
        "type": "Transform",
        "name": "transform"
      }
    ]
  },
  "geometry_msgs/msg/Twist": {
    "fields": [
      {
        "type": "Vector3",
        "name": "linear"
      },
      {
        "type": "Vector3",
        "name": "angular"
      }
    ]
  },
  "geometry_msgs/msg/TwistStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Twist",
        "name": "twist"
      }
    ]
  },
  "geometry_msgs/msg/TwistWithCovariance": {
    "fields": [
      {
        "type": "Twist",
        "name": "twist"
      },
      {
        "type": "float64[36]",
        "name": "covariance"
      }
    ]
  },
  "geometry_msgs/msg/TwistWithCovarianceStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "TwistWithCovariance",
        "name": "twist"
      }
    ]
  },
  "geometry_msgs/msg/Vector3": {
    "fields": [
      {
        "type": "float64",
        "name": "x"
      },
      {
        "type": "float64",
        "name": "y"
      },
      {
        "type": "float64",
        "name": "z"
      }
    ]
  },
  "geometry_msgs/msg/Vector3Stamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Vector3",
        "name": "vector"
      }
    ]
  },
  "geometry_msgs/msg/VelocityStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string",
        "name": "body_frame_id"
      },
      {
        "type": "string",
        "name": "reference_frame_id"
      },
      {
        "type": "Twist",
        "name": "velocity"
      }
    ]
  },
  "geometry_msgs/msg/Wrench": {
    "fields": [
      {
        "type": "Vector3",
        "name": "force"
      },
      {
        "type": "Vector3",
        "name": "torque"
      }
    ]
  },
  "geometry_msgs/msg/WrenchStamped": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "Wrench",
        "name": "wrench"
      }
    ]
  },
  "sensor_msgs/msg/BatteryState": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float32",
        "name": "voltage"
      },
      {
        "type": "float32",
        "name": "temperature"
      },
      {
        "type": "float32",
        "name": "current"
      },
      {
        "type": "float32",
        "name": "charge"
      },
      {
        "type": "float32",
        "name": "capacity"
      },
      {
        "type": "float32",
        "name": "design_capacity"
      },
      {
        "type": "float32",
        "name": "percentage"
      },
      {
        "type": "uint8",
        "name": "power_supply_status"
      },
      {
        "type": "uint8",
        "name": "power_supply_health"
      },
      {
        "type": "uint8",
        "name": "power_supply_technology"
      },
      {
        "type": "bool",
        "name": "present"
      },
      {
        "type": "float32[]",
        "name": "cell_voltage"
      },
      {
        "type": "float32[]",
        "name": "cell_temperature"
      },
      {
        "type": "string",
        "name": "location"
      },
      {
        "type": "string",
        "name": "serial_number"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_STATUS_UNKNOWN",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_STATUS_CHARGING",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_STATUS_DISCHARGING",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_STATUS_NOT_CHARGING",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_STATUS_FULL",
        "value": 4
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_UNKNOWN",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_GOOD",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_OVERHEAT",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_DEAD",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_OVERVOLTAGE",
        "value": 4
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_UNSPEC_FAILURE",
        "value": 5
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_COLD",
        "value": 6
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_WATCHDOG_TIMER_EXPIRE",
        "value": 7
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_HEALTH_SAFETY_TIMER_EXPIRE",
        "value": 8
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_UNKNOWN",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_NIMH",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_LION",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_LIPO",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_LIFE",
        "value": 4
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_NICD",
        "value": 5
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_LIMN",
        "value": 6
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_TERNARY",
        "value": 7
      },
      {
        "type": "uint8",
        "name": "POWER_SUPPLY_TECHNOLOGY_VRLA",
        "value": 8
      }
    ]
  },
  "sensor_msgs/msg/CameraInfo": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "uint32",
        "name": "height"
      },
      {
        "type": "uint32",
        "name": "width"
      },
      {
        "type": "string",
        "name": "distortion_model"
      },
      {
        "type": "float64[]",
        "name": "d"
      },
      {
        "type": "float64[9]",
        "name": "k"
      },
      {
        "type": "float64[9]",
        "name": "r"
      },
      {
        "type": "float64[12]",
        "name": "p"
      },
      {
        "type": "uint32",
        "name": "binning_x"
      },
      {
        "type": "uint32",
        "name": "binning_y"
      },
      {
        "type": "RegionOfInterest",
        "name": "roi"
      }
    ]
  },
  "sensor_msgs/msg/ChannelFloat32": {
    "fields": [
      {
        "type": "string",
        "name": "name"
      },
      {
        "type": "float32[]",
        "name": "values"
      }
    ]
  },
  "sensor_msgs/msg/CompressedImage": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string",
        "name": "format"
      },
      {
        "type": "uint8[]",
        "name": "data"
      }
    ]
  },
  "sensor_msgs/msg/FluidPressure": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float64",
        "name": "fluid_pressure"
      },
      {
        "type": "float64",
        "name": "variance"
      }
    ]
  },
  "sensor_msgs/msg/Illuminance": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float64",
        "name": "illuminance"
      },
      {
        "type": "float64",
        "name": "variance"
      }
    ]
  },
  "sensor_msgs/msg/Image": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "uint32",
        "name": "height"
      },
      {
        "type": "uint32",
        "name": "width"
      },
      {
        "type": "string",
        "name": "encoding"
      },
      {
        "type": "uint8",
        "name": "is_bigendian"
      },
      {
        "type": "uint32",
        "name": "step"
      },
      {
        "type": "uint8[]",
        "name": "data"
      }
    ]
  },
  "sensor_msgs/msg/Imu": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/Quaternion",
        "name": "orientation"
      },
      {
        "type": "float64[9]",
        "name": "orientation_covariance"
      },
      {
        "type": "geometry_msgs/Vector3",
        "name": "angular_velocity"
      },
      {
        "type": "float64[9]",
        "name": "angular_velocity_covariance"
      },
      {
        "type": "geometry_msgs/Vector3",
        "name": "linear_acceleration"
      },
      {
        "type": "float64[9]",
        "name": "linear_acceleration_covariance"
      }
    ]
  },
  "sensor_msgs/msg/JointState": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string[]",
        "name": "name"
      },
      {
        "type": "float64[]",
        "name": "position"
      },
      {
        "type": "float64[]",
        "name": "velocity"
      },
      {
        "type": "float64[]",
        "name": "effort"
      }
    ]
  },
  "sensor_msgs/msg/Joy": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float32[]",
        "name": "axes"
      },
      {
        "type": "int32[]",
        "name": "buttons"
      }
    ]
  },
  "sensor_msgs/msg/JoyFeedback": {
    "fields": [
      {
        "type": "uint8",
        "name": "type"
      },
      {
        "type": "uint8",
        "name": "id"
      },
      {
        "type": "float32",
        "name": "intensity"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "TYPE_LED",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "TYPE_RUMBLE",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "TYPE_BUZZER",
        "value": 2
      }
    ]
  },
  "sensor_msgs/msg/JoyFeedbackArray": {
    "fields": [
      {
        "type": "JoyFeedback[]",
        "name": "array"
      }
    ]
  },
  "sensor_msgs/msg/LaserEcho": {
    "fields": [
      {
        "type": "float32[]",
        "name": "echoes"
      }
    ]
  },
  "sensor_msgs/msg/LaserScan": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float32",
        "name": "angle_min"
      },
      {
        "type": "float32",
        "name": "angle_max"
      },
      {
        "type": "float32",
        "name": "angle_increment"
      },
      {
        "type": "float32",
        "name": "time_increment"
      },
      {
        "type": "float32",
        "name": "scan_time"
      },
      {
        "type": "float32",
        "name": "range_min"
      },
      {
        "type": "float32",
        "name": "range_max"
      },
      {
        "type": "float32[]",
        "name": "ranges"
      },
      {
        "type": "float32[]",
        "name": "intensities"
      }
    ]
  },
  "sensor_msgs/msg/MagneticField": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/Vector3",
        "name": "magnetic_field"
      },
      {
        "type": "float64[9]",
        "name": "magnetic_field_covariance"
      }
    ]
  },
  "sensor_msgs/msg/MultiDOFJointState": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string[]",
        "name": "joint_names"
      },
      {
        "type": "geometry_msgs/Transform[]",
        "name": "transforms"
      },
      {
        "type": "geometry_msgs/Twist[]",
        "name": "twist"
      },
      {
        "type": "geometry_msgs/Wrench[]",
        "name": "wrench"
      }
    ]
  },
  "sensor_msgs/msg/MultiEchoLaserScan": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float32",
        "name": "angle_min"
      },
      {
        "type": "float32",
        "name": "angle_max"
      },
      {
        "type": "float32",
        "name": "angle_increment"
      },
      {
        "type": "float32",
        "name": "time_increment"
      },
      {
        "type": "float32",
        "name": "scan_time"
      },
      {
        "type": "float32",
        "name": "range_min"
      },
      {
        "type": "float32",
        "name": "range_max"
      },
      {
        "type": "LaserEcho[]",
        "name": "ranges"
      },
      {
        "type": "LaserEcho[]",
        "name": "intensities"
      }
    ]
  },
  "sensor_msgs/msg/NavSatFix": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "NavSatStatus",
        "name": "status"
      },
      {
        "type": "float64",
        "name": "latitude"
      },
      {
        "type": "float64",
        "name": "longitude"
      },
      {
        "type": "float64",
        "name": "altitude"
      },
      {
        "type": "float64[9]",
        "name": "position_covariance"
      },
      {
        "type": "uint8",
        "name": "position_covariance_type"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "COVARIANCE_TYPE_UNKNOWN",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "COVARIANCE_TYPE_APPROXIMATED",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "COVARIANCE_TYPE_DIAGONAL_KNOWN",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "COVARIANCE_TYPE_KNOWN",
        "value": 3
      }
    ]
  },
  "sensor_msgs/msg/NavSatStatus": {
    "fields": [
      {
        "type": "int8",
        "name": "status",
        "default": -2
      },
      {
        "type": "uint16",
        "name": "service"
      }
    ],
    "constants": [
      {
        "type": "int8",
        "name": "STATUS_UNKNOWN",
        "value": -2
      },
      {
        "type": "int8",
        "name": "STATUS_NO_FIX",
        "value": -1
      },
      {
        "type": "int8",
        "name": "STATUS_FIX",
        "value": 0
      },
      {
        "type": "int8",
        "name": "STATUS_SBAS_FIX",
        "value": 1
      },
      {
        "type": "int8",
        "name": "STATUS_GBAS_FIX",
        "value": 2
      },
      {
        "type": "uint16",
        "name": "SERVICE_UNKNOWN",
        "value": 0
      },
      {
        "type": "uint16",
        "name": "SERVICE_GPS",
        "value": 1
      },
      {
        "type": "uint16",
        "name": "SERVICE_GLONASS",
        "value": 2
      },
      {
        "type": "uint16",
        "name": "SERVICE_COMPASS",
        "value": 4
      },
      {
        "type": "uint16",
        "name": "SERVICE_GALILEO",
        "value": 8
      }
    ]
  },
  "sensor_msgs/msg/PointCloud": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/Point32[]",
        "name": "points"
      },
      {
        "type": "ChannelFloat32[]",
        "name": "channels"
      }
    ]
  },
  "sensor_msgs/msg/PointCloud2": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "uint32",
        "name": "height"
      },
      {
        "type": "uint32",
        "name": "width"
      },
      {
        "type": "PointField[]",
        "name": "fields"
      },
      {
        "type": "bool",
        "name": "is_bigendian"
      },
      {
        "type": "uint32",
        "name": "point_step"
      },
      {
        "type": "uint32",
        "name": "row_step"
      },
      {
        "type": "uint8[]",
        "name": "data"
      },
      {
        "type": "bool",
        "name": "is_dense"
      }
    ]
  },
  "sensor_msgs/msg/PointField": {
    "fields": [
      {
        "type": "string",
        "name": "name"
      },
      {
        "type": "uint32",
        "name": "offset"
      },
      {
        "type": "uint8",
        "name": "datatype"
      },
      {
        "type": "uint32",
        "name": "count"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "INT8",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "UINT8",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "INT16",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "UINT16",
        "value": 4
      },
      {
        "type": "uint8",
        "name": "INT32",
        "value": 5
      },
      {
        "type": "uint8",
        "name": "UINT32",
        "value": 6
      },
      {
        "type": "uint8",
        "name": "FLOAT32",
        "value": 7
      },
      {
        "type": "uint8",
        "name": "FLOAT64",
        "value": 8
      }
    ]
  },
  "sensor_msgs/msg/Range": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "uint8",
        "name": "radiation_type"
      },
      {
        "type": "float32",
        "name": "field_of_view"
      },
      {
        "type": "float32",
        "name": "min_range"
      },
      {
        "type": "float32",
        "name": "max_range"
      },
      {
        "type": "float32",
        "name": "range"
      },
      {
        "type": "float32",
        "name": "variance"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "ULTRASOUND",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "INFRARED",
        "value": 1
      }
    ]
  },
  "sensor_msgs/msg/RegionOfInterest": {
    "fields": [
      {
        "type": "uint32",
        "name": "x_offset"
      },
      {
        "type": "uint32",
        "name": "y_offset"
      },
      {
        "type": "uint32",
        "name": "height"
      },
      {
        "type": "uint32",
        "name": "width"
      },
      {
        "type": "bool",
        "name": "do_rectify"
      }
    ]
  },
  "sensor_msgs/msg/RelativeHumidity": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float64",
        "name": "relative_humidity"
      },
      {
        "type": "float64",
        "name": "variance"
      }
    ]
  },
  "sensor_msgs/msg/Temperature": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float64",
        "name": "temperature"
      },
      {
        "type": "float64",
        "name": "variance"
      }
    ]
  },
  "sensor_msgs/msg/TimeReference": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "builtin_interfaces/Time",
        "name": "time_ref"
      },
      {
        "type": "string",
        "name": "source"
      }
    ]
  },
  "sensor_msgs/srv/SetCameraInfo": {
    "fields": [
      {
        "type": "sensor_msgs/CameraInfo",
        "name": "camera_info"
      }
    ],
    "response": [
      {
        "type": "bool",
        "name": "success"
      },
      {
        "type": "string",
        "name": "status_message"
      }
    ]
  },
  "nav_msgs/msg/Goals": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/PoseStamped[]",
        "name": "goals"
      }
    ]
  },
  "nav_msgs/msg/GridCells": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "float32",
        "name": "cell_width"
      },
      {
        "type": "float32",
        "name": "cell_height"
      },
      {
        "type": "geometry_msgs/Point[]",
        "name": "cells"
      }
    ]
  },
  "nav_msgs/msg/MapMetaData": {
    "fields": [
      {
        "type": "builtin_interfaces/Time",
        "name": "map_load_time"
      },
      {
        "type": "float32",
        "name": "resolution"
      },
      {
        "type": "uint32",
        "name": "width"
      },
      {
        "type": "uint32",
        "name": "height"
      },
      {
        "type": "geometry_msgs/Pose",
        "name": "origin"
      }
    ]
  },
  "nav_msgs/msg/OccupancyGrid": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "MapMetaData",
        "name": "info"
      },
      {
        "type": "int8[]",
        "name": "data"
      }
    ]
  },
  "nav_msgs/msg/Odometry": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "string",
        "name": "child_frame_id"
      },
      {
        "type": "geometry_msgs/PoseWithCovariance",
        "name": "pose"
      },
      {
        "type": "geometry_msgs/TwistWithCovariance",
        "name": "twist"
      }
    ]
  },
  "nav_msgs/msg/Path": {
    "fields": [
      {
        "type": "std_msgs/Header",
        "name": "header"
      },
      {
        "type": "geometry_msgs/PoseStamped[]",
        "name": "poses"
      }
    ]
  },
  "nav_msgs/srv/GetMap": {
    "fields": [],
    "response": [
      {
        "type": "OccupancyGrid",
        "name": "map"
      }
    ]
  },
  "nav_msgs/srv/GetPlan": {
    "fields": [
      {
        "type": "geometry_msgs/PoseStamped",
        "name": "start"
      },
      {
        "type": "geometry_msgs/PoseStamped",
        "name": "goal"
      },
      {
        "type": "float32",
        "name": "tolerance"
      }
    ],
    "response": [
      {
        "type": "Path",
        "name": "plan"
      }
    ]
  },
  "nav_msgs/srv/LoadMap": {
    "fields": [
      {
        "type": "string",
        "name": "map_url"
      }
    ],
    "response": [
      {
        "type": "nav_msgs/OccupancyGrid",
        "name": "map"
      },
      {
        "type": "uint8",
        "name": "result"
      }
    ],
    "responseConstants": [
      {
        "type": "uint8",
        "name": "RESULT_SUCCESS",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "RESULT_MAP_DOES_NOT_EXIST",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "RESULT_INVALID_MAP_DATA",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "RESULT_INVALID_MAP_METADATA",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "RESULT_UNDEFINED_FAILURE",
        "value": 255
      }
    ]
  },
  "nav_msgs/srv/SetMap": {
    "fields": [
      {
        "type": "nav_msgs/OccupancyGrid",
        "name": "map"
      },
      {
        "type": "geometry_msgs/PoseWithCovarianceStamped",
        "name": "initial_pose"
      }
    ],
    "response": [
      {
        "type": "bool",
        "name": "success"
      }
    ]
  },
  "example_interfaces/msg/Bool": {
    "fields": [
      {
        "type": "bool",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Byte": {
    "fields": [
      {
        "type": "byte",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/ByteMultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "byte[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Char": {
    "fields": [
      {
        "type": "char",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Empty": {
    "fields": []
  },
  "example_interfaces/msg/Float32": {
    "fields": [
      {
        "type": "float32",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Float32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "float32[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Float64": {
    "fields": [
      {
        "type": "float64",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Float64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "float64[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int16": {
    "fields": [
      {
        "type": "int16",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int16MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int16[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int32": {
    "fields": [
      {
        "type": "int32",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int32[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int64": {
    "fields": [
      {
        "type": "int64",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int64[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int8": {
    "fields": [
      {
        "type": "int8",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/Int8MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "int8[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/MultiArrayDimension": {
    "fields": [
      {
        "type": "string",
        "name": "label"
      },
      {
        "type": "uint32",
        "name": "size"
      },
      {
        "type": "uint32",
        "name": "stride"
      }
    ]
  },
  "example_interfaces/msg/MultiArrayLayout": {
    "fields": [
      {
        "type": "MultiArrayDimension[]",
        "name": "dim"
      },
      {
        "type": "uint32",
        "name": "data_offset"
      }
    ]
  },
  "example_interfaces/msg/String": {
    "fields": [
      {
        "type": "string",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt16": {
    "fields": [
      {
        "type": "uint16",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt16MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint16[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt32": {
    "fields": [
      {
        "type": "uint32",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt32MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint32[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt64": {
    "fields": [
      {
        "type": "uint64",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt64MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint64[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt8": {
    "fields": [
      {
        "type": "uint8",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/UInt8MultiArray": {
    "fields": [
      {
        "type": "MultiArrayLayout",
        "name": "layout"
      },
      {
        "type": "uint8[]",
        "name": "data"
      }
    ]
  },
  "example_interfaces/msg/WString": {
    "fields": [
      {
        "type": "wstring",
        "name": "data"
      }
    ]
  },
  "example_interfaces/srv/AddTwoInts": {
    "fields": [
      {
        "type": "int64",
        "name": "a"
      },
      {
        "type": "int64",
        "name": "b"
      }
    ],
    "response": [
      {
        "type": "int64",
        "name": "sum"
      }
    ]
  },
  "example_interfaces/srv/SetBool": {
    "fields": [
      {
        "type": "bool",
        "name": "data"
      }
    ],
    "response": [
      {
        "type": "bool",
        "name": "success"
      },
      {
        "type": "string",
        "name": "message"
      }
    ]
  },
  "example_interfaces/srv/Trigger": {
    "fields": [],
    "response": [
      {
        "type": "bool",
        "name": "success"
      },
      {
        "type": "string",
        "name": "message"
      }
    ]
  },
  "std_srvs/srv/Empty": {
    "fields": [],
    "response": []
  },
  "std_srvs/srv/SetBool": {
    "fields": [
      {
        "type": "bool",
        "name": "data"
      }
    ],
    "response": [
      {
        "type": "bool",
        "name": "success"
      },
      {
        "type": "string",
        "name": "message"
      }
    ]
  },
  "std_srvs/srv/Trigger": {
    "fields": [],
    "response": [
      {
        "type": "bool",
        "name": "success"
      },
      {
        "type": "string",
        "name": "message"
      }
    ]
  },
  "action_msgs/msg/GoalInfo": {
    "fields": [
      {
        "type": "unique_identifier_msgs/UUID",
        "name": "goal_id"
      },
      {
        "type": "builtin_interfaces/Time",
        "name": "stamp"
      }
    ]
  },
  "action_msgs/msg/GoalStatus": {
    "fields": [
      {
        "type": "GoalInfo",
        "name": "goal_info"
      },
      {
        "type": "int8",
        "name": "status"
      }
    ],
    "constants": [
      {
        "type": "int8",
        "name": "STATUS_UNKNOWN",
        "value": 0
      },
      {
        "type": "int8",
        "name": "STATUS_ACCEPTED",
        "value": 1
      },
      {
        "type": "int8",
        "name": "STATUS_EXECUTING",
        "value": 2
      },
      {
        "type": "int8",
        "name": "STATUS_CANCELING",
        "value": 3
      },
      {
        "type": "int8",
        "name": "STATUS_SUCCEEDED",
        "value": 4
      },
      {
        "type": "int8",
        "name": "STATUS_CANCELED",
        "value": 5
      },
      {
        "type": "int8",
        "name": "STATUS_ABORTED",
        "value": 6
      }
    ]
  },
  "action_msgs/msg/GoalStatusArray": {
    "fields": [
      {
        "type": "GoalStatus[]",
        "name": "status_list"
      }
    ]
  },
  "action_msgs/srv/CancelGoal": {
    "fields": [
      {
        "type": "GoalInfo",
        "name": "goal_info"
      }
    ],
    "response": [
      {
        "type": "int8",
        "name": "return_code"
      },
      {
        "type": "GoalInfo[]",
        "name": "goals_canceling"
      }
    ],
    "responseConstants": [
      {
        "type": "int8",
        "name": "ERROR_NONE",
        "value": 0
      },
      {
        "type": "int8",
        "name": "ERROR_REJECTED",
        "value": 1
      },
      {
        "type": "int8",
        "name": "ERROR_UNKNOWN_GOAL_ID",
        "value": 2
      },
      {
        "type": "int8",
        "name": "ERROR_GOAL_TERMINATED",
        "value": 3
      }
    ]
  },
  "unique_identifier_msgs/msg/UUID": {
    "fields": [
      {
        "type": "uint8[16]",
        "name": "uuid"
      }
    ]
  },
  "rcl_interfaces/msg/Log": {
    "fields": [
      {
        "type": "builtin_interfaces/Time",
        "name": "stamp"
      },
      {
        "type": "uint8",
        "name": "level"
      },
      {
        "type": "string",
        "name": "name"
      },
      {
        "type": "string",
        "name": "msg"
      },
      {
        "type": "string",
        "name": "file"
      },
      {
        "type": "string",
        "name": "function"
      },
      {
        "type": "uint32",
        "name": "line"
      }
    ],
    "constants": [
      {
        "type": "uint8",
        "name": "DEBUG",
        "value": 10
      },
      {
        "type": "uint8",
        "name": "INFO",
        "value": 20
      },
      {
        "type": "uint8",
        "name": "WARN",
        "value": 30
      },
      {
        "type": "uint8",
        "name": "ERROR",
        "value": 40
      },
      {
        "type": "uint8",
        "name": "FATAL",
        "value": 50
      }
    ]
  },
  "rcl_interfaces/msg/ParameterEvent": {
    "fields": [
      {
        "type": "builtin_interfaces/Time",
        "name": "stamp"
      },
      {
        "type": "string",
        "name": "node"
      },
      {
        "type": "Parameter[]",
        "name": "new_parameters"
      },
      {
        "type": "Parameter[]",
        "name": "changed_parameters"
      },
      {
        "type": "Parameter[]",
        "name": "deleted_parameters"
      }
    ]
  },
  "rcl_interfaces/msg/Parameter": {
    "fields": [
      {
        "type": "string",
        "name": "name"
      },
      {
        "type": "ParameterValue",
        "name": "value"
      }
    ]
  },
  "rcl_interfaces/msg/ParameterValue": {
    "fields": [
      {
        "type": "uint8",
        "name": "type"
      },
      {
        "type": "bool",
        "name": "bool_value"
      },
      {
        "type": "int64",
        "name": "integer_value"
      },
      {
        "type": "float64",
        "name": "double_value"
      },
      {
        "type": "string",
        "name": "string_value"
      },
      {
        "type": "byte[]",
        "name": "byte_array_value"
      },
      {
        "type": "bool[]",
        "name": "bool_array_value"
      },
      {
        "type": "int64[]",
        "name": "integer_array_value"
      },
      {
        "type": "float64[]",
        "name": "double_array_value"
      },
      {
        "type": "string[]",
        "name": "string_array_value"
      }
    ]
  },
  "rcl_interfaces/msg/ParameterType": {
    "fields": [],
    "constants": [
      {
        "type": "uint8",
        "name": "PARAMETER_NOT_SET",
        "value": 0
      },
      {
        "type": "uint8",
        "name": "PARAMETER_BOOL",
        "value": 1
      },
      {
        "type": "uint8",
        "name": "PARAMETER_INTEGER",
        "value": 2
      },
      {
        "type": "uint8",
        "name": "PARAMETER_DOUBLE",
        "value": 3
      },
      {
        "type": "uint8",
        "name": "PARAMETER_STRING",
        "value": 4
      },
      {
        "type": "uint8",
        "name": "PARAMETER_BYTE_ARRAY",
        "value": 5
      },
      {
        "type": "uint8",
        "name": "PARAMETER_BOOL_ARRAY",
        "value": 6
      },
      {
        "type": "uint8",
        "name": "PARAMETER_INTEGER_ARRAY",
        "value": 7
      },
      {
        "type": "uint8",
        "name": "PARAMETER_DOUBLE_ARRAY",
        "value": 8
      },
      {
        "type": "uint8",
        "name": "PARAMETER_STRING_ARRAY",
        "value": 9
      }
    ]
  }
};
