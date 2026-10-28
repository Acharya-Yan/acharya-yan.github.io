/** Shared camera geometry for the laboratory and the homepage's aligned drawings. */
export const studioDepth = { desk: -65, lamp: 85, avatar: 125, camera: 270 } as const;
export const studioView = { perspective: 1.65, yaw: 12, pitch: 3, minZoom: .9, maxZoom: 1.85 } as const;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function studioPlane(layer: keyof typeof studioDepth, width: number, viewportWidth = width) {
  const depth = studioDepth[layer] * width / 1000;
  // Keep every drawing aligned at the neutral angle despite its different depth.
  return `translateZ(${depth}px) scale(${1 - depth / (viewportWidth * studioView.perspective)})`;
}
