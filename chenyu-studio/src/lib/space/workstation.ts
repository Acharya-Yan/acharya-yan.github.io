import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createMacBook } from './macbook';
type V=[number,number,number];
export function createWorkstation(screenTexture:THREE.Texture, notebookTexture:THREE.Texture){
 const group=new THREE.Group(), resources=new Set<THREE.BufferGeometry|THREE.Material|THREE.Texture>();
 const own=<T extends THREE.BufferGeometry|THREE.Material|THREE.Texture>(o:T):T=>{resources.add(o);return o;};
 const mat=(color:string,roughness=.45,metalness=0)=>own(new THREE.MeshStandardMaterial({color,roughness,metalness}));
 const white=mat('#f8f7f2',.42), silver=mat('#c9cdd0',.3,.8), black=mat('#1b1d21',.5), rubber=mat('#25282c',.9), dark=mat('#41454b',.4,.5), paper=mat('#e5e6df',.8);
 function mesh(g:THREE.Object3D,geo:THREE.BufferGeometry,m:THREE.Material,p:V){const o=new THREE.Mesh(own(geo),m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 function box(g:THREE.Object3D,s:V,p:V,m=white,r=.015){return mesh(g,new RoundedBoxGeometry(...s,3,Math.min(r,...s.map(x=>x/2))),m,p);}
 function rod(g:THREE.Object3D,a:V,b:V,r=.02,m=silver){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),o=mesh(g,new THREE.CylinderGeometry(r,r,v.distanceTo(w),20),m,[0,0,0]);o.position.copy(v.clone().add(w).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),w.sub(v).normalize());return o;}
 function cylinder(g:THREE.Object3D,r:number,h:number,p:V,m=black){return mesh(g,new THREE.CylinderGeometry(r,r,h,40),m,p);}
 function tag(g:THREE.Object3D,id:string){g.traverse(o=>{if(o instanceof THREE.Mesh)o.userData.target=id;});}
 // Desk: thin beveled top, stepped telescoping lift columns, leveling feet and cable tray.
 box(group,[5.45,.11,1.8],[0,1.35,0],white,.035);
 box(group,[4.85,.08,.58],[0,1.23,-.13],paper,.025);
 for(const x of [-2.28,2.28]){
  box(group,[.16,.62,.19],[x,.93,0],white);box(group,[.19,.56,.22],[x,.38,0],paper);
  box(group,[.31,.08,1.55],[x,.07,0],white,.035);
  for(const z of [-.61,.61])cylinder(group,.055,.04,[x,.01,z],rubber);
  box(group,[.44,.06,.96],[x,1.25,0],white);
 }
 box(group,[1.5,.15,.3],[-.2,1.13,-.58],black);
 box(group,[.25,.035,.08],[2.12,1.28,.89],black,.008);
 for(let i=0;i<4;i++)box(group,[.025,.008,.022],[2.04+i*.047,1.258,.895],paper,.004);
 // Monitor: layered chassis, bowed rear, VESA plate, vents, actual arm joints and front glass.
 const monitor=new THREE.Group();monitor.position.set(.2,0,-.3);group.add(monitor);
 box(monitor,[2.08,1.22,.055],[0,2.28,.02],black,.035);
 box(monitor,[1.8,.94,.09],[0,2.28,-.04],dark,.085);
 box(monitor,[.45,.43,.14],[0,2.26,-.11],black,.04);
 const displayMat=own(new THREE.MeshBasicMaterial({map:screenTexture}));
 mesh(monitor,new THREE.PlaneGeometry(1.986,1.117),displayMat,[0,2.29,.0505]);
 for(let i=0;i<27;i++)box(monitor,[.023,.003,.043],[-.77+i*.059,2.76,-.089],black,.001);
 for(let i=0;i<5;i++)box(monitor,[.071,.03,.015],[-.25+i*.12,1.88,-.09],black,.003);
 rod(monitor,[0,2.3,-.18],[.45,1.99,-.37],.055,dark);rod(monitor,[.45,1.99,-.37],[.1,1.61,-.37],.055,dark);rod(monitor,[.1,1.43,-.37],[.1,1.83,-.37],.058,dark);
 for(const p of [[0,2.3,-.18],[.45,1.99,-.37],[.1,1.61,-.37]] as V[]) {const c=cylinder(monitor,.08,.13,p,dark);c.rotation.x=Math.PI/2;}
 box(monitor,[.24,.05,.24],[.1,1.43,-.37],black);
 rod(monitor,[-.76,2.935,.07],[.76,2.935,.07],.028,black);
 rod(monitor,[-.72,2.918,.088],[.72,2.918,.088],.009,white);
 box(monitor,[.13,.08,.18],[0,2.896,.015],black);
 tag(monitor,'work');
 // Laptop: detailed dedicated asset, on an adjustable aluminum riser.
 const riser=new THREE.Group();riser.position.set(-1.58,1.47,-.14);riser.rotation.y=.13;group.add(riser);
 box(riser,[.65,.025,.53],[0,0,.02],silver,.025);
 for(const x of [-.21,.21]){rod(riser,[x,.02,.02],[x,.29,-.18],.028,silver);box(riser,[.08,.025,.6],[x,.32,0],silver,.01);}
 const laptop=createMacBook(notebookTexture);laptop.group.position.set(0,.35,0);riser.add(laptop.group);tag(riser,'notes');
 // Speakers: separate cabinet, baffle, rubber surround, curved diaphragm and dust cap.
 for(const x of [-2.43,2.43]){
  const speaker=new THREE.Group();speaker.position.set(x,1.7,-.29);group.add(speaker);
  box(speaker,[.45,.57,.41],[0,0,0],white,.038);box(speaker,[.401,.52,.015],[0,0,.208],white,.022);
  for(const [y,r] of [[-.09,.141],[.16,.055]]){
   const ring=mesh(speaker,new THREE.TorusGeometry(r,.014,10,56),rubber,[0,y,.222]);
   const profile=[new THREE.Vector2(0,.012),new THREE.Vector2(r*.35,.005),new THREE.Vector2(r*.42,-.025),new THREE.Vector2(r*.86,.001),new THREE.Vector2(r,.014)];
   const cone=mesh(speaker,new THREE.LatheGeometry(profile,56),black,[0,y,.22]);cone.rotation.x=Math.PI/2;
   const dome=mesh(speaker,new THREE.SphereGeometry(r*.31,32,16,0,Math.PI*2,0,Math.PI/2),dark,[0,y,.232]);dome.rotation.x=Math.PI/2;
   for(const a of [Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4]){const screw=cylinder(speaker,.008,.007,[Math.cos(a)*(r+.022),y+Math.sin(a)*(r+.022),.224],dark);screw.rotation.x=Math.PI/2;}
  }
  box(speaker,[.28,.32,.018],[0,-.01,-.211],black,.01);
  for(const y of [-.07,.03]){const port=cylinder(speaker,.022,.025,[0,y,-.23],silver);port.rotation.x=Math.PI/2;}
  for(const sx of [-.15,.15])for(const z of [-.12,.12])cylinder(speaker,.03,.02,[sx,-.292,z],rubber);
 }
 // PS5: curved wings around the core, rather than rectangular slabs.
 const consoleGroup=new THREE.Group();consoleGroup.position.set(1.84,1.43,-.29);group.add(consoleGroup);
 box(consoleGroup,[.22,1.03,.48],[0,.53,0],black,.055);
 for(const sign of [-1,1]){
  const positions:number[]=[],indices:number[]=[];const nx=12,ny=30;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const t=j/ny,v=i/nx;const z=(v-.5)*.57;const flare=.022+Math.pow(t,3)*.035;positions.push(sign*(.13+flare+.016*Math.sin(v*Math.PI)),.02+t*1.1,z+.035*Math.sin(t*Math.PI));}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const wingMat=own(white.clone());wingMat.side=THREE.DoubleSide;mesh(consoleGroup,geo,wingMat,[0,0,0]);
 }
 cylinder(consoleGroup,.23,.045,[0,.01,0],black);box(consoleGroup,[.006,.35,.018],[.1,.35,.248],silver,.002);
 // Keyboard: sloped shell, stepped six-row keycaps and precise dark key legends.
 const keyboard=new THREE.Group();keyboard.position.set(.1,1.43,.52);keyboard.rotation.x=.06;group.add(keyboard);
 box(keyboard,[1.36,.065,.45],[0,0,0],white,.022);box(keyboard,[1.29,.008,.39],[0,.035,0],dark,.009);
 const keyCanvas=document.createElement('canvas');keyCanvas.width=1024;keyCanvas.height=384;const ctx=keyCanvas.getContext('2d')!;ctx.fillStyle='#f5f5f0';ctx.fillRect(0,0,1024,384);ctx.fillStyle='#6b6e6c';ctx.font='23px sans-serif';
 const rows=['ESC 1 2 3 4 5 6 7 8 9 0 − =','TAB Q W E R T Y U I O P [ ]','CAP A S D F G H J K L ; ENTER','SHIFT Z X C V B N M , . / ↑','CTRL OPT CMD              CMD ← ↓ →'];
 for(let r=0;r<5;r++){const chars=rows[r].split(' ');for(let c=0;c<13;c++)ctx.fillText(chars[c]||'',c*78+15,r*73+40);}
 const keyTex=own(new THREE.CanvasTexture(keyCanvas));keyTex.colorSpace=THREE.SRGBColorSpace;
 const legendMat=own(new THREE.MeshBasicMaterial({map:keyTex}));
 for(let row=0;row<5;row++)for(let col=0;col<13;col++){
  if(row===4&&col>=4&&col<=7)continue;
  const w=row===4&&col===3?.455:.086,x=row===4&&col===3?-.115:-.6+col*.1;
  box(keyboard,[w,.025,.067],[x,.052,-.155+row*.078],white,.008);
  const geo=new THREE.PlaneGeometry(w*.9,.05);const uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++){uv.setXY(i,(col+uv.getX(i))/13,1-(row+1-uv.getY(i))/5);}
  const label=mesh(keyboard,geo,legendMat,[x,.0651,-.155+row*.078]);label.rotation.x=-Math.PI/2;
 }
 box(group,[.48,.018,.36],[1.14,1.43,.53],silver,.018);box(group,[.46,.004,.34],[1.14,1.441,.53],white,.015);
 const mouse=mesh(group,new THREE.SphereGeometry(1,40,24),white,[1.68,1.45,.53]);mouse.scale.set(.095,.055,.15);rod(group,[1.68,1.502,.42],[1.68,1.506,.52],.002,dark);
 const tablet=new THREE.Group();tablet.position.set(.06,1.73,.08);tablet.rotation.x=-.18;group.add(tablet);box(tablet,[.9,.56,.028],[0,0,0],silver,.023);box(tablet,[.884,.544,.01],[0,0,.018],black,.02);mesh(tablet,new THREE.PlaneGeometry(.83,.49),displayMat,[0,0,.024]);
 const phone=new THREE.Group();phone.position.set(1.17,1.66,.09);phone.rotation.x=-.2;group.add(phone);box(phone,[.23,.45,.03],[0,0,0],silver,.025);box(phone,[.216,.436,.006],[0,0,.019],black,.022);mesh(phone,new THREE.PlaneGeometry(.195,.4),displayMat,[0,0,.023]);box(phone,[.07,.013,.004],[0,.19,.026],black,.006);
 // Cable curves and tidy clips at the rear of the real desk.
 for(let i=0;i<3;i++) {const path=new THREE.CatmullRomCurve3([new THREE.Vector3(.1+i*.1,2,-.55),new THREE.Vector3(.1+i*.1,1.5,-.75),new THREE.Vector3(.8+i*.15,1.1,-.8),new THREE.Vector3(1.85,1.05,-.7)]);mesh(group,new THREE.TubeGeometry(path,32,.008,6,false),rubber,[0,0,0]);}
 return {group,dispose(){laptop.dispose();resources.forEach(r=>r.dispose());}};
}
export function createChair(){
 const group=new THREE.Group(),resources=new Set<THREE.BufferGeometry|THREE.Material|THREE.Texture>();const own=<T extends THREE.BufferGeometry|THREE.Material|THREE.Texture>(o:T):T=>{resources.add(o);return o;};
 const dark=own(new THREE.MeshStandardMaterial({color:'#373b40',roughness:.68})),silver=own(new THREE.MeshStandardMaterial({color:'#b7bec4',metalness:.8,roughness:.3}));
 function obj(geo:THREE.BufferGeometry,mat:THREE.Material,p:V){const o=new THREE.Mesh(own(geo),mat);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function rod(a:V,b:V,r:number,mat=dark){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),m=obj(new THREE.CylinderGeometry(r,r,va.distanceTo(vb),16),mat,[0,0,0]);m.position.copy(va.clone().add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());}
 obj(new RoundedBoxGeometry(.89,.15,.84,5,.073),dark,[0,.79,.03]);rod([0,.12,0],[0,.74,0],.045,silver);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.sin(a)*.58,z=Math.cos(a)*.58;rod([0,.22,0],[x,.13,z],.029,silver);for(const dx of [-.045,.045]){const wheel=obj(new THREE.CylinderGeometry(.075,.075,.055,28),dark,[x+dx,.075,z]);wheel.rotation.z=Math.PI/2;}}
 const rimPoints=[[-.38,.89,-.35],[-.43,1.25,-.44],[-.39,1.68,-.49],[0,1.76,-.49],[.39,1.68,-.49],[.43,1.25,-.44],[.38,.89,-.35],[0,.87,-.35]].map(p=>new THREE.Vector3(...p as V));
 obj(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),100,.028,10,true),dark,[0,0,0]);
 // Fine woven ergonomic mesh; open cells remain geometry, visible from the back.
 for(let i=0;i<24;i++){const x=-.36+i*.0313;rod([x,.93,-.36],[x,1.68,-.48],.004,dark);}
 for(let i=0;i<31;i++){const t=i/30;rod([-.38,.93+t*.75,-.36-t*.12],[.38,.93+t*.75,-.36-t*.12],.003,dark);}
 for(const x of [-.52,.52]){rod([x*.8,.72,-.2],[x,1.14,.03],.025,silver);obj(new RoundedBoxGeometry(.14,.065,.46,4,.03),dark,[x,1.16,.05]);}
 rod([0,.7,-.15],[0,1.4,-.55],.04,dark);obj(new RoundedBoxGeometry(.45,.12,.1,4,.04),dark,[0,1.13,-.45]);
 return {group,dispose(){resources.forEach(r=>r.dispose());}};
}
