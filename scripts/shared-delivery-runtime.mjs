// Deferred real-worker checks for the Basics delivery-ACK ownership fix.
// Requires LAB_URL for an already served immutable candidate. Does not serve,
// build a distribution, deploy, or alter a repository. Every case uses a fresh
// in-browser Lab and actual package/build/source/run paths and worker adapters.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const url=process.env.LAB_URL;
if(!url)throw Error('LAB_URL must identify the served Basics review candidate');
const timeoutMs=Number(process.env.LAB_TIMEOUT_MS||240000);
if(!Number.isFinite(timeoutMs)||timeoutMs<1000)throw Error('LAB_TIMEOUT_MS must be at least 1000');
const engines=(process.env.BROWSERS||'chromium').split(',');
if(engines.some(engine=>!['chromium','firefox'].includes(engine)))throw Error('BROWSERS supports chromium,firefox');
const out=resolve(process.env.QA_OUTPUT||'artifacts/shared-delivery-runtime');
await mkdir(out,{recursive:true});
const expected=process.env.LAB_BUILD_INFO?JSON.parse(await readFile(process.env.LAB_BUILD_INFO,'utf8')):{};
const expectedAsset=process.env.LAB_EXPECTED_ASSET_VERSION||expected.assetVersion;
const expectedSha=process.env.LAB_EXPECTED_SOURCE_SHA256||expected.sourceSha256;
async function buildIdentity(){
 const response=await fetch(new URL('build-info.json',url),{cache:'no-store'});
 assert(response.ok,'Cannot read candidate build-info.json');
 const info=await response.json();
 assert.match(info.assetVersion??'',/^[a-f0-9]{12}$/,'Missing versioned candidate assets');
 assert.match(info.sourceSha256??'',/^[a-f0-9]{64}$/,'Missing candidate source identity');
 assert.equal(info.sourceSha256.slice(0,12),info.assetVersion);
 if(expectedAsset)assert.equal(info.assetVersion,expectedAsset,'Unexpected candidate asset version');
 if(expectedSha)assert.equal(info.sourceSha256,expectedSha,'Unexpected candidate source SHA256');
 return {assetVersion:info.assetVersion,sourceSha256:info.sourceSha256};
}

