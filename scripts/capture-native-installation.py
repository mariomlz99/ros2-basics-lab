import sys,base64,hashlib,json,os,pathlib,stat,subprocess,zlib
root=pathlib.Path('/opt/ros/jazzy')
paths=set(root.rglob('*'));paths.add(root)
# Include installed Graphviz paths, not unrelated files from the host filesystem.
for package in ['graphviz','libgvc6','libcgraph6','libcdt5','libpathplan4','libgvpr2','liblab-gamut1','libxdot4']:
 result=subprocess.run(['dpkg-query','-L',package],capture_output=True,text=True)
 if result.returncode==0:
  for line in result.stdout.splitlines():
   p=pathlib.Path(line)
   if p.is_file() or p.is_symlink():paths.add(p)
rows=[];total=0
for p in sorted(paths):
 if p.is_dir():rows.append([str(p),'d']);continue
 if not p.is_file():continue
 raw=p.read_bytes();mode=p.stat().st_mode;link=str(p.readlink()) if p.is_symlink() else ''
 try:
  value=raw.decode('utf8');assert '\0' not in value
  encoding='z';payload=base64.b64encode(zlib.compress(raw,9)).decode('ascii');total+=len(raw)
 except (UnicodeError,AssertionError):encoding='b';payload=''
 rows.append([str(p),encoding,mode&0o777,len(raw),hashlib.sha256(raw).hexdigest(),payload,link])
content='// Generated native installation inventory; see scripts/capture-native-installation.py.\nexport const NATIVE_INSTALLATION='+json.dumps(rows,separators=(',',':'))+';\n'
target=pathlib.Path(__file__).resolve().parents[1]/'src/native-installation-data.js'
if '--check' in sys.argv:
 assert target.read_text()==content, 'Native inventory has changed; recapture and review.'
else:target.write_text(content)
print('Captured/verified',len(rows),'paths;',total,'text bytes; compressed JS',len(content),'bytes')
