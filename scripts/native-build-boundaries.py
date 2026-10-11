import os, pathlib, subprocess, tempfile, json
root=pathlib.Path(tempfile.mkdtemp(prefix='ros2-audit-build-'))
def run(command):
 p=subprocess.run(['bash','-c','source /opt/ros/jazzy/setup.bash\n'+command],cwd=root,text=True,capture_output=True)
 return {'code':p.returncode,'out':p.stdout,'err':p.stderr}
(root/'src').mkdir()
a=run('cd src\nros2 pkg create --build-type ament_cmake --node-name hello audit_cpp')
f=root/'src/audit_cpp/CMakeLists.txt'
s=f.read_text();start=s.index('install(TARGETS');end=s.index(')',start)+1;f.write_text(s[:start]+s[end:])
b=run('colcon build');c=run('source install/setup.bash\nros2 pkg executables audit_cpp\nros2 run audit_cpp hello')
d=run('cd src\nros2 pkg create --build-type ament_python --node-name hello audit_py')
f=root/'src/audit_py/setup.py';f.write_text(f.read_text().replace('audit_py.hello:main','audit_py.absent:main'))
e=run('colcon build --packages-select audit_py');g=run('source install/setup.bash\nros2 run audit_py hello')
assert b['code']==0,b
assert c['code']!=0 and 'No executable found' in c['err']+c['out'],c
assert e['code']==0,e
assert 'ModuleNotFoundError' in g['err'],g
print(json.dumps({'root':str(root),'cmake_build':b,'cmake_run':c,'python_build':e,'python_run':g},indent=2))
