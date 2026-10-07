// Curated Jazzy interface schemas, transcribed from installed upstream .msg/.srv files.
// See NOTICE and docs/INTERFACES.md for upstream attribution. Canonical source.
export const BUILTIN = {
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
  "std_msgs/msg/String": {
    "fields": [
      {
        "type": "string",
        "name": "data"
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
  "std_msgs/msg/Int32": {
    "fields": [
      {
        "type": "int32",
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
  "std_msgs/msg/Float32": {
    "fields": [
      {
        "type": "float32",
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
  "std_msgs/msg/Empty": {
    "fields": []
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
  "std_srvs/srv/Empty": {
    "fields": [],
    "response": []
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
  "unique_identifier_msgs/msg/UUID": {
    "fields": [
      {
        "type": "uint8[16]",
        "name": "uuid"
      }
    ]
  }
};
