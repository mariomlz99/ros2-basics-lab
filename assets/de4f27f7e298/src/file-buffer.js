// Shared file buffer for terminal editors; opening a new file does not save it.
// Bounded content identity for completion evidence; no file contents are kept
// in terminal history. Equal text always yields the same identity.
export function contentFingerprint(text){let a=2166136261,b=5381;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b,33)^c;}return text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
export class FileBuffer{
 constructor(fs,path){this.fs=fs;this.path=path;fs.dir(path.slice(0,path.lastIndexOf('/'))||'/');this.existed=fs.exists(path);this.saved=this.existed?fs.read(path):'';this.text=this.saved;}
 get dirty(){return this.text!==this.saved;}
 save(){const exists=this.fs.exists(this.path);if(exists!==this.existed||exists&&this.fs.read(this.path)!==this.saved)throw Error('File changed in another editor. Reopen it before saving.');this.fs.write(this.path,this.text);this.saved=this.text;this.existed=true;}
}
