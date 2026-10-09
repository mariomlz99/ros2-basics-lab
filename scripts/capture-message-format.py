import json,pathlib,re,subprocess,sys
from rosidl_runtime_py.utilities import get_message
from rosidl_runtime_py.convert import message_to_yaml
root=pathlib.Path(__file__).resolve().parents[1]
schema=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {BUILTIN} from './src/interfaces/builtin.js';console.log(JSON.stringify(BUILTIN))"],cwd=root))
primitives={'bool','byte','char','int8','uint8','int16','uint16','int32','uint32','int64','uint64','float32','float64','string','wstring'}
def typ(t,owner):
 m=re.fullmatch(r'(.*?)(?:\[(\d*)\])?',t);base=m[1];array=m[2] is not None;length=int(m[2]) if m[2] else None
 if base not in primitives:
  if '/' not in base:base=owner.split('/')[0]+'/msg/'+base
  elif base.count('/')==1:base=base.replace('/','/msg/')
 return base,array,length
def sample(base,i):
 if base not in primitives:return build(base,True)
 if base in ['string','wstring']:return ['ROS message','hello: \'ROS\'\nnext'][i%2]
 if base=='bool':return i%2==0
 if base=='byte':return bytes([i+1])
 if base=='char':return i+65
 if base.startswith('float'):return [0.25,-1.5][i%2]
 return i+1

def build(name,populated):
 msg=get_message(name)()
 if populated:
  for i,f in enumerate(schema[name]['fields']):
   base,array,length=typ(f['type'],name)
   value=[sample(base,j) for j in range(length or 2)] if array else sample(base,i)
   setattr(msg,f['name'],value)
 return msg

def plain(name,msg):
 result={}
 for f in schema[name]['fields']:
  base,array,length=typ(f['type'],name);value=getattr(msg,f['name'])
  def scalar(v):
   if base not in primitives:return plain(base,v)
   if base=='byte':return v[0]
   return v.item() if hasattr(v,'item') else v
  result[f['name']]=[scalar(v) for v in value] if array else scalar(value)
 return result
fixtures=[]
for name in schema:
 if '/msg/' not in name:continue
 for populated in [False,True]:
  try:
   msg=build(name,populated);fixtures.append({'type':name,'populated':populated,'message':plain(name,msg),'publisher':repr(msg),'echo':message_to_yaml(msg).rstrip('\n')})
  except Exception as e:raise RuntimeError(name) from e
# Edge values exercise representation rules beyond the default/populated schema pass.
for value in ['', 'true', 'null', '-hello', '?hello', ':hello', ' leading', 'trailing ', 'café 🤖', 'a\nb\n', "both '\" quotes", '\x00\x07\x1b', 'one '*35]:
 msg=get_message('std_msgs/msg/String')(data=value);fixtures.append({'type':'std_msgs/msg/String','case':'string edge','message':{'data':value},'publisher':repr(msg),'echo':message_to_yaml(msg).rstrip('\n')})
for value in [0.0,-0.0,1e-7,1e-4,1e15,1e16,1.23456789,1e100,1e-100]:
 msg=get_message('std_msgs/msg/Float64')(data=value);fixtures.append({'type':'std_msgs/msg/Float64','case':'float edge','message':{'data':value},'publisher':repr(msg),'echo':message_to_yaml(msg).rstrip('\n')})
for value in [9,10,13,27,34,39,92,127,128,255]:
 msg=get_message('std_msgs/msg/Byte')(data=bytes([value]));fixtures.append({'type':'std_msgs/msg/Byte','case':'byte edge','message':{'data':value},'publisher':repr(msg),'echo':message_to_yaml(msg).rstrip('\n')})
for values in [[0.2,-0.1,1.23456789], [1e-12,1e10,-2e-12], [1e-100,1e100,0.0]]:
 msg=get_message('geometry_msgs/msg/PoseWithCovariance')();msg.covariance=(values*12);fixtures.append({'type':'geometry_msgs/msg/PoseWithCovariance','case':'array edge','message':plain('geometry_msgs/msg/PoseWithCovariance',msg),'publisher':repr(msg),'echo':message_to_yaml(msg).rstrip('\n')})
target=root/'tests/fixtures/native-message-format.json'
text=json.dumps(fixtures,indent=2,ensure_ascii=False)+'\n'
if '--check' in sys.argv:
 assert target.read_text()==text,'Native message fixtures need regeneration'
else:target.write_text(text)
print('Verified',len(fixtures),'native message representations')
