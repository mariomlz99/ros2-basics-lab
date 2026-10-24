// Match a coordinate pair printed after its verified TF event, in the same run.
// Accept the lesson's labelled pair and ordinary print(x, y); ignore log prefixes
// (the adapter passes the raw message) and unrelated diagnostic numbers.
const number='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const labelled=new RegExp('^\\s*x\\s*=\\s*('+number+')\\s*,?\\s*y\\s*=\\s*('+number+')(?:\\s*m)?\\s*$','i');
const pair=new RegExp('^\\s*\\(?\\s*('+number+')[,\\s]+('+number+')\\s*\\)?(?:\\s*m)?\\s*$');
export function recordTfOutput(runtime,owner,text){
 const match=labelled.exec(String(text))??pair.exec(String(text));
 if(!match)return;
 const event=runtime.tfEvidence.findLast(event=>event.owner===owner);
 if(!event)return;
 const point=event.operation==='point'?event.result.point:event.result.transform.translation;
 event.outputMatches=[Number(match[1]),Number(match[2])].every((value,i)=>Number.isFinite(value)&&Math.abs(value-point[i?'y':'x'])<=0.005000001);
}
