export function pubsubDiagram(){
 const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
 const figure=element('figure',null,'diagram pubsub-diagram');
 figure.append(element('strong','What you will run'));
 const flow=element('div',null,'pubsub-flow');
 const card=(role,name,detail)=>{const box=element('div',null,'pubsub-role');box.append(element('span',role),element('code',name));if(detail)box.append(element('code',detail));return box;};
 const arrow=()=>{const node=element('span','→','pubsub-arrow');node.setAttribute('aria-hidden','true');return node;};
 flow.append(card('Publisher node','/talker'),arrow(),card('Topic · message type','/topic','std_msgs/msg/String'),arrow(),card('Subscriber node','/listener'));
 figure.append(flow);
 const caption=element('figcaption');
 caption.append(element('p','The talker publishes text messages on /topic. The listener subscribes to /topic and prints the messages it receives.'));
 caption.append(element('p','Building creates the executables; it does not start the nodes. After building, source the workspace in two terminals, then run the talker in one and the listener in the other.'));
 figure.append(caption);return figure;
}
