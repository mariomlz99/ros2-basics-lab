import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePythonSetup} from '../src/metadata.js';
const setup=destination=>`package_name = 'my_first_package'
setup(name=package_name, data_files=[(${destination}, ['launch/system.launch.py'])],
entry_points={'console_scripts': ['talker = my_first_package.talker:main']})`;
// Both declarations install the same launch file under native setuptools/ament.
// Independent native and learner-UI evidence is retained outside the repository.
test('equivalent literal and concatenated launch destinations install the same files',()=>{
 for(const destination of ["'share/my_first_package/launch'","'share/' + package_name + '/launch'"]){
  const metadata=parsePythonSetup(setup(destination),'my_first_package');
  assert.deepEqual([...metadata.launchFiles],['launch/system.launch.py'],destination);
 }
});
test('unrelated destinations do not install launch files into this package',()=>{
 const metadata=parsePythonSetup(setup("'share/another_package/launch'"),'my_first_package');
 assert.deepEqual([...metadata.launchFiles],[]);
});
