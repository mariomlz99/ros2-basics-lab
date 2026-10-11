#!/usr/bin/env python3
"""Build the exact visible sensor-reader examples and run them on native Jazzy."""
import os
os.environ['ROS_DOMAIN_ID']=os.environ.get('PLAYGROUND_ROS_DOMAIN','192')
os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE']='LOCALHOST'
import json, pathlib, shlex, signal, subprocess, tempfile, threading, time
import rclpy
from sensor_msgs.msg import Image, LaserScan

files=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {sensorFiles} from './src/playground/examples.js';console.log(JSON.stringify({python:sensorFiles('python'),cpp:sensorFiles('cpp')}));"],text=True))
rclpy.init();node=rclpy.create_node('playground');scan_pub=node.create_publisher(LaserScan,'/scan',10);image_pub=node.create_publisher(Image,'/camera/image_raw',10)
scan=LaserScan();scan.header.frame_id='laser_link';scan.ranges=[2.88]*120
image=Image();image.header.frame_id='camera_optical_frame';image.width=320;image.height=240;image.encoding='rgb8';image.step=960;image.data=[0]*(960*240)
timer=node.create_timer(.1,lambda:(scan_pub.publish(scan),image_pub.publish(image)))
thread=threading.Thread(target=lambda:rclpy.spin(node),daemon=True);thread.start()
try:
 for language in ['python','cpp']:
  with tempfile.TemporaryDirectory(prefix='ros2lab-sensor-readers-') as directory:
   root=pathlib.Path(directory);(root/'src').mkdir()
   def run(args,cwd=root):
    result=subprocess.run(args,cwd=cwd,capture_output=True,text=True,timeout=120);assert result.returncode==0,(args,result.stdout,result.stderr);return result
   run(['ros2','pkg','create','--build-type','ament_python' if language=='python' else 'ament_cmake','--license','Apache-2.0','sensor_lab','--dependencies','rclpy' if language=='python' else 'rclcpp','sensor_msgs'],root/'src')
   for relative,content in files[language].items():
    path=root/'src'/'sensor_lab'/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
   run(['colcon','build','--packages-select','sensor_lab'])
   missing=subprocess.run(['ros2','run','sensor_lab','lidar'],capture_output=True,text=True,timeout=15);assert missing.returncode!=0 and 'not found' in missing.stderr
   for executable,needle in [('lidar','Front: 2.88 m; nearest: 2.88 m'),('camera','Image: 320')]:
    command='source '+shlex.quote(str(root/'install/setup.bash'))+' && ros2 run sensor_lab '+executable
    process=subprocess.Popen(['bash','-c',command],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
    try:
     time.sleep(2);os.killpg(process.pid,signal.SIGINT);output=process.communicate(timeout=10)[0];assert needle in output,output
    finally:
     if process.poll() is None:os.killpg(process.pid,signal.SIGTERM);process.wait(timeout=10)
   print('PASS native '+language+': visible files, package/create/build/source/run, both sensor readers and unsourced failure',flush=True)
finally:
 node.destroy_node();rclpy.shutdown();thread.join(timeout=3)
