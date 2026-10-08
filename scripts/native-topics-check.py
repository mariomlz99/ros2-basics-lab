#!/usr/bin/env python3
"""Native counterpart of the terminal-topics lesson, using a private ROS domain."""
import os, subprocess, tempfile, time, signal, pathlib
root=pathlib.Path(tempfile.mkdtemp(prefix='ros-topics-mirror-'))
env=dict(os.environ,ROS_DOMAIN_ID='187',ROS_AUTOMATIC_DISCOVERY_RANGE='LOCALHOST',PYTHONUNBUFFERED='1')
processes=[]
def start(label,args):
    stream=(root/(label+'.log')).open('w')
    process=subprocess.Popen(['ros2',*args],env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
    processes.append((process,stream));return process
def finish(process,timeout=20):
    code=process.wait(timeout=timeout)
    assert code==0, 'Native command failed with '+str(code)
def read(label):return (root/(label+'.log')).read_text()
def stop(process):
    if process.poll() is None:
        os.killpg(process.pid,signal.SIGINT)
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
try:
    echo=start('once-echo',['topic','echo','/lab_chat','std_msgs/msg/String','--once'])
    pub=start('once-pub',['topic','pub','--once','/lab_chat','std_msgs/msg/String',"{data: 'Hello from Terminal 1'}"])
    finish(pub);finish(echo);assert 'Hello from Terminal 1' in read('once-echo');print('PASS native: typed echo before publisher; --once delivery',flush=True)
    echo=start('finite-echo',['topic','echo','/lab_chat','std_msgs/msg/String'])
    pub=start('finite-pub',['topic','pub','--times','3','--rate','2','/lab_chat','std_msgs/msg/String',"{data: 'Three messages'}"])
    finish(pub);time.sleep(.3);stop(echo);assert read('finite-echo').count('data: Three messages')==3,read('finite-echo');print('PASS native: --times 3 --rate 2 delivers exactly three messages',flush=True)
    pub=start('waiting-pub',['topic','pub','-1','/lab_wait','std_msgs/msg/String',"{data: 'Waiting for you'}"])
    time.sleep(2);assert pub.poll() is None
    echo=start('late-echo',['topic','echo','/lab_wait','std_msgs/msg/String','--once']);finish(pub);finish(echo);assert 'Waiting for you' in read('late-echo');print('PASS native: finite publisher waits for a matching subscriber',flush=True)
    echo=start('twist-echo',['topic','echo','/lab_twist','geometry_msgs/msg/Twist'])
    pub=start('twist-pub',['topic','pub','-r','5','/lab_twist','geometry_msgs/msg/Twist','{linear: {x: 0.2}, angular: {z: 0.5}}'])
    time.sleep(2);hz=start('twist-hz',['topic','hz','/lab_twist']);time.sleep(4)
    stop(hz);stop(pub);stop(echo)
    assert 'x: 0.2' in read('twist-echo') and 'z: 0.5' in read('twist-echo')
    assert 'average rate:' in read('twist-hz'),read('twist-hz');print('PASS native: Twist stream, nested fields and rate measurement\n'+read('twist-hz'),flush=True)
    no_listener=start('no-listener',['topic','pub','--once','-w','0','/lab_unheard','std_msgs/msg/String',"{data: 'No replay'}"]);finish(no_listener)
    late=start('no-replay',['topic','echo','/lab_unheard','std_msgs/msg/String','--once','--timeout','2']);late.wait(timeout=8)
    assert 'No replay' not in read('no-replay');print('PASS native: default volatile topics do not replay old messages',flush=True)
finally:
    for process,stream in processes:stop(process);stream.close()
    print('Native topic evidence: '+str(root),flush=True)
