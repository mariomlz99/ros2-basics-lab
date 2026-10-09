// Shared file buffer for terminal editors; opening a new file does not save it.
export class FileBuffer{
 constructor(fs,path){this.fs=fs;this.path=path;fs.dir(path.slice(0,path.lastIndexOf('/'))||'/');this.existed=fs.exists(path);this.saved=this.existed?fs.read(path):'';this.text=this.saved;}
 get dirty(){return this.text!==this.saved;}
 save(){const exists=this.fs.exists(this.path);if(exists!==this.existed||exists&&this.fs.read(this.path)!==this.saved)throw Error('File changed in another editor. Reopen it before saving.');this.fs.write(this.path,this.text);this.saved=this.text;this.existed=true;}
}
