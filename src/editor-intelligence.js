import {StateField} from '@codemirror/state';
import {showTooltip} from '@codemirror/view';
import {syntaxTree} from '@codemirror/language';
import {globalCompletion} from '@codemirror/lang-python';
import {autocompletion,snippetCompletion} from '@codemirror/autocomplete';
import {codeCompletions,callSignature} from './code-intelligence.js';
export function intelligenceExtensions(support,language,getRegistry){
 const complete=context=>{
  const node=syntaxTree(context.state).resolveInner(context.pos,-1),line=context.state.doc.lineAt(context.pos).text;
  if(/Comment|String/.test(node.name)&&!(language==='cpp'&&/^\s*#\s*include/.test(line)))return null;
  const source=context.state.doc.toString(),result=codeCompletions(source,context.pos,language,getRegistry?.());
  if(!context.explicit&&result.from===context.pos&&!/[.:>]$/.test(source.slice(0,context.pos))&&!/\bimport\s+$/.test(source.slice(0,context.pos)))return null;
  const options=result.options.map(record=>{
   const option={label:record.label,type:record.type,detail:record.signature,info:record.doc};
   return (record.type==='function'||record.type==='class'&&language==='python')&&!/^\s*from\b/.test(line)?snippetCompletion(record.label+'(${})',option):option;
  });
  if(language==='python'&&!/[.:>]\w*$/.test(source.slice(0,context.pos))&&!/\bfrom\s/.test(line)){const global=globalCompletion(context);if(global?.from===result.from){const labels=new Set(options.map(o=>o.label));options.push(...global.options.filter(o=>!labels.has(o.label)));}}
  return {...result,options};
 };
 const signature=state=>{
  if(!state.selection.main.empty)return null;
  const result=callSignature(state.doc.toString(),state.selection.main.head,language,getRegistry?.());if(!result)return null;
  return {pos:result.pos,above:true,strictSide:true,create(){const dom=document.createElement('div');dom.className='code-signature';const title=document.createElement('strong');title.textContent=result.signature;dom.append(title);if(result.doc){const help=document.createElement('div');help.textContent=result.doc;dom.append(help);}return {dom};}};
 };
 const signatures=StateField.define({create:signature,update(value,transaction){return transaction.docChanged||transaction.selection?signature(transaction.state):value;},provide:field=>showTooltip.from(field)});
 return [support,autocompletion({override:[complete]}),signatures];
}
