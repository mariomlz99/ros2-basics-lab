# Maintenance tool only; the browser has no native ROS dependency.
from pathlib import Path
import json,re,ast
root=Path('/opt/ros/jazzy/share'); out=Path(__file__).resolve().parent.parent/'src/interfaces/builtin.js'
chosen={'builtin_interfaces':['msg/Time','msg/Duration'],'std_msgs':['msg/String','msg/Bool','msg/Int32','msg/Int64','msg/Float32','msg/Float64','msg/Header','msg/Empty','msg/ColorRGBA'],'geometry_msgs':['msg/Vector3','msg/Point','msg/Quaternion','msg/Pose','msg/PoseStamped','msg/Twist','msg/TwistStamped','msg/PoseWithCovariance','msg/TwistWithCovariance'],'sensor_msgs':['msg/Image','msg/LaserScan','msg/Imu'],'nav_msgs':['msg/Odometry'],'example_interfaces':['srv/AddTwoInts'],'std_srvs':['srv/Trigger','srv/SetBool','srv/Empty'],'action_msgs':['msg/GoalInfo','msg/GoalStatus','msg/GoalStatusArray'],'unique_identifier_msgs':['msg/UUID']}
chosen={pkg:[str(f.relative_to(root/pkg)).rsplit('.',1)[0] for kind in ['msg','srv'] for f in sorted((root/pkg/kind).glob('*.'+kind))] for pkg in chosen}
records={}
for pkg,types in chosen.items():
 for typ in types:
  kind,name=typ.split('/'); file=root/pkg/(typ+'.'+kind);fields=[[]];constants=[[]]
  for line in file.read_text().splitlines():
   line=line.split('#')[0].strip()
   if not line:continue
   if line=='---':fields.append([]);constants.append([]);continue
   t,rest=line.split(maxsplit=1)
   if '=' in rest:
    k,v=rest.split('=',1);constants[-1].append({'type':t,'name':k.strip(),'value':ast.literal_eval(v.strip())});continue
   parts=rest.split();f={'type':t,'name':parts[0]}
   if len(parts)>1:f['default']=ast.literal_eval(' '.join(parts[1:]))
   fields[-1].append(f)
  records[pkg+'/'+typ]={'fields':fields[0],**({'response':fields[1]} if len(fields)>1 else {}),**({'constants':constants[0]}if constants[0] else {}),**({'responseConstants':constants[1]}if len(constants)>1 and constants[1] else {})}
out.write_text('// Curated Jazzy interface schemas, transcribed from installed upstream .msg/.srv files.\n// See NOTICE and docs/INTERFACES.md for upstream attribution. Canonical source.\nexport const BUILTIN = '+json.dumps(records,indent=2)+';\n')
