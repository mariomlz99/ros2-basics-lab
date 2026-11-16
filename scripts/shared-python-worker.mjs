// Actual browser/Pyodide probe for the narrow Basics retired-node patch.
// Requires a served candidate. No deployment, fake worker, compiler or ROS oracle.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.LAB_URL;
if(!url)throw Error('LAB_URL must point to the served review candidate');
const out=resolve(process.env.QA_OUTPUT||'artifacts/python-worker-review');
await mkdir(out,{recursive:true});
const code=`import json
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from example_interfaces.srv import AddTwoInts
rclpy.init()
old = Node('replacement')
old.destroy_node()
fresh = Node('replacement')
rejections = []
for name, factory in [
 ('publisher', lambda: old.create_publisher(String, '/ghost', 10)),
 ('subscription', lambda: old.create_subscription(String, '/ghost', lambda m: None, 10)),
 ('timer', lambda: old.create_timer(0.1, lambda: None)),
 ('service', lambda: old.create_service(AddTwoInts, '/ghost_service', lambda q, r: r)),
 ('client', lambda: old.create_client(AddTwoInts, '/ghost_service')),
]:
 try:
  factory()
 except RuntimeError:
  rejections.append(name)
assert len(rejections) == 5, rejections
observed = {'message': False, 'service': False, 'ticks': 0, 'server_calls': 0, 'retired_callbacks': 0}

def received(message):
 observed['message'] = message.data == 'fresh replacement'

def answer(request, response):
 observed['server_calls'] += 1
 response.sum = request.a + request.b
 return response

publisher = fresh.create_publisher(String, '/replacement_topic', 10)
subscription = fresh.create_subscription(String, '/replacement_topic', received, 10)
service = fresh.create_service(AddTwoInts, '/replacement_sum', answer)
client = fresh.create_client(AddTwoInts, '/replacement_sum')
doomed = Node('retired_client')
old_client = doomed.create_client(AddTwoInts, '/replacement_sum')
old_future = old_client.call_async(AddTwoInts.Request(a=2, b=3))
old_future.add_done_callback(lambda f: observed.update(retired_callbacks=observed['retired_callbacks'] + 1))
doomed.destroy_node()
new_client_node = Node('retired_client')

def tick():
 observed['ticks'] += 1
 publisher.publish(String(data='fresh replacement'))
 if observed['ticks'] == 1:
  future = client.call_async(AddTwoInts.Request(a=14, b=17))
  future.add_done_callback(lambda f: observed.update(service=f.result().sum == 31))
 if observed['message'] and observed['service'] and observed['server_calls'] >= 2:
  assert not old_future.done()
  assert observed['retired_callbacks'] == 0
  print('WORKER_PROBE:' + json.dumps({'retiredFactories': rejections, 'replacementDelivery': True, 'serviceSum': 31, 'retiredFutureIncomplete': not old_future.done(), 'retiredCallbacks': observed['retired_callbacks'], 'serverCalls': observed['server_calls']}))
  rclpy.shutdown()
 elif observed['ticks'] >= 100:
  raise RuntimeError('Replacement endpoints did not complete: ' + json.dumps(observed))

timer = fresh.create_timer(0.05, tick)
assert old.destroy_publisher(publisher) is False
assert old.destroy_subscription(subscription) is False
assert old.destroy_timer(timer) is False
assert old.destroy_service(service) is False
old.destroy_node()
rclpy.spin(fresh)
`;
const results={scope:'Real browser Worker + Pyodide + shipped RuntimeAdapter; direct PythonBridge program. Not package/build/source or native ROS certification.',runs:[]};
for(const engine of (process.env.BROWSERS||'chromium,firefox').split(',')){
 const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'networkidle'});
  const record=await page.evaluate(async code=>{
   const base=document.querySelector('script[type=module]').src;
   const [{Lab},{PythonBridge}]=await Promise.all([import(new URL('lab.js',base)),import(new URL('python/bridge.js',base))]);
   const lab=new Lab(),output=[],status=[];
   let completed=false;
   const bridge=new PythonBridge(lab.runtime,{output:s=>output.push(s),status:s=>status.push(s),onStop:()=>completed=true});
   try{
    bridge.run({code,schema:lab.workspace.registry.schema(),services:[]});
    const realWorker=bridge.worker instanceof Worker;
    const deadline=Date.now()+180000;
    while(!completed&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
    const marker=output.find(line=>line.startsWith('WORKER_PROBE:'));
    return {realWorker,completed,marker:marker?JSON.parse(marker.slice('WORKER_PROBE:'.length)):null,output,status,cleanup:{nodes:lab.runtime.nodes.size,jobs:lab.runtime.jobs.size,listeners:lab.runtime.listeners.size,services:lab.runtime.services.size},source:base};
   }finally{bridge.stop();lab.reset();}
  },code);
  assert(record.realWorker&&record.completed,JSON.stringify(record));
  assert.deepEqual(record.marker?.retiredFactories,['publisher','subscription','timer','service','client']);
  assert.equal(record.marker.replacementDelivery,true);assert.equal(record.marker.serviceSum,31);
  assert.equal(record.marker.retiredFutureIncomplete,true);assert.equal(record.marker.retiredCallbacks,0);assert(record.marker.serverCalls>=2);
  assert.deepEqual(record.cleanup,{nodes:0,jobs:0,listeners:0,services:0});
  assert.deepEqual(errors,[]);
  assert(!record.output.some(line=>/Traceback|Error:|Exception/.test(line)),record.output.join('\n'));
  results.runs.push({engine,version:browser.version(),status:'PASS',...record});
 }catch(error){results.runs.push({engine,version:browser.version(),status:'FAIL',error:error.stack});process.exitCode=1;}
 finally{await browser.close();await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2)+'\n');}
}
console.log(JSON.stringify(results,null,2));
