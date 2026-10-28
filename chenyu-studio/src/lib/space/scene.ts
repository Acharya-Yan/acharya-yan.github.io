import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createAvatar } from './avatar';
import { createWorkstation, createChair } from './workstation';
import { createFilming } from './filming';

export type Target = 'about' | 'work' | 'notes';
export type View = 'orbit' | 'camera' | 'desk';
type Point = [number, number, number];
export interface SpaceAPI {
  focus: (target: Target) => void;
  view: (view: View) => void;
  rotate: (amount: number) => void;
  zoom: (amount: number) => void;
  light: (on: boolean) => void;
  tour: (on: boolean) => void;
  dispose: () => void;
}
export function createSpace(host: HTMLElement, events: {
  select: (id: Target) => void;
  hover: (id: Target | null) => void;
  angle: (degrees: number) => void;
  interact: () => void;
  fail: () => void;
}): SpaceAPI {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f5f1');
  scene.fog = new THREE.Fog('#f5f5f1', 20, 42);
  const camera = new THREE.PerspectiveCamera(40, 1, .06, 65);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const studioEnvironment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studioEnvironment, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  studioEnvironment.dispose(); pmrem.dispose();
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const occlusion = new GTAOPass(scene, camera, 512, 512);
  occlusion.updateGtaoMaterial({ radius: .26, thickness: .7, samples: 8, scale: .8 });
  occlusion.blendIntensity = .45;
  const outputPass = new OutputPass();
  composer.addPass(renderPass); composer.addPass(occlusion); composer.addPass(outputPass);
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', '可环绕的三维工作室。拖动旋转，滚轮缩放；也可使用页面底部的键盘可达控制按钮。');
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .065;
  controls.enablePan = false;
  controls.minDistance = 1.2;
  controls.maxDistance = 17;
  controls.minPolarAngle = .28;
  controls.maxPolarAngle = Math.PI / 2 - .025;
  controls.rotateSpeed = .65;
  controls.zoomSpeed = .7;
  controls.autoRotateSpeed = .45;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const ink = '#2b2b2b';
  const lineMaterial = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: .8 });
  materials.add(lineMaterial);
  const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: ink, side: THREE.BackSide });
  materials.add(silhouetteMaterial);
  function silhouette(obj: THREE.Mesh) {
    const shell = new THREE.Mesh(obj.geometry, silhouetteMaterial);
    shell.scale.setScalar(1.014);
    shell.raycast = () => {};
    obj.add(shell);
  }
  const white = material('#fafaf6');
  const dark = material('#292a2c');
  const pale = material('#deded7');
  function material(color: string) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0 });
    materials.add(m); return m;
  }
  function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: Point, outline = true) {
    geometries.add(geo);
    const obj = new THREE.Mesh(geo, mat); obj.position.set(...pos);
    obj.castShadow = true; obj.receiveShadow = true; parent.add(obj);
    if (outline && geo.type === 'RoundedBoxGeometry') {
      silhouette(obj);
    } else if (outline) {
      const edge = new THREE.EdgesGeometry(geo, 28); geometries.add(edge);
      obj.add(new THREE.LineSegments(edge, lineMaterial));
    }
    return obj;
  }
  function box(parent: THREE.Object3D, size: Point, pos: Point, mat: THREE.Material = white, radius = 0) {
    return mesh(parent, radius ? new RoundedBoxGeometry(...size, 3, radius) : new THREE.BoxGeometry(...size), mat, pos);
  }
  function ball(parent: THREE.Object3D, pos: Point, scale: Point, mat = white) {
    const obj = mesh(parent, new THREE.SphereGeometry(1, 24, 16), mat, pos, false); obj.scale.set(...scale); silhouette(obj); return obj;
  }
  function rod(parent: THREE.Object3D, from: Point, to: Point, radius = .025, mat = dark) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const obj = mesh(parent, new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 12), mat, [0,0,0], false);
    obj.position.copy(a.clone().add(b).multiplyScalar(.5)); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), b.sub(a).normalize()); return obj;
  }
  function group(pos: Point, parent: THREE.Object3D = scene) { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; }
  function tag(g: THREE.Object3D, id: Target) {
    g.traverse(o => { if (o instanceof THREE.Mesh) o.userData.target = id; });
  }
  function textTexture(title: string, subtitle: string, type: 'screen' | 'poster' = 'screen') {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#f4f4ee'; ctx.fillRect(0,0,1024,640);
    ctx.fillStyle = '#272925'; ctx.font = '18px sans-serif'; ctx.fillText('CHENYU YAN / STUDIO', 58, 62);
    ctx.strokeStyle = '#b5b7aa'; ctx.beginPath(); ctx.moveTo(58,90); ctx.lineTo(966,90); ctx.stroke();
    ctx.font = type === 'screen' ? '94px Georgia' : '110px Georgia'; ctx.fillText(title, 58, 258);
    ctx.font = '26px sans-serif'; ctx.fillText(subtitle, 62, 318);
    ctx.strokeStyle = '#30332b'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.strokeRect(62+i*306,390,278,140); ctx.font='italic 38px Georgia'; ctx.fillText(['Create.','Explore.','Repeat.'][i],80+i*306,475); }
    ctx.font='18px sans-serif';ctx.fillText('A SPACE FOR THINGS IN PROGRESS',62,590);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture); return texture;
  }
  scene.add(new THREE.HemisphereLight('#ffffff', '#c1c4c9', 1.15));
  const sun = new THREE.DirectionalLight('#fff9ee', 1.9); sun.position.set(-4,8,5); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-8; sun.shadow.camera.right=8; sun.shadow.camera.top=8; sun.shadow.camera.bottom=-8; sun.shadow.normalBias=.035; sun.shadow.bias=-.0002; sun.shadow.radius=4; scene.add(sun);
  const fill = new THREE.DirectionalLight('#e9f0ff', .7); fill.position.set(5,4,-2); scene.add(fill);
  box(scene,[11,.14,9],[0,-.12,0],material('#eeeeE8'),.035);
  // The cutaway walls disappear on the viewer's side so orbiting never hides the room.
  const wallMat = material('#f6f6f0');
  const rear = group([0,0,-4.35]); box(rear,[11,3.9,.12],[0,1.88,0],wallMat);
  const side = group([-5.42,0,0]); box(side,[.12,3.9,8.7],[0,1.88,0],wallMat);
  const sideRight = group([5.42,0,0]); box(sideRight,[.12,3.9,8.7],[0,1.88,0],wallMat);
  // Real floor seams, skirting, window and studio shelving establish depth from every angle.
  for (let z = -4; z < 4.4; z += .55) rod(scene,[-5.4,-.039,z],[5.4,-.039,z],.003, pale);
  box(rear,[10.9,.12,.04],[0,.05,.085],pale);
  const windowFrame = group([-5.3,2.3,-1],side); windowFrame.position.set(.1,2.25,-.5);
  box(windowFrame,[.06,2.3,2.8],[0,0,0],dark);
  box(windowFrame,[.08,2.17,2.66],[.04,0,0],material('#ffffff'));
  for(const z of [-.45,.45]) box(windowFrame,[.09,2.2,.035],[.09,0,z],pale);
  box(windowFrame,[.09,.035,2.7],[.09,.1,0],pale);
  box(windowFrame,[.32,.07,2.95],[.15,-1.18,0],white);
  const poster = group([2.7,2.55,.09],rear);
  box(poster,[1.18,1.48,.045],[0,0,0],dark);
  const posterMat = new THREE.MeshBasicMaterial({map:textTexture('Room to','make something.','poster')}); materials.add(posterMat);
  mesh(poster,new THREE.PlaneGeometry(1.1,1.4),posterMat,[0,0,.03],false);
  for (let i=0;i<3;i++) {
    box(rear,[1.8,.06,.44],[-3.1,.75+i*.63,.3],white);
    for (let j=0;j<5;j++) { const b=box(rear,[.12,.32+(j%3)*.07,.22],[-3.8+j*.18,.94+i*.63,.32],j%3===0?pale:white);b.rotation.z=j===4?-.13:0; }
  }
  // Detailed component models share the original desk layout and picking behavior.
  const workstation = createWorkstation(textTexture('Selected work','我的线上工作室 · 正在进行'),textTexture('Notebook','灵感与日常，慢慢写。'));
  workstation.group.position.set(0,0,-1.75);scene.add(workstation.group);
  const chair = createChair();chair.group.position.set(-.2,0,.03);scene.add(chair.group);
  const avatar = createAvatar();avatar.group.position.set(-.2,0,.12);scene.add(avatar.group);tag(avatar.group,'about');
  const filming = createFilming();filming.camera.position.set(.65,0,2.9);scene.add(filming.camera);
  filming.lamp.position.set(2.8,0,1.1);filming.lamp.rotation.y=-1.95;scene.add(filming.lamp);
  const studioLight = new THREE.PointLight('#ffffff', 3.5, 8, 2);studioLight.position.set(2.3,2.7,1.7);scene.add(studioLight);
  // A quiet plant and stool complete the invented room envelope, without claiming a measured room scan.
  const plant=group([-3.75,0,-2.6]);mesh(plant,new THREE.CylinderGeometry(.28,.22,.43,24),white,[0,.23,0]);
  for(let i=0;i<7;i++){const a=i*2.4; const end:Point=[Math.sin(a)*.36,.8+(i%3)*.22,Math.cos(a)*.32];rod(plant,[0,.4,0],end,.009,dark);const leaf=ball(plant,end,[.09,.22,.03],pale);leaf.rotation.set(.3,a,.45);}
  const stool=group([-3.45,0,1.6]);mesh(stool,new THREE.CylinderGeometry(.4,.4,.08,32),white,[0,.7,0]);
  for(const [x,z] of [[-.25,-.25],[.25,-.25],[.25,.25],[-.25,.25]])rod(stool,[x,.67,z],[x*1.3,.02,z*1.3],.025,pale);
  box(stool,[.4,.04,.29],[0,.76,0],pale);box(stool,[.36,.025,.26],[.02,.79,.01],white);

  const presets: Record<View,{position: Point;target: Point}> = {
    orbit:{position:[5.6,3.8,8.1],target:[0,1.25,-.55]},
    camera:{position:[.45,2.17,2.25],target:[-.2,1.96,.1]},
    desk:{position:[2.9,3.5,2.25],target:[.05,1.9,-1.7]},
  };
  camera.position.set(...presets.orbit.position);controls.target.set(...presets.orbit.target);controls.update();
  let transition: {from:THREE.Vector3;to:THREE.Vector3;startTarget:THREE.Vector3;endTarget:THREE.Vector3;start:number} | null=null;
  function move(position:Point,target:Point) {
    controls.autoRotate=false;
    if(reduced.matches){camera.position.set(...position);controls.target.set(...target);controls.update();return;}
    transition={from:camera.position.clone(),to:new THREE.Vector3(...position),startTarget:controls.target.clone(),endTarget:new THREE.Vector3(...target),start:performance.now()};
  }
  const selectPositions:Record<Target,{position:Point;target:Point}>={about:{position:[1.7,2.7,4.1],target:[-.2,1.65,.05]},work:{position:[1.2,2.85,.75],target:[.2,2.25,-2.02]},notes:{position:[-3.1,2.9,.25],target:[-1.65,2.05,-1.95]}};
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down={x:0,y:0};let dragged=false;let hover:Target|null=null;
  function hit(e:PointerEvent) {
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    // Test against visible geometry so objects cannot be selected through a desk or wall.
    const hits=raycaster.intersectObjects(scene.children,true);
    for(const hit of hits){if(!(hit.object instanceof THREE.Mesh))continue;let ancestor:THREE.Object3D|null=hit.object;let visible=true;while(ancestor){if(!ancestor.visible)visible=false;ancestor=ancestor.parent;}if(!visible)continue;return (hit.object.userData.target as Target)||null;}return null;
  }
  function pointerDown(e:PointerEvent){down={x:e.clientX,y:e.clientY};dragged=false;transition=null;controls.autoRotate=false;events.interact();}
  function pointerMove(e:PointerEvent){if(e.buttons&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)dragged=true;const id=dragged?null:hit(e);if(id!==hover){hover=id;events.hover(id);renderer.domElement.style.cursor=id?'pointer':e.buttons?'grabbing':'grab';}}
  function pointerUp(e:PointerEvent){if(!dragged&&e.button===0){const id=hit(e);if(id)events.select(id);}dragged=false;}
  function pointerLeave(){hover=null;events.hover(null);}
  function wheel(){transition=null;controls.autoRotate=false;events.interact();}
  function lost(e:Event){e.preventDefault();events.fail();}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointerleave',pointerLeave);renderer.domElement.addEventListener('wheel',wheel,{passive:true});renderer.domElement.addEventListener('webglcontextlost',lost);
  const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(host);
  let frame=0,disposed=false,lastAngle=0;
  function draw(now:number){if(disposed)return;frame=requestAnimationFrame(draw);if(document.hidden)return;
    if(transition){const t=Math.min((now-transition.start)/1000,1),ease=1-Math.pow(1-t,4);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.startTarget,transition.endTarget,ease);if(t===1)transition=null;}
    controls.update();
    rear.visible=camera.position.z>-3.9;side.visible=camera.position.x>-4.9;sideRight.visible=camera.position.x<4.9;
    avatar.update(now,reduced.matches);
    if(now-lastAngle>120){lastAngle=now;events.angle(Math.round((THREE.MathUtils.radToDeg(controls.getAzimuthalAngle())+360)%360));}
    composer.render();
  }
  frame=requestAnimationFrame(draw);
  return {
    focus(id){const p=selectPositions[id];move(p.position,p.target);},
    view(v){const p=presets[v];move(p.position,p.target);},
    rotate(amount){transition=null;controls.autoRotate=false;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),amount);camera.position.copy(controls.target).add(offset);controls.update();},
    zoom(amount){transition=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*amount,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();},
    light(on){studioLight.intensity=on?3.5:0;filming.diffuser.emissiveIntensity=on?.28:0;filming.diffuser.color.set(on?'#ffffff':'#91938b');},
    tour(on){transition=null;controls.autoRotate=on;},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointerleave',pointerLeave);renderer.domElement.removeEventListener('wheel',wheel);renderer.domElement.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());workstation.dispose();chair.dispose();avatar.dispose();filming.dispose();environment.dispose();occlusion.dispose();outputPass.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
