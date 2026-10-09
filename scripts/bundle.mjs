import './installation-assets.mjs';
import{build}from'esbuild';await build({entryPoints:['src/ui-lib.js'],bundle:true,format:'esm',outfile:'src/vendor/ui.js',minify:true,legalComments:'linked'});

await build({entryPoints:['src/native-codec.js'],bundle:true,format:'esm',outfile:'src/vendor/native-codec.js',minify:true,legalComments:'linked'});
