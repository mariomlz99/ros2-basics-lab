export const TOPICS_TITLE='Talking ROS 2: Topics & Terminals';
const text=body=>({kind:'text',body});
const commands=(terminal,...commands)=>({kind:'commands',terminal,commands});
const stop=terminal=>({kind:'terminal-action',terminal,action:'stop'});
export function topicsLesson(){return [
 text('Send messages before writing a node. Open three terminals with + Terminal. A terminal starts a command; ros2 topic pub and ros2 topic echo create the publisher and subscriber nodes. They communicate through a named topic using the same message type. No package creation or build is needed.'),
 {kind:'topic-diagram'},
 text('Terminal 1 — load ROS and inspect the message. std_msgs/msg/String contains one field, data. On native ROS, source the installation in every terminal; this lab does so by default through .bashrc.'),
 commands(1,'source /opt/ros/jazzy/setup.bash','ros2 interface show std_msgs/msg/String'),
 text('Terminal 2 — start listening first. Giving the message type lets echo subscribe even before a publisher exists. The command stays running and initially prints nothing; that means it is waiting, not broken.'),
 commands(2,'source /opt/ros/jazzy/setup.bash','ros2 topic echo /lab_chat std_msgs/msg/String'),
 text('Terminal 1 — send one message. --once (short form -1) publishes once and exits. Terminal 2 should print data: Hello from Terminal 1 followed by ---. The outer quotes keep the YAML mapping together as one shell argument.'),
 commands(1,`ros2 topic pub --once /lab_chat std_msgs/msg/String "{data: 'Hello from Terminal 1'}"`),
 text('Terminal 1 — repeat continuously. Without --once or --times, pub keeps running at 1 Hz by default: one message each second. Leave both commands active and observe several messages in Terminal 2.'),
 commands(1,`ros2 topic pub /lab_chat std_msgs/msg/String "{data: 'A message every second'}"`),
 text('Terminal 3 — inspect the live connection. Find /lab_chat and its type, then check the publisher and subscription counts. The CLI commands create hidden nodes: plain ros2 node list omits them; --all reveals them. The three terminals share one ROS graph; each still has its own shell environment.'),
 commands(3,'source /opt/ros/jazzy/setup.bash','ros2 topic list -t','ros2 topic type /lab_chat','ros2 topic info /lab_chat','ros2 node list','ros2 node list --all'),
 text('Stop only the publisher in Terminal 1. Terminal 2 remains subscribed and waits for the next message; stopping one command does not close the other terminals.'),stop(1),
 text('Terminal 1 — send a fixed number at a chosen rate. --times 3 publishes three messages; --rate 2 means two messages per second. The short forms are -t 3 and -r 2. Count three new messages in Terminal 2 and wait for Terminal 1 to return to its prompt.'),
 commands(1,`ros2 topic pub --times 3 --rate 2 /lab_chat std_msgs/msg/String "{data: 'Three messages'}"`),
 text('Terminal 1 — try a structured message. Twist contains linear and angular vectors. Unspecified components become zero. This example uses /lab_twist for inspection; it does not command the playground robot. Leave the 5 Hz publisher running.'),
 commands(1,'ros2 interface show geometry_msgs/msg/Twist',`ros2 topic pub -r 5 /lab_twist geometry_msgs/msg/Twist '{linear: {x: 0.2}, angular: {z: 0.5}}'`),
 text('Terminal 2 — stop the String subscriber, then listen to /lab_twist. The publisher now exists, so echo can discover the type. Find linear.x = 0.2, angular.z = 0.5, and zeros in the other components.'),stop(2),commands(2,'ros2 topic echo /lab_twist'),
 text('Terminal 3 — measure the receiving rate. Expect approximately 5 Hz after a few messages. hz is another subscriber; scheduling and discovery can make the measured rate differ slightly from the requested rate.'),commands(3,'ros2 topic hz /lab_twist'),
 text('Stop the rate monitor, publisher and subscriber before the next experiment. Ctrl+C affects only the command in the focused terminal.'),stop(3),stop(1),stop(2),
 text('Terminal 1 — what if nobody is listening? A finite publisher (--once or --times) waits for one matching subscriber by default. Run this on a fresh topic and observe the waiting message; leave it active.'),
 commands(1,`ros2 topic pub --once /lab_wait std_msgs/msg/String "{data: 'Ready when you are'}"`),
 text('Terminal 2 — join the topic. echo --once exits after receiving its first message. Both commands should now finish. This is why waiting for a subscriber helps a one-shot message reach its listener.'),commands(2,'ros2 topic echo /lab_wait std_msgs/msg/String --once'),
 text('Terminal 1 — explicitly skip that wait with -w 0. This sends once even when no subscriber exists. Start the listener afterwards in Terminal 2: it will wait silently. With the default volatile durability, a topic does not store old messages for future subscribers.'),
 commands(1,`ros2 topic pub -1 -w 0 /lab_unheard std_msgs/msg/String "{data: 'No replay'}"`),commands(2,'ros2 topic echo /lab_unheard std_msgs/msg/String'),stop(2),
 text('You have now used publishers and subscribers without writing them. Next, create a workspace and run your own hello executable. In the publishers and subscribers lesson, your Python or C++ programs take those roles: choose the same topic name and message type, publish data, and receive it in a callback.')
];}
export function topicsChecks(lab){const values=[...lab.runtime.cliTopicEvidence.values()];const check=(label,passed)=>({label,passed:!!passed});return [
 check('Receive a String message in another terminal',values.some(e=>e.kind==='received'&&e.topic==='/lab_chat'&&e.type==='std_msgs/msg/String'&&e.publisherTerminal!==undefined&&e.publisherTerminal!==e.terminal)),
 check('Complete a three-message publisher at 2 Hz',values.some(e=>e.kind==='published'&&e.topic==='/lab_chat'&&e.limit===3&&e.count===3&&e.rate===2&&e.finished)),
 check('Receive the Twist stream',values.some(e=>e.kind==='received'&&e.topic==='/lab_twist'&&e.type==='geometry_msgs/msg/Twist')),
 check('Measure the Twist receiving rate',values.some(e=>e.kind==='rate'&&e.topic==='/lab_twist'&&e.samples>=2)),
 check('Connect a listener to the waiting one-shot publisher',values.some(e=>e.kind==='received'&&e.topic==='/lab_wait'&&e.publisherTerminal!==e.terminal))
];}
