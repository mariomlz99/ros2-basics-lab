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
chunks=[];chunk=[];size=0
for row in rows:
 text=json.dumps(row,separators=(',',':'))
 if size+len(text)>6_000_000 and chunk:chunks.append(chunk);chunk=[];size=0
 chunk.append(row);size+=len(text)+1
chunks.append(chunk)
root=pathlib.Path(__file__).resolve().parents[1]/'src'
files={root/'native-installation-parts'/f'part-{i}.js':'export default '+json.dumps(chunk,separators=(',',':'))+';\n' for i,chunk in enumerate(chunks)}
files[root/'native-installation-data.js']='// Generated native installation inventory, split for static hosting limits.\n'+''.join(f"import part{i} from './native-installation-parts/part-{i}.js';\n" for i in range(len(chunks)))+'export const NATIVE_INSTALLATION=['+','.join(f'...part{i}' for i in range(len(chunks)))+'];\n'
for target,content in files.items():
 if '--check' in sys.argv:assert target.read_text()==content,'Native inventory changed: '+str(target)
 else:target.parent.mkdir(exist_ok=True);target.write_text(content)
print('Captured/verified',len(rows),'paths in',len(chunks),'parts;',total,'text bytes')
