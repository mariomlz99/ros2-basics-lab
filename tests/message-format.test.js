import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {InterfaceRegistry} from '../src/interfaces/registry.js';
import {formatPublishedMessage,formatEchoMessage} from '../src/message-format.js';
import {formatHzStatistics} from '../src/topic-cli.js';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/native-message-format.json',import.meta.url))),registry=new InterfaceRegistry();
test('every built-in message matches native Jazzy publisher repr and echo YAML',()=>{
 for(const [type] of registry.definitions)if(type.includes('/msg/'))for(const populated of [false,true])assert(fixtures.some(f=>f.type===type&&f.populated===populated),type+' native coverage');
 for(const f of fixtures){assert.equal(formatPublishedMessage(registry,f.type,f.message),f.publisher,f.type+' publisher');assert.equal(formatEchoMessage(registry,f.type,f.message),f.echo,f.type+' echo');}
});
test('hz reports real interval statistics with native formatting',()=>{
 assert.equal(formatHzStatistics([0,200,400,600]),'average rate: 5.000\n\tmin: 0.200s max: 0.200s std dev: 0.00000s window: 3');
 assert.equal(formatHzStatistics([0,199,400]),'average rate: 5.000\n\tmin: 0.199s max: 0.201s std dev: 0.00100s window: 2');
});
