"""Compare supported endpoint and timer ownership with native ROS 2 Jazzy."""
import os
import time
os.environ['ROS_DOMAIN_ID'] = '193'
os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE'] = 'LOCALHOST'
import rclpy
from std_msgs.msg import String
rclpy.init()
node = rclpy.create_node('endpoints')
try:
    pubs = [node.create_publisher(String, '/shared', 10) for _ in range(2)]
    received = []
    subs = [node.create_subscription(String, '/shared', lambda m, i=i: received.append((i, m.data)), 10) for i in range(2)]
    def counts(expected):
        for _ in range(100):
            if node.count_publishers('/shared') == expected and node.count_subscribers('/shared') == expected:
                return
            time.sleep(0.05)
        raise AssertionError((node.count_publishers('/shared'), node.count_subscribers('/shared')))
    counts(2)
    for i, pub in enumerate(pubs):
        pub.publish(String(data='payload' + str(i)))
    for _ in range(30):
        rclpy.spin_once(node, timeout_sec=0.1)
        if len(received) == 4:
            break
    assert set(received) == {(i, 'payload'+str(j)) for i in range(2) for j in range(2)}, received
    for expected in (1, 0):
        assert node.destroy_publisher(pubs.pop(0))
        assert node.destroy_subscription(subs.pop(0))
        counts(expected)
    timer = node.create_timer(0.1, lambda: None)
    assert node.destroy_timer(timer)
    print('PASS native: 2/2 -> 1/1 -> 0/0; four deliveries; destroy_timer(timer object)')
finally:
    node.destroy_node()
    rclpy.shutdown()
