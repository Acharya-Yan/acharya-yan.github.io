import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Self-authored MacBook Pro 14-inch study. One model unit is ~26 cm.
 * Hardware dimensions follow Apple's 2021 14-inch published enclosure proportions.
 * No Apple mesh, texture, wallpaper or logo is included. Front is +Z; base is Y=0.
 */
export function createMacBook(screenTexture: THREE.Texture): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group(); group.name = 'MacBook Pro 14 — original detailed model';
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const mat = (p: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial(p); materials.add(m); return m;
  };
  const aluminum = mat({ color: '#aeb2b9', metalness: .78, roughness: .29 });
  const edgeMetal = mat({ color: '#d2d5d8', metalness: .85, roughness: .22 });
  const lidMetal = mat({ color: '#b9bdc3', metalness: .76, roughness: .31 });
  const black = mat({ color: '#111216', metalness: .18, roughness: .47 });
  const rubber = mat({ color: '#17191b', roughness: .88 });
  const keyMaterial = mat({ color: '#202126', roughness: .45, metalness: .12 });
  const wellMaterial = mat({ color: '#090a0c', roughness: .7 });
  const trackMaterial = mat({ color: '#b1b5bb', roughness: .36, metalness: .56 });
  const screenMaterial = mat({ map: screenTexture, emissiveMap: screenTexture, emissive: '#ffffff', emissiveIntensity: .28, roughness: .22, metalness: 0 });
  const silver = mat({ color: '#8e939b', metalness: .85, roughness: .24 });
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
    geometries.add(geometry); const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, r = .003) => add(parent, new RoundedBoxGeometry(w, h, d, 3, Math.min(r, h / 2, d / 2, w / 2)), material, x, y, z);
  const roundShape = (w: number, h: number, r: number) => {
    const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  };
  const plate = (parent: THREE.Object3D, w: number, d: number, depth: number, radius: number, y: number, material: THREE.Material, bevel = .002) => {
    const geometry = new THREE.ExtrudeGeometry(roundShape(w, d, radius), { depth, steps: 1, bevelEnabled: true, bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel, curveSegments: 12 });
    const mesh = add(parent, geometry, material, 0, y, 0); mesh.rotation.x = -Math.PI / 2; return mesh;
  };
  // Continuous unibody with a thin polished machined rim and a recessed bottom cover.
  plate(group, 1.188, .829, .034, .038, .012, aluminum, .006);
  plate(group, 1.178, .817, .004, .036, .004, lidMetal, .003);
  plate(group, 1.186, .825, .003, .038, .046, edgeMetal, .0018);
  // Palm rest + keyboard recess: the well is truly below the raised key caps.
  box(group, 1.014, .004, .422, 0, .0505, -.121, wellMaterial, .002);
  box(group, 1.019, .003, .428, 0, .049, -.121, black, .0015);
  // The oversized glass trackpad is inset with a fine dark perimeter seam.
  box(group, .517, .0016, .267, 0, .051, .246, silver, .0008);
  box(group, .509, .0018, .259, 0, .052, .246, trackMaterial, .0008);
  // Front finger scoop: a curved dark shadow inset at the body lip.
  const scoop = add(group, new THREE.CylinderGeometry(.078, .078, .004, 40, 1, false, 0, Math.PI), aluminum, 0, .040, .415);
  scoop.rotation.x = Math.PI / 2;
  box(group, .125, .007, .002, 0, .039, .419, silver, .001);

  type Key = { label: string; units: number };
  const row = (labels: string[], units: number[] = []) => labels.map((label, i): Key => ({label, units: units[i] ?? 1}));
  const rows: Key[][] = [
    row(['esc','◀','☀','▤','⌕','◉','☾','◁','▷','▷|','◀','−','+','◉']),
    row(['~','1','2','3','4','5','6','7','8','9','0','−','=','delete'],[1,1,1,1,1,1,1,1,1,1,1,1,1,1.5]),
    row(['tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],[1.5,1,1,1,1,1,1,1,1,1,1,1,1,1]),
    row(['caps','A','S','D','F','G','H','J','K','L',';','\'','return'],[1.75,1,1,1,1,1,1,1,1,1,1,1,1.75]),
    row(['shift','Z','X','C','V','B','N','M',',','.','/','shift'],[2.25,1,1,1,1,1,1,1,1,1,1,2.25]),
    row(['fn','control','option','⌘','','⌘','option','←','↕','→'],[1,1,1,1.25,5.25,1.25,1,1,1,1]),
  ];
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const boardWidth = 1.0, boardDepth = .406, boardZ = -.121;
  const keyDepth = .052, rowStep = .064;
  // Individual key widths keep the corner radii and special-key spacing consistent.
  rows.forEach((keys, r) => {
    const total = keys.reduce((sum, k) => sum + k.units, 0);
    const step = .982 / total;
    let cursor = -.491;
    keys.forEach((key, index) => {
      const slot = step * key.units;
      const x = cursor + slot / 2;
      const z = -.282 + r * rowStep;
      const keycap = box(group, slot - .006, .0075, keyDepth, x, .056, z, keyMaterial, .0024);
      keycap.name = `key-${r}-${index}-${key.label || 'space'}`;
      // A shallow top highlight makes the individual cap edges legible under soft lights.
      if (r === 0 && index === keys.length - 1) {
        const ring = add(group, new THREE.TorusGeometry(.0155, .001, 5, 28), silver, x, .0602, z);
        ring.rotation.x = -Math.PI / 2;
      }
      if (ctx && key.label) {
        const px = (x / boardWidth + .5) * canvas.width;
        const py = ((z - boardZ) / boardDepth + .5) * canvas.height;
        ctx.fillStyle = '#e4e5e9';
        ctx.font = `${key.label.length > 2 ? 13 : r === 0 ? 19 : 23}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(key.label, px, py);
      }
      cursor += slot;
    });
  });
  if (ctx) {
    const legends = new THREE.CanvasTexture(canvas); legends.colorSpace = THREE.SRGBColorSpace;
    legends.anisotropy = 4; textures.add(legends);
    const legendsMat = new THREE.MeshBasicMaterial({ map: legends, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }); materials.add(legendsMat);
    const legendPlane = add(group, new THREE.PlaneGeometry(boardWidth, boardDepth), legendsMat, 0, .0601, boardZ);
    legendPlane.rotation.x = -Math.PI / 2; legendPlane.castShadow = false;
  }
  // Two dense laser-perforated speaker arrays, rendered with instancing (one draw call).
  const dotGeo = new THREE.CircleGeometry(.00115, 5); geometries.add(dotGeo);
  const columns = 7, lines = 62;
  const grilles = new THREE.InstancedMesh(dotGeo, black, 2 * columns * lines);
  const matrix = new THREE.Matrix4(); const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  let n = 0;
  for (const side of [-1, 1]) for (let r = 0; r < lines; r++) for (let c = 0; c < columns; c++) {
    matrix.compose(new THREE.Vector3(side * (.536 + c * .0049), .0517, -.318 + r * .00635), rotation, new THREE.Vector3(1, 1, 1));
    grilles.setMatrixAt(n++, matrix);
  }
  grilles.instanceMatrix.needsUpdate = true; group.add(grilles);
  // Underside rubber pads and pentalobe screws remain visible from low orbit angles.
  for (const x of [-.47, .47]) for (const z of [-.306, .306]) {
    add(group, new THREE.CylinderGeometry(.037, .033, .007, 32), rubber, x, .0015, z);
    add(group, new THREE.CylinderGeometry(.0031, .0031, .001, 12), silver, x + Math.sign(x) * .069, .001, z + Math.sign(z) * .053);
  }
  // Side port apertures sit flush in the unibody with a smaller interior tongue.
  const port = (side: number, z: number, length: number, height: number, tongue = true) => {
    box(group, .002, height, length, side * .598, .029, z, wellMaterial, .0008);
    if (tongue) box(group, .0023, .0018, length * .68, side * .5995, .029, z, silver, .0006);
  };
  port(-1, -.292, .054, .012, false); // MagSafe
  for (let i = 0; i < 5; i++) box(group, .0028, .0032, .0032, -.600, .029, -.309 + i * .008, edgeMetal, .0005);
  port(-1, -.209, .032, .010); port(-1, -.149, .032, .010);
  const jack = add(group, new THREE.CylinderGeometry(.006, .006, .0025, 20), wellMaterial, -.600, .028, -.065); jack.rotation.z = Math.PI / 2;
  port(1, -.287, .047, .014, false); // HDMI
  port(1, -.204, .033, .010);
  port(1, -.079, .104, .005, false); // SDXC
  // A nearly full-width hinge barrel and rear exhaust channel join two real shells.
  box(group, .974, .016, .012, 0, .034, -.417, black, .003);
  const hinge = add(group, new THREE.CylinderGeometry(.022, .022, 1.045, 40), aluminum, 0, .057, -.388);
  hinge.rotation.z = Math.PI / 2;
  for (let i = 0; i < 44; i++) box(group, .009, .009, .002, -.46 + i * .0214, .037, -.424, wellMaterial, .001);
  const lid = new THREE.Group(); lid.name = 'display-lid'; lid.position.set(0, .060, -.388); lid.rotation.x = -.235; group.add(lid);
  const lidShell = new THREE.ExtrudeGeometry(roundShape(1.196, .778, .035), { depth: .010, bevelEnabled: true, bevelSegments: 3, bevelThickness: .0028, bevelSize: .0028, curveSegments: 12 });
  add(lid, lidShell, lidMetal, 0, .389, -.012);
  add(lid, new THREE.ShapeGeometry(roundShape(1.174, .754, .029), 12), black, 0, .392, .002);
  const displayGeo = new THREE.ShapeGeometry(roundShape(1.133, .710, .022), 16);
  // ShapeGeometry UVs are in local coordinates, so normalize explicitly for the screen texture.
  const uv = displayGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.133 + .5, uv.getY(i) / .710 + .5);
  add(lid, displayGeo, screenMaterial, 0, .404, .0032);
  // Distinctive camera notch, with a glass lens and two tiny sensor dots.
  box(lid, .108, .032, .002, 0, .745, .005, black, .001);
  const lensMat = mat({ color: '#16262e', metalness: .65, roughness: .12 });
  const lens = add(lid, new THREE.CylinderGeometry(.004, .004, .0015, 24), lensMat, 0, .749, .007); lens.rotation.x = Math.PI / 2;
  const highlight = mat({ color: '#577880', metalness: .4, roughness: .15 });
  add(lid, new THREE.SphereGeometry(.0012, 8, 6), highlight, -.0008, .750, .008);
  for (const x of [-.022, .019]) {
    const sensor = add(lid, new THREE.CircleGeometry(.0016, 12), rubber, x, .748, .007);
    sensor.castShadow = false;
  }
  box(lid, 1.128, .015, .002, 0, .026, .005, black, .001);
  return {
    group,
    dispose() {
      grilles.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
