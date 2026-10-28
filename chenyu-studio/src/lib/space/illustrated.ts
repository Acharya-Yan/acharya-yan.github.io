/** The approved drawings, arranged as fixed depth planes. No synthetic character mesh. */
export type Target = 'about' | 'work' | 'notes';
export type View = 'orbit' | 'camera' | 'desk';
export interface SpaceAPI {
  focus(target: Target): void;
  view(view: View): void;
  rotate(amount: number): void;
  zoom(amount: number): void;
  light(on: boolean): void;
  tour(on: boolean): void;
  dispose(): void;
}
interface Events {
  select(id: Target): void;
  hover(id: Target | null): void;
  angle(degrees: number): void;
  interact(): void;
  ready(): void;
  fail(): void;
}
export function createSpace(host: HTMLElement, events: Events): SpaceAPI {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.createElement('div');
  root.className = 'illustrated-viewport';
  const mount = document.createElement('div');
  mount.className = 'illustrated-rig';
  const room = document.createElement('div');
  room.className = 'illustrated-room';
  mount.append(room); root.append(mount); host.append(root);
  const layers: {element: HTMLDivElement; depth: number; name: string}[] = [];
  const images: HTMLImageElement[] = [];
  for (const [name, depth] of [['desk', -65], ['lamp', 85], ['avatar', 125], ['camera', 270]] as const) {
    const element = document.createElement('div');
    element.className = `illustrated-plane illustrated-${name}`;
    const img = new Image(); img.src = `/assets/${name}.webp`;
    img.alt = ''; img.draggable = false;
    if (name === 'avatar') {
      const shadow = document.createElement('div'); shadow.className = 'illustrated-contact-shadow'; element.append(shadow);
    }
    element.append(img); room.append(element); layers.push({element, depth, name}); images.push(img);
  }
  const areas = [
    {id: 'about', layer: 'avatar', left: 25, top: 11, width: 25, height: 43, label: '认识严晨宇'},
    {id: 'work', layer: 'desk', left: 43, top: 16, width: 20, height: 16, label: '屏幕里的作品'},
    {id: 'notes', layer: 'desk', left: 8, top: 22, width: 13, height: 13, label: '打开文字笔记'},
  ] as const;
  for (const area of areas) {
    const button = document.createElement('button');
    button.className = `illustrated-hotspot illustrated-hotspot-${area.id}`;
    button.dataset.target = area.id; button.setAttribute('aria-label', area.label);
    Object.assign(button.style, {left: `${area.left}%`, top: `${area.top}%`, width: `${area.width}%`, height: `${area.height}%`});
    const marker = document.createElement('span'); marker.className = 'illustrated-marker'; marker.textContent = '+'; marker.setAttribute('aria-hidden', 'true');
    button.append(marker);
    button.addEventListener('pointerenter', () => events.hover(area.id));
    button.addEventListener('pointerleave', () => events.hover(null));
    button.addEventListener('click', e => { if (e.detail === 0) events.select(area.id); });
    layers.find(l => l.name === area.layer)!.element.append(button);
  }
  let disposed = false, frame = 0, width = 900, height = 675, lastTime = 0;
  let yaw = 0, pitch = 0, targetYaw = 0, targetPitch = 0, scale = 1, targetScale = 1;
  let focusX = .5, focusY = .5, targetX = .5, targetY = .5;
  let mode: View = 'orbit', auto = false, autoStart = 0, lastAngle = 999, drag: {x: number; y: number; yaw: number; pitch: number; distance: number; target: Target | null} | null = null;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  function resize() {
    const box = host.getBoundingClientRect();
    const hasPanel = host.parentElement?.classList.contains('has-panel');
    width = Math.max(280, Math.min(box.width - (hasPanel ? 90 : 230), (box.height - 155) * 4 / 3));
    height = width * .75;
    mount.style.width = `${width}px`; mount.style.height = `${height}px`;
    mount.style.left = `calc(50% + ${hasPanel ? 0 : 55}px)`;
    const perspective = width * 1.65;
    mount.style.perspective = `${perspective}px`;
    for (const layer of layers) {
      const z = layer.depth * width / 1000;
      // Undo perspective magnification so all original layers align at the neutral view.
      layer.element.style.transform = `translateZ(${z}px) scale(${1 - z / perspective})`;
    }
    wake();
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now;
    const ease = reduced.matches ? 1 : 1 - Math.exp(-9 * dt);
    if (auto) targetYaw = Math.sin((now - autoStart) / 3800) * 9;
    yaw += (targetYaw - yaw) * ease; pitch += (targetPitch - pitch) * ease;
    scale += (targetScale - scale) * ease;
    focusX += (targetX - focusX) * ease; focusY += (targetY - focusY) * ease;
    room.style.transform = `translate3d(${(.5-focusX)*width*scale}px, ${(.5-focusY)*height*scale}px, 0) scale(${scale}) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    const angle = Math.round(yaw); if (angle !== lastAngle) { events.angle(angle); lastAngle = angle; }
    if (auto || Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)+Math.abs(scale-targetScale)+Math.abs(focusX-targetX)+Math.abs(focusY-targetY) > .0005) frame = requestAnimationFrame(render);
  }
  function wake() { if (!frame && !disposed && !document.hidden) { lastTime = performance.now(); frame = requestAnimationFrame(render); } }
  function interact() { auto = false; events.interact(); }
  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    interact();
    const button = (e.target as Element).closest<HTMLButtonElement>('[data-target]');
    drag = {x: e.clientX, y: e.clientY, yaw: targetYaw, pitch: targetPitch, distance: 0, target: button?.dataset.target as Target || null};
    root.setPointerCapture(e.pointerId); root.classList.add('is-dragging');
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const dx = e.clientX-drag.x, dy = e.clientY-drag.y;
    drag.distance = Math.max(drag.distance, Math.hypot(dx,dy));
    targetYaw = clamp(drag.yaw + dx * .045, -12, 12);
    targetPitch = clamp(drag.pitch - dy * .018, -3, 3); wake();
  }
  function up(e: PointerEvent) {
    if (!drag) return;
    const click = drag.distance < 6 ? drag.target : null;
    drag = null; root.classList.remove('is-dragging');
    if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
    if (click && e.type !== 'pointercancel') { events.hover(null); events.select(click); }
  }
  function wheel(e: WheelEvent) { e.preventDefault(); interact(); targetScale = clamp(targetScale * Math.exp(-e.deltaY*.0008), .9, 1.85); wake(); }
  root.addEventListener('pointerdown', down); root.addEventListener('pointermove', move);
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('wheel', wheel, {passive: false});
  function visibility() { if (document.hidden) {cancelAnimationFrame(frame); frame = 0;} else wake(); }
  document.addEventListener('visibilitychange', visibility);
  function setView(view: View) {
    mode = view; auto = false; targetYaw = 0; targetPitch = 0;
    root.dataset.view = mode;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-target]')) {
      button.disabled = mode === 'desk' && button.dataset.target === 'about';
    }
    events.hover(null);
    targetScale = mode === 'camera' ? 1.65 : mode === 'desk' ? 1.35 : 1;
    targetX = mode === 'camera' ? .365 : mode === 'desk' ? .49 : .5;
    targetY = mode === 'camera' ? .32 : mode === 'desk' ? .33 : .5;
    wake();
  }
  Promise.all(images.map(img => img.decode())).then(() => {if (!disposed) {resize(); events.ready();}}).catch(() => {if (!disposed) events.fail();});
  resize();
  return {
    focus(id) {
      setView('orbit');
      const point = {about: [.37,.38,1.45], work: [.53,.29,1.6], notes: [.205,.35,1.65]}[id];
      [targetX,targetY,targetScale] = point;
      // Foreground gear yields while reading, leaving the drawing and selected object clear.
      root.dataset.view = 'detail'; wake();
    },
    view: setView,
    rotate(amount) {interact(); targetYaw = clamp(targetYaw + amount*20,-12,12); wake();},
    zoom(amount) {interact(); targetScale = clamp(targetScale/amount,.9,1.85); wake();},
    light(on) {root.classList.toggle('light-off', !on);},
    tour(on) {auto = on; autoStart = performance.now() - Math.asin(clamp(yaw/9,-1,1))*3800; wake();},
    dispose() {disposed = true; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange',visibility); root.remove();}
  };
}
