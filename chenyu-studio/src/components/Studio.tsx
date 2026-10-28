import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { clamp, studioPlane, studioView } from '../lib/space/perspective';
import { artworkAim, artworkLensZoom, wallPlane, type WallArtwork } from '../data/gallery';
import WallGallery from './WallGallery';

type Target = 'about' | 'work' | 'notes' | 'contact' | 'camera' | 'lamp';
type LensSubject = { kind: 'portrait' } | { kind: 'artwork'; artwork: WallArtwork };
const hints: Record<Target, string> = {
  about: '认识一下 →', work: '看看我的作品 →', notes: '读一点文字 →',
  contact: '打个招呼 →', camera: '从镜头里看看', lamp: '试试这盏灯',
};
function Glyph({ name, size = 18 }: { name: 'camera' | 'sun' | 'close' | 'reset' | 'eye' | 'pause' | 'play' | 'plus' | 'minus'; size?: number }) {
  const paths = {
    camera: 'M3 7h5l2-3h4l2 3h5v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    sun: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    close: 'M6 6l12 12M18 6 6 18',
    reset: 'M3 11a9 9 0 1 1 2.4 7M3 4v7h7',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    pause: 'M8 5v14M16 5v14',
    play: 'm8 4 12 8-12 8z',
    plus: 'M5 12h14M12 5v14',
    minus: 'M5 12h14',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Studio() {
  const root = useRef<HTMLDivElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; yaw: number; pitch: number } | null>(null);
  const dragged = useRef(false);
  const lensReturn = useRef<{ yaw: number; pitch: number; zoom: number; element: HTMLElement | null } | null>(null);
  const [lensSubject, setLensSubject] = useState<LensSubject | null>(null);
  const cameraMode = lensSubject !== null;
  const selectedArtwork = lensSubject?.kind === 'artwork' ? lensSubject.artwork : null;
  const [musicHost, setMusicHost] = useState<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stageWidth, setStageWidth] = useState(1000);
  const [hovered, setHovered] = useState<Target | null>(null);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [blinkReady, setBlinkReady] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [light, setLight] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const reduceMotion = useReducedMotion();
  const ready = loaded.length === 4 && !failed;
  const moving = ready && visible && !paused && !reduceMotion;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawZoom = useMotionValue(1);
  const aimYaw = useMotionValue(0);
  const aimPitch = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 110, damping: 28 });
  const y = useSpring(rawY, { stiffness: 110, damping: 28 });
  const zoom = useSpring(rawZoom, { stiffness: 110, damping: 28 });
  const aimedX = useSpring(aimPitch, { stiffness: 160, damping: 30 });
  const aimedY = useSpring(aimYaw, { stiffness: 160, damping: 30 });
  const plane = (layer: Parameters<typeof studioPlane>[0]) => {
    const scale = layer === 'camera' ? .59 : .7;
    return {
      left: layer === 'lamp' ? '28%' : layer === 'camera' ? '25%' : '12%',
      top: layer === 'camera' ? '38%' : '30%',
      width: `${scale * 100}%`, height: `${scale * 100}%`,
      transform: studioPlane(layer, stageWidth * scale, stageWidth),
    };
  };
  const transition = { duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const };

  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(Math.max(1, entry.contentRect.width)));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Cached images may finish before React hydration attaches onLoad handlers.
    root.current?.querySelectorAll<HTMLImageElement>('img[data-layer]').forEach(image => {
      if (image.complete && image.naturalWidth > 0) markLoaded(image.dataset.layer!);
      else if (image.complete) setFailed(true);
    });
    const blink = root.current?.querySelector<HTMLImageElement>('.blink-frame');
    if (blink?.complete && blink.naturalWidth > 0) setBlinkReady(true);
  }, []);

  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); }, { threshold: 0.08 });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!moving || !blinkReady) { setBlinking(false); return; }
    let closed: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      setBlinking(true);
      closed = setTimeout(() => setBlinking(false), 150);
    }, 5400);
    return () => { clearInterval(tick); clearTimeout(closed); };
  }, [moving, blinkReady]);

  function exitCamera() {
    const previous = lensReturn.current;
    lensReturn.current = null;
    setLensSubject(null);
    aimYaw.set(0); aimPitch.set(0);
    if (previous) {
      rawX.set(previous.yaw); rawY.set(previous.pitch); rawZoom.set(previous.zoom);
    }
    setAnnouncement('已退出取景，恢复之前的工作室视角');
    requestAnimationFrame(() => {
      const trigger = previous?.element;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      else cameraButton.current?.focus({ preventScroll: true });
    });
  }
  function enterLens(subject: LensSubject, trigger?: HTMLElement) {
    if (!lensReturn.current) lensReturn.current = { yaw: rawX.get(), pitch: rawY.get(), zoom: rawZoom.get(), element: trigger ?? document.activeElement as HTMLElement | null };
    setLensSubject(subject); setHovered(null);
    rawX.set(0); rawY.set(0); rawZoom.set(1);
    const aim = subject.kind === 'artwork' ? artworkAim(subject.artwork, 1) : { yaw: 0, pitch: 0 };
    aimYaw.set(aim.yaw); aimPitch.set(aim.pitch);
    setGreeting(subject.kind === 'portrait');
    setAnnouncement(subject.kind === 'artwork' ? `镜头正在拍摄《${subject.artwork.title}》，按 Escape 返回工作室` : '镜头正在拍摄严晨宇，按 Escape 返回工作室');
  }
  function pointAtArtwork(artwork: WallArtwork, trigger: HTMLButtonElement) { enterLens({ kind: 'artwork', artwork }, trigger); }
  useEffect(() => {
    if (!cameraMode) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') exitCamera(); };
    document.addEventListener('keydown', key);
    closeButton.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', key);
  }, [cameraMode]);

  useEffect(() => {
    if (!greeting) return;
    const timer = setTimeout(() => setGreeting(false), 2600);
    return () => clearTimeout(timer);
  }, [greeting]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!ready || cameraMode || !event.isPrimary || event.button !== 0) return;
    dragged.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: rawX.get(), pitch: rawY.get() };
  }
  function point(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!dragged.current && Math.hypot(dx, dy) < 6) return;
    dragged.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true); setHovered(null);
    rawX.set(clamp(start.yaw + dx * .045, -studioView.yaw, studioView.yaw));
    rawY.set(clamp(start.pitch - dy * .018, -studioView.pitch, studioView.pitch));
  }
  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function resetView() {
    lensReturn.current = null; setLensSubject(null);
    aimYaw.set(0); aimPitch.set(0); rawX.set(0); rawY.set(0); rawZoom.set(1);
  }
  function changeZoom(factor: number) {
    const next = clamp(rawZoom.get() * factor, studioView.minZoom, studioView.maxZoom);
    rawZoom.set(next);
  }
  useEffect(() => {
    const element = stage.current;
    if (!element || !ready || cameraMode) return;
    function wheel(event: WheelEvent) {
      // Only claim zoom gestures over the drawing; the rest of the homepage scrolls normally.
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault(); changeZoom(Math.exp(-event.deltaY * .0008));
    }
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [ready, cameraMode]);
  function markLoaded(name: string) { setLoaded(previous => previous.includes(name) ? previous : [...previous, name]); }
  function enterCamera(event?: { currentTarget: HTMLButtonElement }) {
    enterLens({ kind: 'portrait' }, event?.currentTarget ?? cameraButton.current ?? undefined);
  }
  function toggleLight() { setLight(value => !value); setAnnouncement(light ? '摄影灯已关闭' : '摄影灯已打开'); }
  const hintEvents = (target: Target) => ({
    onPointerEnter: () => setHovered(target), onPointerLeave: () => setHovered(null),
    onFocus: () => setHovered(target), onBlur: () => setHovered(null),
  });
  const hotspot = (target: Target, href: string, style: CSSProperties, label: string) => <a
    className={`scene-hotspot hotspot-${target}`} href={href} style={style}
    aria-label={label} tabIndex={cameraMode ? -1 : 0} {...hintEvents(target)}
  ><span className="hotspot-marker" aria-hidden="true"/><span className="hotspot-label">{hints[target]}</span></a>;

  return <div className={`studio ${cameraMode ? 'is-camera' : ''} ${selectedArtwork ? 'is-artwork-view' : ''} ${light ? 'light-on' : 'light-off'} ${showHints ? 'show-hints' : ''} ${moving ? 'is-moving' : ''} ${dragging ? 'is-dragging' : ''}`} ref={root}>
    <div className="studio-window" ref={stage} tabIndex={0} role="region" aria-label="工作室 2.5D 视图" aria-describedby="studio-view-instructions"
      onPointerDown={startDrag} onPointerMove={point} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}
      onPointerLeave={() => { if (!dragged.current) drag.current = null; setHovered(null); }} onDragStart={event => event.preventDefault()}
      onClickCapture={event => { if (dragged.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || cameraMode || !ready) return;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '0', 'Escape'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') rawX.set(clamp(rawX.get() + (event.key === 'ArrowLeft' ? -4 : 4), -studioView.yaw, studioView.yaw));
        else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') rawY.set(clamp(rawY.get() + (event.key === 'ArrowUp' ? -1 : 1), -studioView.pitch, studioView.pitch));
        else if (event.key === '0' || event.key === 'Escape') resetView();
        else changeZoom(event.key === '-' ? .89 : 1.12);
      }}>
      <div className="scene-accessible-description sr-only">黑白漫画工作室：严晨宇坐在桌前，背后的墙上错落挂着三张电影海报、三张游戏海报和三张音乐图片。点击相机进入人物取景，点击海报进入海报取景，点击音乐封面播放或暂停。右侧摄影灯控制侧光与投影。</div>
      <motion.div className="scene-canvas" animate={{ scale: selectedArtwork ? artworkLensZoom(selectedArtwork) : cameraMode ? 1.65 : 1, x: cameraMode && !selectedArtwork ? '16.5%' : '0%', y: cameraMode && !selectedArtwork ? '-3.25%' : '0%' }} transition={transition} style={{ transformOrigin: '50% 50%' }}>
        {!ready && <img className="studio-poster gallery-studio-poster" src="/assets/studio-poster.webp" width="1448" height="1086" alt="严晨宇的黑白漫画工作室" fetchPriority="high" />}
        <div className="scene-rig" style={{ perspective: stageWidth * studioView.perspective }}>
        <motion.div className="scene-aim" style={{ transformOrigin: `50% 50% ${stageWidth * studioView.perspective}px`, rotateX: reduceMotion ? aimPitch : aimedX, rotateY: reduceMotion ? aimYaw : aimedY }}>
        <motion.div className="scene-room" style={{ rotateX: reduceMotion ? rawY : y, rotateY: reduceMotion ? rawX : x, scale: reduceMotion ? rawZoom : zoom }}>
        <WallGallery selected={selectedArtwork?.id ?? null} onSelect={pointAtArtwork} disabled={!ready || cameraMode} planeStyle={{ transform: wallPlane(stageWidth), visibility: ready ? 'visible' : 'hidden' }} statusHost={musicHost} stageWidth={stageWidth} />
        <div className="scene-layers" style={{ visibility: ready ? 'visible' : 'hidden' }} aria-hidden="true">
          <div className="scene-layer desk-layer" style={{ ...plane('desk'), opacity: selectedArtwork ? 0 : 1 }} aria-hidden="true">
            <img data-layer="desk" src="/assets/desk.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('desk')} onError={() => setFailed(true)} fetchPriority="high" />
            <div className={`monitor-content ${hovered === 'work' ? 'screen-active' : ''}`}><span>WORK IN PROGRESS</span><strong>正在做的事</strong><span className="screen-rule"/><small>我的线上工作室</small></div>
            <div className={`laptop-content ${hovered === 'notes' ? 'screen-active' : ''}`}><span>Notes</span><i/><i/><i/><small>写下来，慢慢想。</small></div>
          </div>
          <motion.div className="scene-layer lamp-layer" animate={{ opacity: cameraMode ? 0 : 1 }} transition={transition} style={plane('lamp')} aria-hidden="true">
            <img data-layer="lamp" src="/assets/lamp.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('lamp')} onError={() => setFailed(true)} />
            <svg className="lamp-overlay" viewBox="0 0 1448 1086"><path className="lamp-shade" d="M1109 78 1215 26 1292 324 1173 321Z" fill="#77776e" fillOpacity=".22"/><g className="light-rays" stroke="#65655f" strokeWidth="2" strokeLinecap="round"><path d="m1074 86-25-12m12 60-28-2m32 46-24 10"/></g></svg>
          </motion.div>
          <div className="scene-layer avatar-layer" style={{ ...plane('avatar'), opacity: selectedArtwork ? 0 : 1 }} aria-hidden="true">
            <div className="avatar-breath">
              <img data-layer="avatar" src="/assets/avatar.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('avatar')} onError={() => setFailed(true)} />
              <img className="blink-frame" style={{ opacity: blinking && blinkReady ? 1 : 0 }} src="/assets/avatar-blink.webp" width="1448" height="1086" alt="" onLoad={() => setBlinkReady(true)} onError={() => setBlinkReady(false)} />
              <span className="avatar-side-light" />
            </div>
          </div>
          <motion.div className="scene-layer camera-layer" style={plane('camera')} animate={{ opacity: cameraMode ? 0 : 1 }} transition={transition} aria-hidden="true">
            <img data-layer="camera" src="/assets/camera.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('camera')} onError={() => setFailed(true)} />
          </motion.div>
        </div>
        {!cameraMode && <div className="scene-targets">
          <div className="scene-hit-plane" style={plane('desk')}>
          {hotspot('work', '/work/', { left: '42%', top: '16%', width: '22%', height: '16%' }, '主显示器：浏览作品')}
          {hotspot('notes', '/notes/', { left: '8.4%', top: '22%', width: '12%', height: '13%' }, '笔记本：阅读文字')}
          {hotspot('contact', '/#contact', { left: '58.2%', top: '34%', width: '4.5%', height: '8%' }, '桌上的手机：联系我')}
          </div>
          <div className="scene-hit-plane" style={plane('avatar')}>
          {hotspot('about', '/about/', { left: '25%', top: '11%', width: '16%', height: '20%' }, '人物：关于严晨宇')}
          </div>
          <div className="scene-hit-plane" style={plane('camera')}>
          <button ref={cameraButton} className="scene-hotspot hotspot-camera" style={{ left: '66%', top: '13%', width: '16%', height: '13%' }} type="button" aria-label="相机：进入取景模式" aria-expanded={cameraMode} aria-controls="camera-viewfinder" onClick={enterCamera} disabled={!ready} {...hintEvents('camera')}><span className="hotspot-marker" aria-hidden="true"/><span className="hotspot-label">{hints.camera}</span></button>
          </div>
          <div className="scene-hit-plane" style={plane('lamp')}>
          <button className="scene-hotspot hotspot-lamp" style={{ left: '82%', top: '4%', width: '10%', height: '22%' }} type="button" aria-label={light ? '关闭摄影灯' : '打开摄影灯'} aria-pressed={light} onClick={toggleLight} disabled={!ready} {...hintEvents('lamp')}><span className="hotspot-marker" aria-hidden="true"/><span className="hotspot-label">{light ? '关灯，休息一下' : '开灯，继续吧'}</span></button>
          </div>
        </div>}
        </motion.div>
        </motion.div>
        </div>
      </motion.div>
      <div className="studio-ambient-shade" aria-hidden="true" />
      <AnimatePresence>
        {cameraMode && <motion.div id="camera-viewfinder" className={`viewfinder ${selectedArtwork ? 'viewfinder-artwork' : 'viewfinder-portrait'}`} role="region" aria-label={selectedArtwork ? `海报取景：《${selectedArtwork.title}》` : '人物取景：严晨宇'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
          <div className="viewfinder-top"><span><span className="camera-dot"/>取景中</span><span>{selectedArtwork ? '海报取景' : '人物取景'}</span></div>
          <div className="focus-bracket" aria-hidden="true"><i/><i/><i/><i/></div>
          {greeting && !selectedArtwork && <motion.p className="camera-greeting" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>嗨，很高兴在这里见到你。</motion.p>}
          <div className="viewfinder-bottom"><span>{selectedArtwork?.title ?? "CHENYU'S STUDIO"}</span><button className="viewfinder-close" ref={closeButton} onClick={exitCamera}><Glyph name="close" size={14}/>退出取景 <kbd>Esc</kbd></button></div>
        </motion.div>}
      </AnimatePresence>
      {failed && <p className="scene-error" role="status">互动素材暂时没加载好。可以通过顶部导航继续浏览。</p>}
    </div>
    <div className="studio-caption"><span>一张桌子，我的小小世界。</span><span className="scene-index">STUDIO / 2026</span></div>
    <div ref={setMusicHost} className="studio-music-host" />
    <p className="studio-view-instructions" id="studio-view-instructions">拖动环绕 · 点击海报取景 · 点击封面听歌<span className="sr-only">。滚轮缩放。聚焦视图后可用方向键环绕，加减键缩放，0 复位，取景时按 Escape 返回之前的视角。</span></p>
    <div className="studio-controls" aria-label="工作室控制">
      <button type="button" onClick={() => setShowHints(value => !value)} aria-pressed={showHints} disabled={cameraMode}><Glyph name="eye" size={16}/><span>{showHints ? '收起提示' : '探索空间'}</span></button>
      <span className="control-divider"/>
      <button type="button" onClick={toggleLight} aria-pressed={light} aria-label={light ? '关闭摄影灯' : '打开摄影灯'} disabled={!ready}><Glyph name="sun" size={17}/></button>
      <button type="button" onClick={cameraMode ? exitCamera : enterCamera} aria-pressed={cameraMode} aria-label={cameraMode ? '退出取景模式' : '进入取景模式'} disabled={!ready}><Glyph name="camera" size={17}/></button>
      <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? '继续场景动画' : '暂停场景动画'} disabled={!!reduceMotion}><Glyph name={paused ? 'play' : 'pause'} size={16}/></button>
      <span className="control-divider"/>
      <button type="button" onClick={() => changeZoom(.89)} aria-label="远离工作室" disabled={!ready || cameraMode}><Glyph name="minus" size={15}/></button>
      <button type="button" onClick={() => changeZoom(1.12)} aria-label="靠近工作室" disabled={!ready || cameraMode}><Glyph name="plus" size={15}/></button>
      <button type="button" aria-label="重置工作室" onClick={() => { resetView(); setLight(true); setPaused(false); setShowHints(false); setAnnouncement('工作室已重置'); }}><Glyph name="reset" size={16}/></button>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
  </div>;
}
