export function freeLabLesson(language){
 const python=language==='python';
 return [
  {kind:'text',body:'Experiment freely. There is no checker and no required solution. Your fresh workspace, files and terminals here are separate from the course and the guided playground. Reset workspace clears only this Free Lab. Save session preserves files and terminal environments; running nodes must be started again after a reload.'},
  {kind:'text',body:'Use + Terminal for up to six terminals, create and edit files in the workspace, and try the same shell, Python, C++, interfaces, parameters, services and launch tools as the lessons. Each terminal needs its own workspace source command. Switching the Python/C++ learning path changes the examples below; both use the same Free Lab files.'},
  {kind:'text',body:'A starting point, if you want one: create an ordinary hello package, build it, source it and run it. Choose your own package names and code. Reuse examples from the course by copying their source into packages here.'},
  {kind:'commands',commands:['cd ~/ros2_ws/src',`ros2 pkg create --build-type ${python?'ament_python':'ament_cmake'} --license Apache-2.0 --node-name hello my_experiment`,'cd ..','colcon build','source install/setup.bash','ros2 run my_experiment hello']},
  {kind:'text',body:'Enable robot and sensors to show the optional simulator, then choose Start playground to publish its topics. It uses the same robot, sensors and ROS tools as the guided playground. This remains a browser simulation with a bounded shell and build system; unsupported commands report their limits.'}
 ];
}
