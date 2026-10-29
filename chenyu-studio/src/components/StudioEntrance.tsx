import { useEffect, useRef } from 'react';
import { wallArtworks, type WallArtwork } from '../data/gallery';

/** A bounded raster buffer avoids scaling an entire masked 3D tree into giant GPU tiles. */
export default function StudioEntrance({ onComplete, onFadeComplete, subject, light = true }: { onComplete: () => void; onFadeComplete?: () => void; subject?: WallArtwork; light?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const output = canvas.current;
    if (!output) return;
    let cancelled = false, frame = 0;
    const finish = () => { if (!cancelled) complete.current(); };
    const load = async (src: string) => {
      const image = new Image(); image.src = src;
      await image.decode(); return image;
    };
    const urls = [...wallArtworks.map(a => `/assets/gallery/${a.image}.webp`), ...(subject ? [] : ['desk', 'lamp', 'avatar', 'camera'].map(a => `/assets/${a}.webp`))];
    Promise.all(urls.map(load)).then(images => {
      if (cancelled) return;
      const box = output.getBoundingClientRect();
      // Cap both DPR and total dimensions; the output never grows with the camera zoom.
      const outputWidth = Math.round(Math.min(1920, box.width * Math.min(devicePixelRatio, 1.5)));
      const outputHeight = Math.round(outputWidth * box.height / box.width);
      const width = Math.round(Math.min(outputWidth, outputHeight * 4 / 3));
      const height = Math.round(width * .75);
      if (!width || !height) { finish(); return; }
      output.width = outputWidth; output.height = outputHeight;
      const scene = document.createElement('canvas'); scene.width = width; scene.height = height;
      const ctx = scene.getContext('2d'), screen = output.getContext('2d', { alpha: false });
      if (!ctx || !screen) { finish(); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
      wallArtworks.forEach((art, index) => {
        const w = width * art.size / 100, h = w * art.height / art.width;
        ctx.save(); ctx.translate(width * art.left / 100 + w / 2, height * art.top / 100 + h / 2); ctx.rotate(art.tilt * Math.PI / 180);
        ctx.shadowColor = light ? '#332c2250' : 'transparent'; ctx.shadowBlur = width * .008; ctx.shadowOffsetX = -width * .009; ctx.shadowOffsetY = width * .006;
        ctx.fillStyle = '#faf8f2'; ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
        ctx.shadowColor = 'transparent'; ctx.drawImage(images[index], -w / 2, -h / 2, w, h);
        if (art.kind !== 'music' && art.id !== 'yotei') { ctx.strokeStyle = '#292925'; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4); }
        else { ctx.fillStyle = '#e8d8b6d9'; ctx.fillRect(-w * .42, -h / 2 - 4, w * .2, 7); }
        ctx.restore();
      });
      const placements = [[.12, .3, .7], [.28, .3, .7], [.12, .3, .7], [.25, .38, .59]];
      if (!subject) placements.forEach(([x, y, size], index) => {
        ctx.save(); ctx.translate(x * width, y * height); ctx.scale(size * width / 100, size * height / 100);
        if (index === 0) {
          const outline = [[0,30],[7.6,30],[7.6,21.3],[20.7,21.3],[22,30],[34.5,30],[34.5,14.7],[40.6,14.7],[40.6,13.1],[62.4,13.1],[62.4,14.7],[64.8,14.7],[64.8,30],[70.4,30],[70.4,24.8],[76,25.3],[77,30],[100,30],[100,100],[0,100]];
          ctx.beginPath(); outline.forEach(([px, py], n) => n ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.clip();
        }
        ctx.drawImage(images[wallArtworks.length + index], 0, 0, 100, 100);
        if (index === 1 && light) {
          ctx.fillStyle = '#ffe8adb8'; ctx.beginPath(); [[76.6,7.2],[83.9,2.4],[89.2,29.8],[81,29.6]].forEach(([px,py],n)=>n ? ctx.lineTo(px,py):ctx.moveTo(px,py)); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      });
      // Bake the warm side light once, rather than recompositing masks on every camera frame.
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = light ? 1 : .12;
      const glow = ctx.createRadialGradient(width * .76, height * .44, 0, width * .76, height * .44, width * .7);
      glow.addColorStop(0, '#ffcf8080'); glow.addColorStop(.5, '#ffe6b533'); glow.addColorStop(1, '#ffffff00');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      // Feather the room into the viewport, rather than exposing a colored rectangular tile.
      ctx.globalCompositeOperation = 'destination-in';
      const edgeX = ctx.createLinearGradient(0, 0, width, 0);
      edgeX.addColorStop(0, '#0000'); edgeX.addColorStop(.08, '#000'); edgeX.addColorStop(.92, '#000'); edgeX.addColorStop(1, '#0000');
      ctx.fillStyle = edgeX; ctx.fillRect(0, 0, width, height);
      const edgeY = ctx.createLinearGradient(0, 0, 0, height);
      edgeY.addColorStop(0, '#0000'); edgeY.addColorStop(.08, '#000'); edgeY.addColorStop(.92, '#000'); edgeY.addColorStop(1, '#0000');
      ctx.fillStyle = edgeY; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over';
      if (subject) {
        const w = width * subject.size / 100, h = w * subject.height / subject.width;
        const zoom = Math.min(outputWidth * .66 / w, outputHeight * .64 / h);
        const cx = width * subject.left / 100 + w / 2, cy = height * subject.top / 100 + h / 2;
        screen.fillStyle = '#fff'; screen.fillRect(0, 0, outputWidth, outputHeight);
        screen.drawImage(scene, outputWidth / 2 - cx * zoom, outputHeight / 2 - cy * zoom, width * zoom, height * zoom);
        // Keep the focused print sharp; only its surrounding wall uses the small snapshot.
        screen.save(); screen.translate(outputWidth / 2, outputHeight / 2); screen.rotate(subject.tilt * Math.PI / 180);
        screen.fillStyle = '#faf8f2'; screen.fillRect(-w * zoom / 2 - 2 * zoom, -h * zoom / 2 - 2 * zoom, (w + 4) * zoom, (h + 4) * zoom);
        screen.drawImage(images[wallArtworks.findIndex(a => a.id === subject.id)], -w * zoom / 2, -h * zoom / 2, w * zoom, h * zoom);
        if (subject.id !== 'yotei') { screen.strokeStyle = '#292925'; screen.lineWidth = 1.5 * zoom; screen.strokeRect(-w * zoom / 2 - 2 * zoom, -h * zoom / 2 - 2 * zoom, (w + 4) * zoom, (h + 4) * zoom); }
        screen.restore();
        scene.width = 0; scene.height = 0;
        return;
      }
      let start = 0;
      const draw = (now: number) => {
        if (cancelled) return;
        if (!start) start = now;
        const progress = Math.min(1, (now - start) / 2800);
        const remaining = (1 - progress) ** 4;
        const zoom = 1 + 4.4 * remaining;
        const x = outputWidth / 2 - width * zoom / 2 + width * .177 * remaining;
        const y = outputHeight / 2 - height * zoom / 2 + height * .169 * remaining;
        screen.fillStyle = '#fff'; screen.fillRect(0, 0, outputWidth, outputHeight);
        screen.drawImage(scene, x, y, width * zoom, height * zoom);
        if (progress < 1) frame = requestAnimationFrame(draw);
        else { scene.width = 0; scene.height = 0; finish(); }
      };
      frame = requestAnimationFrame(draw);
    }).catch(finish);
    // A resize invalidates the neutral camera snapshot; hand back to the responsive live scene.
    if (!subject) window.addEventListener('resize', finish, { once: true });
    return () => { cancelled = true; cancelAnimationFrame(frame); window.removeEventListener('resize', finish); output.width = 0; output.height = 0; };
  }, [subject, light]);
  return <canvas ref={canvas} className={subject ? 'studio-lens-canvas' : 'studio-entrance-canvas'} aria-hidden="true" onTransitionEnd={event => { if (!subject && event.propertyName === 'opacity') onFadeComplete?.(); }} />;
}