// Strong attacker model: the harness supplies a real canonical sample ID via
// an ordinary ROS parameter. The Python program itself sends the forged ACK
// through the exposed js.emit_json bridge. It never creates a subscription.
// This tests known-ID injection, not autonomous guessing of a hidden sample ID.
const attackSource=`import json
import rclpy
from rclpy.node import Node
from js import emit_json

class Listener(Node):
    def __init__(self):
        super().__init__('listener')
        self.declare_parameter('attack_sample', 0)
        self.attempts = 0
        self.timer = self.create_timer(0.05, self.forge)

    def forge(self):
        sample = self.get_parameter('attack_sample').value
        if sample <= 0:
            return
        emit_json(json.dumps({'kind': 'message_processed', 'sample': sample}))
        self.attempts += 1
        if self.attempts in (1, 5):
            print('FORGED_ACK:' + json.dumps({'sample': sample, 'attempt': self.attempts}))

def main(args=None):
    rclpy.init(args=args)
    node = Listener()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()
`;
const cases=[
 {id:'python-forged-ack-pubsub',language:'python',attack:true,launched:false},
 {id:'python-forged-ack-launch',language:'python',attack:true,launched:true},
 ...['python','cpp'].flatMap(language=>[false,true].map(launched=>({id:language+'-genuine-'+(launched?'launch':'pubsub'),language,attack:false,launched})))
];
const report={schemaVersion:1,status:'NOT_TESTED',scope:'Actual browser workers with real Pyodide/Clang-WASM and package installation. Known-ID ACK injection is performed by learner Python source; no host injection of checker evidence. Not native ROS parity or independent guessing certification.',expectedIdentity:{assetVersion:expectedAsset??null,sourceSha256:expectedSha??null},identity:null,runs:[]};
const save=()=>writeFile(resolve(out,'results.json'),JSON.stringify(report,null,2)+'\n');
await save();
try{
 report.identity=await buildIdentity();
 const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
 for(const engine of engines){
  const run={engine,status:'RUNNING',cases:cases.map(fixture=>({...fixture,status:'NOT_TESTED'})),pageErrors:[]};
  report.runs.push(run);report.status='RUNNING';await save();
  let browser;
  try{
   browser=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
   run.version=browser.version();
   const context=await browser.newContext(),page=await context.newPage();
   page.on('pageerror',error=>run.pageErrors.push(error.message));
   await page.goto(url,{waitUntil:'networkidle'});
   for(let i=0;i<cases.length;i++){
    const fixture=cases[i];run.cases[i].status='RUNNING';await save();
    console.log(engine+': '+fixture.id);
    try{
     run.cases[i]=await page.evaluate(async ({fixture,attackSource,timeoutMs,identity})=>{
      const observation={...fixture,status:'RUNNING',commands:[],log:[]};
      let lab;
      const require=(condition,message)=>{if(!condition)throw Error(message);};
      const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      try{
       const base=document.querySelector('script[type=module]').src;
       observation.source=base;
       require(new URL(base).pathname.endsWith('/assets/'+identity.assetVersion+'/src/app.js'),'Page entry does not use expected immutable assets');
       const [{Lab},{ROOT,setup,cmake},examples,{lessonChecks:checks}]=await Promise.all([
        import(new URL('lab.js',base)),import(new URL('workspace.js',base)),import(new URL('examples.js',base)),import(new URL('course/checks.js',base))
       ]);
       lab=new Lab();const build=lab.terminal(),a=lab.terminal(),b=lab.terminal(),inspect=lab.terminal();
       for(const terminal of [build,a,b,inspect])terminal.output=text=>{observation.log.push(String(text));if(observation.log.length>300)observation.log.shift();};
       const execute=async (terminal,command)=>{observation.commands.push({terminal:terminal.id,command});return terminal.execute(command);};
       const until=async(predicate,label)=>{const deadline=Date.now()+timeoutMs;while(Date.now()<deadline){if(predicate())return;await sleep(50);}throw Error('Timed out: '+label);};
       const checkpoint=()=>({pubsub:checks(lab,3).map(check=>check.passed),launch:checks(lab,5).map(check=>check.passed)});
       observation.before=checkpoint();
       require(!observation.before.pubsub[1]&&!observation.before.launch[2],'Fresh lab already has delivery credit');
       const py=fixture.language==='python',pkg='delivery_probe';
       await execute(build,'mkdir -p ~/ros2_ws/src');await execute(build,'cd ~/ros2_ws/src');
       await execute(build,'ros2 pkg create '+pkg+' --build-type '+(py?'ament_python':'ament_cmake')+' --dependencies '+(py?'rclpy':'rclcpp')+' std_msgs');
       const files=examples.pubsubFiles(fixture.language,pkg);
       const pubPath=py?pkg+'/talker.py':'src/publisher_member_function.cpp',subPath=py?pkg+'/listener.py':'src/subscriber_member_function.cpp';
       if(fixture.attack)files[subPath]=attackSource;
       files['launch/system.launch.py']=examples.launchSource(pkg);
       files[py?'setup.py':'CMakeLists.txt']=py?setup(pkg,[`talker = ${pkg}.talker:main`,`listener = ${pkg}.listener:main`],['launch/system.launch.py']):cmake(pkg,{talker:pubPath,listener:subPath},['rclcpp','std_msgs'],true);
       for(const [name,source]of Object.entries(files)){
        const path=ROOT+'/src/'+pkg+'/'+name;lab.fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);lab.fs.write(path,source);
       }
       await execute(build,'cd ~/ros2_ws');await execute(build,'colcon build --packages-select '+pkg);
       for(const terminal of [build,a,b,inspect])await execute(terminal,'source ~/ros2_ws/install/setup.bash');
       const installed=lab.workspace.installed.get(pkg);
       require(installed&&lab.workspace.current(pkg),'Actual build did not install the current package');
       if(fixture.launched)await execute(a,'ros2 launch '+pkg+' system.launch.py');
       else{await execute(a,'ros2 run '+pkg+' talker');await execute(b,'ros2 run '+pkg+' listener');}
       const sender=lab.processes.runs.get(pkg+'/talker'),receiver=lab.processes.runs.get(pkg+'/listener');
       require(sender?.adapter&&receiver?.adapter,'Missing program adapters');
       await until(()=>sender.adapter.nodes.size===1&&receiver.adapter.nodes.size===1,'both actual program nodes');
       observation.realWorkers=[sender,receiver].map(process=>process.adapter.worker instanceof Worker);
       require(observation.realWorkers.every(Boolean),'Expected actual browser Workers');
       observation.installedSourceMatches={publisher:sender.entryCode===files[pubPath],receiver:receiver.entryCode===files[subPath],launch:installed.files['launch/system.launch.py']===files['launch/system.launch.py']};
       require(Object.values(observation.installedSourceMatches).every(Boolean),'Program does not match installed fixture');
       observation.compiledWasm=py?null:['talker','listener'].map(name=>{const executable=installed.executables.get(name);return executable.module instanceof WebAssembly.Module&&[0,97,115,109].every((value,index)=>executable.wasmBytes?.[index]===value);});
       if(!py)require(observation.compiledWasm.every(Boolean),'Expected compiled WASM artifacts');
       observation.sameLaunchGroup=!!sender.group&&sender.group===receiver.group;
       if(fixture.launched)require(observation.sameLaunchGroup&&checks(lab,5)[1].passed,'Two processes must belong to one actual launch group');
       const topic=fixture.launched?'/conversation':'/topic';
       const ownedSamples=()=>[...lab.runtime.samples].filter(([,sample])=>sample.publisherOwner===sender.adapter&&sample.topic===topic);
       await until(()=>ownedSamples().length>0,'real publisher sample');
       if(fixture.attack){
        const [sampleId,sample]=ownedSamples().at(-1);
        observation.injectedKnownSample={id:sampleId,topic:sample.topic,type:sample.type,data:sample.message.data};
        require(receiver.adapter.subscriptions.size===0,'Attack program unexpectedly subscribed');
        await until(()=>lab.runtime.parameters.get([...receiver.adapter.nodes][0])?.has('attack_sample'),'attack parameter declaration');
        await execute(inspect,'ros2 param set /listener attack_sample '+sampleId);
        await until(()=>receiver.output.some(line=>line.startsWith('FORGED_ACK:')&&JSON.parse(line.slice('FORGED_ACK:'.length)).attempt===5),'five real Python bridge forgery attempts');
        observation.attackMarkers=receiver.output.filter(line=>line.startsWith('FORGED_ACK:')).map(line=>JSON.parse(line.slice('FORGED_ACK:'.length)));
        require(observation.attackMarkers.every(marker=>marker.sample===sampleId),'Python forged the wrong sample ID');
        observation.checkerSnapshots=[];
        for(let j=0;j<10;j++){
         const state=checkpoint();observation.checkerSnapshots.push(state);
         require(!state.pubsub[1]&&!state.pubsub[2]&&!state.launch[2],'Forged ACK awarded mandatory delivery credit');
         await sleep(50);
        }
        observation.receiverSubscriptions=receiver.adapter.subscriptions.size;
        observation.sampleStillCanonical=lab.runtime.samples.get(sampleId)===sample;
        observation.sampleCreditedToReceiver=sample.receivedOwners.has(receiver.adapter);
        observation.ownerDeliveries=lab.runtime.programDeliveries.filter(delivery=>delivery.receiver===receiver.adapter).length;
        require(observation.sampleStillCanonical,'Attack sample aged out; result would be inconclusive');
        require(observation.receiverSubscriptions===0&&!observation.sampleCreditedToReceiver&&observation.ownerDeliveries===0,'Forged ACK recorded false runtime delivery');
       }else{
        await until(()=>checks(lab,3).every(check=>check.passed)&&(!fixture.launched||checks(lab,5)[2].passed),'genuine subscriber delivery and checker success');
        await until(()=>receiver.output.some(line=>line.includes('I heard:')),'actual learner callback output');
        observation.receiverSubscriptions=receiver.adapter.subscriptions.size;
        observation.actualReceivedSamples=ownedSamples().filter(([,sample])=>sample.receivedOwners.has(receiver.adapter)).map(([id,sample])=>({id,topic:sample.topic,data:sample.message.data}));
        require(observation.receiverSubscriptions>0&&observation.actualReceivedSamples.length>0,'Genuine case lacks canonical dispatch/receipt evidence');
        observation.callbackOutput=receiver.output.filter(line=>line.includes('I heard:')).slice(-3);
       }
       observation.active=checkpoint();
       lab.stop(a.id);lab.stop(b.id);
       observation.afterStop=checkpoint();
       observation.stopCleanup={processes:lab.processes.active().length,nodes:lab.runtime.nodes.size,listeners:lab.runtime.listeners.size,jobs:lab.runtime.jobs.size};
       require(Object.values(observation.stopCleanup).every(value=>value===0),'Stop leaked processes or endpoints');
       require(!observation.afterStop.pubsub[1]&&!observation.afterStop.pubsub[2]&&!observation.afterStop.launch[2],'Stop retained active delivery credit');
       lab.reset();
       observation.afterReset=checkpoint();
       observation.resetCleanup={processes:lab.processes.active().length,nodes:lab.runtime.nodes.size,listeners:lab.runtime.listeners.size,jobs:lab.runtime.jobs.size,samples:lab.runtime.samples.size,deliveries:lab.runtime.programDeliveries.length};
       require(Object.values(observation.resetCleanup).every(value=>value===0),'Reset retained runtime evidence');
       require(!observation.afterReset.pubsub[1]&&!observation.afterReset.pubsub[2]&&!observation.afterReset.launch[2],'Reset retained delivery credit');
       observation.status='PASS';
      }catch(error){observation.status='FAIL';observation.error=error.stack;}
      finally{lab?.reset();}
      return observation;
     },{fixture,attackSource,timeoutMs,identity:report.identity});
    }catch(error){run.cases[i]={...fixture,status:'FAIL',error:error.stack};}
    await save();
   }
   run.status=run.cases.every(result=>result.status==='PASS')&&run.pageErrors.length===0?'PASS':'FAIL';
  }catch(error){run.status='FAIL';run.error=error.stack;}
  finally{await browser?.close();await save();}
 }
 report.finalIdentity=await buildIdentity();
 assert.deepEqual(report.finalIdentity,report.identity,'Candidate changed while validation was running');
 report.status=report.runs.length===engines.length&&report.runs.every(run=>run.status==='PASS')?'PASS':'FAIL';
}catch(error){report.status='FAIL';report.error=error.stack;}
finally{await save();}
if(report.status!=='PASS')process.exitCode=1;
console.log(JSON.stringify({status:report.status,evidence:resolve(out,'results.json'),identity:report.identity}));
