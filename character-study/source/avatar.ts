import * as THREE from 'three';

type XYZ = [number, number, number];
type Ring = { y: number; x: number; z: number; offset?: number };

/** A bespoke, fully volumetric portrait-inspired seated character.
 * All surfaces, including the back of the head/clothing, are authored here.
 * No remote avatar service, portrait texture, billboard or generated likeness is used.
 */
export function createAvatar(): {
  group: THREE.Group;
  update: (time: number, reduced: boolean) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.name = 'Chenyu — sculpted seated character';
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const owned = <T extends THREE.Material>(mat: T): T => { materials.add(mat); return mat; };
  const cloth = owned(new THREE.MeshStandardMaterial({ color: '#ebe9e2', roughness: .91 }));
  const clothShadow = owned(new THREE.MeshStandardMaterial({ color: '#bfc0b8', roughness: .95 }));
  const pants = owned(new THREE.MeshStandardMaterial({ color: '#d6d8d2', roughness: .92 }));
  const stitch = owned(new THREE.MeshStandardMaterial({ color: '#b9bdb9', roughness: .87 }));
  const skin = owned(new THREE.MeshStandardMaterial({ color: '#e6cbb7', roughness: .76 }));
  const innerEar = owned(new THREE.MeshStandardMaterial({ color: '#cdbdb0', roughness: .84 }));
  const lip = owned(new THREE.MeshStandardMaterial({ color: '#ad8b80', roughness: .8 }));
  const ink = owned(new THREE.MeshStandardMaterial({ color: '#24262a', roughness: .7 }));
  const hair = owned(new THREE.MeshStandardMaterial({ color: '#171a20', roughness: .65 }));
  const hairRidge = owned(new THREE.MeshStandardMaterial({ color: '#292e36', roughness: .53 }));
  const hairFine = owned(new THREE.MeshStandardMaterial({ color: '#3b424a', roughness: .56 }));
  const sclera = owned(new THREE.MeshStandardMaterial({ color: '#fffefa', roughness: .45 }));
  const iris = owned(new THREE.MeshStandardMaterial({ color: '#45413d', roughness: .43 }));
  const highlight = owned(new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  const frame = owned(new THREE.MeshPhysicalMaterial({ color: '#cdd8d7', roughness: .28, metalness: .05, clearcoat: .8 }));
  const lens = owned(new THREE.MeshPhysicalMaterial({ color: '#f4ffff', roughness: .08, metalness: 0, transparent: true, opacity: .075, depthWrite: false, side: THREE.DoubleSide }));
  const sole = owned(new THREE.MeshStandardMaterial({ color: '#c8cbc7', roughness: .77 }));

  function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, position: XYZ = [0, 0, 0]) {
    geometries.add(geo);
    const obj = new THREE.Mesh(geo, mat);
    obj.position.set(...position); obj.castShadow = true; obj.receiveShadow = true;
    parent.add(obj); return obj;
  }
  function sub(parent: THREE.Object3D, position: XYZ = [0, 0, 0]) {
    const g = new THREE.Group(); g.position.set(...position); parent.add(g); return g;
  }
  function surface(parent: THREE.Object3D, rows: number, columns: number, at: (v: number, u: number) => XYZ, mat: THREE.Material, reverse = false) {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) {
      positions.push(...at(j / rows, i / columns)); uv.push(i / columns, j / rows);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i, b = a + columns + 1;
      if (reverse) indices.push(a, b, a + 1, b, b + 1, a + 1);
      else indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    return mesh(parent, geo, mat);
  }
  function curve(points: XYZ[], closed = false) { return new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'catmullrom', .48); }
  function line(parent: THREE.Object3D, points: XYZ[], radius = .003, mat: THREE.Material = stitch, closed = false, segments = 32) {
    return mesh(parent, new THREE.TubeGeometry(curve(points, closed), segments, radius, 10, closed), mat);
  }
  function ellipsoid(parent: THREE.Object3D, position: XYZ, scale: XYZ, mat: THREE.Material, width = 24, height = 16) {
    const obj = mesh(parent, new THREE.SphereGeometry(1, width, height), mat, position); obj.scale.set(...scale); return obj;
  }

  function interpolate(values: number[], t: number) {
    const f = Math.max(0, Math.min(1, t)) * (values.length - 1), i = Math.min(values.length - 2, Math.floor(f));
    const k=f-i, p0=values[Math.max(0,i-1)], p1=values[i], p2=values[i+1], p3=values[Math.min(values.length-1,i+2)];
    return .5*((2*p1)+(-p0+p2)*k+(2*p0-5*p1+4*p2-p3)*k*k+(-p0+3*p1-3*p2+p3)*k*k*k);
  }
  /** Closed elliptical sweep with independent width/thickness and stable transported frame. */
  function sweep(parent: THREE.Object3D, points: XYZ[], widths: number[], depths: number[], mat: THREE.Material, sections = 42, sides = 24, ridge = 0) {
    const path = curve(points), frames = path.computeFrenetFrames(sections, false);
    return surface(parent, sections, sides, (t, u) => {
      const n = Math.min(sections, Math.round(t * sections));
      const p = path.getPointAt(t), a = u * Math.PI * 2;
      const w = interpolate(widths, t), d = interpolate(depths, t);
      const ripple = 1 + ridge * Math.sin(a * 5 + t * 12) * Math.sin(t * Math.PI);
      p.addScaledVector(frames.normals[n], Math.cos(a) * w * ripple);
      p.addScaledVector(frames.binormals[n], Math.sin(a) * d * ripple);
      return [p.x, p.y, p.z];
    }, mat);
  }
  function rings(parent: THREE.Object3D, profile: Ring[], mat: THREE.Material, folds = 0) {
    const ys = profile.map(p => p.y), xs = profile.map(p => p.x), zs = profile.map(p => p.z), os = profile.map(p => p.offset ?? 0);
    return surface(parent, 42, 64, (v, u) => {
      const a = u * Math.PI * 2, x = interpolate(xs, v), z = interpolate(zs, v);
      const fold = 1 + folds * Math.sin(a * 6 + v * 17) * Math.sin(v * Math.PI) ** 2;
      return [Math.sin(a) * x * fold, interpolate(ys, v), Math.cos(a) * z * fold + interpolate(os, v)];
    }, mat);
  }

  // Relaxed seated tailoring: continuous thigh/knee/calf volumes and real fabric seams.
  for (const s of [-1, 1]) {
    sweep(group, [[s * .16, .91, -.055], [s * .22, .89, .25], [s * .25, .8, .53], [s * .27, .55, .62], [s * .27, .23, .67]],
      [.055, .185, .165, .14, .12, .112], [.06, .175, .16, .145, .13, .112], pants, 58, 32, .025);
    line(group, [[s * .35, .91, .12], [s * .4, .88, .32], [s * .4, .72, .53], [s * .39, .48, .62], [s * .38, .25, .68]], .0025);
    for (let i = 0; i < 3; i++) {
      const y = .82 - i * .034;
      line(group, [[s * .13, y + .025, .565], [s * .25, y, .675], [s * .36, y + .01, .59]], .0022, clothShadow);
    }
    const cuff = rings(group, [{ y: .227, x: .115, z: .115 }, { y: .245, x: .124, z: .122 }, { y: .293, x: .126, z: .122 }, { y: .3, x: .115, z: .115 }], pants);
    cuff.position.set(s * .27, 0, .67);
    const cuffSeam: XYZ[] = Array.from({ length: 33 }, (_, i) => [s * .27 + Math.sin(i / 32 * Math.PI * 2) * .125, .254, .67 + Math.cos(i / 32 * Math.PI * 2) * .124]);
    line(group, cuffSeam, .002, stitch, true);
    makeShoe(s * .27, s * -.055);
  }
  function makeShoe(x: number, yaw: number) {
    const shoe = sub(group, [x, .04, .74]); shoe.rotation.y = yaw;
    // Shoe cross sections produce a round toe, high tongue and narrow heel, not a box.
    const shoeSurface = (mat: THREE.Material, soleOnly = false) => surface(shoe, 36, 40, (t, u) => {
      const a = u * Math.PI * 2;
      const rx = interpolate([.025, .105, .125, .133, .129, .113, .015], t);
      const ry = soleOnly ? .024 : interpolate([.025, .085, .108, .092, .07, .048, .01], t);
      const y = soleOnly ? .023 : interpolate([.065, .115, .136, .12, .094, .075, .065], t);
      return [Math.cos(a) * rx, y + Math.sin(a) * ry, -.18 + t * .52];
    }, mat);
    shoeSurface(sole, true); shoeSurface(cloth);
    const soleEdge: XYZ[] = Array.from({ length: 49 }, (_, i) => {
      const a = i / 48 * Math.PI * 2; return [Math.sin(a) * .128 * (1 + .05 * Math.cos(a)), .048, .07 + Math.cos(a) * .25];
    }); line(shoe, soleEdge, .0034, stitch, true);
    line(shoe, [[-.115, .105, .14], [-.1, .14, .19], [0, .151, .23], [.1, .14, .19], [.115, .105, .14]], .003, clothShadow);
    for (const s of [-1, 1]) {
      line(shoe, [[s * .095, .135, -.11], [s * .106, .155, -.01], [s * .1, .128, .12], [s * .112, .08, .2]], .003, stitch);
      line(shoe, [[s * .115, .08, -.14], [s * .122, .095, -.04], [s * .125, .08, .08]], .0025, clothShadow);
    }
    for (let i = 0; i < 5; i++) {
      const z = -.065 + i * .043, y = .232 - i * .014;
      for (const s of [-1, 1]) ellipsoid(shoe, [s * .063, y - .007, z], [.011, .004, .009], stitch, 10, 8);
      line(shoe, [[-.065, y, z], [0, y + .005, z + .018], [.065, y, z + .024]], .006, cloth);
    }
    for (const s of [-1, 1]) line(shoe, [[0, .24, -.095], [s * .065, .256, -.112], [s * .052, .269, -.073], [0, .24, -.095]], .0048, cloth);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ellipsoid(shoe, [(j - 1) * .031, .143 - i * .009, .19 + i * .025], [.003, .0015, .003], stitch, 8, 6);
    line(shoe, [[-.045, .184, -.173], [0, .192, -.18], [.045, .184, -.173]], .009, clothShadow);
  }

  const upper = sub(group);
  rings(upper, [
    { y: .88, x: .25, z: .19, offset: .01 }, { y: .93, x: .325, z: .245 },
    { y: 1.06, x: .345, z: .25 }, { y: 1.24, x: .35, z: .235, offset: -.015 },
    { y: 1.42, x: .365, z: .23, offset: -.015 }, { y: 1.55, x: .37, z: .205, offset: -.02 },
    { y: 1.64, x: .27, z: .17, offset: -.015 }, { y: 1.71, x: .12, z: .105 },
    { y: 1.7, x: .04, z: .04 },
  ], cloth, .035);
  // Double-stitched lower ribbing and soft kangaroo-pocket edge.
  for (const y of [.945, .965]) {
    const pts: XYZ[] = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return [Math.sin(a) * .327, y, Math.cos(a) * .248]; });
    line(upper, pts, .0025, clothShadow, true);
  }
  line(upper, [[-.23, 1.19, .188], [-.18, 1.15, .242], [-.14, 1.065, .262], [0, 1.038, .266], [.14, 1.065, .262], [.18, 1.15, .242], [.23, 1.19, .188]], .004, clothShadow);
  line(upper, [[-.17, 1.17, .243], [0, 1.185, .25], [.17, 1.17, .243]], .002, stitch);
  for (const s of [-1, 1]) {
    line(upper, [[s * .12, 1.66, .1], [s * .21, 1.58, .163], [s * .29, 1.47, .159]], .003, clothShadow);
    line(upper, [[s * .27, 1.02, .15], [s * .31, 1.12, .139], [s * .32, 1.22, .13]], .003, clothShadow);
    const sleevePoints: XYZ[] = [[s * .29, 1.56, -.012], [s * .43, 1.43, .005], [s * .48, 1.21, .09], [s * .44, 1.115, .25], [s * .29, 1.075, .425]];
    sweep(upper, sleevePoints, [.07, .153, .15, .14, .12, .093], [.06, .15, .145, .13, .11, .09], cloth, 48, 28, .028);
    line(upper, [[s * .4, 1.49, .105], [s * .55, 1.27, .15], [s * .51, 1.15, .3], [s * .34, 1.1, .48]], .0025, clothShadow);
    for (let i = 0; i < 3; i++) line(upper, [[s * .44, 1.24 - i * .027, .24], [s * .5, 1.22 - i * .027, .205], [s * .55, 1.24 - i * .027, .13]], .0023, clothShadow);
    sweep(upper, [[s * .31, 1.08, .405], [s * .284, 1.064, .448]], [.098, .099, .087], [.095, .096, .083], clothShadow, 12, 24);
    makeHand(upper, [s * .278, 1.048, .477], s);
  }
  function makeHand(parent: THREE.Object3D, pos: XYZ, sign: number) {
    const hand = sub(parent, pos); hand.rotation.y = -sign * .19; hand.rotation.x = -.08;
    // Palm, four individually articulated relaxed fingers and opposing thumb.
    sweep(hand, [[0, .005, -.045], [0, .003, 0], [0, 0, .052], [0, -.002, .086]], [.028, .055, .061, .046], [.028, .032, .034, .024], skin, 22, 24);
    const lengths = [.094, .125, .117, .085];
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * .029, l = lengths[i];
      sweep(hand, [[x, 0, .065], [x * 1.12, -.003, .105], [x * 1.15, -.025, .075 + l * .72], [x * 1.12, -.048, .075 + l]], [.0138, .014, .0125, .01, .001], [.014, .014, .011, .009, .001], skin, 18, 10);
      line(hand, [[x - .008, .012, .105], [x, .0135, .108], [x + .008, .012, .105]], .001, innerEar, false, 8);
      ellipsoid(hand, [x * 1.13, -.029, .063 + l], [.0073, .002, .011], skin, 10, 6);
    }
    sweep(hand, [[-sign * .04, .003, .012], [-sign * .075, -.002, .035], [-sign * .084, -.016, .079], [-sign * .07, -.032, .101]], [.019, .02, .015, .001], [.019, .018, .013, .001], skin, 22, 12);
  }
  // Neck and folded hood are distinct continuous surfaces; the rear is fully modeled.
  rings(upper, [{ y: 1.59, x: .095, z: .088 }, { y: 1.68, x: .107, z: .093 }, { y: 1.79, x: .103, z: .091 }, { y: 1.83, x: .08, z: .07 }], skin);
  sweep(upper, [[-.075, 1.58, .18], [-.21, 1.66, .1], [-.26, 1.7, -.085], [-.17, 1.7, -.22], [0, 1.7, -.27], [.17, 1.7, -.22], [.26, 1.7, -.085], [.21, 1.66, .1], [.075, 1.58, .18]],
    [.025, .067, .08, .085, .09, .085, .08, .067, .025], [.025, .06, .067, .075, .075, .075, .067, .06, .025], cloth, 64, 24);
  line(upper, [[-.065, 1.59, .199], [-.2, 1.695, .12], [-.24, 1.753, -.09], [0, 1.765, -.267], [.24, 1.753, -.09], [.2, 1.695, .12], [.065, 1.59, .199]], .003, clothShadow, false, 64);
  for (const s of [-1, 1]) {
    ellipsoid(upper, [s * .09, 1.565, .198], [.014, .015, .006], stitch, 12, 8);
    line(upper, [[s * .09, 1.565, .207], [s * .095, 1.46, .245], [s * .105, 1.32, .25]], .006, clothShadow);
    line(upper, [[s * .105, 1.32, .25], [s * .107, 1.288, .25]], .0065, ink, false, 8);
  }

  const hoodPouch=rings(upper,[
    {y:1.3,x:.025,z:.022,offset:-.24},{y:1.35,x:.12,z:.06,offset:-.25},
    {y:1.43,x:.21,z:.075,offset:-.26},{y:1.55,x:.245,z:.08,offset:-.25},
    {y:1.65,x:.21,z:.07,offset:-.21},{y:1.7,x:.11,z:.04,offset:-.19}
  ],cloth,.018);
  line(upper,[[0,1.32,-.266],[0,1.4,-.324],[0,1.53,-.333],[0,1.64,-.276]],.002,clothShadow);
  const head = sub(upper, [0, 2.045, .02]);
  head.rotation.y = -.045; head.rotation.z = .018;
  // A single smooth face mesh with cheek planes, tapered jaw, nasal bridge and nose tip.
  const profile = {
    y: [-.34, -.31, -.26, -.18, -.08, .035, .14, .255, .33, .365],
    x: [.018, .095, .177, .245, .295, .314, .306, .272, .182, .008],
    z: [.04, .12, .182, .222, .253, .27, .267, .235, .16, .009],
    c: [.075, .06, .025, 0, -.015, -.025, -.032, -.035, -.035, -.035],
  };
  surface(head, 80, 96, (v, u) => {
    const a = u * Math.PI * 2, y = interpolate(profile.y, v), x = Math.sin(a) * interpolate(profile.x, v);
    let z = Math.cos(a) * interpolate(profile.z, v) + interpolate(profile.c, v);
    const front = Math.max(Math.cos(a), 0) ** 9;
    const bridge = .044 * Math.exp(-((x / .037) ** 2) - ((y + .01) / .11) ** 2);
    const noseTip = .062 * Math.exp(-((x / .049) ** 2) - ((y + .092) / .037) ** 2);
    const philtrum = .013 * Math.exp(-((x / .04) ** 2) - ((y + .145) / .03) ** 2);
    const eyeSockets = .011 * (Math.exp(-(((x - .125) / .065) ** 2)) + Math.exp(-(((x + .125) / .065) ** 2))) * Math.exp(-(((y - .025) / .039) ** 2));
    z += front * (bridge + noseTip + philtrum - eyeSockets);
    return [x, y, z];
  }, skin);
  for (const s of [-1, 1]) {
    const ear = ellipsoid(head, [s * .302, -.055, -.025], [.051, .088, .048], skin, 26, 20); ear.rotation.z = s * -.1;
    line(head, [[s * .327, -.103, .003], [s * .337, -.074, .02], [s * .339, -.026, .014], [s * .32, .006, -.002]], .009, innerEar);
    line(head, [[s * .322, -.065, .019], [s * .316, -.043, .023], [s * .328, -.025, .017]], .006, skin);
    // Quiet nostril and brow details remain legible when the portrait is close.

  }
  // Facial lines sit on the actual cheek surface, including in profile.
  function facialZ(x:number,y:number) {
    let lo=0,hi=1;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(interpolate(profile.y,mid)<y)lo=mid;else hi=mid;}
    const v=(lo+hi)/2, rx=interpolate(profile.x,v), cosine=Math.sqrt(Math.max(0,1-(x/rx)**2));
    const bridge=.044*Math.exp(-((x/.037)**2)-((y+.01)/.11)**2);
    const nose=.062*Math.exp(-((x/.049)**2)-((y+.092)/.037)**2);
    const philtrum=.013*Math.exp(-((x/.04)**2)-((y+.145)/.03)**2);
    return cosine*interpolate(profile.z,v)+interpolate(profile.c,v)+cosine**9*(bridge+nose+philtrum)+.002;
  }
  const mouthPoints:XYZ[]=[[-.067,-.181,0],[-.035,-.19,0],[0,-.192,0],[.035,-.19,0],[.067,-.181,0]];
  mouthPoints.forEach(p=>p[2]=facialZ(p[0],p[1]));
  line(head,mouthPoints,.0024,lip);

  const eyeGroups: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const eye = sub(head, [s * .124, .027, .229]); eye.rotation.y = s * .2; eyeGroups.push(eye);
    const shape = new THREE.Shape();
    shape.moveTo(-.077, 0); shape.bezierCurveTo(-.043, .043, .025, .049, .078, .007);
    shape.bezierCurveTo(.044, -.026, -.029, -.03, -.077, 0);
    mesh(eye, new THREE.ShapeGeometry(shape, 24), sclera, [0, 0, .008]);
    ellipsoid(eye, [.004, .006, .011], [.029, .033, .009], iris, 28, 20);
    ellipsoid(eye, [.004, .006, .019], [.014, .023, .004], ink, 24, 16);
    ellipsoid(eye, [-.005, .019, .023], [.008, .009, .002], highlight, 16, 10);
    ellipsoid(eye, [.014, -.005, .023], [.003, .003, .0015], highlight, 10, 8);
    line(eye, [[-.078, 0, .01], [-.043, .03, .018], [.017, .034, .019], [.078, .007, .01]], .0045, ink);
    line(eye, [[-.077, 0, .009], [-.034, -.019, .016], [.031, -.017, .016], [.077, .007, .01]], .0025, innerEar);
    line(head, [[s * .054, .115, .235], [s * .107, .13, .237], [s * .159, .124, .223], [s * .207, .105, .187]], .009, hair);
  }

  // Transparent rounded-square optical frames. Separate lenses preserve both eyes.
  const glasses = sub(head, [0, .033, .283]);
  function roundedRect(w: number, h: number, r: number) {
    const p = new THREE.Shape();
    p.moveTo(-w + r, -h); p.lineTo(w - r, -h); p.quadraticCurveTo(w, -h, w, -h + r);
    p.lineTo(w, h - r); p.quadraticCurveTo(w, h, w - r, h); p.lineTo(-w + r, h);
    p.quadraticCurveTo(-w, h, -w, h - r); p.lineTo(-w, -h + r); p.quadraticCurveTo(-w, -h, -w + r, -h); return p;
  }
  for (const s of [-1, 1]) {
    const eyepiece = sub(glasses, [s * .128, 0, -.013]); eyepiece.rotation.y = s * .1;
    const shape = roundedRect(.109, .076, .037);
    const path = shape.getPoints(64).map(p => [p.x, p.y, 0] as XYZ);
    line(eyepiece, path, .007, frame, true, 72);
    const glass = mesh(eyepiece, new THREE.ShapeGeometry(shape, 32), lens, [0, 0, -.002]); glass.castShadow = false;
    line(eyepiece, [[s * .092, .049, .002], [s * .117, .043, -.006], [s * .18, .022, -.17], [s * .183, -.02, -.235]], .006, frame);
    line(eyepiece, [[-.073, .057, .005], [-.015, .067, .005], [.051, .065, .005]], .0016, highlight);
    ellipsoid(glasses, [s * .034, -.005, -.021], [.009, .017, .005], frame, 14, 10);
  }
  line(glasses, [[-.027, .014, 0], [0, .027, .009], [.027, .014, 0]], .0055, frame);

  // Scalp + broad, tapered swept locks form a flowing parted hairstyle in all views.
  const hairGroup = sub(head);
  surface(hairGroup, 36, 80, (v, u) => {
    const a = u * Math.PI * 2;
    const front = Math.max(Math.cos(a), 0);
    const bottomAngle = 1.8 - front * .73 + .05 * Math.sin(a * 5);
    const polar = .008 + v * bottomAngle;
    return [Math.sin(a) * Math.sin(polar) * .337, .07 + Math.cos(polar) * .365, -.035 + Math.cos(a) * Math.sin(polar) * .319];
  }, hair, true);
  /** Leaf-like volumetric locks, with a raised center and a pointed tip. */
  function lock(points: XYZ[], width: number, depth: number, normal: XYZ, light = false) {
    const path = curve(points), n = new THREE.Vector3(...normal).normalize();
    surface(hairGroup, 34, 16, (t, u) => {
      const p = path.getPoint(t), tangent = path.getTangent(t).normalize();
      const across = new THREE.Vector3().crossVectors(tangent, n).normalize();
      const outward = new THREE.Vector3().crossVectors(across, tangent).normalize();
      const taper = Math.sin(Math.PI * (t * .985 + .0075)) ** .54 * (1 - .62 * t);
      const a = u * Math.PI * 2;
      p.addScaledVector(across, Math.cos(a) * width * taper);
      p.addScaledVector(outward, Math.sin(a) * depth * taper);
      return [p.x, p.y, p.z];
    }, light ? hairRidge : hair, true);
    for (const offset of [-.24, .18]) {
      const strand: XYZ[] = Array.from({ length: 28 }, (_, i) => {
        const t = .08 + i / 27 * .84, p = path.getPoint(t), tangent = path.getTangent(t).normalize();
        const across = new THREE.Vector3().crossVectors(tangent, n).normalize();
        const outward = new THREE.Vector3().crossVectors(across, tangent).normalize();
        const taper = Math.sin(Math.PI * t) ** .54 * (1 - .62 * t);
        p.addScaledVector(across, offset * width * taper); p.addScaledVector(outward, depth * taper * .99);
        return [p.x, p.y, p.z];
      });
      line(hairGroup, strand, .0015, light ? hairFine : hairRidge, false, 28);
    }
  }
  // Long left sweep and shorter right sweep retain the asymmetry of the portrait.
  lock([[.055,.39,.087],[-.07,.425,.17],[-.19,.34,.265],[-.27,.19,.283],[-.287,.04,.18]], .095,.031,[0,.15,1]);
  lock([[.07,.405,.04],[-.07,.445,.115],[-.24,.36,.22],[-.33,.22,.17],[-.35,.12,.08]], .1,.035,[0,.25,1]);
  lock([[.045,.365,.15],[-.025,.365,.235],[-.115,.28,.31],[-.145,.16,.315],[-.185,.1,.267]], .075,.026,[0,0,1]);
  lock([[.075,.37,.16],[.02,.32,.25],[-.012,.23,.296],[-.015,.14,.287],[-.047,.12,.265]], .061,.026,[0,0,1]);
  lock([[.08,.405,.04],[.19,.421,.125],[.28,.32,.217],[.31,.19,.227],[.345,.12,.155]], .08,.03,[0,.1,1]);
  lock([[.105,.383,.12],[.17,.35,.22],[.18,.26,.294],[.22,.155,.276],[.27,.112,.214]], .07,.027,[0,0,1]);
  lock([[.13,.407,-.015],[.25,.39,.075],[.32,.29,.12],[.35,.16,.08],[.378,.2,.025]], .08,.026,[1,.2,.3]);
  lock([[-.055,.401,-.04],[-.21,.397,.03],[-.31,.28,.065],[-.349,.12,.04],[-.335,-.045,-.005]], .08,.03,[-1,.15,.3]);
  // Sideburns taper into the temples; rear locks are sculpted independently.
  for (const s of [-1, 1]) {
    lock([[s*.29,.245,.09],[s*.329,.14,.065],[s*.328,.045,.048],[s*.305,-.075,.047]], .041,.019,[s,0,.5]);
    lock([[s*.11,.395,-.12],[s*.25,.33,-.2],[s*.337,.14,-.195],[s*.33,-.02,-.13],[s*.31,-.13,-.07]], .092,.035,[s,.1,-.4]);
    lock([[s*.06,.41,-.095],[s*.15,.34,-.28],[s*.21,.16,-.345],[s*.19,-.045,-.312],[s*.17,-.145,-.24]], .084,.03,[s*.3,0,-1]);
    lock([[s*.03,.39,-.16],[s*.055,.25,-.35],[s*.075,.065,-.372],[s*.052,-.13,-.286]], .08,.028,[0,0,-1]);
  }
  lock([[.04,.407,-.02],[-.02,.457,-.055],[-.115,.465,-.015],[-.19,.429,.03]], .03,.014,[0,1,.2], true);
  lock([[.11,.396,-.02],[.17,.452,-.06],[.246,.44,-.035],[.263,.398,.011]], .025,.013,[0,1,.1]);

  group.traverse(obj => { if (obj instanceof THREE.Mesh) obj.userData.target = 'about'; });
  const neutralTilt = head.rotation.z;
  return {
    group,
    update(time, reduced) {
      upper.position.y = reduced ? 0 : Math.sin(time * 1.35) * .003;
      head.rotation.z = neutralTilt + (reduced ? 0 : Math.sin(time * .41) * .008);
      const phase = time % 5.7;
      const blink = reduced || phase > .16 ? 1 : Math.max(.08, Math.abs(phase - .08) / .08);
      for (const eye of eyeGroups) eye.scale.y = blink;
    },
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); group.removeFromParent(); },
  };
}
