import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type V = [number, number, number];
/** Original geometry based on the A7 IV's product proportions, not an official Sony asset. */
export function createFilming() {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const camera = new THREE.Group(); camera.name = 'Sony A7 IV inspired camera and professional tripod';
  const lamp = new THREE.Group(); lamp.name = 'Octagonal softbox and telescopic light stand';
  function material(color: string, roughness = .5, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.add(m); return m;
  }
  const charcoal = material('#24262a', .56, .12);
  const rubber = material('#101214', .9);
  const graphite = material('#373a3e', .38, .55);
  const edge = material('#5b5d60', .3, .75);
  const steel = material('#b4b7ba', .27, .88);
  const black = material('#07090c', .35);
  const white = material('#ebebe7', .6);
  const red = material('#b84a42', .45);
  const warm = material('#b17b54', .3, .7);
  const diffuser = material('#fffef6', .95); diffuser.emissive.set('#f7f4e8'); diffuser.emissiveIntensity = .12;
  // A subtle generated roughness surface gives rubberized grips a finer visual scale.
  const grainCanvas = document.createElement('canvas'); grainCanvas.width = grainCanvas.height = 128;
  const grainContext = grainCanvas.getContext('2d')!;
  const grain = grainContext.createImageData(128, 128);
  for (let i=0; i<grain.data.length; i+=4) { const n=144+Math.floor((Math.sin(i*12.9898)*43758.5453%1)*25); grain.data[i]=grain.data[i+1]=grain.data[i+2]=n; grain.data[i+3]=255; }
  grainContext.putImageData(grain,0,0);
  const grainMap = new THREE.CanvasTexture(grainCanvas); grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping; grainMap.repeat.set(4,4); textures.add(grainMap);
  rubber.bumpMap=grainMap; rubber.bumpScale=.0009;
  function mesh(parent:THREE.Object3D, geo:THREE.BufferGeometry, mat:THREE.Material, p:V=[0,0,0]) {
    geometries.add(geo); const obj=new THREE.Mesh(geo,mat); obj.position.set(...p); obj.castShadow=true; obj.receiveShadow=true; parent.add(obj); return obj;
  }
  function group(parent:THREE.Object3D,p:V=[0,0,0],name='') { const g=new THREE.Group();g.position.set(...p);g.name=name;parent.add(g);return g; }
  function box(parent:THREE.Object3D, size:V, p:V, mat=charcoal, r=.008) { return mesh(parent,new RoundedBoxGeometry(...size,3,Math.min(r,Math.min(...size)*.45)),mat,p); }
  function rod(parent:THREE.Object3D,a:V,b:V,r:number,mat=graphite,rt=r,segments=16) {
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);
    const m=mesh(parent,new THREE.CylinderGeometry(rt,r,va.distanceTo(vb),segments),mat);
    m.position.copy(va.clone().add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());return m;
  }
  function cyl(parent:THREE.Object3D, r:number, depth:number, p:V, mat=charcoal, axis:'x'|'y'|'z'='y',rt=r,segments=48) {
    const m=mesh(parent,new THREE.CylinderGeometry(rt,r,depth,segments),mat,p);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;
  }
  function torus(parent:THREE.Object3D,r:number,tube:number,p:V,mat=edge,axis:'x'|'y'|'z'='z') {
    const m=mesh(parent,new THREE.TorusGeometry(r,tube,8,64),mat,p); if(axis==='y')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.y=Math.PI/2;return m;
  }
  function path(parent:THREE.Object3D, pts:V[], radius:number, mat=graphite, closed=false) {
    return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),closed),Math.max(20,pts.length*8),radius,7,closed),mat);
  }
  function labels(parent:THREE.Object3D,w:number,h:number,p:V,lines:{text:string;x:number;y:number;size:number;color?:string;font?:string}[],flip=false,bg?:string) {
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d')!;
    if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}
    for(const l of lines){ctx.fillStyle=l.color||'#efefeb';ctx.font=`${l.font||'500'} ${l.size}px Arial`;ctx.textBaseline='middle';ctx.fillText(l.text,l.x,l.y);}
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    const mat=new THREE.MeshBasicMaterial({map:texture,transparent:!bg,depthWrite:!!bg,polygonOffset:true,polygonOffsetFactor:-1});materials.add(mat);
    const m=mesh(parent,new THREE.PlaneGeometry(w,h),mat,p);if(flip)m.rotation.y=Math.PI;return m;
  }
  function knurl(parent:THREE.Object3D,r:number,length:number,p:V,count=48,axis:'y'|'z'='z',mat=graphite) {
    const geo=new THREE.BoxGeometry(.004,length,.004);geometries.add(geo);
    const ins=new THREE.InstancedMesh(geo,mat,count);const dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){const a=i/count*Math.PI*2;dummy.position.set(Math.cos(a)*r,0,Math.sin(a)*r);dummy.rotation.set(0,-a,0);dummy.updateMatrix();ins.setMatrixAt(i,dummy.matrix);}
    if(axis==='z')ins.rotation.x=Math.PI/2;ins.position.set(...p);ins.castShadow=true;parent.add(ins);return ins;
  }
  function screw(parent:THREE.Object3D,p:V,axis:'x'|'y'|'z'='z',r=.007) {
    const g=group(parent,p);if(axis==='x')g.rotation.y=Math.PI/2;if(axis==='y')g.rotation.x=-Math.PI/2;
    cyl(g,r,.003,[0,0,0],steel,'z',r,12);
    box(g,[r*1.15,.0013,.001],[0,0,.002],black,.0002);
    box(g,[.0013,r*1.15,.001],[0,0,.002],black,.0002);return g;
  }

  // Body follows Sony's 131.3 × 96.4 × 79.8 mm envelope (scaled for the scene).
  const body=group(camera,[0,2.2,0],'A7 IV camera body');
  box(body,[.52,.305,.19],[-.013,0,.02],charcoal,.033);
  box(body,[.516,.025,.19],[-.012,-.15,.019],graphite,.01);
  // Stepped shoulder deck, deep hand grip, and softly rounded rubber front panel.
  box(body,[.19,.065,.2],[-.168,.158,.013],charcoal,.018);
  box(body,[.175,.065,.22],[.178,.147,-.003],charcoal,.024);
  const gripOutline=new THREE.Shape();gripOutline.moveTo(.132,.105);gripOutline.bezierCurveTo(.15,.153,.248,.157,.273,.107);gripOutline.bezierCurveTo(.29,.02,.275,-.133,.249,-.152);gripOutline.quadraticCurveTo(.206,-.171,.166,-.145);gripOutline.quadraticCurveTo(.14,-.1,.148,-.023);gripOutline.quadraticCurveTo(.163,.045,.132,.105);
  const grip=mesh(body,new THREE.ExtrudeGeometry(gripOutline,{depth:.165,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.015,bevelThickness:.015,curveSegments:20}),rubber,[0,0,-.187]);
  grip.name='Contoured rubber finger grip';
  path(body,[[.16,-.138,-.199],[.195,-.151,-.203],[.242,-.14,-.2],[.263,-.03,-.2],[.25,.095,-.2],[.219,.118,-.203]],.0023,graphite);
  // EVF housing uses a tapered front profile rather than a box perched on the body.
  const evfOutline=new THREE.Shape();evfOutline.moveTo(-.104,.128);evfOutline.lineTo(-.077,.223);evfOutline.quadraticCurveTo(0,.244,.077,.223);evfOutline.lineTo(.105,.128);evfOutline.closePath();
  mesh(body,new THREE.ExtrudeGeometry(evfOutline,{depth:.19,bevelEnabled:true,bevelSegments:3,bevelThickness:.007,bevelSize:.007,curveSegments:12}),charcoal,[0,0,-.09]);
  box(body,[.143,.091,.05],[0,.186,.133],rubber,.025);
  box(body,[.102,.054,.009],[0,.186,.162],black,.011);
  box(body,[.073,.035,.006],[0,.186,.168],material('#243035',.15,.45),.006);
  box(body,[.104,.01,.09],[0,.248,.005],black,.002);
  for(const x of [-.05,.05])box(body,[.012,.014,.097],[x,.251,.005],steel,.002);
  for(let i=0;i<7;i++)box(body,[.007,.004,.025],[-.032+i*.01,.252,-.021],warm,.001);
  labels(body,.12,.031,[0,.181,-.1],[{text:'SONY',x:70,y:120,size:195,font:'700'}],true);
  labels(body,.082,.052,[-.193,.065,-.082],[{text:'α',x:80,y:190,size:400},{text:'7 IV',x:410,y:400,size:230}],true);
  // Machined bayonet, nested zoom sections, rubber focus and zoom rings.
  const lens=group(body,[-.034,-.018,-.092],'Zoom lens');
  const segments:[number,number,number,THREE.MeshStandardMaterial][]=[
    [.129,.015,-.008,steel],[.126,.012,-.021,warm],[.135,.042,-.048,charcoal],
    [.137,.06,-.094,graphite],[.141,.093,-.169,rubber],[.133,.022,-.226,charcoal],
    [.126,.08,-.275,charcoal],[.128,.055,-.337,rubber],[.124,.024,-.377,graphite],
  ];
  for(const [r,d,z,m]of segments)cyl(lens,r,d,[0,0,z],m,'z');
  for(const z of [-.121,-.216,-.311,-.364])torus(lens,.133,.0025,[0,0,z],edge);
  knurl(lens,.142,.079,[0,0,-.169],72,'z',charcoal);
  knurl(lens,.129,.045,[0,0,-.337],64,'z',charcoal);
  cyl(lens,.114,.007,[0,0,-.391],black,'z');
  torus(lens,.114,.008,[0,0,-.397],rubber);
  torus(lens,.099,.002,[0,0,-.4],steel);
  const glass=material('#233238',.13,.58); glass.transparent=true;glass.opacity=.88;
  cyl(lens,.097,.006,[0,0,-.404],glass,'z');
  cyl(lens,.076,.003,[0,0,-.407],material('#182328',.16,.48),'z');
  cyl(lens,.049,.003,[0,0,-.41],black,'z',.049,9);
  const glint=material('#728789',.11,.4);glint.transparent=true;glint.opacity=.55;
  const glintShape=new THREE.Shape();glintShape.moveTo(-.054,.035);glintShape.quadraticCurveTo(-.03,.073,.009,.066);glintShape.quadraticCurveTo(-.014,.036,-.054,.035);
  const highlight=mesh(lens,new THREE.ShapeGeometry(glintShape,24),glint,[0,0,-.414]);highlight.rotation.y=Math.PI;
  // Lens switches, focal marks and a distinct raised focus index.
  box(lens,[.026,.063,.045],[.131,0,-.27],graphite,.005);
  for(const y of [-.017,.016])box(lens,[.009,.014,.022],[.148,y,-.27],black,.002);
  labels(lens,.13,.024,[0,.13,-.07],[{text:'FE  /  G',x:40,y:90,size:125,font:'700'}]);
  const focal=labels(lens,.15,.022,[0,.137,-.21],[{text:'24   35   50   70  105',x:15,y:65,size:76}]);focal.rotation.x=-Math.PI/2;
  box(lens,[.007,.005,.012],[0,.14,-.224],white,.001);
  // Control wheels and movie switch carry real ridged edges.
  for(const [x,z,r]of [[.125,.015,.048],[.222,.05,.039],[-.17,.035,.034]]){
    cyl(body,r,.018,[x,.195,z],black);knurl(body,r,.015,[x,.195,z],32,'y',edge);
    cyl(body,r*.82,.002,[x,.206,z],charcoal);
  }
  const mode=labels(body,.076,.076,[.125,.208,.015],[{text:'M',x:90,y:200,size:240},{text:'A',x:640,y:190,size:200},{text:'S',x:680,y:700,size:200},{text:'P',x:100,y:730,size:200}]);mode.rotation.x=-Math.PI/2;
  cyl(body,.034,.023,[.213,.157,-.131],steel);
  cyl(body,.025,.006,[.213,.172,-.131],black);
  cyl(body,.015,.008,[.187,.192,-.05],red);
  for(const x of [.06,.236])box(body,[.029,.013,.024],[x,.185,-.048],rubber,.008);
  // Strap lugs are open metal loops on both shoulders.
  for(const s of [-1,1]){const loop=torus(body,.021,.004,[s*.276,.114,.027],steel,'x');loop.scale.y=.74;box(body,[.015,.036,.033],[s*.267,.112,.027],graphite,.004);}
  // Articulated rear LCD with its hinge and an off-axis screen surround.
  const lcd=group(body,[-.097,-.013,.133],'Vari-angle LCD');lcd.rotation.y=-.08;
  box(lcd,[.294,.207,.021],[0,0,0],rubber,.015);
  box(lcd,[.268,.178,.004],[0,.004,.014],black,.006);
  labels(lcd,.25,.155,[0,.006,.017],[
    {text:'● REC',x:40,y:65,size:47,color:'#d26455',font:'700'},
    {text:'4K 25p',x:690,y:65,size:42},{text:'1/50    F2.8    ISO 400',x:45,y:568,size:42},
    {text:'┌',x:280,y:200,size:120},{text:'┐',x:630,y:200,size:120},
    {text:'└',x:280,y:395,size:120},{text:'┘',x:630,y:395,size:120},
  ],false,'#303837');
  labels(lcd,.087,.014,[0,-.092,.015],[{text:'SONY',x:220,y:75,size:140,font:'700'}]);
  cyl(body,.014,.155,[-.256,-.01,.126],edge,'y');
  for(const y of [-.074,.057])cyl(body,.017,.018,[-.256,y,.126],charcoal,'y');
  const backWheel=group(body,[.178,-.042,.126]);cyl(backWheel,.049,.008,[0,0,0],rubber,'z');knurl(backWheel,.049,.009,[0,0,0],32);torus(backWheel,.038,.002,[0,0,.006],edge);cyl(backWheel,.018,.012,[0,0,.006],graphite,'z');
  for(const [x,y]of [[.165,.08],[.211,.099],[.232,.011],[.129,-.117],[.223,-.115],[-.204,.117]]){cyl(body,.013,.007,[x,y,.126],rubber,'z');}
  labels(body,.11,.065,[.17,-.095,.134],[{text:'Fn',x:70,y:120,size:190},{text:'▶',x:650,y:430,size:140}]);
  box(body,[.042,.011,.007],[.165,.117,.128],graphite,.004);
  for(const p of [[-.229,-.125,.122],[.244,-.136,.124],[-.227,.084,-.079],[.124,-.139,-.085]]as V[])screw(body,p);
  // Side connector cover outlines and small hinge ribs are visible from an orbit.
  box(body,[.008,.173,.119],[-.278,-.033,.013],rubber,.005);
  for(const y of [-.072,-.005,.061])box(body,[.01,.002,.104],[-.283,y,.013],graphite,.001);

  // A complete three-section tripod: cast spider, hinges, carbon tubes, clamps, struts and feet.
  cyl(camera,.083,.09,[0,1.67,0],graphite);
  cyl(camera,.048,.35,[0,1.745,0],graphite);
  knurl(camera,.052,.05,[0,1.71,0],32,'y');
  cyl(camera,.067,.035,[0,1.915,0],black);
  const ball=mesh(camera,new THREE.SphereGeometry(.055,24,16),steel,[0,1.957,0]);ball.scale.y=.92;
  cyl(camera,.034,.055,[0,1.984,0],graphite);
  box(camera,[.19,.027,.14],[0,2.009,0],black,.008);
  box(camera,[.175,.014,.13],[0,2.029,0],graphite,.004);
  for(const x of [-.075,.075])box(camera,[.012,.012,.133],[x,2.043,0],steel,.002);
  cyl(camera,.032,.056,[.087,1.924,0],rubber,'x');knurl(camera,.032,.05,[.087,1.924,0],24,'z').rotation.set(0,0,Math.PI/2);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3+.15; const outward=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    const start=new THREE.Vector3().copy(outward).multiplyScalar(.065).setY(1.67);
    const foot=new THREE.Vector3().copy(outward).multiplyScalar(.71).setY(.055);
    const point=(t:number):V=>start.clone().lerp(foot,t).toArray() as V;
    const leg=group(camera,[0,0,0],`Tripod leg ${i+1}`);
    rod(leg,point(0),point(.44),.035,graphite,.038,20);
    rod(leg,point(.43),point(.74),.028,edge,.03,20);
    rod(leg,point(.73),point(1),.022,graphite,.025,20);
    // Fine longitudinal weave strokes catch light without an oversized outline.
    for(const offset of [-.014,.014]){
      const p1=new THREE.Vector3(...point(.04));const p2=new THREE.Vector3(...point(.42));const tangent=new THREE.Vector3(Math.cos(a),0,-Math.sin(a)).multiplyScalar(offset);
      p1.add(tangent);p2.add(tangent);rod(leg,p1.toArray() as V,p2.toArray() as V,.0012,edge,.0012,5);
    }
    const hinge=group(leg,point(.015));hinge.rotation.y=a;
    box(hinge,[.088,.085,.09],[0,0,0],graphite,.012);screw(hinge,[.047,0,0],'x',.014);screw(hinge,[-.047,0,0],'x',.014);
    for(const t of [.435,.735]){
      const collar=group(leg,point(t));collar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),foot.clone().sub(start).normalize());
      cyl(collar,t<.5?.043:.036,.052,[0,0,0],rubber);knurl(collar,t<.5?.044:.037,.04,[0,0,0],24,'y');
      const clip=box(collar,[.055,.039,.018],[0,0,.038],black,.007);clip.rotation.x=.12;screw(collar,[0,0,.049],'z',.005);
    }
    rod(leg,[0,.88,0],point(.58),.012,graphite,.012,10);
    const footObj=mesh(leg,new THREE.SphereGeometry(1,18,12),rubber,point(1));footObj.scale.set(.052,.035,.068);footObj.rotation.y=a;
    rod(leg,point(.95),point(1),.031,rubber,.028);
  }
  cyl(camera,.052,.065,[0,.88,0],black);
  path(camera,[[0,1.5,0],[0,1.4,0],[.035,1.36,0],[.047,1.4,0]],.008,steel);
  labels(camera,.1,.035,[0,1.788,.05],[{text:'PRO',x:30,y:150,size:250,font:'700'}]);

  // Octagonal fabric light modifier with tapered shell, sewn ribs and inset diffusion panel.
  const softbox=group(lamp,[0,2.74,0],'Deep octagonal softbox');softbox.rotation.x=-.16;
  const shellMat=material('#24262a',.94);const seamMat=material('#44464a',.8);
  const front:V[]=[],back:V[]=[];
  for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;front.push([Math.cos(a)*.64,Math.sin(a)*.64,.15]);back.push([Math.cos(a)*.18,Math.sin(a)*.18,-.47]);}
  const vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<8;i++){const j=(i+1)%8; const base=vertices.length/3;vertices.push(...back[i],...back[j],...front[j],...front[i]);indices.push(base,base+1,base+2,base,base+2,base+3);}
  const shellGeo=new THREE.BufferGeometry();shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));shellGeo.setIndex(indices);shellGeo.computeVertexNormals();shellMat.side=THREE.DoubleSide;mesh(softbox,shellGeo,shellMat);
  const diffuserShape=new THREE.Shape();front.forEach((p,i)=>i?diffuserShape.lineTo(p[0]*.968,p[1]*.968):diffuserShape.moveTo(p[0]*.968,p[1]*.968));diffuserShape.closePath();
  const diffuseMesh=mesh(softbox,new THREE.ShapeGeometry(diffuserShape),diffuser,[0,0,.157]);diffuseMesh.castShadow=false;
  // True fabric lip and subtly inset diffuser seam, with eight physical rod ribs.
  for(let i=0;i<8;i++){
    const j=(i+1)%8;rod(softbox,front[i],front[j],.014,rubber,.014,10);
    const a=front[i],b=back[i];const mid:V=[a[0]*.59,a[1]*.59,-.19];path(softbox,[b,mid,a],.0055,seamMat);
    const si:V=[front[i][0]*.975,front[i][1]*.975,.163],sj:V=[front[j][0]*.975,front[j][1]*.975,.163];rod(softbox,si,sj,.0025,white,.0025,6);
  }
  cyl(softbox,.181,.025,[0,0,-.485],graphite,'z',.181,16);
  for(let i=0;i<8;i++){const a=i*Math.PI/4; screw(softbox,[Math.cos(a)*.15,Math.sin(a)*.15,-.501],'z',.006);}
  const flash=group(softbox,[0,0,-.64],'Studio LED body');
  box(flash,[.28,.3,.31],[0,0,0],charcoal,.035);
  for(let i=0;i<9;i++)box(flash,[.005,.21,.012],[-.108+i*.027,0,-.16],black,.001);
  cyl(flash,.038,.014,[.078,-.088,-.17],rubber,'z');
  labels(flash,.11,.058,[-.045,.07,-.162],[{text:'100%',x:50,y:210,size:260}],true,'#d9ddce');
  // U-yoke, toothed swivel and tilt locking knob.
  for(const x of [-.187,.187]){rod(softbox,[x,-.27,-.62],[x,.02,-.62],.019,graphite);cyl(softbox,.05,.045,[x,.01,-.62],black,'x');}
  rod(softbox,[-.187,-.27,-.62],[.187,-.27,-.62],.02,graphite);
  cyl(softbox,.051,.055,[.229,.01,-.62],rubber,'x');
  const mount=group(lamp,[0,2.36,-.6]);cyl(mount,.055,.14,[0,0,0],graphite);screw(mount,[.056,0,0],'x',.015);
  // Studio stand with three nested tubes, oversized collars and welded leg braces.
  rod(lamp,[0,.12,-.6],[0,1.15,-.6],.038,graphite);
  rod(lamp,[0,1.12,-.6],[0,1.88,-.6],.029,edge);
  rod(lamp,[0,1.84,-.6],[0,2.38,-.6],.021,steel);
  for(const y of [1.1,1.83]){cyl(lamp,.05,.084,[0,y,-.6],rubber);rod(lamp,[.025,y,-.6],[.091,y,-.6],.014,steel);const knob=box(lamp,[.033,.073,.05],[.1,y,-.6],black,.012);knob.rotation.x=.2;}
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;const bottom:V=[Math.sin(a)*.68,.047,Math.cos(a)*.68-.6];
    rod(lamp,[Math.sin(a)*.035,.51,Math.cos(a)*.035-.6],bottom,.027,graphite);
    rod(lamp,[0,.2,-.6],[bottom[0]*.64,.23,(bottom[2]+.6)*.64-.6],.014,edge);
    const foot=box(lamp,[.074,.047,.105],bottom,rubber,.02);foot.rotation.y=a;
    screw(lamp,[Math.sin(a)*.046,.48,Math.cos(a)*.046-.6],'x',.011);
  }
  cyl(lamp,.075,.096,[0,.48,-.6],black);cyl(lamp,.065,.055,[0,.2,-.6],graphite);
  path(lamp,[[.1,2.65,-.76],[.17,2.25,-.72],[.13,1.55,-.65],[.17,.65,-.6],[.32,.06,-.56],[.56,.025,-.32],[.9,.025,-.5]],.009,rubber);
  // Cable ties are small physical loops around the stand.
  for(const y of [.77,1.51,2.1])torus(lamp,.045,.003,[0,y,-.6],black,'y');
  camera.updateMatrixWorld(true);lamp.updateMatrixWorld(true);
  return { camera, lamp, diffuser, dispose() { geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose()); } };
}
