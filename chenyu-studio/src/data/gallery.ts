/** Wall coordinates use the same 4:3 canvas as the approved studio drawings. */
export interface WallArtwork {
  id: string;
  title: string;
  artist?: string;
  kind: 'movie' | 'game' | 'music';
  image: string;
  width: number;
  height: number;
  left: number;
  top: number;
  size: number;
  tilt: number;
  listenUrl?: string;
}

export const wallArtworks: WallArtwork[] = [
  { id: 'social-network', title: '社交网络', kind: 'movie', image: 'the-social-network', width: 479, height: 755, left: 5.5, top: 5, size: 11.4, tilt: -1.1 },
  { id: 'odyssey', title: '奥德赛', kind: 'movie', image: 'the-odyssey', width: 2000, height: 3000, left: 25, top: 10, size: 10.3, tilt: 1 },
  { id: 'bouquet', title: '花束般的恋爱', kind: 'movie', image: 'we-made-a-beautiful-bouquet', width: 566, height: 800, left: 42, top: 1, size: 12.3, tilt: -.8 },
  { id: 'apex', title: 'Apex Legends', kind: 'game', image: 'apex-legends', width: 600, height: 900, left: 61, top: 2.5, size: 11.8, tilt: .8 },
  { id: 'gta-vi', title: 'GTA VI', kind: 'game', image: 'gta-vi', width: 1080, height: 1920, left: 79, top: 6.5, size: 10.8, tilt: -.7 },
  { id: 'yotei', title: '羊蹄山之魂', kind: 'game', image: 'ghost-of-yotei', width: 2400, height: 2323, left: 57.5, top: 33, size: 12.4, tilt: -.7 },
  { id: 'cai-er-shi-san', title: '才二十三', artist: '方大同', kind: 'music', image: 'cai-er-shi-san', width: 1200, height: 1200, left: 3.5, top: 32.5, size: 10.3, tilt: .8, listenUrl: 'https://music.apple.com/us/album/1762980605' },
  { id: 'skinny-love', title: '瘦子', artist: '丁世光', kind: 'music', image: 'skinny-love', width: 1200, height: 1200, left: 18.5, top: 32, size: 10.3, tilt: -1.1, listenUrl: 'https://music.apple.com/cn/album/1733590258' },
  { id: 'hua-hai', title: '花海', artist: '龚琳娜 / 美依礼芽', kind: 'music', image: 'hua-hai', width: 1763, height: 975, left: 73, top: 35.2, size: 17, tilt: -.7, listenUrl: 'https://w.mgtv.com/b/542234/18873338.html?lang=zh-cn' },
];

export const wallDepth = -180;
const perspective = 1.65;

export function wallPlane(width: number) {
  const depth = wallDepth * width / 1000;
  return `translateZ(${depth}px) scale(${1 - wallDepth / (1000 * perspective)})`;
}

/** Inverse camera rotation about the eye, with no translation, zoom or FOV change. */
export function artworkAim(artwork: WallArtwork, zoom: number) {
  const neutralScale = 1 - wallDepth / (1000 * perspective);
  const dx = ((artwork.left + artwork.size / 2) / 100 - .5) * neutralScale * zoom;
  const artworkHeight = artwork.size * (4 / 3) * artwork.height / artwork.width;
  const dy = ((artwork.top + artworkHeight / 2) / 100 - .5) * .75 * neutralScale * zoom;
  // The room's CSS scale is planar; it scales x/y while the wall's z stays fixed.
  const distance = perspective - wallDepth / 1000;
  return {
    yaw: Math.atan2(dx, distance) * 180 / Math.PI,
    pitch: -Math.atan2(dy, Math.hypot(distance, dx)) * 180 / Math.PI,
  };
}

/** Fit the projected print inside the same viewfinder used for the portrait. */
export function artworkLensZoom(artwork: WallArtwork) {
  const aim = artworkAim(artwork, 1);
  const yaw = aim.yaw * Math.PI / 180, pitch = aim.pitch * Math.PI / 180;
  const tilt = artwork.tilt * Math.PI / 180;
  const scale = 1 - wallDepth / (1000 * perspective);
  const width = artwork.size / 100, height = width * artwork.height / artwork.width;
  const cx = (artwork.left / 100 + width / 2 - .5) * scale;
  const cy = (artwork.top / 100 * .75 + height / 2 - .375) * scale;
  const points = [-1, 1].flatMap(x => [-1, 1].map(y => {
    const localX = x * width / 2, localY = y * height / 2;
    const dx = cx + (localX * Math.cos(tilt) - localY * Math.sin(tilt)) * scale;
    const dy = cy + (localX * Math.sin(tilt) + localY * Math.cos(tilt)) * scale;
    const dz = wallDepth / 1000 - perspective;
    const rx = dx * Math.cos(yaw) + dz * Math.sin(yaw);
    const rz = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const ry = dy * Math.cos(pitch) - rz * Math.sin(pitch);
    const depth = dy * Math.sin(pitch) + rz * Math.cos(pitch);
    return { x: rx * perspective / -depth, y: ry * perspective / -depth };
  }));
  // Use distance from the optical center, so perspective and the paper's tilt cannot crop a corner.
  const halfWidth = Math.max(...points.map(point => Math.abs(point.x)));
  const halfHeight = Math.max(...points.map(point => Math.abs(point.y)));
  return Math.min(.33 / halfWidth, (.75 * .32) / halfHeight, 4.5);
}
