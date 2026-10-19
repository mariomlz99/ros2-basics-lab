import {translations} from './translations.js';
const languages=['en','nl','fr'];
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
let locale=read('ros2lab.locale','en');if(!languages.includes(locale))locale='en';
export function t(text){
 if(locale==='en')return text;
 const column=locale==='fr'?0:1;
 if(translations[text])return translations[text][column];
 const progress=/^(\d+) \/ 7 completed$/.exec(text);
 if(progress)return `${progress[1]} / 7 ${locale==='fr'?'terminées':'voltooid'}`;
 const graph=/^(\d+) nodes · (\d+) topics$/.exec(text);
 if(graph)return `${graph[1]} ${locale==='fr'?'nœuds':'nodes'} · ${graph[2]} topics`;
 const decorated=/^(\d+[. ]+|↗  |[✓○] )(.*)$/.exec(text);
 if(decorated)return decorated[1]+t(decorated[2]);
 for(const [prefix,fr,nl] of [['Saved ','Enregistré : ','Opgeslagen: '],['Added visible example ','Exemple ajouté : ','Voorbeeld toegevoegd: ']])if(text.startsWith(prefix))return (column===0?fr:nl)+text.slice(prefix.length);
 if(text.endsWith(' • unsaved'))return text.slice(0,-10)+(locale==='fr'?' • non enregistré':' • niet opgeslagen');
 return text;
}
const originals=new WeakMap();
// Translate only interface prose. Student files, commands, diagnostics and
// terminal output are data and must survive locale changes byte-for-byte.
const excluded='script,style,code,pre,.nano-text,.nano-path,.cm-editor,.terminal-screen,#file-tree';
let observer;
export function translateUI(){
 observer?.disconnect();
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode;if(node.parentElement?.closest(excluded))continue;
  const prior=originals.get(node),current=node.nodeValue;
  const source=prior&&current===prior.translated?prior.source:current;
  const trimmed=source.trim();if(!trimmed)continue;
  const translated=source.replace(trimmed,t(trimmed));
  if(current!==translated)node.nodeValue=translated;
  originals.set(node,{source,translated});
 }
 for(const node of document.querySelectorAll('[data-layout-label]')){node.setAttribute('aria-label',t(node.dataset.layoutLabel));node.title=t(node.dataset.layoutLabel);}
 document.documentElement.lang=locale;
 document.querySelector('#locale')?.setAttribute('aria-label',t('Language'));
 document.querySelector('#theme')?.setAttribute('aria-label',t('Theme'));
 observer?.observe(document.body,{subtree:true,childList:true,characterData:true});
}
export function initPreferences(){
 let theme=read('ros2lab.theme',matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
 if(!['light','dark'].includes(theme))theme='dark';
 document.documentElement.classList.toggle('light',theme==='light');
 const controls=document.querySelector('header .preferences')||document.createElement('div');controls.className='preferences';
 if(!controls.children.length)controls.innerHTML='<label><span>Theme</span><select id="theme"><option value="dark">Dark</option><option value="light">Light</option></select></label><label><span>Language</span><select id="locale"><option value="en">EN</option><option value="nl">NL</option><option value="fr">FR</option></select></label>';
 if(!controls.isConnected)document.querySelector('header').append(controls);controls.querySelectorAll('select').forEach(select=>select.disabled=false);
 controls.querySelector('#theme').value=theme;
 controls.querySelector('#theme').onchange=e=>{document.documentElement.classList.toggle('light',e.target.value==='light');save('ros2lab.theme',e.target.value);};
 controls.querySelector('#locale').value=locale;
 controls.querySelector('#locale').onchange=e=>{locale=e.target.value;save('ros2lab.locale',locale);translateUI();};
 observer=new MutationObserver(translateUI);translateUI();
}
