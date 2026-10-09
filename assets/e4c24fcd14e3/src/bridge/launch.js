// A literal, non-executing parser for the Python launch shape taught here.
// It rejects arbitrary Python statements and substitutions.
function scan(source){
  const out=[];let i=0;
  while(i<source.length){
    const char=source[i];if(/\s/.test(char)){i++;continue;}
    if(char==='#'){while(i<source.length&&source[i]!=='\n')i++;continue;}
    if(char==='"'||char==="'"){
      const quote=char;let value='';i++;let closed=false;
      while(i<source.length){const c=source[i++];if(c===quote){closed=true;break;}if(c==='\\'){const next=source[i++];if(next===undefined)break;value+=({n:'\n',t:'\t',r:'\r'}[next]??next);}else value+=c;}
      if(!closed)throw Error('Unclosed launch string.');out.push({type:'string',value});continue;
    }
    const number=/^-?\d+(?:\.\d+)?/.exec(source.slice(i));if(number){out.push({type:'number',value:Number(number[0])});i+=number[0].length;continue;}
    const name=/^[A-Za-z_][A-Za-z_0-9]*/.exec(source.slice(i));if(name){out.push({type:'name',value:name[0]});i+=name[0].length;continue;}
    if('()[]{}:,=.'.includes(char)){out.push({type:char,value:char});i++;continue;}
    throw Error('Unsupported launch syntax near '+source.slice(i,i+16));
  }
  return out;
}

export function parseLaunch(source){
  const tokens=scan(source);let i=0;
  const peek=()=>tokens[i];
  function take(value){const token=tokens[i++];if(!token||token.value!==value)throw Error('Expected '+value+' in supported Python launch file.');return token;}
  function literal(){
    const token=tokens[i++];if(!token)throw Error('Missing launch value.');
    if(['string','number'].includes(token.type))return token.value;
    if(token.value==='True')return true;if(token.value==='False')return false;
    if(token.value==='['||token.value==='('){const end=token.value==='['?']':')',values=[];while(peek()?.value!==end){values.push(literal());if(peek()?.value!==end)take(',');}take(end);return values;}
    if(token.value==='{'){const result={};while(peek()?.value!=='}'){const key=literal();if(typeof key!=='string')throw Error('Parameter names must be strings.');take(':');result[key]=literal();if(peek()?.value!=='}')take(',');}take('}');return result;}
    throw Error('Launch values must be literal strings, numbers, booleans, lists, tuples or parameter maps.');
  }
  for(const word of ['from','launch','import','LaunchDescription','from','launch_ros','.','actions','import','Node','def','generate_launch_description','(',')',':','return','LaunchDescription','(','['])take(word);
  const nodes=[];
  while(peek()?.value!==']'){
    take('Node');take('(');const args={};
    while(peek()?.value!==')'){
      const key=tokens[i++];if(key?.type!=='name'||!['package','executable','name','namespace','parameters','remappings'].includes(key.value))throw Error('Unsupported Node field: '+(key?.value??'(missing)'));
      if(Object.hasOwn(args,key.value))throw Error('Duplicate Node field: '+key.value);
      take('=');args[key.value]=literal();if(peek()?.value!==')')take(',');
    }
    take(')');
    if(typeof args.package!=='string'||typeof args.executable!=='string')throw Error('Node requires literal package and executable.');
    if(args.name!==undefined&&typeof args.name!=='string')throw Error('Node name must be a string.');
    if(args.namespace!==undefined&&typeof args.namespace!=='string')throw Error('Node namespace must be a string.');
    const parameters={};
    if(args.parameters!==undefined){if(!Array.isArray(args.parameters))throw Error('Node parameters must be a list of maps.');for(const map of args.parameters){if(!map||Array.isArray(map)||typeof map!=='object')throw Error('Each parameter entry must be a map.');for(const [key,value] of Object.entries(map)){if(!['string','number','boolean'].includes(typeof value))throw Error('Only scalar launch parameters are supported.');parameters[key]=value;}}}
    const remappings=[];
    if(args.remappings!==undefined){if(!Array.isArray(args.remappings))throw Error('Node remappings must be a list of pairs.');for(const pair of args.remappings){if(!Array.isArray(pair)||pair.length!==2||pair.some(x=>typeof x!=='string'))throw Error('A remapping is a pair of topic names.');remappings.push(pair);}}
    nodes.push({package:args.package,executable:args.executable,name:args.name,namespace:args.namespace,parameters,remappings});
    if(peek()?.value!==']')take(',');
  }
  take(']');take(')');if(peek())throw Error('Unsupported statements after LaunchDescription.');
  if(!nodes.length)throw Error('LaunchDescription needs at least one Node.');
  return nodes;
}
