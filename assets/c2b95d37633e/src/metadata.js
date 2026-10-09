// Adapted from KineNest (Apache-2.0): empty packages and optional launch installation.
const PACKAGE=/^[a-z][a-z0-9_]*$/;
function xmlNode(source){
  const root={name:'',children:[],text:''},stack=[root];let pos=0;
  for(const match of source.matchAll(/<\/?[A-Za-z_][^>]*>|<\?[^>]*\?>|<!--[^]*?-->/g)){
    const gap=source.slice(pos,match.index);if(gap.includes('<')||/&(?!amp;|lt;|gt;|quot;|apos;)/.test(gap))throw Error('Malformed package.xml');stack.at(-1).text+=gap;pos=match.index+match[0].length;
    const tag=match[0];if(tag.startsWith('<?')||tag.startsWith('<!--'))continue;
    if(tag.startsWith('</')){const name=tag.slice(2,-1).trim();if(stack.length===1||stack.at(-1).name!==name)throw Error('package.xml has mismatched XML tags.');stack.pop();continue;}
    const name=tag.slice(1).match(/^[A-Za-z_][\w:-]*/)?.[0];if(!name)throw Error('Invalid package.xml tag.');
    const attributes=tag.slice(1,-1).replace(/\/$/,'').slice(name.length);if(attributes.replace(/([\w:-]+)\s*=\s*(["'])([^]*?)\2/g,'').trim())throw Error('Malformed XML attributes');
    const node={name,attrs:Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1],m[2]])),children:[],text:''};
    stack.at(-1).children.push(node);if(!tag.endsWith('/>'))stack.push(node);
  }
  const tail=source.slice(pos);if(tail.trim()||root.text.trim())throw Error('Malformed package.xml');stack.at(-1).text+=tail;if(stack.length!==1||root.children.length!==1||root.children[0].name!=='package')throw Error('package.xml must contain one <package> root.');
  return root.children[0];
}
export function parsePackageXml(source){
  const root=xmlNode(source),one=name=>{const nodes=root.children.filter(n=>n.name===name);if(nodes.length!==1||!nodes[0].text.trim())throw Error('package.xml needs one <'+name+'>.');return nodes[0].text.trim();};
  const name=one('name');if(!PACKAGE.test(name))throw Error('Package names use lowercase letters, digits and underscores, starting with a letter.');
  const version=one('version'),description=one('description'),license=one('license'),maintainer=one('maintainer');
  if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('package.xml version should be MAJOR.MINOR.PATCH.');
  const deps=new Set(root.children.filter(n=>['depend','exec_depend','build_depend','buildtool_depend'].includes(n.name)).map(n=>n.text.trim()));
  const exportNode=root.children.find(n=>n.name==='export');
  const buildType=exportNode?.children.find(n=>n.name==='build_type')?.text.trim();
  if(!['ament_python','ament_cmake'].includes(buildType))throw Error('package.xml needs a supported <export><build_type>.');
  if(!root.children.some(n=>n.name==='buildtool_depend'&&n.text.trim()===buildType))throw Error('package.xml needs <buildtool_depend>'+buildType+'</buildtool_depend>.');

  const testDependencies=new Set(root.children.filter(n=>n.name==='test_depend').map(n=>n.text.trim()));
  return {name,version,description,license,maintainer,testDependencies,maintainerEmail:root.children.find(n=>n.name==='maintainer')?.attrs.email??'',dependencies:deps,buildType};
}

