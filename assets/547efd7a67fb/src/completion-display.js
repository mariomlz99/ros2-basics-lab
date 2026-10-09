// Bash/readline defaults: two Tabs, query at 100 matches, vertical columns.
export const COMPLETION_QUERY_ITEMS=100;
const collator=new Intl.Collator('en',{ignorePunctuation:true});
export function sortedCompletions(values){return [...new Set(values)].sort((a,b)=>collator.compare(a,b)||a.localeCompare(b,'en'));}
export function commonCompletion(values){if(!values.length)return '';let prefix=values[0];for(const value of values)while(!value.startsWith(prefix))prefix=prefix.slice(0,-1);return prefix;}
export function completionColumns(values,width){
 const choices=sortedCompletions(values);if(!choices.length)return [];
 const cell=Math.max(...choices.map(value=>Array.from(value).length))+2;
 const columns=Math.max(1,Math.min(choices.length,Math.floor((width+2)/cell))),rows=Math.ceil(choices.length/columns);
 return Array.from({length:rows},(_,row)=>{
  const entries=[];for(let column=0;column<columns;column++){const value=choices[row+column*rows];if(value!==undefined)entries.push(value);}
  return entries.map((value,i)=>i===entries.length-1?value:value+' '.repeat(cell-Array.from(value).length)).join('');
 });
}
