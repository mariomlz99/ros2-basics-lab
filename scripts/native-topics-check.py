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
def inspect(label,args):
    process=start(label,args);finish(process);return read(label)
def stop(process):
    if process.poll() is None:
        os.killpg(process.pid,signal.SIGINT)
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
try:
    assert 'string data' in inspect('string-interface',['interface','show','std_msgs/msg/String'])
    assert 'Vector3 linear' in ' '.join(inspect('twist-interface',['interface','show','geometry_msgs/msg/Twist']).split())
    echo=start('once-echo',['topic','echo','/lab_chat','std_msgs/msg/String'])
    pub=start('once-pub',['topic','pub','--once','/lab_chat','std_msgs/msg/String',"{data: 'Hello from Terminal 1'}"])
    finish(pub);assert 'data: Hello from Terminal 1\n---' in read('once-echo');print('PASS native: exact typed echo and --once publisher deliver the message',flush=True)
    pub=start('continuous-pub',['topic','pub','/lab_chat','std_msgs/msg/String',"{data: 'A message every second'}"])
    time.sleep(3)
    assert read('once-echo').count('data: A message every second')>=2
    assert '/lab_chat [std_msgs/msg/String]' in inspect('topic-list',['topic','list','-t'])
    assert 'std_msgs/msg/String' in inspect('topic-type',['topic','type','/lab_chat'])
    info=inspect('topic-info',['topic','info','/lab_chat'])
    assert 'Publisher count: 1' in info and 'Subscription count: 1' in info,info
    assert '_ros2cli_' not in inspect('visible-nodes',['node','list'])
    assert '_ros2cli_' in inspect('all-nodes',['node','list','--all'])
    stop(pub);stop(echo)
    print('PASS native: default 1 Hz stream, interfaces, topic list/type/info and hidden CLI nodes',flush=True)
    echo=start('finite-echo',['topic','echo','/lab_chat','std_msgs/msg/String'])
    pub=start('finite-pub',['topic','pub','--times','3','--rate','2','/lab_chat','std_msgs/msg/String',"{data: 'Three messages'}"])
    finish(pub);time.sleep(.3);stop(echo);assert read('finite-echo').count('data: Three messages')==3,read('finite-echo');print('PASS native: --times 3 --rate 2 delivers exactly three messages',flush=True)
    pub=start('waiting-pub',['topic','pub','--once','/lab_wait','std_msgs/msg/String',"{data: 'Ready when you are'}"])
    time.sleep(2);assert pub.poll() is None
    echo=start('late-echo',['topic','echo','/lab_wait','std_msgs/msg/String','--once']);finish(pub);finish(echo);assert 'Ready when you are' in read('late-echo');print('PASS native: finite publisher waits for a matching subscriber',flush=True)
    pub=start('twist-pub',['topic','pub','-r','5','/lab_twist','geometry_msgs/msg/Twist','{linear: {x: 0.2}, angular: {z: 0.5}}'])
    time.sleep(2);echo=start('twist-echo',['topic','echo','/lab_twist'])
    time.sleep(2);hz=start('twist-hz',['topic','hz','/lab_twist']);time.sleep(4)
    stop(hz);stop(pub);stop(echo)
    assert 'x: 0.2' in read('twist-echo') and 'z: 0.5' in read('twist-echo')
    assert 'average rate:' in read('twist-hz'),read('twist-hz');print('PASS native: Twist stream, nested fields and rate measurement\n'+read('twist-hz'),flush=True)
    no_listener=start('no-listener',['topic','pub','-1','-w','0','/lab_unheard','std_msgs/msg/String',"{data: 'No replay'}"]);finish(no_listener)
    late=start('no-replay',['topic','echo','/lab_unheard','std_msgs/msg/String']);time.sleep(3);assert late.poll() is None;stop(late)
    assert 'No replay' not in read('no-replay');print('PASS native: default volatile topics do not replay old messages',flush=True)
finally:
    for process,stream in processes:stop(process);stream.close()
    print('Native topic evidence: '+str(root),flush=True)
