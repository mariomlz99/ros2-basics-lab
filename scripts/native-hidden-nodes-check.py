#!/usr/bin/env python3
"""Verify CLI node visibility against Jazzy, using an isolated domain."""
import os, subprocess, tempfile, time, signal
with tempfile.TemporaryDirectory(prefix='ros-hidden-nodes-') as directory:
    env=dict(os.environ, ROS_DOMAIN_ID='188', ROS_AUTOMATIC_DISCOVERY_RANGE='LOCALHOST', ROS_LOG_DIR=directory)
    processes=[]
    try:
        for args in [['topic','echo','/lab_hidden','std_msgs/msg/String'],['topic','pub','/lab_hidden','std_msgs/msg/String',"{data: hello}"]]:
            processes.append(subprocess.Popen(['ros2',*args],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True))
        time.sleep(2)
        def run(*args):
            return subprocess.run(['ros2',*args],env=env,capture_output=True,text=True,check=True,timeout=15).stdout.strip()
        visible=run('node','list','--no-daemon','--spin-time','2')
        hidden=run('node','list','--no-daemon','--spin-time','2','--all')
        assert not visible, visible
        assert hidden.count('/_ros2cli_')>=2,hidden
        print('PASS native: default node list omits CLI nodes; --all includes them')
        print(hidden)
        info=run('topic','info','/lab_hidden','--no-daemon','--spin-time','2')
        assert 'Publisher count: 1' in info and 'Subscription count: 1' in info,info
        print(info)
    finally:
        for process in processes:
            if process.poll() is None:os.killpg(process.pid,signal.SIGINT)
            process.wait(timeout=10)
        subprocess.run(['ros2','daemon','stop'],env=env,capture_output=True,timeout=15)
