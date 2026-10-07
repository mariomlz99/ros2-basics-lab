import {setup,cmake} from './workspace.js';
export const pythonActionServer=`import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer, GoalResponse, CancelResponse
from rclpy.task import Future
from action_tutorials_interfaces.action import Fibonacci

class FibonacciServer(Node):
    def __init__(self):
        super().__init__('fibonacci_server')
        self.active = None
        self.server = ActionServer(
            self, Fibonacci, 'fibonacci', self.execute,
            goal_callback=self.accept_goal,
            cancel_callback=lambda handle: CancelResponse.ACCEPT)
        self.timer = self.create_timer(0.5, self.tick)

    def accept_goal(self, request):
        if self.active is not None or not 2 <= request.order <= 20:
            return GoalResponse.REJECT
        return GoalResponse.ACCEPT

    async def execute(self, handle):
        done = Future()
        self.active = (handle, [0, 1], done)
        return await done

    def tick(self):
        if self.active is None:
            return
        handle, sequence, done = self.active
        if handle.is_cancel_requested:
            handle.canceled()
        elif len(sequence) >= handle.request.order:
            handle.succeed()
        else:
            sequence.append(sequence[-1] + sequence[-2])
            feedback = Fibonacci.Feedback()
            feedback.partial_sequence = sequence
            handle.publish_feedback(feedback)
            return
        result = Fibonacci.Result()
        result.sequence = sequence
        self.active = None
        done.set_result(result)

def main(args=None):
    rclpy.init(args=args)
    node = FibonacciServer()
    rclpy.spin(node)
`;
export const cppActionServer=`#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>
#include <action_tutorials_interfaces/action/fibonacci.hpp>

using Fibonacci = action_tutorials_interfaces::action::Fibonacci;
using GoalHandle = rclcpp_action::ServerGoalHandle<Fibonacci>;

class FibonacciServer : public rclcpp::Node {
  rclcpp_action::Server<Fibonacci>::SharedPtr server_;
  std::shared_ptr<GoalHandle> active_;
  rclcpp::TimerBase::SharedPtr timer_;
  std::vector<int32_t> sequence_;
public:
  FibonacciServer() : Node("fibonacci_server") {
    server_ = rclcpp_action::create_server<Fibonacci>(this, "fibonacci",
      [this](const rclcpp_action::GoalUUID&, std::shared_ptr<const Fibonacci::Goal> goal) {
        if (active_ || goal->order < 2 || goal->order > 20)
          return rclcpp_action::GoalResponse::REJECT;
        return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
      },
      [](std::shared_ptr<GoalHandle>) { return rclcpp_action::CancelResponse::ACCEPT; },
      [this](std::shared_ptr<GoalHandle> handle) { active_ = handle; sequence_ = {0, 1}; });
    timer_ = create_wall_timer(std::chrono::milliseconds(500), [this]() { tick(); });
  }
  void tick() {
    if (!active_) return;
    auto result = std::make_shared<Fibonacci::Result>();
    if (active_->is_canceling()) {
      result->sequence = sequence_;
      active_->canceled(result);
    } else if (sequence_.size() >= static_cast<size_t>(active_->get_goal()->order)) {
      result->sequence = sequence_;
      active_->succeed(result);
    } else {
      sequence_.push_back(sequence_[sequence_.size()-1] + sequence_[sequence_.size()-2]);
      auto feedback = std::make_shared<Fibonacci::Feedback>();
      feedback->partial_sequence = sequence_;
      active_->publish_feedback(feedback);
      return;
    }
    active_.reset();
  }
};
int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<FibonacciServer>());
  return 0;
}
`;
export function pythonActionClient(cancel=false){return `import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from action_tutorials_interfaces.action import Fibonacci

class FibonacciClient(Node):
    def __init__(self):
        super().__init__('fibonacci_client')
        self.client = ActionClient(self, Fibonacci, 'fibonacci')
        self.goal_handle = None
        self.cancel_sent = False
        self.client.wait_for_server(timeout_sec=5.0)
        goal = Fibonacci.Goal()
        goal.order = ${cancel?20:6}
        future = self.client.send_goal_async(goal, feedback_callback=self.feedback)
        future.add_done_callback(self.accepted)

    def accepted(self, future):
        self.goal_handle = future.result()
        if not self.goal_handle.accepted:
            self.get_logger().info('Goal rejected')
            rclpy.shutdown()
            return
        self.get_logger().info('Goal accepted')
        self.goal_handle.get_result_async().add_done_callback(self.result)

    def feedback(self, event):
        self.get_logger().info('Feedback: ' + str(list(event.feedback.partial_sequence)))
${cancel?`        if self.goal_handle and not self.cancel_sent:
            self.cancel_sent = True
            self.goal_handle.cancel_goal_async().add_done_callback(self.canceled)

    def canceled(self, future):
        self.get_logger().info('Cancel accepted: ' + str(bool(future.result().goals_canceling)))
`:''}
    def result(self, future):
        response = future.result()
        self.get_logger().info('Result status: ' + str(response.status))
        self.get_logger().info('Sequence: ' + str(list(response.result.sequence)))
        rclpy.shutdown()

def main(args=None):
    rclpy.init(args=args)
    node = FibonacciClient()
    rclpy.spin(node)
`;}
export function cppActionClient(cancel=false){return `#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>
#include <action_tutorials_interfaces/action/fibonacci.hpp>
using Fibonacci = action_tutorials_interfaces::action::Fibonacci;
using GoalHandle = rclcpp_action::ClientGoalHandle<Fibonacci>;
class FibonacciClient : public rclcpp::Node {
  rclcpp_action::Client<Fibonacci>::SharedPtr client_;
  bool cancel_sent_ = false;
public:
  FibonacciClient() : Node("fibonacci_client") {
    client_ = rclcpp_action::create_client<Fibonacci>(this, "fibonacci");
    client_->wait_for_action_server(std::chrono::seconds(5));
    Fibonacci::Goal goal;
    goal.order = ${cancel?20:6};
    rclcpp_action::Client<Fibonacci>::SendGoalOptions options;
    options.goal_response_callback = [this](std::shared_ptr<GoalHandle> handle) {
      RCLCPP_INFO(get_logger(), "%s", handle ? "Goal accepted" : "Goal rejected");
      if (!handle) rclcpp::shutdown();
    };
    options.feedback_callback = [this](std::shared_ptr<GoalHandle> handle, Fibonacci::Feedback::ConstSharedPtr feedback) {
      RCLCPP_INFO(get_logger(), "Feedback: %d terms", (int)feedback->partial_sequence.size());
${cancel?`      if (!cancel_sent_) {
        cancel_sent_ = true;
        client_->async_cancel_goal(handle, [this](auto response) {
          RCLCPP_INFO(get_logger(), "Cancel accepted: %s", response->goals_canceling.empty() ? "false" : "true");
        });
      }
`:''}    };
    options.result_callback = [this](const GoalHandle::WrappedResult& result) {
      RCLCPP_INFO(get_logger(), "Result status: %d", (int)result.code);
      for (auto value : result.result->sequence) RCLCPP_INFO(get_logger(), "Term: %d", value);
      rclcpp::shutdown();
    };
    client_->async_send_goal(goal, options);
  }
};
int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<FibonacciClient>());
  return 0;
}
`;}
export function actionFiles(language){const py=language==='python',pkg=py?'py_actions':'cpp_actions';return py?{
 [pkg+'/server.py']:pythonActionServer,[pkg+'/client.py']:pythonActionClient(),[pkg+'/cancel_client.py']:pythonActionClient(true),
 'setup.py':setup(pkg,['server','client','cancel_client'].map(n=>`${n} = ${pkg}.${n}:main`))
}:{'src/server.cpp':cppActionServer,'src/client.cpp':cppActionClient(),'src/cancel_client.cpp':cppActionClient(true),'CMakeLists.txt':cmake(pkg,{server:'src/server.cpp',client:'src/client.cpp',cancel_client:'src/cancel_client.cpp'},['rclcpp','rclcpp_action','action_tutorials_interfaces'])};}
export function actionUnit(language){const py=language==='python',pkg=py?'py_actions':'cpp_actions';const text=body=>({kind:'text',body}),commands=(...commands)=>({kind:'commands',commands});return [
 text('An action is a task that takes time. A client sends a goal; the server accepts or rejects it, publishes feedback, and returns a final result. A client can also request cancellation. Compare this with one service request and response.'),
 commands('ros2 interface show action_tutorials_interfaces/action/Fibonacci'),
 text('The two separators divide Goal, Result and Feedback. Here, order is the requested number of Fibonacci terms. The server computes one term every half second, so you can observe feedback and cancel before completion. This example accepts orders from 2 to 20 and one active goal at a time.'),
 commands('mkdir -p ~/ros2_ws/src','cd ~/ros2_ws/src',`ros2 pkg create --build-type ${py?'ament_python':'ament_cmake'} --license Apache-2.0 ${pkg} --dependencies ${py?'rclpy':'rclcpp rclcpp_action'} action_tutorials_interfaces`),
 text('Add the server and two clients below, including their build configuration. The timer keeps the server responsive while the action runs. The normal client waits for a result; the cancellation client requests a stop after receiving feedback.'),
 {kind:'files',pkg,items:actionFiles(language)},
 commands('cd ~/ros2_ws',`colcon build --packages-select ${pkg}`,'source install/setup.bash',`ros2 run ${pkg} server`),
 text('Leave the server running. In another terminal, inspect it and send a goal. --feedback prints intermediate results as they arrive.'),
 commands('source ~/ros2_ws/install/setup.bash','ros2 action list -t','ros2 action info /fibonacci',"ros2 action send_goal /fibonacci action_tutorials_interfaces/action/Fibonacci '{order: 6}' --feedback"),
 text('Run the normal client, then the cancellation client. Result status 4 means succeeded; status 5 means canceled. A cancellation request is not the final result: wait for the server to acknowledge it and finish.'),
 commands(`ros2 run ${pkg} client`,`ros2 run ${pkg} cancel_client`),
 text('Try an invalid goal. The server rejects it, so no feedback or result follows. Stop the server with Ctrl+C and inspect the action list again. Its endpoint disappears. To try Python and C++ together, stop the server, build the other language package, and run one language as server and the other as client.'),
 commands("ros2 action send_goal /fibonacci action_tutorials_interfaces/action/Fibonacci '{order: -1}'",'ros2 action list'),
 text('The browser models action transport between real Python and compiled C++ programs. It does not run DDS or a native executor. Advanced action options and blocking waits are outside this module.')
];}
