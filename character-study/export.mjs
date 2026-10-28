import fs from 'node:fs/promises';
import ts from '../chenyu-studio/node_modules/typescript/lib/typescript.js';
import {GLTFExporter} from '../chenyu-studio/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
class Reader { result=null; onloadend=null; onerror=null; readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();}).catch(e=>this.onerror?.(e));} readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.();}).catch(e=>this.onerror?.(e));} }
globalThis.FileReader=Reader;
const source=await fs.readFile(new URL('source/avatar.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace("from 'three'", "from '../../chenyu-studio/node_modules/three/build/three.module.js'");
await fs.writeFile(new URL('source/avatar.mjs',import.meta.url),js);
const {createAvatar}=await import('./source/avatar.mjs?'+Date.now());
const model=createAvatar();model.update(1,true);model.group.updateMatrixWorld(true);
const bytes=await new GLTFExporter().parseAsync(model.group,{binary:true,onlyVisible:true});
await fs.writeFile(new URL('chenyu-character.glb',import.meta.url),Buffer.from(bytes));
let meshes=0,triangles=0;model.group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
console.log(JSON.stringify({meshes,triangles,bytes:bytes.byteLength}));model.dispose();
