import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export const sourceRoot=process.env.LAB_SOURCE_ROOT
 ?pathToFileURL(resolve(process.env.LAB_SOURCE_ROOT)+'/')
 :new URL('../src/',import.meta.url);
export const load=path=>import(new URL(path,sourceRoot));
console.log('# Lab source under test: '+sourceRoot.pathname);
