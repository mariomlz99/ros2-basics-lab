#!/usr/bin/env python3
"""Run the actual introductory inspection commands against native Jazzy.
Source Jazzy first. Private domain, native message classes, native TF listener;
no packages are installed and no host ROS files are changed.
"""
import os
os.environ['ROS_DOMAIN_ID'] = os.environ.get('PLAYGROUND_ROS_DOMAIN', '191')
os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE'] = 'LOCALHOST'
import copy, json, math, pathlib, shlex, subprocess, threading, time
import rclpy
from rclpy.qos import QoSProfile, DurabilityPolicy
from rclpy.time import Time
from rosidl_runtime_py.utilities import get_message
from rosidl_runtime_py.set_message import set_message_fields
from rosidl_runtime_py.convert import message_to_yaml
from tf2_ros import Buffer, TransformListener
from geometry_msgs.msg import Twist

source="import {playgroundSamples,inspectionCommands} from './scripts/playground-samples.mjs';console.log(JSON.stringify({samples:playgroundSamples(),commands:inspectionCommands}));"
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',source],text=True))
subprocess.run(['ros2','daemon','stop'],capture_output=True,timeout=10)
rclpy.init();node=rclpy.create_node('playground');pairs=[];velocity=[]
for topic,sample in data['samples'].items():
    qos=QoSProfile(depth=1)
    if sample.get('durability'):qos.durability=DurabilityPolicy.TRANSIENT_LOCAL
    msg_type=get_message(sample['type']);msg=msg_type();set_message_fields(msg,copy.deepcopy(sample['message']))
    pub=node.create_publisher(msg_type,topic,qos)
    if sample.get('durability'):pub.publish(msg)
    else:pairs.append((pub,msg))
subscription=node.create_subscription(Twist,'/cmd_vel',lambda msg:velocity.append(msg),10)
timer=node.create_timer(.1,lambda:[pub.publish(msg) for pub,msg in pairs])
buffer=Buffer();listener=TransformListener(buffer,node)
thread=threading.Thread(target=lambda:rclpy.spin(node),daemon=True);thread.start()
try:
    deadline=time.monotonic()+8
    while not buffer.can_transform('odom','camera_optical_frame',Time()):
        assert time.monotonic()<deadline,'Native TF tree not connected'
        time.sleep(.05)
    laser=buffer.lookup_transform('odom','laser_link',Time()).transform
    assert math.isclose(laser.translation.x,1+.12*math.cos(.6),abs_tol=1e-9)
    assert math.isclose(laser.translation.y,.12*math.sin(.6),abs_tol=1e-9)
    left=buffer.lookup_transform('base_link','left_wheel_link',Time()).transform
    right=buffer.lookup_transform('base_link','right_wheel_link',Time()).transform
    assert left.translation.y>0 and right.translation.y<0
    print('PASS native tf2 lookup composes odom, robot, wheel and sensor mounts',flush=True)
    deadline=time.monotonic()+8
    while True:
        ready=subprocess.run(['ros2','topic','type','/odom'],capture_output=True,text=True,timeout=10)
        if ready.returncode==0:break
        assert time.monotonic()<deadline,('Native CLI discovery did not become ready',ready.stdout,ready.stderr)
        time.sleep(.2)
    cases=[]
    for command in data['commands']+['ros2 topic echo /odom --once --field missing']:
        result=subprocess.run(shlex.split(command),capture_output=True,text=True,timeout=15)
        if '--field missing' in command:assert result.returncode!=0 and "Invalid field 'missing'" in result.stderr
        else:assert result.returncode==0,(command,result.stderr)
        cases.append({'command':command,'stdout':result.stdout.rstrip('\n'),'stderr':result.stderr.rstrip('\n'),'code':result.returncode})
        print('PASS native '+command,flush=True)
    for payload in ["{linear: {x: 0.2}}","{angular: {z: 0.4}}","{}"]:
        result=subprocess.run(['ros2','topic','pub','--once','/cmd_vel','geometry_msgs/msg/Twist',payload],capture_output=True,text=True,timeout=15)
        assert result.returncode==0,result.stderr
    assert any(m.linear.x==.2 for m in velocity) and any(m.angular.z==.4 for m in velocity)
    assert velocity[-1].linear.x==0 and velocity[-1].angular.z==0
    path=pathlib.Path('tests/fixtures/native-playground.json');path.write_text(json.dumps({'distro':'jazzy','cases':cases},indent=2)+'\n')
    path=pathlib.Path('tests/fixtures/native-message-format.json');formats=json.loads(path.read_text());formats=[f for f in formats if f['type']!='tf2_msgs/msg/TFMessage']
    for populated,fields in [(False,{'transforms':[]}),(True,data['samples']['/tf']['message'])]:
        msg=get_message('tf2_msgs/msg/TFMessage')();set_message_fields(msg,copy.deepcopy(fields))
        formats.append({'type':'tf2_msgs/msg/TFMessage','populated':populated,'message':fields,'publisher':str(msg),'echo':message_to_yaml(msg).rstrip('\n')})
    path.write_text(json.dumps(formats,ensure_ascii=False,indent=2)+'\n')
    print('PASS native motion/stop messages; captured '+str(len(cases))+' inspection cases',flush=True)
finally:
    node.destroy_node();rclpy.shutdown();thread.join(timeout=3)
