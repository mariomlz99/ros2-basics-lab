"""Native parity for duplicate node names and independent topic endpoints."""
import json
import os
import subprocess
import time
os.environ['ROS_DOMAIN_ID'] = '192'
os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE'] = 'LOCALHOST'
import rclpy
from rclpy.parameter import Parameter
from std_msgs.msg import String
rclpy.init()
first = rclpy.create_node('same_name')
second = rclpy.create_node('same_name')
try:
    first.create_publisher(String, '/shared', 10)
    second.create_publisher(String, '/shared', 10)
    second.declare_parameter('publish_rate', 2.0)
    assert second.set_parameters([Parameter('publish_rate', value=25.0)])[0].successful
    for _ in range(100):
        if second.count_publishers('/shared') == 2:
            break
        time.sleep(0.05)
    assert second.count_publishers('/shared') == 2
    listing = subprocess.run(['ros2', 'node', 'list', '--no-daemon'], check=True, capture_output=True, text=True)
    assert listing.stdout.count('/same_name') == 2
    print(json.dumps({'nodes': listing.stdout, 'warning': listing.stderr, 'publishers': 2}))
    first.destroy_node()
    first = None
    for _ in range(100):
        if second.count_publishers('/shared') == 1:
            break
        time.sleep(0.05)
    assert second.count_publishers('/shared') == 1
    print('PASS native duplicate names, independent publisher cleanup, and unrestricted publish_rate parameter')
finally:
    if first:
        first.destroy_node()
    second.destroy_node()
    rclpy.shutdown()
