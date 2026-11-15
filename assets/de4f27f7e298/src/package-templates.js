// ROS 2 Jazzy ros2pkg ament_cmake template (Apache-2.0).
// Keep creation output distinct from the concise, edited lesson examples.
// Verified against native ros2 pkg create by capture-cmake-templates.py.
export function createdCmake(name,{node=null,dependencies=[]}={}){
 return `cmake_minimum_required(VERSION 3.8)
project(${name})

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
${dependencies.length?dependencies.map(dep=>`find_package(${dep} REQUIRED)`).join('\n'):`# uncomment the following section in order to fill in
# further dependencies manually.
# find_package(<dependency> REQUIRED)`}
${node?`
add_executable(${node} src/${node}.cpp)
target_include_directories(${node} PUBLIC
  $<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include/\${PROJECT_NAME}>)
target_compile_features(${node} PUBLIC c_std_99 cxx_std_17)  # Require C99 and C++17
${dependencies.length?`ament_target_dependencies(
  ${node}
${dependencies.map(dep=>`  "${dep}"`).join('\n')}
)
`:''}
install(TARGETS ${node}
  DESTINATION lib/\${PROJECT_NAME})
`:''}
if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # comment the line when a copyright and license is added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # comment the line when this package is in a git repo and when
  # a copyright and license is added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
`;
}
