import {translations} from './translations.js';
const languages=['en','nl','fr','es','de','pt','it'];
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
let locale=read('kinenest.locale','en');if(!languages.includes(locale))locale='en';
export function t(text){
 if(locale==='en')return text;
 const column=['fr','nl','es','de','pt','it'].indexOf(locale);
 if(translations[text])return translations[text][column]??text;
 const progress=/^(\d+) \/ 6 completed$/.exec(text);
 if(progress)return `${progress[1]} / 6 ${['terminées','voltooid','completadas','abgeschlossen','concluídas','completate'][column]}`;
 const graph=/^(\d+) nodes · (\d+) topics$/.exec(text);
 if(graph)return `${graph[1]} ${['nœuds','nodes','nodos','Nodes','nós','nodi'][column]} · ${graph[2]} topics`;
 const move=/^Move to unit (\d+)$/.exec(text);if(move)return ['Passer à l’unité ','Ga naar onderdeel ','Ir a la unidad ','Weiter zu Einheit ','Ir para a unidade ','Vai all’unità '][column]+move[1];
 const decorated=/^(\d+[. ]+|↗  |[✓○] )(.*)$/.exec(text);
 if(decorated)return decorated[1]+t(decorated[2]);
 if(column<2)for(const [prefix,fr,nl] of [['Saved ','Enregistré : ','Opgeslagen: '],['Added visible example ','Exemple ajouté : ','Voorbeeld toegevoegd: ']])if(text.startsWith(prefix))return (column===0?fr:nl)+text.slice(prefix.length);
 if(text.endsWith(' • unsaved'))return text.slice(0,-10)+[' • non enregistré',' • niet opgeslagen',' • sin guardar',' • ungespeichert',' • não salvo',' • non salvato'][column];
 return text;
}
const originals=new WeakMap();
// Translate only interface prose. Learner files, commands, diagnostics and
// terminal output are data and must survive locale changes byte-for-byte.
const excluded='[translate="no"],script,style,code,pre,.nano-text,.nano-path,.cm-editor,.terminal-screen,#file-tree button';
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
 let theme=read('kinenest.theme',matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
 if(!['light','dark'].includes(theme))theme='dark';
 document.documentElement.classList.toggle('light',theme==='light');
 const controls=document.createElement('div');controls.className='preferences';
 controls.innerHTML='<label><span>Theme</span><select id="theme"><option value="dark">Dark</option><option value="light">Light</option></select></label><label><span>Language</span><select id="locale"><option value="en">🇬🇧 EN</option><option value="nl">🇳🇱 NL</option><option value="fr">🇫🇷 FR</option><option value="es">🇪🇸 ES</option><option value="de">🇩🇪 DE</option><option value="pt">🇵🇹 PT</option><option value="it">🇮🇹 IT</option></select></label>';
 document.querySelector('header').append(controls);
 controls.querySelector('#theme').value=theme;
 controls.querySelector('#theme').onchange=e=>{document.documentElement.classList.toggle('light',e.target.value==='light');save('kinenest.theme',e.target.value);};
 controls.querySelector('#locale').value=locale;
 controls.querySelector('#locale').onchange=e=>{locale=e.target.value;save('kinenest.locale',locale);translateUI();};
 observer=new MutationObserver(translateUI);translateUI();
}
