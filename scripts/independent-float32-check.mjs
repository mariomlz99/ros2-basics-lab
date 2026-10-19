import assert from 'node:assert/strict';

// Public UI regression. Native Jazzy serialize/deserialize + struct.pack('f')
// independently establish the expected values and sign, including underflow.
export async function checkFloat32(page,base,{lab=false,onResult=()=>{}}={}){
 await page.goto(base+(lab?'/':'/basics.html?start=1'));
 if(lab)await page.getByRole('button',{name:'Start lesson',exact:true}).click();
 await page.locator('.terminal-card').first().waitFor();
 await page.getByRole('button',{name:/Free Lab/}).click();
 async function cmd(command,n=1){
  const card=page.locator('.terminal-card').nth(n-1),input=card.locator('textarea');
  await input.click();await page.keyboard.type(command);await input.press('Enter');
  await page.waitForFunction(({n,command})=>document.querySelectorAll('.terminal-card pre')[n-1]?.textContent.includes(command),{n,command});
  if(command.startsWith('colcon build'))await page.waitForFunction(n=>document.querySelectorAll('.terminal-card pre')[n-1].textContent.split('colcon build').at(-1).includes('Summary:'),n,{timeout:180000});
  if(command.startsWith('ros2 run'))await page.waitForFunction(n=>document.querySelectorAll('.terminal-state')[n-1]?.textContent.includes('callbacks ready'),n,{timeout:90000});
  await page.waitForTimeout(200);
 }
 await cmd('mkdir -p ~/zero_ws/src');await cmd('cd ~/zero_ws/src');
 await cmd('ros2 pkg create zero_probe --build-type ament_python --node-name probe --dependencies rclpy std_msgs sensor_msgs');
 await cmd('gedit ~/zero_ws/src/zero_probe/zero_probe/probe.py');
 await page.locator('.cm-content').click();await page.keyboard.press('Control+a');await page.keyboard.insertText(`import math
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32
from sensor_msgs.msg import LaserScan

def main():
    rclpy.init()
    node=Node('signed_zero_observer')
    def scalar(message):
        print('SCALAR',format(message.data,'.17g'),int(math.copysign(1,message.data)<0),flush=True)
    def sequence(message):
        print('SEQUENCE',','.join(str(int(math.copysign(1,x)<0)) for x in message.ranges),flush=True)
    sub=node.create_subscription(Float32,'/zero_scalar',scalar,10)
    array_sub=node.create_subscription(LaserScan,'/zero_sequence',sequence,10)
    rclpy.spin(node)
`);await page.getByRole('button',{name:'Save',exact:true}).click();
 await cmd('cd ~/zero_ws');await cmd('colcon build --packages-select zero_probe');await cmd('source install/setup.bash');await cmd('ros2 run zero_probe probe');
 await page.getByRole('button',{name:'+ Terminal',exact:true}).click();
 const cases=[[-1e-46,0,1],[0,0,0],[1e-46,0,0],[1.0000000596046448,1,0],[1.0000001788139343,1.000000238418579,0],[-1.0000000596046448,-1,1],[65536.00390625,65536,0],[1/3,0.3333333432674408,0],[1.1754942807573643e-38,1.1754943508222875e-38,0]];
 const rows=[];
 try{
  for(const [input,expected,negative]of cases){
   const before=(await page.locator('.terminal-card pre').first().textContent()).split('\n').filter(l=>l.startsWith('SCALAR ')).length;
   await cmd(`ros2 topic pub --once -w 0 /zero_scalar std_msgs/msg/Float32 '{data: ${input}}'`,2);
   await page.waitForFunction(before=>document.querySelector('.terminal-card pre').textContent.split('\n').filter(l=>l.startsWith('SCALAR ')).length>before,before,{timeout:20000});
   const line=(await page.locator('.terminal-card pre').first().textContent()).split('\n').filter(l=>l.startsWith('SCALAR ')).at(-1),parts=line.split(' ');
   rows.push({input,expected,negative,actual:Number(parts[1]),actualNegative:Number(parts[2])});await onResult(rows);
   assert.ok(Number(parts[1])===expected,'float32 rounding');assert.equal(Number(parts[2]),negative,'float32 zero sign');
  }
  await cmd("ros2 topic pub --once -w 0 /zero_sequence sensor_msgs/msg/LaserScan '{ranges: [-1e-46, 0.0, 1e-46, -1.0]}'",2);
  await page.waitForFunction(()=>document.querySelector('.terminal-card pre').textContent.includes('SEQUENCE '),null,{timeout:20000});
  const sequence=(await page.locator('.terminal-card pre').first().textContent()).split('\n').filter(l=>l.startsWith('SEQUENCE ')).at(-1);
  rows.push({sequence});await onResult(rows);assert.equal(sequence,'SEQUENCE 1,0,0,1');
  return rows;
 }finally{await page.locator('.terminal-card textarea').first().press('Control+c');}
}
