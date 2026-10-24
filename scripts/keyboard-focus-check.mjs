import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox} from 'playwright-core';
const url=process.env.LAB_URL;if(!url)throw Error('Set LAB_URL to the candidate course URL');
const out=process.env.FOCUS_ARTIFACTS||'artifacts/keyboard-focus';await mkdir(out,{recursive:true});
const results=[];
for(const engine of ['chrome','firefox']){
 const browser=await(engine==='firefox'?firefox:chromium).launch({headless:true,...(engine==='chrome'?{executablePath:'/usr/bin/google-chrome'}:{})});
 const page=await browser.newPage(),record={browser:engine,version:browser.version(),url};
 try{
  await page.goto(url);if(await page.locator('#start:visible').count())await page.locator('#start').click();
  const input=page.locator('.xterm-helper-textarea').first();await input.waitFor({state:'attached'});
  await page.waitForFunction(()=>document.querySelector('.terminal-state')?.textContent.startsWith('Jazzy'));
  await input.focus();await page.keyboard.type('echo PRESERVED_DRAFT');await page.keyboard.press('Escape');await page.keyboard.press('Tab');
  assert.equal(await input.evaluate(el=>el===document.activeElement),false,'Escape then Tab must leave terminal input');
  record.forwardFocus=await page.evaluate(()=>document.activeElement.outerHTML);
  await input.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.terminal-transcript pre').textContent.includes('\nPRESERVED_DRAFT\n'));
  await input.focus();await page.keyboard.press('Escape');await page.keyboard.press('Shift+Tab');
  assert.equal(await input.evaluate(el=>el===document.activeElement),false,'Escape then Shift+Tab must move focus backwards');
  record.backwardFocus=await page.evaluate(()=>document.activeElement.outerHTML);
  await input.focus();await page.keyboard.type('pw');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>/\$ pwd\s*\n/.test(document.querySelector('.terminal-transcript pre').textContent));
  await input.focus();await page.keyboard.type('ros2 topic echo /focus_test std_msgs/msg/String');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.terminal-state')?.textContent.includes('Running'));
  await page.keyboard.press('Escape');await page.keyboard.press('Tab');
  assert.equal(await input.evaluate(el=>el===document.activeElement),false,'Focus exit must work while a command runs');
  assert.match(await page.locator('.terminal-state').first().innerText(),/Running/,'Focus exit must not interrupt the command');
  await input.focus();await page.keyboard.press('Control+c');
  const editor=page.locator('.cm-content');assert.equal(await editor.getAttribute('aria-label'),'Code editor');
  await editor.focus();await page.keyboard.press('Escape');await page.keyboard.press('Tab');assert.equal(await editor.evaluate(el=>el===document.activeElement),false,'Editor escape path remains usable');
  assert.match(await page.locator('.editor-help').innerText(),/Esc then Tab/);
  await page.locator('.terminal-shortcuts summary').first().click();assert.match(await page.locator('.terminal-shortcuts').first().innerText(),/Move focus outside terminal/);
  await page.setViewportSize({width:320,height:900});
  await page.locator('#locale').selectOption(await page.locator('#locale option[value=de]').count()?'de':'fr');
  const bounds=await page.locator('.terminal-shortcuts>div').first().evaluate(el=>{const p=el.getBoundingClientRect(),c=el.closest('.terminal-card').getBoundingClientRect();return {left:p.left,right:p.right,bottom:p.bottom,cardLeft:c.left,cardRight:c.right,cardBottom:c.bottom};});
  record.narrowHelp=bounds;assert(bounds.left>=bounds.cardLeft&&bounds.right<=bounds.cardRight&&bounds.bottom<=bounds.cardBottom,'Keyboard help must stay inside its clipping panel');
  const help=page.locator('.terminal-shortcuts>div').first();await help.focus();assert.equal(await help.evaluate(el=>el===document.activeElement),true,'Scrollable keyboard help is keyboard reachable');await page.keyboard.press('End');await page.waitForTimeout(150);assert.equal(await help.evaluate(el=>el.scrollHeight<=el.clientHeight+1||el.scrollTop>0),true,'Long help must scroll using the keyboard');
  await page.screenshot({path:out+'/'+engine+'-narrow-help.png',fullPage:true});
  record.status='PASS';
 }catch(error){record.status='FAIL';record.error=error.stack;record.transcript=await page.locator('.terminal-transcript pre').first().textContent().catch(()=>null);process.exitCode=1;}
 results.push(record);await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(engine,record.status,record.error||'');await browser.close();
}
