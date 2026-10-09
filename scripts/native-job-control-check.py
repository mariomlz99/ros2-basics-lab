import os,pty,select,time,signal
pid,fd=pty.fork()
if pid==0:
 os.environ['PS1']='NATIVE_JOB> ';os.environ['ROS_DOMAIN_ID']='189';os.environ['ROS_AUTOMATIC_DISCOVERY_RANGE']='LOCALHOST';os.execv('/bin/bash',['bash','--noprofile','--norc','-i'])
def read(seconds=1):
 end=time.monotonic()+seconds;out=b''
 while time.monotonic()<end:
  if select.select([fd],[],[],.1)[0]:
   try:out+=os.read(fd,65536)
   except OSError:break
 return out.decode(errors='replace')
def send(s):os.write(fd,s.encode())
try:
 read(.2);send('source /opt/ros/jazzy/setup.bash\n');read(1)
 send('ros2 topic pub --rate 10 /job_parity std_msgs/msg/String "{data: hello}"\n');a=read(2);assert 'publishing #1:' in a,a
 send('\x1a');a=read(.5);assert 'Stopped' in a,a
 send('jobs\n');a=read(.2);assert 'Stopped' in a,a
 a=read(.4);assert 'publishing #' not in a,a
 send('fg\n');a=read(.5);assert 'publishing #' in a,a
 send('\x03');a=read(.7);assert 'NATIVE_JOB>' in a,a
 send('jobs\n');a=read(.2);assert 'Stopped' not in a,a
 print('PASS native Jazzy: Ctrl+Z stops publisher, jobs lists it, fg resumes same process, Ctrl+C ends it')
 send('exit\n');read(.2)
finally:
 try:os.kill(pid,signal.SIGTERM)
 except ProcessLookupError:pass
 os.close(fd);os.waitpid(pid,0)
