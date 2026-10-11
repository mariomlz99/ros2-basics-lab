import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.LAB_URL||'https://mariomlz99.github.io/ros2-basics-lab/';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[],setCookies=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('response',async response=>{if((await response.allHeaders())['set-cookie'])setCookies.push(new URL(response.url()).origin);});
 const response=await page.goto(base);assert.equal(response.status(),200);
 const build=await page.evaluate(async()=>fetch('./build-info.json').then(r=>r.json()));
 const module=await page.locator('script[type="module"]').getAttribute('src');
 const files=['app.js','lab.js','python/worker.js','python/compat.py','cpp/worker.js','cpp/compat.hpp','interfaces/builtin.js','installation-assets.js'];
 for(const file of files){const url=new URL(file,new URL(module,page.url())).href;const r=await context.request.get(url);assert.equal(r.status(),200,url);if(file.endsWith('.js'))assert.match(r.headers()['content-type'],/javascript/,url);}
 await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 const unitCount=await page.locator('#nav button, #exercise-nav button').count();for(let i=0;i<unitCount;i++){await page.locator(`button[data-index="${i}"]`).click();assert(await page.locator('#lesson-heading').isVisible());}
 await page.locator('button[data-index="7"]').click();
 assert(!requests.some(url=>url.includes('/pyodide/')||url.includes('/wasm-clang/')),'Runtime downloads must remain lazy');
 await page.locator('#save-session').click();await page.waitForTimeout(600);await page.reload();await page.locator('#start').click();await page.locator('.xterm').first().waitFor();assert.equal(await page.locator('#lesson-heading').textContent(),'Robotics Playground');
 const storage=await page.evaluate(async()=>({localStorageKeys:Object.keys(localStorage),databases:(await indexedDB.databases()).map(d=>d.name),caches:await caches.keys(),serviceWorkers:(await navigator.serviceWorker.getRegistrations()).length}));
 const cookies=await context.cookies();assert.equal(cookies.length,0);assert.deepEqual(setCookies,[]);assert.deepEqual(errors,[]);
 const result={url:base,build,assetsVerified:files.length,reload:true,unitsOpened:unitCount,lazyRuntimes:true,cookieCount:cookies.length,setCookieResponses:setCookies,storage};await mkdir('artifacts/audit',{recursive:true});await writeFile('artifacts/audit/'+(base.includes('127.0.0.1')?'local-pages-storage':'pages-storage')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