export function cmakeCalls(source){
  const calls=[];let i=0;
  while(i<source.length){
    if(/\s/.test(source[i])){i++;continue;}
    if(source[i]==='#'){while(i<source.length&&source[i]!=='\n')i++;continue;}
    const match=/^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(i));if(!match)throw Error('Unsupported CMake syntax near '+source.slice(i,i+20));
    const name=match[0].toLowerCase();i+=match[0].length;while(/\s/.test(source[i]))i++;
    if(source[i++]!=='(')throw Error('Expected ( after '+name);let depth=1,start=i,quote=false;
    while(i<source.length&&depth){const c=source[i++];if(c==='"')quote=!quote;else if(!quote&&c==='(')depth++;else if(!quote&&c===')')depth--;}
    if(depth)throw Error('Unclosed CMake '+name+' declaration.');
    calls.push({name,args:source.slice(start,i-1).trim().split(/\s+/).filter(Boolean)});
  }
  return calls;
}
export function parseCmake(source,packageName){
  const calls=cmakeCalls(source),allowed=new Set(['cmake_minimum_required','project','find_package','add_executable','ament_target_dependencies','install','ament_package']);
  for(const c of calls)if(!allowed.has(c.name))throw Error('CMake '+c.name+' is outside the supported lesson subset.');
  if(!calls.some(c=>c.name==='cmake_minimum_required'))throw Error('CMakeLists.txt needs cmake_minimum_required.');
  if(!calls.some(c=>c.name==='project'&&c.args[0]===packageName))throw Error('CMake project must match package.xml name.');
  const found=new Set(calls.filter(c=>c.name==='find_package'&&c.args.includes('REQUIRED')).map(c=>c.args[0]));
  if(!found.has('ament_cmake'))throw Error('CMakeLists.txt needs find_package(ament_cmake REQUIRED).');
  if(!calls.some(c=>c.name==='ament_package'))throw Error('CMakeLists.txt needs ament_package().');
  const targets=new Map();for(const c of calls.filter(c=>c.name==='add_executable')){if(targets.has(c.args[0]))throw Error('Duplicate CMake target '+c.args[0]);targets.set(c.args[0],c.args.slice(1).map(a=>a.replace(/^"|"$/g,'')));}
  const installed=new Set();let launchInstalled=false;for(const c of calls.filter(c=>c.name==='install')){
    if(c.args[0]==='DIRECTORY'&&c.args[1]==='launch'&&c.args[2]==='DESTINATION'&&c.args[3]===`share/\${PROJECT_NAME}`){launchInstalled=true;continue;}
    if(c.args[0]!=='TARGETS'||!c.args.includes('DESTINATION')||c.args.slice(c.args.indexOf('DESTINATION')+1).join(' ')!==`lib/\${PROJECT_NAME}`)throw Error('Supported install form: install(TARGETS name DESTINATION lib/${PROJECT_NAME}).');
    for(const name of c.args.slice(1,c.args.indexOf('DESTINATION')))installed.add(name);
  }
  const dependencies=new Map();for(const c of calls.filter(c=>c.name==='ament_target_dependencies'))dependencies.set(c.args[0],new Set(c.args.slice(1)));
  for(const target of dependencies.keys())if(!targets.has(target))throw Error('Dependencies for unknown target '+target);
  return {found,targets,installed,dependencies,launchInstalled};
}

// Read literal setup declarations as tokens. Node modules are subsequently
// compiled and imported by CPython; no source-text grader is involved.
export function parsePythonSetup(source,packageName){
  const tokens=[];let i=0;
  while(i<source.length){const c=source[i];if(/\s/.test(c)){i++;continue;}if(c==='#'){while(i<source.length&&source[i]!=='\n')i++;continue;}
    if(c==='"'||c==="'"){const quote=c;let value='',closed=false;i++;while(i<source.length){const next=source[i++];if(next===quote){closed=true;break;}if(next==='\\'){value+=source[i++]??'';}else value+=next;}if(!closed)throw Error('Unclosed setup.py string.');tokens.push({kind:'string',value});continue;}
    if(/[A-Za-z_]/.test(c)){let value='';while(i<source.length&&/[A-Za-z_0-9]/.test(source[i]))value+=source[i++];tokens.push({kind:'name',value});continue;}
    tokens.push({kind:'symbol',value:c});i++;
  }
  const values=tokens.map(token=>token.value),at=values.indexOf('entry_points');
  if(at<0||values[at+1]!=='='||values[at+2]!=='{')throw Error('setup.py needs a literal entry_points map.');
  const key=values.indexOf('console_scripts',at+3);
  if(key<0||tokens[key].kind!=='string'||values[key+1]!==':'||values[key+2]!=='[')throw Error('setup.py needs a literal console_scripts list.');
  const scripts=new Map();let cursor=key+3;
  while(values[cursor]!==']'){
    const token=tokens[cursor++];if(!token||token.kind!=='string')throw Error('Only literal console_scripts entries are supported.');
    const equal=token.value.indexOf('='),colon=token.value.lastIndexOf(':'),executable=token.value.slice(0,equal).trim(),module=token.value.slice(equal+1,colon).trim(),func=token.value.slice(colon+1).trim();
    if(equal<1||colon<=equal+1||!PACKAGE.test(executable)||!module.startsWith(packageName+'.')||!module.split('.').every(part=>PACKAGE.test(part))||!PACKAGE.test(func))throw Error('Console script must name a module inside '+packageName+'.');
    if(scripts.has(executable))throw Error('Duplicate console script: '+executable);
    scripts.set(executable,{module,function:func});
    if(values[cursor]===',')cursor++;else if(values[cursor]!==']')throw Error('Expected comma in console_scripts list.');
  }

  const launchAt=tokens.findIndex((token,index)=>token.kind==='string'&&token.value==='/launch'&&values[index-1]==='+'&&values[index-2]==='package_name'&&values[index-3]==='+'&&tokens[index-4]?.kind==='string'&&tokens[index-4].value==='share/');
  if(launchAt<0){scripts.launchFiles=new Set();return scripts;}
  if(values[launchAt+1]!==','||values[launchAt+2]!=='[')throw Error('Use a literal launch file list in setup.py.');
  scripts.launchFiles=new Set();let fileAt=launchAt+3;
  while(values[fileAt]!==']'){
    const token=tokens[fileAt++];if(!token||token.kind!=='string'||!token.value.startsWith('launch/')||!token.value.endsWith('launch.py'))throw Error('setup.py launch installation needs literal launch/*.py filenames.');
    scripts.launchFiles.add(token.value);
    if(values[fileAt]===',')fileAt++;else if(values[fileAt]!==']')throw Error('Expected comma in setup.py launch file list.');
  }

  return scripts;
}

