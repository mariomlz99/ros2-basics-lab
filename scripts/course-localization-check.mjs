import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome'}),results=[];
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto(process.env.LAB_URL||'http://127.0.0.1:8017/ros2-basics-lab/');await page.locator('#start').click();await page.locator('.xterm').first().waitFor();
  const locales=await page.locator('#locale option').evaluateAll(options=>options.map(o=>o.value));
  for(const locale of locales){
   await page.locator('#locale').selectOption(locale);await page.locator('[data-index="1"]').click();
   const body=await page.evaluate(async()=>{
    const base=document.querySelector('script[src*="/app.js"]').src,{courseTranslations}=await import(new URL('course-translations.js',base)),{t}=await import(new URL('i18n.js',base));
    const source=Object.keys(courseTranslations).find(key=>key.startsWith('Send messages before writing'));
    return {source,translated:t(source),text:document.querySelector('#lesson,#unit').textContent,headings:['Talking ROS 2: Topics & Terminals','Free Lab · experiment freely'].map(source=>({source,translated:t(source)})),nav:[...document.querySelectorAll('#nav,#exercise-nav')].map(node=>node.textContent).join(' ')};
   });
   assert(body.text.includes(body.translated));if(locale!=='en')assert.notEqual(body.translated,body.source);
   for(const heading of body.headings){assert(body.nav.includes(heading.translated));if(locale!=='en')assert.notEqual(heading.translated,heading.source);}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow: '+width+'/'+locale);
   results.push({width,locale,passed:true});
  }
  await mkdir('artifacts/product-fixes',{recursive:true});await page.screenshot({path:'artifacts/product-fixes/course-language-'+width+'.png'});await page.close();
 }
 await writeFile('artifacts/product-fixes/course-languages.json',JSON.stringify(results,null,2));console.log('PASS translated course prose at desktop/mobile widths in every supported locale');
}finally{await browser.close();}
