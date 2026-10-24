// Repeatable, bounded release checks. Individual logs preserve every failure.
import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8')),kinenest=pkg.name==='kinenest';
const url=process.env.LAB_URL||(kinenest?'http://127.0.0.1:8024/basics.html':'http://127.0.0.1:8017/ros2-basics-lab/');
const suites={
 artifact:[['python-spin-check'],['independent-float32-check'],['tf-runtime-check'],['product-regressions-check'],['course-localization-check'],['session-race-check'],...(kinenest?[['product'],['modules-check']]:[])],
 verification:[['python-spin-check'],['python-spin-check',{BROWSER:'firefox'}],['tf-learning-check'],['odometry-ui-check'],['byte-runtime-check'],...(kinenest?[['actions']]:[['tf-checker-attacks'],['tf-adversarial-runtime'],['endpoint-lifecycle-check'],['worker-output-check']])],
 latency:[['sensor-feedback-check']],
 final:[['python-spin-check'],['python-spin-check',{BROWSER:'firefox'}],['tf-runtime-check'],['tf-learning-check'],['odometry-ui-check'],['product-regressions-check'],['course-localization-check'],['independent-float32-check']],
 followup:[['tf-runtime-check'],['tf-learning-check'],['odometry-ui-check'],['product-regressions-check']],
 runtime:[['python-spin-check'],['python-spin-check',{BROWSER:'firefox'}],['tf-runtime-check'],['tf-checker-attacks'],['tf-adversarial-runtime'],['odometry-check'],['byte-runtime-check'],['endpoint-lifecycle-check'],['sensor-feedback-check'],['worker-output-check']],
 ui:[['unit-language-check'],['tf-learning-check'],['tf-session-review'],['tf-visual-check'],['odometry-ui-check'],['session-race-check'],['package-continuity-check'],['product-regressions-check'],...(kinenest?[['tf-language-check'],['product'],['modules-check']]:[])],
 course:[['acceptance'],['acceptance',{LAB_LANGUAGE:'cpp'}],['python-build-parity'],['adversarial-build-check'],...(kinenest?[['actions']]:[])],
 native:[['native-python-spin-check'],['native-tf-lessons'],['native-odometry-check']],
};
const suite=process.argv[2];if(!suites[suite])throw Error('Choose '+Object.keys(suites).join(', '));
await mkdir('artifacts/product-fixes/'+suite,{recursive:true});
const results=[];
for(const [script,extra={}]of suites[suite]){
 const name=script+(extra.BROWSER?'-'+extra.BROWSER:'')+(extra.LAB_LANGUAGE?'-'+extra.LAB_LANGUAGE:''),file='artifacts/product-fixes/'+suite+'/'+name+'.log';
 console.log('RUN '+name);
 const started=Date.now(),stream=createWriteStream(file);
 const child=spawn(process.execPath,['scripts/'+script+'.mjs'],{env:{...process.env,LAB_URL:url,SITE_URL:new URL('/',url).href,...extra},stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');},15*60*1000);
 const code=await new Promise(resolve=>{child.on('error',error=>{stream.write(String(error));resolve(-1);});child.on('exit',resolve);});
 clearTimeout(timer);await new Promise(resolve=>stream.end(resolve));
 const row={name,code,timedOut,seconds:Math.round((Date.now()-started)/1000),file};results.push(row);
 console.log((code===0?'PASS ':'FAIL ')+name+' ('+row.seconds+'s)');
 if(code!==0)console.log((await readFile(file,'utf8')).slice(-3000));
 await writeFile('artifacts/product-fixes/'+suite+'/results.json',JSON.stringify(results,null,2));
}
if(results.some(row=>row.code!==0))process.exitCode=1;
