import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {TransformClient} from '../src/runtime/tf.js';

function fixture(language){
 const messages=[];let now=10000,imports;
 const memory={buffer:new ArrayBuffer(65536)};
 const context=vm.createContext({TransformClient,URL,AbortSignal,TextDecoder,TextEncoder,setTimeout,self:{},Date:{now:()=>now},postMessage:message=>messages.push(message),loadToolchain:async()=>({metrics:{},instantiate:async(_module,value)=>{imports=value;return {exports:{memory,_start(){}}};}})});
 let source=readFileSync(new URL('../src/'+language+'/worker.js',import.meta.url),'utf8');
 if(language==='cpp')source=source.replace(/^import .+;\n/gm,'').replaceAll('import.meta.url',JSON.stringify('http://localhost/src/cpp/worker.js'));
 vm.runInContext(source,context);
 const send=value=>{const message=JSON.stringify(value);if(language==='python')context.self.emit_json(message);else{const bytes=new TextEncoder().encode(message);new Uint8Array(memory.buffer).set(bytes);imports.kinenest.emit(0,bytes.length);}};
 return {messages,context,send,advance(){now+=1001;},async init(){if(language==='cpp')await vm.runInContext('handle({kind:"start",module:{}})',context);messages.length=0;},log(text){send({kind:'log',node:'/noisy',level:20,text});}};
}
for(const language of ['python','cpp'])test(language+' worker bounds logger traffic before posting to the UI',async()=>{
 const f=fixture(language);await f.init();
 for(let i=0;i<100;i++)f.log('x'.repeat(8000));
 assert.equal(f.messages.filter(m=>m.kind==='log').length,40,'Logger calls must share the existing output rate limit');
 assert(f.messages.every(m=>m.text.length<=4000),'A log line must have the same bound as stdout');
 assert(f.messages.every(m=>m.node==='/noisy'&&m.level===20),'Keep ROS logger metadata');
 f.advance();f.log('recovered');assert.equal(f.messages.at(-1).text,'recovered');
});
test('C++ unterminated stdout remains bounded across chunks and recovers at a newline',async()=>{
 const f=fixture('cpp');await f.init();
 vm.runInContext("for(let i=0;i<100;i++)output('x'.repeat(8192))",f.context);
 assert(vm.runInContext('stdout.length',f.context)<=4000,'No-newline output must not retain the entire stream');
 vm.runInContext("output('\\nnext\\n')",f.context);
 assert.deepEqual(f.messages.map(m=>m.text),['x'.repeat(4000),'next']);
});

for(const language of ['python','cpp'])test(language+' output budget preserves protocol messages and normal output recovery',async()=>{
 const f=fixture(language);await f.init();
 for(let i=0;i<30;i++)vm.runInContext("output('ordinary\\n')",f.context);
 for(let i=0;i<30;i++)f.log('also output');
 assert.equal(f.messages.length,40);
 f.send({kind:'publish',node:'/noisy',topic:'/text',message:{data:'p'.repeat(8000)}});
 assert.equal(f.messages.at(-1).message.data.length,8000,'Do not truncate learner ROS payloads');
 f.send({kind:'destroy',node:'/noisy'});assert.equal(f.messages.at(-1).kind,'destroy');
 f.advance();f.log('recovered');assert.equal(f.messages.at(-1).text,'recovered');
});

test('Python delivery preserves floating negative zero without traversing integer camera bytes',()=>{
 const f=fixture('python');
 const paths=vm.runInContext(`JSON.stringify(negativeZeroPaths({image:new Uint8Array(230400),ranges:new Float32Array([-0,0,1]),point:{x:-0,y:0},values:[0,-0]}))`,f.context);
 assert.deepEqual(JSON.parse(paths),[['ranges',0],['point','x'],['values',1]]);
});
test('Python executor bounds queued events and interrupt discards pending callbacks',async()=>{
 const f=fixture('python');
 vm.runInContext(`for(let i=0;i<300;i++)enqueue({kind:'service_request',id:String(i)});`,f.context);
 assert(vm.runInContext('events.length',f.context)<=256);
 assert.equal(vm.runInContext('events[0].kind',f.context),'executor_error');
 vm.runInContext(`enqueue({kind:'interrupt'});enqueue({kind:'timer',id:'late'});`,f.context);
 assert.equal((await f.context.self.next_ros_event()).kind,'interrupt');
 assert.equal((await f.context.self.next_ros_event()).kind,'interrupt');
});
