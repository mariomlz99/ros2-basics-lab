// Match a coordinate pair printed after its verified TF event, in the same run.
// Labels may appear in explanatory prose or a printed object, in either order.
// Unlabelled diagnostics still do not count as a coordinate pair.
const number='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const coordinate=axis=>new RegExp('(?:^|[^\\w])["\']?'+axis+'["\']?\\s*[:=]\\s*('+number+')(?![\\w.])','i');
const xCoordinate=coordinate('x'),yCoordinate=coordinate('y');
const pair=new RegExp('^\\s*\\(?\\s*('+number+')[,\\s]+('+number+')\\s*\\)?(?:\\s*m)?\\s*$');
export function recordTfOutput(runtime,owner,text){
 const x=xCoordinate.exec(String(text)),y=yCoordinate.exec(String(text));
 const match=x&&y?[null,x[1],y[1]]:pair.exec(String(text));
 if(!match)return;
 const event=runtime.tfEvidence.findLast(event=>event.owner===owner);
 if(!event)return;
 const point=event.operation==='point'?event.result.point:event.result.transform.translation;
 event.outputMatches=[Number(match[1]),Number(match[2])].every((value,i)=>Number.isFinite(value)&&Math.abs(value-point[i?'y':'x'])<=0.005000001);
}
