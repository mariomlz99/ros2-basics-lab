import{build}from'esbuild';await build({entryPoints:['src/ui-lib.js'],bundle:true,format:'esm',outfile:'src/vendor/ui.js',minify:true,legalComments:'linked'});
