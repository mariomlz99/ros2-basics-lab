// Terminal output is untrusted and may contain very long lines. Scan location
// delimiters without a backtracking filename expression on the whole output.
export function diagnosticLocation(text){
 const digit=c=>c>='0'&&c<='9';
 for(let at=text.indexOf('.cpp:');at>=0;at=text.indexOf('.cpp:',at+5)){
  let end=at+5;while(end<text.length&&digit(text[end]))end++;
  if(end===at+5||text[end]!==':')continue;
  let start=at;while(start>0&&/[\w./-]/.test(text[start-1]))start--;
  if(start<at)return{file:text.slice(start,at+4),line:Number(text.slice(at+5,end))};
 }
 for(let at=text.indexOf('File ');at>=0;at=text.indexOf('File ',at+5)){
  const quote=text[at+5];if(quote!=="'"&&quote!=='"')continue;
  const start=at+6,end=text.indexOf(quote,start);
  if(end<0||!text.slice(start,end).endsWith('.py')||text.slice(end+1,end+8)!==', line ')continue;
  let last=end+8;while(last<text.length&&digit(text[last]))last++;
  if(last>end+8)return{file:text.slice(start,end),line:Number(text.slice(end+8,last))};
 }
 return null;
}
