// Keep the source order: one command or source file per guided step.
export function guidePages(steps){
 const pages=[];let context=[];
 for(const step of steps){
  if(step.kind==='commands'){
   for(const command of step.commands)pages.push([...context,{...step,commands:[command]}]);
   context=[];
  }else if(step.kind==='files'){
   for(const [path,source] of Object.entries(step.items))pages.push([...context,{...step,items:{[path]:source}}]);
   context=[];
  }else context.push(step);
 }
 if(context.length)pages.push(context);
 pages.push([]); // Final state-based checks, independent of navigation progress.
 return pages;
}

export const environmentHints={
  "pwd": "Read the absolute path: this is where relative file paths begin.",
  "ls -a": "Find .bashrc: -a also shows hidden files.",
  "mkdir practice": "Create a practice directory. A successful mkdir normally prints nothing.",
  "cd practice": "Watch the prompt change: you are now inside practice.",
  "touch notes.txt": "Create an empty file and find it in Workspace files.",
  "echo \"This is my text\" > notes.txt": "The > operator writes to the file, replacing its contents. Why is there no text in the terminal?",
  "cat notes.txt": "Check that the file contains the text you just wrote.",
  "tree": "Compare the directory tree with Workspace files.",
  "cd ..": "Move to the parent directory and check the prompt again.",
  "rm -r practice": "Remove the practice directory and its contents. Watch it disappear from the file tree.",
  "echo $ROS_DISTRO": "The shell expands this environment variable. The result should be jazzy.",
  "which ros2": "Locate the ros2 executable supplied by the base environment.",
  "ros2 --help": "Read the available command groups before trying the graph commands.",
  "ros2 node list": "An empty result is expected: you have not started a student node yet.",
  "ros2 topic list": "Find /parameter_events and /rosout. System topics can exist before your own nodes start."
};
