import os, subprocess, tempfile, time, signal
from pathlib import Path
os.environ['ROS_DOMAIN_ID']='178'
os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE']='LOCALHOST'
os.environ['ROS_LOG_DIR']=str(Path.cwd()/'log/native-validation')
processes=[]
def start(args):
    output=tempfile.TemporaryFile(mode='w+t')
    p=subprocess.Popen(args,stdout=output,stderr=subprocess.STDOUT,start_new_session=True)
    processes.append((p,output))
    return p,output
def read(f):
    f.seek(0);return f.read()
def until(f,text,seconds=20):
    for _ in range(seconds*10):
        if text in read(f):return
        time.sleep(.1)
    raise RuntimeError('Missing '+text+' in '+read(f))
def stop():
    for p,f in processes:
        if p.poll() is None:
            os.killpg(p.pid,signal.SIGINT)
            try:p.wait(timeout=5)
            except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
        f.close()
    processes.clear()
try:
    for talker,listener in [('py_pubsub','cpp_pubsub'),('cpp_pubsub','py_pubsub')]:
        p,a=start(['ros2','run',talker,'talker']);p,b=start(['ros2','run',listener,'listener'])
        until(b,'I heard:')
        result=subprocess.run(['ros2','param','set','/talker','message_prefix','Native'],capture_output=True,text=True,timeout=20)
        if result.returncode:raise RuntimeError(result.stderr)
        until(b,'Native')
        print('PASS native '+talker+' -> '+listener+' and live parameter',flush=True);stop()
    for pkg in ['py_service','cpp_service']:
        p,a=start(['ros2','run',pkg,'server']);time.sleep(1)
        result=subprocess.run(['ros2','service','call','/add_two_ints','example_interfaces/srv/AddTwoInts','{a: 7, b: 8}'],capture_output=True,text=True,timeout=20)
        if result.returncode or 'sum=15' not in result.stdout:raise RuntimeError(result.stdout+result.stderr)
        p,b=start(['ros2','run',pkg,'client']);until(b,'Sum: 5')
        print('PASS native '+pkg+' server and client',flush=True);stop()
    p,a=start(['ros2','launch','py_pubsub','system.launch.py']);until(a,'Launched')
    print('PASS native launch and remapping',flush=True);stop()
    p,a=start(['ros2','run','cpp_pubsub','status']);until(a,'Ada')
    result=subprocess.run(['ros2','topic','echo','/student_status','--once'],capture_output=True,text=True,timeout=20)
    if 'ready: true' not in result.stdout:raise RuntimeError(result.stdout+result.stderr)
    print('PASS native generated StudentStatus',flush=True)
finally:stop()
