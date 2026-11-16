// Exact CHECKER-04-001 fixtures and an observation oracle. This module does not
// launch browsers, compile programs or substitute for real worker execution.
import {createHash} from 'node:crypto';
import {parameterTalker,cppParameterTalker} from '../src/examples.js';

const plans=[
 {id:'shrink-ignored',previous:'Hello World',value:'Hello',ignored:true},
 {id:'grow-ignored',previous:'Hello',value:'Hello World',ignored:true},
 {id:'shrink-observed',previous:'Hello World',value:'Hello',ignored:false},
 {id:'grow-observed',previous:'Hello',value:'Hello World',ignored:false},
];
function replaceOnce(source,needle,replacement){
 if(source.split(needle).length!==2)throw Error('Parameter overlap fixture source no longer has exactly one '+needle);
 return source.replace(needle,replacement);
}
export function parameterOverlapFixtures(language){
 if(!['python','cpp'].includes(language))throw Error('Expected python or cpp');
 const py=language==='python';
 return plans.map(plan=>{
  let source=py?parameterTalker:cppParameterTalker;
  source=replaceOnce(source,py?"super().__init__('talker')":'Talker() : Node("talker")',py?"super().__init__('overlap_probe')":'Talker() : Node("overlap_probe")');
  source=replaceOnce(source,py?"self.create_publisher(String, 'topic', 10)":'create_publisher<std_msgs::msg::String>("topic", 10)',py?"self.create_publisher(String, 'overlap_probe', 10)":'create_publisher<std_msgs::msg::String>("overlap_probe", 10)');
  source=replaceOnce(source,py?"self.declare_parameter('message_prefix', 'Hello World')":'declare_parameter<std::string>("message_prefix", "Hello World")',py?`self.declare_parameter('message_prefix', '${plan.previous}')`:`declare_parameter<std::string>("message_prefix", "${plan.previous}")`);
  if(plan.ignored)source=replaceOnce(source,py?"self.get_parameter('message_prefix').value":'get_parameter("message_prefix").as_string()',py?"'Hello World'":'std::string("Hello World")');
  return {...plan,language,expectedPassed:!plan.ignored,beforePrefix:plan.ignored?'Hello World':plan.previous,afterPrefix:plan.ignored?'Hello World':plan.value,source,sourceSHA256:createHash('sha256').update(source).digest('hex')};
 });
}

function payload(data,prefix){
 if(typeof data!=='string'||!data.startsWith(prefix+': '))return null;
 const counter=data.slice(prefix.length+2);
 if(!/^(0|[1-9][0-9]*)$/.test(counter)||!Number.isSafeInteger(Number(counter)))return null;
 return Number(counter);
}
export function assessParameterOverlap(fixture,o){
 const samples=Array.isArray(o.postSamples)?o.postSamples:[];
 const baseline=payload(o.baseline?.data,fixture.beforePrefix);
 const changeBaseline=payload(o.change?.beforeData,fixture.beforePrefix);
 const counters=samples.map(s=>payload(s.data,fixture.afterPrefix));
 const checks={
  matching_fixture:o.id===fixture.id&&o.language===fixture.language&&o.sourceSHA256===fixture.sourceSHA256,
  no_harness_error:!o.error,
  fresh_real_worker:o.workerInstance===true&&o.ownerReused===false,
  installed_source_matches:o.installedSourceMatches===true,
  actual_cpp_artifact:fixture.language!=='cpp'||o.compiledWasm===true,
  no_borrowed_credit_before_change:o.checkerBefore===false,
  baseline_publication:baseline!==null&&Number.isSafeInteger(o.baseline?.sample),
  exact_parameter_change:o.change?.ownerMatches===true&&o.change?.name==='message_prefix'&&o.change?.previous===fixture.previous&&o.change?.value===fixture.value,
  captured_change_baseline:changeBaseline!==null&&baseline!==null&&changeBaseline>=baseline,
  command_barrier:Number.isSafeInteger(o.change?.afterSample)&&Number.isSafeInteger(o.commandEndSample)&&o.baseline?.sample<=o.change?.afterSample&&o.commandEndSample>=o.change?.afterSample,
  three_fresh_owned_publications:samples.length===3&&samples.every((s,i)=>s.ownerMatches===true&&s.type==='std_msgs/msg/String'&&Number.isSafeInteger(s.sample)&&s.sample>o.commandEndSample&&(i===0||s.sample>samples[i-1].sample)),
  exact_prefix_and_advancing_counter:counters.length===3&&counters.every((n,i)=>n!==null&&changeBaseline!==null&&n>changeBaseline&&(i===0||n>counters[i-1])),
  checker_matches_observed_behavior:o.checkerAfter===fixture.expectedPassed,
  stopped_owned_runtime:o.cleanup?.activeProcesses===0&&o.cleanup?.nodes===0&&o.cleanup?.jobs===0,
 };
 return {passed:Object.values(checks).every(Boolean),checks};
}
