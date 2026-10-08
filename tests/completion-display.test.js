import test from 'node:test';import assert from 'node:assert/strict';
import {sortedCompletions,commonCompletion,completionColumns,COMPLETION_QUERY_ITEMS} from '../src/completion-display.js';
test('readline completion is alphabetic, fills columns vertically and fits the terminal',()=>{
 assert.equal(COMPLETION_QUERY_ITEMS,100);
 assert.deepEqual(sortedCompletions(['std_msgs','action_msgs','actionlib_msgs','--all-comments','std_msgs']),['actionlib_msgs','action_msgs','--all-comments','std_msgs']);
 assert.equal(commonCompletion(['std_msgs/msg/String','std_msgs/msg/Int32']),'std_msgs/msg/');
 assert.deepEqual(completionColumns(['fox','ant','dog','bee','eel','cat'],13),['ant  cat  eel','bee  dog  fox']);
 const rows=completionColumns(['a','b','c','d','e','f'],8);assert.deepEqual(rows,['a  c  e','b  d  f']);assert(rows.every(row=>row.length<=8));
 assert.deepEqual(completionColumns(['long_name','short'],4),['long_name','short']);
});
