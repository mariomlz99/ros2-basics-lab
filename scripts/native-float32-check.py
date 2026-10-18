"""Native Jazzy serialization reference for the shared browser topic regression."""
import json
from pathlib import Path

from rclpy.serialization import deserialize_message, serialize_message
from sensor_msgs.msg import LaserScan
from std_msgs.msg import Float32, Float64

results = []
for value, expected in [
    (0.1, 0.10000000149011612),
    (2.88, 2.880000114440918),
    (-0.1, -0.10000000149011612),
    (1e-45, 1.401298464324817e-45),
]:
    scalar = deserialize_message(serialize_message(Float32(data=value)), Float32)
    double = deserialize_message(serialize_message(Float64(data=value)), Float64)
    scan = deserialize_message(
        serialize_message(LaserScan(angle_min=value, ranges=[value])), LaserScan
    )
    assert scalar.data == scan.angle_min == scan.ranges[0] == expected
    assert double.data == value
    results.append({"input": value, "float32": scalar.data, "float64": double.data})

target = Path("artifacts/stabilization/native-float32-reference.json")
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(results, indent=2) + "\n")
print("PASS native Jazzy scalar/array float32 rounding and unchanged float64")
