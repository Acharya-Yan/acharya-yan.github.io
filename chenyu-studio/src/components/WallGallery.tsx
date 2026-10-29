import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { wallArtworks, type WallArtwork } from '../data/gallery';

type Playback = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
type AudioSource = { src: string; label?: string };
type AudioManifest = Record<string, AudioSource | null>;

function PlayGlyph({ pause }: { pause: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d={pause ? 'M8 5v14M16 5v14' : 'm8 5 11 7-11 7Z'} /></svg>;
}

export default function WallGallery({ selected, onSelect, disabled, planeStyle, statusHost, stageWidth }: {
  selected: string | null;
  onSelect: (artwork: WallArtwork, trigger: HTMLButtonElement) => void;
  disabled: boolean;
  planeStyle: CSSProperties;
  statusHost: HTMLDivElement | null;
  stageWidth: number;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const manifest = useRef<AudioManifest | null>(null);
  const requestId = useRef(0);
  const activeId = useRef<string | null>(null);
  const statusRef = useRef<Playback>('idle');
  const [active, setActive] = useState<WallArtwork | null>(null);
  const [status, setStatus] = useState<Playback>('idle');
  const [progress, setProgress] = useState(0);
  const [sourceLabel, setSourceLabel] = useState('');
  const [failedImages, setFailedImages] = useState<string[]>([]);

  function updateStatus(next: Playback) { statusRef.current = next; setStatus(next); }

  useEffect(() => {
    const player = audio.current;
    const controller = new AbortController();
    fetch('/audio/tracks.json', { cache: 'no-cache', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data && typeof data === 'object' && !Array.isArray(data)) manifest.current = data; })
      .catch(() => {});
    return () => { requestId.current++; controller.abort(); player?.pause(); };
  }, []);

  async function toggleMusic(artwork: WallArtwork) {
    const player = audio.current;
    if (!player) return;
    if (activeId.current === artwork.id && ['playing', 'loading'].includes(statusRef.current)) {
      requestId.current++;
      player.pause();
      // A click while resolving the source cancels playback, rather than starting later.
      updateStatus(player.getAttribute('src') ? 'paused' : 'idle');
      return;
    }
    const ticket = ++requestId.current;
    const resume = activeId.current === artwork.id && statusRef.current === 'paused' && !!player.getAttribute('src');
    player.pause();
    activeId.current = artwork.id;
    setActive(artwork);
    if (!resume) {
      player.removeAttribute('src'); player.load(); setProgress(0); setSourceLabel('');
    }
    updateStatus('loading');
    try {
      if (!resume) {
        if (!manifest.current) {
          const response = await fetch('/audio/tracks.json', { cache: 'no-cache' });
          if (!response.ok) throw new Error('Audio catalog unavailable');
          const data: unknown = await response.json();
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid audio catalog');
          manifest.current = data as AudioManifest;
        }
        if (ticket !== requestId.current) return;
        const source = manifest.current[artwork.id];
        if (!source || typeof source.src !== 'string' || !source.src) throw new Error('Audio source unavailable');
        const url = new URL(source.src, location.origin);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid audio source');
        player.src = url.href;
        setSourceLabel(typeof source.label === 'string' ? source.label : '');
      }
      await player.play();
      if (ticket !== requestId.current) return;
      updateStatus('playing');
    } catch {
      if (ticket !== requestId.current) return;
      player.pause();
      // Let the visitor retry a previously missing or temporarily unavailable source.
      manifest.current = null;
      updateStatus('error');
    }
  }

  return <>
    <div className="gallery-wall" style={planeStyle} aria-label="我的电影、游戏与音乐收藏" role="group" inert={disabled}>
      {wallArtworks.map(artwork => {
        const music = artwork.kind === 'music';
        const isActive = active?.id === artwork.id;
        const playing = isActive && status === 'playing';
        const loading = isActive && status === 'loading';
        const centerX = artwork.left + artwork.size / 2;
        const centerY = artwork.top + artwork.size * (4 / 3) * artwork.height / artwork.width / 2;
        const shadowX = (centerX - 94) * .15 * stageWidth / 1000;
        const shadowY = (5 + (centerY - 14) * .12) * stageWidth / 1000;
        return <button key={artwork.id} type="button" data-artwork={artwork.id}
          className={`wall-artwork ${music ? 'wall-music' : 'wall-poster'} ${selected === artwork.id ? 'is-selected' : ''} ${playing ? 'is-playing' : ''}`}
          style={{ left: `${artwork.left}%`, top: `${artwork.top}%`, width: `${artwork.size}%`, aspectRatio: `${artwork.width} / ${artwork.height}`, '--art-tilt': `${artwork.tilt}deg`, '--track-progress': `${progress}%`, '--cast-x': `${shadowX}px`, '--cast-y': `${shadowY}px`, '--cast-soft-x': `${shadowX * 1.65}px`, '--cast-soft-y': `${shadowY * 1.65}px` } as CSSProperties}
          aria-label={music ? `${playing || loading ? '暂停' : '播放'}《${artwork.title}》，${artwork.artist}` : `从相机镜头里查看《${artwork.title}》海报`}
          aria-pressed={music ? playing : selected === artwork.id}
          aria-controls={music ? undefined : 'camera-viewfinder'}
          aria-busy={loading || undefined}
          onClick={event => music ? void toggleMusic(artwork) : onSelect(artwork, event.currentTarget)}>
          <img src={`/assets/gallery/${artwork.image}.webp`} width={artwork.width} height={artwork.height} alt="" draggable={false} decoding="async" style={{ visibility: failedImages.includes(artwork.id) ? 'hidden' : undefined }} onError={() => setFailedImages(previous => previous.includes(artwork.id) ? previous : [...previous, artwork.id])} />
          {failedImages.includes(artwork.id) && <span className="artwork-unavailable">{artwork.title}<small>图片暂未加载</small></span>}
          <span className="artwork-caption">{artwork.title}{music && <small>{artwork.artist}</small>}</span>
          {music && <><span className="music-toggle" aria-hidden="true"><PlayGlyph pause={playing || loading} /></span><span className="music-progress" aria-hidden="true" /></>}
        </button>;
      })}
      <img className="wall-cast-shadow" src="/assets/avatar.webp" width="1448" height="1086" alt="" aria-hidden="true" draggable={false} />
    </div>
    <audio ref={audio} preload="none"
      onTimeUpdate={() => { const player = audio.current; if (player && Number.isFinite(player.duration) && player.duration > 0) setProgress(player.currentTime / player.duration * 100); }}
      onEnded={() => { updateStatus('idle'); setProgress(0); }}
      onPause={() => { if (statusRef.current === 'playing') updateStatus('paused'); }}
      onPlaying={() => { if (!audio.current?.paused) updateStatus('playing'); }}
      onError={() => { if (audio.current?.getAttribute('src')) updateStatus('error'); }} />
    {active && statusHost && createPortal(<div className={`studio-music-status music-${status}`} role="status" aria-live="polite">
      <span>{active.title}<small> · {active.artist}</small></span>
      {status === 'error' ? <><span>暂时无法播放</span><button type="button" onClick={() => void toggleMusic(active)}>重试</button><a href={active.listenUrl} target="_blank" rel="noreferrer">前往收听 <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10"/></svg></a></> : <><span>{status === 'loading' ? '正在加载…' : status === 'playing' ? '正在播放' : status === 'paused' ? '已暂停' : '已停止'}{sourceLabel && ` · ${sourceLabel}`}</span>{status !== 'idle' && <button type="button" aria-label={`${status === 'playing' || status === 'loading' ? '暂停' : '继续播放'}《${active.title}》`} onClick={() => void toggleMusic(active)}><PlayGlyph pause={status === 'playing' || status === 'loading'} /></button>}</>}
    </div>, statusHost)}
  </>;
}
