import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

type Target = 'about' | 'work' | 'notes' | 'contact' | 'camera' | 'lamp';
const hints: Record<Target, string> = {
  about: '认识一下 →', work: '看看我的作品 →', notes: '读一点文字 →',
  contact: '打个招呼 →', camera: '从镜头里看看', lamp: '试试这盏灯',
};
function Glyph({ name, size = 18 }: { name: 'camera' | 'sun' | 'close' | 'reset' | 'eye' | 'pause' | 'play'; size?: number }) {
  const paths = {
    camera: 'M3 7h5l2-3h4l2 3h5v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    sun: 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    close: 'M6 6l12 12M18 6 6 18',
    reset: 'M3 11a9 9 0 1 1 2.4 7M3 4v7h7',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    pause: 'M8 5v14M16 5v14',
    play: 'm8 4 12 8-12 8z',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Studio() {
  const root = useRef<HTMLDivElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState<Target | null>(null);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [blinkReady, setBlinkReady] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [light, setLight] = useState(true);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [cameraMode, setCameraMode] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const reduceMotion = useReducedMotion();
  const ready = loaded.length === 4 && !failed;
  const moving = ready && visible && !paused && !reduceMotion;
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 110, damping: 28 });
  const y = useSpring(rawY, { stiffness: 110, damping: 28 });
  const backX = useTransform(x, v => v * 0.35);
  const backY = useTransform(y, v => v * 0.35);
  const frontX = useTransform(x, v => v * 1.1);
  const frontY = useTransform(y, v => v * 1.1);
  const transition = { duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const };

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

  useEffect(() => {
    if (!moving) { rawX.set(0); rawY.set(0); }
  }, [moving, rawX, rawY]);

  function exitCamera() {
    setCameraMode(false);
    setAnnouncement('已回到工作室');
    requestAnimationFrame(() => cameraButton.current?.focus({ preventScroll: true }));
  }
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

  function point(event: PointerEvent<HTMLDivElement>) {
    if (!moving || cameraMode || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - box.left) / box.width - 0.5) * 9);
    rawY.set(((event.clientY - box.top) / box.height - 0.5) * 6);
  }
  function markLoaded(name: string) { setLoaded(previous => previous.includes(name) ? previous : [...previous, name]); }
  function enterCamera() {
    setCameraMode(true); setHovered(null); setGreeting(true); rawX.set(0); rawY.set(0);
    setAnnouncement('已进入虚拟取景，按 Escape 返回工作室');
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

  return <div className={`studio ${cameraMode ? 'is-camera' : ''} ${light ? 'light-on' : 'light-off'} ${showHints ? 'show-hints' : ''} ${moving ? 'is-moving' : ''}`} ref={root}>
    <div className="studio-window" onPointerMove={point} onPointerLeave={() => { rawX.set(0); rawY.set(0); setHovered(null); }}>
      <div className="scene-accessible-description sr-only">黑白漫画工作室：严晨宇戴着透明框眼镜，坐在桌前，背后是双屏桌搭。前方架高的相机与人物视线接近，摄影灯在右侧。</div>
      <motion.div className="scene-canvas" animate={{ scale: cameraMode ? 1.65 : 1, x: cameraMode ? '10%' : '0%', y: cameraMode ? '14%' : '0%' }} transition={transition} style={{ transformOrigin: '36% 30%' }}>
        {!ready && <img className="studio-poster" src="/assets/studio-poster.webp" width="1448" height="1086" alt="严晨宇的黑白漫画工作室" fetchPriority="high" />}
        <div className="scene-layers" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true">
          <motion.div className="scene-layer desk-layer" style={{ x: backX, y: backY }}>
            <img data-layer="desk" src="/assets/desk.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('desk')} onError={() => setFailed(true)} fetchPriority="high" />
            <div className={`monitor-content ${hovered === 'work' ? 'screen-active' : ''}`}><span>WORK IN PROGRESS</span><strong>正在做的事</strong><span className="screen-rule"/><small>我的线上工作室</small></div>
            <div className={`laptop-content ${hovered === 'notes' ? 'screen-active' : ''}`}><span>Notes</span><i/><i/><i/><small>写下来，慢慢想。</small></div>
          </motion.div>
          <motion.div className="scene-layer lamp-layer" animate={{ opacity: cameraMode ? 0 : 1 }} transition={transition} style={{ x: backX, y: backY }}>
            <img data-layer="lamp" src="/assets/lamp.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('lamp')} onError={() => setFailed(true)} />
            <svg className="lamp-overlay" viewBox="0 0 1448 1086"><path className="lamp-shade" d="M1109 78 1215 26 1292 324 1173 321Z" fill="#77776e" fillOpacity=".22"/><g className="light-rays" stroke="#65655f" strokeWidth="2" strokeLinecap="round"><path d="m1074 86-25-12m12 60-28-2m32 46-24 10"/></g></svg>
          </motion.div>
          <motion.div className="scene-layer avatar-layer" style={{ x, y }}>
            <div className="avatar-breath">
              <img data-layer="avatar" src="/assets/avatar.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('avatar')} onError={() => setFailed(true)} />
              <img className="blink-frame" style={{ opacity: blinking && blinkReady ? 1 : 0 }} src="/assets/avatar-blink.webp" width="1448" height="1086" alt="" onLoad={() => setBlinkReady(true)} onError={() => setBlinkReady(false)} />
            </div>
          </motion.div>
          <motion.div className="scene-layer camera-layer" style={{ x: frontX, y: frontY }} animate={{ opacity: cameraMode ? 0 : 1 }} transition={transition}>
            <img data-layer="camera" src="/assets/camera.webp" width="1448" height="1086" alt="" onLoad={() => markLoaded('camera')} onError={() => setFailed(true)} />
          </motion.div>
        </div>
        {!cameraMode && <div className="scene-targets">
          {hotspot('work', '/work/', { left: '42%', top: '16%', width: '22%', height: '16%' }, '主显示器：浏览作品')}
          {hotspot('notes', '/notes/', { left: '8.4%', top: '22%', width: '12%', height: '13%' }, '笔记本：阅读文字')}
          {hotspot('about', '/about/', { left: '25%', top: '11%', width: '16%', height: '20%' }, '人物：关于严晨宇')}
          {hotspot('contact', '/#contact', { left: '58.2%', top: '34%', width: '4.5%', height: '8%' }, '桌上的手机：联系我')}
          <button ref={cameraButton} className="scene-hotspot hotspot-camera" style={{ left: '66%', top: '13%', width: '16%', height: '13%' }} type="button" aria-label="相机：进入取景模式" aria-expanded={cameraMode} aria-controls="camera-viewfinder" onClick={enterCamera} disabled={!ready} {...hintEvents('camera')}><span className="hotspot-marker" aria-hidden="true"/><span className="hotspot-label">{hints.camera}</span></button>
          <button className="scene-hotspot hotspot-lamp" style={{ left: '82%', top: '4%', width: '10%', height: '22%' }} type="button" aria-label={light ? '关闭摄影灯' : '打开摄影灯'} aria-pressed={light} onClick={toggleLight} disabled={!ready} {...hintEvents('lamp')}><span className="hotspot-marker" aria-hidden="true"/><span className="hotspot-label">{light ? '关灯，休息一下' : '开灯，继续吧'}</span></button>
        </div>}
      </motion.div>
      <AnimatePresence>
        {cameraMode && <motion.div id="camera-viewfinder" className="viewfinder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
          <div className="viewfinder-top"><span><span className="camera-dot"/>取景中</span><span>虚拟镜头</span></div>
          <div className="focus-bracket" aria-hidden="true"><i/><i/><i/><i/></div>
          {greeting && <motion.p className="camera-greeting" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>嗨，很高兴在这里见到你。</motion.p>}
          <div className="viewfinder-bottom"><span>CHENYU'S STUDIO</span><button className="viewfinder-close" ref={closeButton} onClick={exitCamera}><Glyph name="close" size={14}/>退出取景 <kbd>Esc</kbd></button></div>
        </motion.div>}
      </AnimatePresence>
      {failed && <p className="scene-error" role="status">互动素材暂时没加载好。可以通过顶部导航继续浏览。</p>}
    </div>
    <div className="studio-caption"><span>一张桌子，我的小小世界。</span><span className="scene-index">STUDIO / 2026</span></div>
    <div className="studio-controls" aria-label="工作室控制">
      <button type="button" onClick={() => setShowHints(value => !value)} aria-pressed={showHints} disabled={cameraMode}><Glyph name="eye" size={16}/><span>{showHints ? '收起提示' : '探索空间'}</span></button>
      <span className="control-divider"/>
      <button type="button" onClick={toggleLight} aria-pressed={light} aria-label={light ? '关闭摄影灯' : '打开摄影灯'} disabled={!ready}><Glyph name="sun" size={17}/></button>
      <button type="button" onClick={cameraMode ? exitCamera : enterCamera} aria-pressed={cameraMode} aria-label={cameraMode ? '退出取景模式' : '进入取景模式'} disabled={!ready}><Glyph name="camera" size={17}/></button>
      <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? '继续场景动画' : '暂停场景动画'} disabled={!!reduceMotion}><Glyph name={paused ? 'play' : 'pause'} size={16}/></button>
      <button type="button" aria-label="重置工作室" onClick={() => { if (cameraMode) exitCamera(); setLight(true); setPaused(false); setShowHints(false); setAnnouncement('工作室已重置'); }}><Glyph name="reset" size={16}/></button>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
  </div>;
}
