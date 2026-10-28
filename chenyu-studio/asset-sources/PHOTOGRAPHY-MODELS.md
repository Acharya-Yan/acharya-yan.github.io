# Photography equipment — 2026-10-23

The runtime models in `src/lib/space/filming.ts` are original procedural geometry written for this project. They are not official Sony, tripod manufacturer or lighting manufacturer files, and do not include third-party mesh downloads.

## Sony A7 IV reference

- Sony official specifications: https://www.sony.com/electronics/support/e-mount-body-ilce-7-series/ilce-7m4/specifications
- Body dimensions: 131.3 × 96.4 × 79.8 mm; from grip to monitor, 69.7 mm deep.
- Recreation: recognizable A7 IV body proportions, shaped rubber grip, raised electronic viewfinder, hot shoe and contacts, separate mode and control dials, rear vari-angle display and controls, strap lugs, connector covers, zoom/focus rings and concentric lens glass.
- The lens is an original generic E-mount-style zoom representation, not a claim about the user's actual lens. The lens model was not specified.

## Third-party exact-model candidate (not included)

- `SONY A7IV` by MarcosDPF: https://sketchfab.com/3d-models/sony-a7iv-874d213bf51b4523b81abc95d3e24c03
- The publicly indexed listing specifies Creative Commons Attribution and 158.6k triangles.
- This was a precise-model candidate, but a reusable asset was not obtained through the site's normal download workflow. The asset was not extracted from the viewer.
- A public GitHub repository also contains a re-exported `a7iv.glb`, but embedded metadata does not establish the original author or asset license. It was therefore not copied into the website.

## Original supporting models

The tripod and softbox are unbranded original models. They represent plausible equipment rather than asserting a manufacturer's exact product:

- Three-section tripod with hinges, clamps, braces, rubber feet, ball head, plate, knurled locking controls and hanging hook.
- Deep octagonal softbox with segmented fabric shell, seam ribs, front diffuser, rear mounting ring, light body and U-yoke.
- Telescopic stand with tube collars, tightening handles, spreader braces and cable routing.

The implementation uses locally generated canvas textures for tiny labels, display UI and a fine surface bump pattern. No camera access or external texture requests are needed.
