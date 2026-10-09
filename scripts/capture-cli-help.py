#!/usr/bin/env python3
"""Capture exact native root/daemon help; source Jazzy before running."""
import json,os,pathlib,subprocess,sys
captures={}
for command in [[],['daemon'],['daemon','start'],['daemon','stop'],['daemon','status']]:
 result=subprocess.run(['ros2',*command,'--help'],capture_output=True,text=True,env=dict(os.environ,COLUMNS='80'),check=True)
 captures[' '.join(command) or 'ros2']=result.stdout.rstrip('\n')
content='// Captured from local Jazzy with COLUMNS=80; selected commands are filtered by cli-help.js.\nexport const NATIVE_CLI_HELP='+json.dumps(captures,indent=2)+';\n'
target=pathlib.Path(__file__).resolve().parents[1]/'src/native-cli-help.js'
if '--check' in sys.argv:assert target.read_text()==content,'Native CLI help changed'
else:target.write_text(content)
print('PASS native root and daemon help captures')
