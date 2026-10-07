import{tags}from'@lezer/highlight';
import{EditorView,basicSetup}from'codemirror';import{EditorState,Compartment}from'@codemirror/state';import{keymap}from'@codemirror/view';import{indentWithTab}from'@codemirror/commands';import{python}from'@codemirror/lang-python';import{cpp}from'@codemirror/lang-cpp';import{xml}from'@codemirror/lang-xml';import{StreamLanguage,HighlightStyle,syntaxHighlighting}from'@codemirror/language';import{cmake}from'@codemirror/legacy-modes/mode/cmake';import{setDiagnostics}from'@codemirror/lint';
import{Terminal}from'@xterm/xterm';import{FitAddon}from'@xterm/addon-fit';import'@xterm/xterm/css/xterm.css';
export{Terminal,FitAddon};
export class CodeEditor{
 constructor(parent,onChange,onSave){this.language=new Compartment();this.view=new EditorView({parent,state:EditorState.create({extensions:[basicSetup,syntaxHighlighting(HighlightStyle.define([{tag:tags.keyword,color:'var(--code-keyword)'},{tag:[tags.string,tags.special(tags.string)],color:'var(--code-string)'},{tag:[tags.number,tags.bool],color:'var(--code-number)'},{tag:tags.comment,color:'var(--muted)'},{tag:[tags.typeName,tags.className],color:'var(--code-type)'}])),keymap.of([{key:'Mod-s',run:()=>{onSave();return true;}},indentWithTab]),this.language.of([]),EditorView.updateListener.of(u=>{if(u.docChanged)onChange();}),EditorView.theme({'&':{height:'100%',fontSize:'13px'},'.cm-scroller':{overflow:'auto',fontFamily:'ui-monospace, monospace'},'.cm-content':{minHeight:'180px'}})]})});}
 open(path,content){this.path=path;this.view.dispatch({changes:{from:0,to:this.view.state.doc.length,insert:content},effects:this.language.reconfigure(path.endsWith('.py')?python():path.endsWith('.cpp')||path.endsWith('.hpp')?cpp():path.endsWith('.xml')?xml():path.endsWith('CMakeLists.txt')?StreamLanguage.define(cmake):[])});this.view.dispatch(setDiagnostics(this.view.state,[]));}
 get value(){return this.view.state.doc.toString();}
 diagnostic(line,message){if(line<1||line>this.view.state.doc.lines)return;const l=this.view.state.doc.line(line);this.view.dispatch(setDiagnostics(this.view.state,[{from:l.from,to:l.to,severity:'error',message}]));}
 destroy(){this.view.destroy();}
}
