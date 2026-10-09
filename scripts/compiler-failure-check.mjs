import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');
 for(const type of ['cpp','python']){
  await page.route('**/'+type+'/worker.js',route=>route.abort());
  const error=await page.evaluate(async type=>{const base=document.querySelector('script[type="module"]').src;const {browserCompile}=await import(new URL('workspace.js',base));try{await browserCompile({type});return 'unexpected success';}catch(e){return e.message;}},type);
  assert.match(error,/compiler worker.*Save your session/);await page.unroute('**/'+type+'/worker.js');
 }
 console.log('PASS blocked C++ and Python workers show recovery diagnostics, never blank stderr');
}finally{await browser.close();}
