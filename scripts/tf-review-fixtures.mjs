// Independent learner-shaped probes, also compiled/executed unchanged in Jazzy.
export const poses=[{x:0,y:0,yaw:0},{x:1,y:0,yaw:0},{x:0,y:1,yaw:Math.PI/2},{x:-1,y:2,yaw:-Math.PI/2},{x:1.2,y:-.7,yaw:2.8},{x:-.4,y:.6,yaw:Math.PI-1e-8},{x:.2,y:-.5,yaw:-Math.PI+1e-8},...[{x:2,y:1,yaw:0},{x:1,y:2,yaw:0},{x:1,y:0,yaw:0},{x:1,y:1,yaw:Math.PI}]];
export const pairs=[['base_link','laser_link'],['odom','base_link'],['odom','laser_link'],['laser_link','odom'],['laser_link','base_link'],['base_link','base_link'],['odom','camera_optical_frame']];
export function probeSource(language){
 if(language==='python')return `import rclpy
from rclpy.time import Time
from tf2_ros import Buffer, TransformListener, TransformException
from geometry_msgs.msg import PointStamped
import tf2_geometry_msgs

def main(args=None):
    rclpy.init(args=args)
    node = rclpy.create_node('independent_tf_probe')
    frames = Buffer()
    listener = TransformListener(frames, node)
    temporary = TransformListener(frames, node)
    temporary.unregister()
    def observe():
        try:
            for i, (reference, frame) in enumerate(${JSON.stringify(pairs)}):
                value = frames.lookup_transform(reference, frame, Time()).transform
                p, q = value.translation, value.rotation
                node.get_logger().info(f'CHECK {i} {p.x:.12g} {p.y:.12g} {p.z:.12g} {q.x:.12g} {q.y:.12g} {q.z:.12g} {q.w:.12g}')
            target = PointStamped()
            target.header.frame_id = 'odom'
            target.point.x, target.point.y = 1.0, 1.0
            p = frames.transform(target, 'base_link').point
            node.get_logger().info(f'CHECK point {p.x:.12g} {p.y:.12g} {p.z:.12g}')
        except TransformException as error:
            node.get_logger().info(f'EXPECTED_ERROR {error}')
    timer = node.create_timer(0.5, observe)
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
 return `#include <chrono>
#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <tf2_ros/buffer.hpp>
#include <tf2_ros/transform_listener.hpp>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
int main(int argc, char **argv) {
 rclcpp::init(argc, argv);
 auto node=std::make_shared<rclcpp::Node>("independent_tf_probe");
 tf2_ros::Buffer frames(node->get_clock());
 tf2_ros::TransformListener listener(frames,node,false);
 { tf2_ros::TransformListener temporary(frames,node,false); }
 auto timer=node->create_wall_timer(std::chrono::milliseconds(500),[&](){
${pairs.map(([target,source],i)=>` { auto value=frames.lookupTransform("${target}","${source}",tf2::TimePointZero).transform;
 auto p=value.translation; auto q=value.rotation;
 RCLCPP_INFO(node->get_logger(),"CHECK ${i} %.12g %.12g %.12g %.12g %.12g %.12g %.12g",p.x,p.y,p.z,q.x,q.y,q.z,q.w); }`).join('\n')}
 geometry_msgs::msg::PointStamped target;target.header.frame_id="odom";target.point.x=1;target.point.y=1;
 auto p=frames.transform(target,"base_link").point;
 RCLCPP_INFO(node->get_logger(),"CHECK point %.12g %.12g %.12g",p.x,p.y,p.z);
 });
 rclcpp::spin(node);rclcpp::shutdown();return 0;
}
`;
}
// Closed-form planar oracle: independent of TF's quaternion/composition code.
export function expected(pose){
 const {x,y,yaw}=pose,c=Math.cos(yaw),s=Math.sin(yaw),q=[0,0,Math.sin(yaw/2),Math.cos(yaw/2)];
 const lx=x+.12*c,ly=y+.12*s;
 return [[.12,0,.15,0,0,0,1],[x,y,0,...q],[lx,ly,.15,...q],[-c*lx-s*ly,s*lx-c*ly,-.15,0,0,-q[2],q[3]],[-.12,0,-.15,0,0,0,1],[0,0,0,0,0,0,1],null,[c*(1-x)+s*(1-y),-s*(1-x)+c*(1-y),0]];
}
