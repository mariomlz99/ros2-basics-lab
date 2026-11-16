// Execute attacks and legitimate alternatives, rather than injecting checker evidence.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {parameterOverlapFixtures,assessParameterOverlap} from './checker-parameter-overlap.mjs';
import {launchOwnershipFixtures,assessLaunchOwnership} from './checker-launch-ownership.mjs';
const url=process.env.LAB_URL;
if(!url)throw Error('LAB_URL must identify the served Basics Lab candidate.');
const languages=(process.env.LAB_LANGUAGE||'python,cpp').split(',');
if(languages.some(language=>!['python','cpp'].includes(language)))throw Error('LAB_LANGUAGE must contain python and/or cpp.');
const out=resolve(process.env.QA_OUTPUT||'artifacts/shared-checker-runtime');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})}),reports=[];
let overlapReport,overlapFixtures,launchReport,launchFixtures;
const saveOverlapReport=()=>writeFile(join(out,`checker-parameter-overlap-${overlapReport.language}.json`),JSON.stringify(overlapReport,null,2)+'\n');
const saveLaunchReport=()=>writeFile(join(out,`checker-launch-ownership-${launchReport.language}.json`),JSON.stringify(launchReport,null,2)+'\n');
try{
 const page=await browser.newPage();await page.goto(url);await page.exposeFunction('checkerProgress',s=>console.log(s));
 await page.exposeFunction('checkerOverlapEvidence',async observation=>{
  const fixture=overlapFixtures.find(f=>f.id===observation.id);
  if(!fixture||observation.language!==overlapReport.language)throw Error('Unexpected parameter overlap case');
  const index=overlapReport.cases.findIndex(c=>c.id===fixture.id);
  if(observation.status==='RUNNING'){
   if(overlapReport.cases[index].status!=='NOT_TESTED')throw Error('Duplicate parameter overlap start');
   overlapReport.cases[index]={id:fixture.id,status:'RUNNING'};overlapReport.status='RUNNING';await saveOverlapReport();return;
  }
  if(overlapReport.cases[index].status!=='RUNNING')throw Error('Parameter overlap observation without a fresh start');
  const assessment=assessParameterOverlap(fixture,observation);
  overlapReport.cases[index]={...observation,status:assessment.passed?'PASS':'FAIL',assessment};
  overlapReport.status=overlapReport.cases.some(c=>c.status==='FAIL')?'FAIL':overlapReport.cases.every(c=>c.status==='PASS')?'PASS':'RUNNING';
  await saveOverlapReport();return assessment;
 });
 await page.exposeFunction('checkerLaunchEvidence',async observation=>{
  const fixture=launchFixtures.find(f=>f.id===observation.id);
  if(!fixture||observation.language!==launchReport.language)throw Error('Unexpected launch ownership case');
  const index=launchReport.cases.findIndex(c=>c.id===fixture.id);
  if(observation.status==='RUNNING'){
   if(launchReport.cases[index].status!=='NOT_TESTED')throw Error('Duplicate launch ownership start');
   launchReport.cases[index]={id:fixture.id,status:'RUNNING'};launchReport.status='RUNNING';await saveLaunchReport();return;
  }
  if(launchReport.cases[index].status!=='RUNNING')throw Error('Launch ownership observation without a fresh start');
  const assessment=assessLaunchOwnership(fixture,observation);
  launchReport.cases[index]={...observation,status:assessment.passed?'PASS':'FAIL',assessment};
  launchReport.status=launchReport.cases.some(c=>c.status==='FAIL')?'FAIL':launchReport.cases.every(c=>c.status==='PASS')?'PASS':'RUNNING';
  await saveLaunchReport();return assessment;
 });
 for(const language of languages){
  launchFixtures=launchOwnershipFixtures(language);
  launchReport={schemaVersion:1,language,status:'NOT_TESTED',scope:'CHECKER-04-003 source-aware real worker launch ownership observations; no native parity or blind learner certification.',fixtures:launchFixtures.map(({sources,...f})=>f),cases:launchFixtures.map(f=>({id:f.id,status:'NOT_TESTED'}))};
  await saveLaunchReport();
  overlapFixtures=parameterOverlapFixtures(language);
  overlapReport={schemaVersion:1,language,status:'NOT_TESTED',scope:'CHECKER-04-001 source-aware actual worker observations only; not native parity or blind learner certification.',fixtures:overlapFixtures.map(({source,...f})=>f),cases:overlapFixtures.map(f=>({id:f.id,status:'NOT_TESTED'}))};
  await saveOverlapReport();
  const result=await page.evaluate(async ({language,overlapFixtures,launchFixtures})=>{
   const base=document.querySelector('script[type=module]').src,{Lab}=await import(new URL('lab.js',base)),{ROOT,setup,cmake}=await import(new URL('workspace.js',base)),examples=await import(new URL('examples.js',base));
   const {lessonChecks:checks}=await import(new URL('course/checks.js',base));
   const lab=new Lab(),build=lab.terminal(),a=lab.terminal(),b=lab.terminal(),inspect=lab.terminal(),log=[],cases=[],py=language==='python',pkg='alternate_pkg';
   for(const t of [build,a,b,inspect])t.output=s=>log.push(s);
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));
   const until=async(fn,label)=>{for(let i=0;i<3600;i++){if(fn())return;await sleep(50);}throw Error(label+' '+log.slice(-8).join('\n'));};
   const record=async(label,passed)=>{if(!passed)throw Error(label+' '+JSON.stringify(checks(lab,3)));cases.push(label);await window.checkerProgress(language+': '+label);};
   const write=(name,files)=>{for(const [file,source]of Object.entries(files)){const path=ROOT+'/src/'+name+'/'+file;lab.fs.mkdir(path.slice(0,path.lastIndexOf('/')),true);lab.fs.write(path,source);}};
   const compile=async(...names)=>{await build.execute('cd ~/ros2_ws');await build.execute('colcon build --packages-select '+names.join(' '));for(const t of [build,a,b,inspect])await t.execute('source ~/ros2_ws/install/setup.bash');};
   const stop=()=>{lab.stop(a.id);lab.stop(b.id);lab.stop(inspect.id);};
   const hasPublication=predicate=>lab.processes.active().some(p=>[...(lab.runtime.programPublications.get(p.adapter)?.values()??[])].some(predicate));
   const pubPath=py?pkg+'/talker.py':'src/publisher_member_function.cpp',subPath=py?pkg+'/listener.py':'src/subscriber_member_function.cpp';
   const alternate=s=>s.replaceAll("'topic'","'alternate'").replaceAll('"topic"','"alternate"').replaceAll("'talker'","'sender'").replaceAll('"talker"','"sender"').replaceAll("'listener'","'receiver'").replaceAll('"listener"','"receiver"');
   const files=examples.pubsubFiles(language,pkg),pub=alternate(files[pubPath]),sub=alternate(files[subPath]);
   try{
    await record('Fresh units cannot pass without work',[0,1,2,3,4,5].every(i=>!checks(lab,i).every(c=>c.passed)));
    await build.execute('mkdir -p ~/ros2_ws/src');await build.execute('cd ~/ros2_ws/src');await build.execute('ros2 pkg create '+pkg+' --build-type '+(py?'ament_python':'ament_cmake')+' --dependencies '+(py?'rclpy':'rclcpp')+' std_msgs');
    const empty=py?'def main():\n    pass\n':'int main(){return 0;}\n';write(pkg,{...files,[pubPath]:empty,[subPath]:empty});await compile(pkg);await a.execute('ros2 run '+pkg+' talker');await b.execute('ros2 run '+pkg+' listener');await until(()=>lab.processes.active().length===0,'empty programs finish');await record('Executed empty programs fail pub/sub checks',!checks(lab,3)[1].passed);stop();
    const fake=py?'def main():\n    print("Publishing: Hello World; I heard: Hello World")\n':'#include <iostream>\nint main(){std::cout<<"Publishing: Hello World; I heard: Hello World"<<std::endl;}\n';write(pkg,{[pubPath]:fake,[subPath]:fake});await compile(pkg);await a.execute('ros2 run '+pkg+' talker');await b.execute('ros2 run '+pkg+' listener');await until(()=>lab.processes.active().length===0,'print-only programs finish');await record('Executed print-only programs fail pub/sub checks',!checks(lab,3)[1].passed);stop();
    write(pkg,{[pubPath]:pub,[subPath]:sub.replaceAll('alternate','wrong_topic')});await compile(pkg);await record('Correct installed source never executed gives no delivery',!checks(lab,3)[1].passed);
    await a.execute('ros2 run '+pkg+' talker');await b.execute('ros2 run '+pkg+' listener');await until(()=>lab.runtime.nodes.size===2,'wrong-topic processes');await sleep(700);await record('Live wrong-topic subscriber fails',!checks(lab,3)[1].passed);stop();
    write(pkg,{[subPath]:sub});await compile(pkg);await b.execute('ros2 run '+pkg+' listener');await until(()=>lab.runtime.nodes.size===1,'repaired listener');await inspect.execute("ros2 topic pub /alternate std_msgs/msg/String '{data: external}'");await sleep(700);await record('External CLI publisher cannot replace the learner program',!checks(lab,3)[1].passed);lab.stop(inspect.id);
    await a.execute('ros2 run '+pkg+' talker');await until(()=>checks(lab,3).every(c=>c.passed),'alternate pub/sub delivery');await record('Alternate node/topic names pass after wrong-topic repair',true);
    lab.stop(b.id);await record('Stopping subscriber invalidates active delivery',!checks(lab,3)[1].passed);stop();
    const parameter=alternate(py?examples.parameterTalker:examples.cppParameterTalker),constant=parameter.replace(py?"self.get_parameter('message_prefix').value":'get_parameter("message_prefix").as_string()',py?"'Hello World'":'std::string("Hello World")');
    write(pkg,{[pubPath]:constant});await compile(pkg);await a.execute('ros2 run '+pkg+' talker');await until(()=>hasPublication(s=>s.message.data?.startsWith('Hello World:')),'constant output');await inspect.execute('ros2 param set /sender message_prefix Changed');await sleep(700);await record('Constant output does not satisfy parameter behavior',!checks(lab,4)[2].passed);stop();
    write(pkg,{[pubPath]:parameter});await compile(pkg);await a.execute('ros2 run '+pkg+' talker');await until(()=>hasPublication(s=>s.message.data?.startsWith('Hello World:')),'parameter baseline');await inspect.execute('ros2 param set /sender message_prefix Repaired');await until(()=>checks(lab,4)[2].passed,'changed parameter output');await record('Repair changes actual output and passes',true);stop();
    // Exact overlap attacks: successful parameter-setting syntax and changing
    // counters must not replace a distinguishable change in published content.
    const overlapOwners=new Set();
    for(const fixture of overlapFixtures){
     const observation={id:fixture.id,language,sourceSHA256:fixture.sourceSHA256};
     await window.checkerOverlapEvidence({...observation,status:'RUNNING'});
     try{
      stop();write(pkg,{[pubPath]:fixture.source});await compile(pkg);
      await a.execute('ros2 run '+pkg+' talker');
      const current=lab.processes.runs.get(pkg+'/talker');
      if(!current?.adapter)throw Error('Overlap program has no runtime owner');
      observation.ownerReused=overlapOwners.has(current.adapter);overlapOwners.add(current.adapter);
      const ownedSamples=()=>[...lab.runtime.samples].filter(([,sample])=>sample.publisherOwner===current.adapter&&sample.topic==='/overlap_probe').map(([sample,s])=>({sample,data:s.message.data,type:s.type,ownerMatches:s.publisherOwner===current.adapter}));
      await until(()=>ownedSamples().length>0,'overlap baseline '+fixture.id);
      observation.workerInstance=current.adapter.worker instanceof Worker;
      observation.installedSourceMatches=current.entryCode===fixture.source;
      const executable=lab.workspace.installed.get(pkg).executables.get('talker');
      observation.compiledWasm=py?null:executable.module instanceof WebAssembly.Module&&executable.wasmBytes?.[0]===0&&executable.wasmBytes?.[1]===97&&executable.wasmBytes?.[2]===115&&executable.wasmBytes?.[3]===109;
      observation.baseline=ownedSamples().at(-1);
      observation.checkerBefore=checks(lab,4)[2].passed;
      observation.parameterCommand='ros2 param set /overlap_probe message_prefix '+JSON.stringify(fixture.value);
      observation.parameterOutput=await inspect.execute(observation.parameterCommand);
      observation.commandEndSample=lab.runtime.sampleCounter;
      const changes=lab.runtime.parameterChanges.filter(c=>c.owner===current.adapter&&c.name==='message_prefix');
      if(changes.length!==1)throw Error('Expected one parameter change for the fresh overlap owner');
      const change=changes[0];
      observation.change={name:change.name,previous:change.previous,value:change.value,ownerMatches:change.owner===current.adapter,afterSample:change.after,beforeData:change.before.get('/overlap_probe')?.data};
      // A queued pre-update worker message may arrive after the setter returns.
      // Wait for three consecutive expected publications, preserving preceding
      // post-command samples as diagnostics instead of assuming zero latency.
      const after=()=>ownedSamples().filter(s=>s.sample>observation.commandEndSample);
      await until(()=>{const samples=after().slice(-3);return samples.length===3&&samples.every(s=>typeof s.data==='string'&&s.data.startsWith(fixture.afterPrefix+': '));},'three overlap publications '+fixture.id);
      const samples=after();observation.precedingPostSamples=samples.slice(0,-3);observation.postSamples=samples.slice(-3);
      observation.checkerAfter=checks(lab,4)[2].passed;
     }catch(error){observation.error=String(error.stack??error);}
     finally{
      stop();observation.cleanup={activeProcesses:lab.processes.active().length,nodes:lab.runtime.nodes.size,jobs:lab.runtime.jobs.size};
      const assessment=await window.checkerOverlapEvidence(observation);
      await record('Exact overlapping parameter '+fixture.id,assessment.passed);
     }
    }
    // Restore the publisher expected by the later launch/remapping control.
    write(pkg,{[pubPath]:parameter});
    await build.execute('cd ~/ros2_ws/src');await build.execute('ros2 pkg create tutorial_interfaces --build-type ament_cmake');write('tutorial_interfaces',examples.customFiles());write(pkg,examples.statusFiles(language,pkg));await compile('tutorial_interfaces',pkg);await record('Custom message source alone gives no publication',!checks(lab,4)[1].passed);
    const customType=Object.keys(lab.workspace.installed.get("tutorial_interfaces").generated)[0];await inspect.execute("ros2 topic pub --once -w 0 /external_custom "+customType+" '{name: Lin, counter: 12, ready: true}'");await record('External custom-message publication is rejected as learner evidence',!checks(lab,4)[1].passed);await a.execute('ros2 run '+pkg+' status');await until(()=>checks(lab,4)[1].passed,'executed custom message');await record('Executed custom publisher passes',true);stop();
    const servicePkg=py?'py_service':'cpp_service',serviceFiles=examples.serviceFiles(language),serverPath=py?servicePkg+'/server.py':'src/server.cpp',server=serviceFiles[serverPath];
    await build.execute('cd ~/ros2_ws/src');await build.execute('ros2 pkg create '+servicePkg+' --build-type '+(py?'ament_python':'ament_cmake')+' --dependencies '+(py?'rclpy':'rclcpp')+' example_interfaces');write(servicePkg,{...serviceFiles,[serverPath]:server.replace(py?'request.a + request.b':'request->a + request->b','5')});await compile(servicePkg);await a.execute('ros2 run '+servicePkg+' server');await until(()=>lab.runtime.services.size,'constant service');await b.execute('ros2 run '+servicePkg+' client');await until(()=>lab.runtime.serviceCalls.some(c=>c.caller),'constant service client');await inspect.execute("ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts '{a: 7, b: 8}'");await record('Hardcoded service response fails varied requests',!checks(lab,5)[0].passed);stop();
    write(servicePkg,{[serverPath]:server});await compile(servicePkg);await a.execute('ros2 run '+servicePkg+' server');await until(()=>lab.runtime.services.size,'repaired service');await inspect.execute("ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts '{a: -4, b: 19}'");await record('CLI alone does not satisfy the program-client task',!checks(lab,5)[0].passed);await b.execute('ros2 run '+servicePkg+' client');await until(()=>checks(lab,5)[0].passed,'repaired program and CLI service');await record('Real client and varied CLI request pass after repair',true);stop();
    // A publisher hearing itself is genuine delivery, but does not prove
    // exchange with its independently running sibling in the launch group.
    const launchOwners=new Set();
    for(const fixture of launchFixtures){
     const observation={id:fixture.id,language,sourceSHA256:fixture.sourceSHA256};
     await window.checkerLaunchEvidence({...observation,status:'RUNNING'});
     try{
      stop();
      write(pkg,{[pubPath]:fixture.sources.publisher,[subPath]:fixture.sources.listener,'launch/system.launch.py':fixture.sources.launch,[py?'setup.py':'CMakeLists.txt']:py?setup(pkg,[`talker = ${pkg}.talker:main`,`listener = ${pkg}.listener:main`,`status = ${pkg}.status_publisher:main`],['launch/system.launch.py']):cmake(pkg,{talker:'src/publisher_member_function.cpp',listener:'src/subscriber_member_function.cpp',status:'src/status_publisher.cpp'},['rclcpp','std_msgs','tutorial_interfaces'],true)});
      await compile(pkg);observation.launchStartSample=lab.runtime.sampleCounter;
      observation.command='ros2 launch '+pkg+' system.launch.py';await a.execute(observation.command);
      const publisher=lab.processes.runs.get(pkg+'/talker'),peer=lab.processes.runs.get(pkg+'/listener');
      if(!publisher?.adapter||!peer?.adapter)throw Error('Both launched programs must have runtime owners');
      await until(()=>publisher.adapter.nodes.size===1&&peer.adapter.nodes.size===1,'two launched nodes '+fixture.id);
      observation.workerInstances=[publisher,peer].map(p=>p.adapter.worker instanceof Worker);
      observation.ownersDistinct=publisher.adapter!==peer.adapter;
      observation.ownersReused=[publisher,peer].some(p=>launchOwners.has(p.adapter));
      for(const p of [publisher,peer])launchOwners.add(p.adapter);
      const installed=lab.workspace.installed.get(pkg);
      observation.installedSourceMatches={publisher:publisher.entryCode===fixture.sources.publisher,listener:peer.entryCode===fixture.sources.listener,launch:installed.files['launch/system.launch.py']===fixture.sources.launch};
      observation.compiledWasm=py?null:['talker','listener'].map(name=>{const e=installed.executables.get(name);return e.module instanceof WebAssembly.Module&&e.wasmBytes?.[0]===0&&e.wasmBytes?.[1]===97&&e.wasmBytes?.[2]===115&&e.wasmBytes?.[3]===109;});
      const endpoints=()=>({publisher:lab.runtime.topics.get(fixture.topic)?.publishers.has(fixture.publisherNode)===true,selfSubscription:lab.runtime.topics.get(fixture.topic)?.subscribers.has(fixture.publisherNode)===true,peerSubscription:lab.runtime.topics.get(fixture.peerTopic)?.subscribers.has(fixture.peerNode)===true,peerTopic:fixture.peerTopic});
      await until(()=>{const e=endpoints();return e.publisher&&e.selfSubscription&&e.peerSubscription;},'all launch endpoints ready '+fixture.id);
      observation.endpointsAtReady=endpoints();observation.startSample=lab.runtime.sampleCounter;
      const ownedSamples=()=>[...lab.runtime.samples].filter(([sample,s])=>sample>observation.startSample&&s.publisherOwner===publisher.adapter&&s.topic===fixture.topic).map(([sample,s])=>({sample,data:s.message.data,type:s.type,topic:s.topic,publisherMatches:s.publisherOwner===publisher.adapter,selfReceived:s.receivedOwners.has(publisher.adapter),peerReceived:s.receivedOwners.has(peer.adapter)}));
      const consumed=()=>ownedSamples().filter(s=>s.selfReceived&&(!fixture.peerExpected||s.peerReceived));
      // Retain initial publications while a launch parameter override is in
      // flight; require three consecutive consumed samples with its final value.
      await until(()=>{const samples=consumed().slice(-3);return samples.length===3&&samples.every(s=>typeof s.data==='string'&&/^Launched: (0|[1-9][0-9]*)$/.test(s.data));},'three consumed launch samples '+fixture.id);
      observation.samples=consumed().slice(-3);
      observation.precedingSamples=ownedSamples().filter(s=>s.sample<observation.samples[0].sample);
      observation.group=publisher.group;observation.sameGroup=publisher.group===peer.group;
      const members=lab.processes.groups.get(publisher.group);
      observation.groupMembers=members?.has(publisher.id)&&members.has(peer.id)?members.size:0;
      observation.activeProcesses=lab.processes.active().length;
      observation.endpoints=endpoints();
      const deliveries=lab.runtime.programDeliveries.filter(d=>d.publisher===publisher.adapter&&d.topic===fixture.topic);
      observation.selfDeliveries=deliveries.filter(d=>d.receiver===publisher.adapter).length;
      observation.peerDeliveries=deliveries.filter(d=>d.receiver===peer.adapter).length;
      observation.checkerActive={group:checks(lab,5)[1].passed,exchange:checks(lab,5)[2].passed};
     }catch(error){observation.error=String(error.stack??error);}
     finally{
      stop();observation.cleanup={activeProcesses:lab.processes.active().length,groups:lab.processes.groups.size,nodes:lab.runtime.nodes.size,jobs:lab.runtime.jobs.size,listeners:lab.runtime.listeners.size};
      observation.checkerStopped={group:checks(lab,5)[1].passed,exchange:checks(lab,5)[2].passed};
      const assessment=await window.checkerLaunchEvidence(observation);
      await record(fixture.peerExpected?'Alternate launched topic with real child delivery passes':'Self-only launch delivery does not count as sibling exchange',assessment.passed);
     }
    }
    await record('Launch Stop clears children and active exchange',!checks(lab,5)[1].passed&&!checks(lab,5)[2].passed&&lab.processes.active().length===0);
    lab.reset();await record('Reset clears all runtime completion evidence',[3,4,5].every(i=>!checks(lab,i).every(c=>c.passed))&&lab.runtime.nodes.size===0&&lab.runtime.listeners.size===0&&lab.runtime.services.size===0);
    return {language,passed:true,cases};
   }finally{lab.reset();}
  },{language,overlapFixtures,launchFixtures});
  reports.push(result);assert(result.passed);await writeFile(join(out,'checker-runtime-'+language+'.json'),JSON.stringify(result,null,2)+'\n');
 }
}catch(error){
 await writeFile(join(out,'failure.json'),JSON.stringify({url,status:'FAIL',error:String(error.stack??error),completedLanguages:reports.map(report=>report.language)},null,2)+'\n');
 throw error;
}finally{await browser.close();}
