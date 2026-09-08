# Human Atlas XR

Human Atlas progressively enhances the existing desktop/mobile viewer with direct Three.js WebXR support for Meta Quest mixed reality and virtual reality.

## Current implementation

- `immersive-ar` passthrough and `immersive-vr` sessions
- life-size, floor-aligned initial placement
- controller rays, hover, and anatomy selection
- squeeze grab, one-hand movement/yaw, and two-hand scaling from 0.15× to 3×
- world-space systems menu and selected-structure card
- optional hand models and pinch selection
- opt-in Quest rendering diagnostics
- installable web manifest and immersive PWA launch route

Anatomy selection continues to use the desktop React state and the existing merged geometry, visibility textures, shaders, and picking meshes.

## Development

```sh
npm ci
npm run dev
```

Open `http://localhost:3016`. Add `?debugXR=1` to display XR FPS, frame time, draw calls, triangles, loaded chunks, mode, and visible-system count.

Run the complete local suite:

```sh
npm run check
npm run validate:xr
node scripts/validate-atlas.mjs
node scripts/validate-interactions.mjs
npm run build
```

## Quest controls

- Trigger: activate spatial UI or select anatomy
- Squeeze/grip: move and yaw the atlas
- Two grips: move, rotate, and scale the atlas
- Hand pinch: activate spatial UI or select anatomy
- Spatial Reset: restore anatomy state and placement

## Quest PWA packaging

The production manifest is available at:

```text
https://human-atlas-zeta.vercel.app/manifest.webmanifest
```

Install Meta Quest Bubblewrap outside the repository, then initialize and build:

```sh
npm install --global @meta-quest/bubblewrap-cli
bubblewrap init \
  --manifest=https://human-atlas-zeta.vercel.app/manifest.webmanifest \
  --metaquest
bubblewrap build
```

Choose `immersive` app mode during initialization. Keep generated build output in `quest-build/`, and never commit a keystore, signing password, credential, or private key.

After the final Android package name and signing certificate are known, generate Digital Asset Links with the SHA-256 certificate fingerprint and deploy the public file at:

```text
public/.well-known/assetlinks.json
https://human-atlas-zeta.vercel.app/.well-known/assetlinks.json
```

Do not create a placeholder `assetlinks.json`: its package name and fingerprint must match the signed APK exactly.

## Hardware validation still required

Before claiming Quest completion, test on Quest 3:

- MR and VR entry, exit, and switching
- floor height, life-size placement, and passthrough transparency
- both controllers, hover, trigger selection, and squeeze manipulation
- two-controller scale limits and reset
- hand appearance, pinch selection, and controller return
- spatial menu readability and hit targets
- sustained frame cadence with `?debugXR=1`
- installed PWA launch, asset-link verification, and exit/re-entry

The atlas is educational and is not a diagnostic or surgical tool. Preserve [BodyParts3D attribution](public/ATTRIBUTION.md) in every distribution.
