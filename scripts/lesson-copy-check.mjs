import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.LAB_URL||'http://127.0.0.1:8031/ros2-basics-lab/');
 await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
 const locales=await page.locator('#locale option').evaluateAll(options=>options.map(o=>o.value));let checked=0;
 for(const language of ['python','cpp']){
  await page.locator('#language').selectOption(language);
  for(let index=0;index<7;index++){
   await page.locator(`#nav button[data-index="${index}"]`).click();
   if(await page.locator('#guide-mode').getAttribute('aria-pressed')==='false')await page.locator('#guide-mode').click();
   for(const locale of locales){await page.locator('#locale').selectOption(locale);await page.waitForTimeout(50);const text=await page.locator('#lesson').innerText();assert(!/\b(RMW|DDS)\b/.test(text),`${language} unit ${index+1} ${locale}: excluded terminology`);checked++;}
  }
 }
 await page.locator('#locale').selectOption('en');await page.locator('#language').selectOption('python');
 const title=await page.locator('#lesson-heading').textContent();if(title.includes('From browser'))assert((await page.locator('#lesson').innerText()).includes('shared graph models node and topic discovery'));
 console.log(`PASS required lesson text: ${checked} language/unit/locale combinations; excluded terminology absent`);
}finally{await browser.close();}
