# MacBook Pro 14-inch model research

Research date: 2026-10-23. The integrated model is **self-authored procedural geometry**, implemented in `src/lib/space/macbook.ts`. It is not an official Apple mesh. No downloaded third-party model is shipped in this directory.

## Dimensions and product reference

Apple's MacBook Pro (14-inch, 2021) specification: https://support.apple.com/en-us/111902

Enclosure: 31.26 × 22.12 × 1.55 cm. 14.2-inch display. 78 U.S. keys with a full-height function row and Touch ID, large Force Touch trackpad, speaker grilles, three USB-C ports, MagSafe 3, HDMI, SDXC and 3.5-mm jack. These publicly described product features informed the original geometry; small features are visually estimated, not engineering CAD.

The user specified 14-inch MacBook Pro, but not model year or chip. The 2021 enclosure is used as the dimensional reference, not as a claim about the user's exact generation.

## Official Apple AR model found, not included

Apple page: https://www.apple.com/macbook-pro/

The page's “View in your space” link points to:
https://www.apple.com/105/media/us/macbook-pro/2025/785e1bc4-d1bd-4cf4-b1b3-94b9411c9e74/ar/macbook-pro-14-in-space-black-variant.usdz

A temporary local inspection confirmed a 10,584,277-byte USDZ archive containing USD meshes and textures. Embedded metadata states `Copyright (c) 2025 Apple Inc. All rights reserved.` The file has not been copied to public assets or converted for redistribution. Apple's website terms do not provide a general open reuse license: https://www.apple.com/legal/internet-services/terms/site.html

## Licensed third-party alternative found, not downloaded

“2021 Macbook Pro 14\" (M1 Pro / M1 Max)” by akshatmittal:
https://sketchfab.com/3d-models/2021-macbook-pro-14-m1-pro-m1-max-f6b0b940fb6a4286b18a674ef32af2d3

Public Sketchfab API confirms CC BY 4.0, commercial use allowed with author attribution and `isDownloadable: true`. Published model stats: approximately 105,000 triangles / 68,300 vertices.

Metadata endpoint: https://api.sketchfab.com/v3/models/f6b0b940fb6a4286b18a674ef32af2d3
License: https://creativecommons.org/licenses/by/4.0/

The official download endpoint returned HTTP 401 (authentication required). No authentication was bypassed and no protected viewer assets were extracted. This asset can replace the original study after a normal authorized download, with attribution retained.

## Original geometry detail

Rounded CNC-style aluminum unibody, separate underside panel and polished rim, individual key caps with locally rendered legend atlas, recessed keyboard well, Touch ID ring, trackpad perimeter, instanced speaker perforations, rubber feet and underside screws, side ports and connectors, rear vent slits, hinge, rounded lid, black glass bezel, display notch and lens.

No Apple logo, Apple wallpaper, Apple mesh or Apple texture is included. The application supplies its own screen artwork. Apple and MacBook Pro are trademarks of Apple Inc.; the personal website is not endorsed by Apple.
