

# Avatar Frame Alignment Fix -- Audit & Standardization Plan

## Audit Summary

### The Problem
The avatar frame overlay is misaligned on the Bounded Profile (and Shop Fitting Room) because **two competing transform systems** exist, and they disagree on units and scaling.

### System A: `AvatarFrame` component (`avatar-frame.tsx`)
- Applies a **per-size base scale** from `frameSizeMap` (sm=1.2, md=1.3, lg=1.35, xl/2xl=1.4)
- Multiplies that base by the DB `frameScale` value
- Uses **pixel units** for offsets: `translate(${offsetX}px, ${offsetY}px)`
- Used by: **Bounded Profile**, **Fitting Room**, **Admin previews** (via `FramePreview`)

### System B: `computeFrameTransform` (`unified-frame-renderer.tsx`)
- Uses DB `frameScale` directly (no per-size base)
- Uses **percentage units**: `translate(${offsetX}%, ${offsetY}%)`
- Used by: **AdminCosmeticsManager** (imported but only for reference -- the actual preview components use System A)

### The Mismatch
1. **Admin calibrates** offsets labeled as "X Offset (%)" and "Y Offset (%)" -- values like 5 mean "5%"
2. **AvatarFrame renders** those same values as `5px` -- completely different visual result
3. The per-size `baseScale` multiplier (1.2-1.4) inflates the frame differently at each size, making admin calibration at one size look wrong at another
4. `computeFrameTransform` exists as the "unified" solution but is never wired into `AvatarFrame`

### Affected Surfaces
| Surface | Component | Issue |
|---|---|---|
| Bounded Profile | `AvatarFrame` size="2xl" | Offsets treated as px instead of %, wrong base scale |
| Shop Fitting Room | `AvatarFrame` size="lg" | Same transform bug, different size = different misalignment |
| Admin Previews | `FramePreview` (alias of `AvatarFrame`) | Shows wrong result because same broken transform |
| Admin Alignment Tool | Sliders write % values | Values stored correctly, but rendered incorrectly everywhere |

---

## Fix Plan

### Step 1: Rewire `AvatarFrame` to use the Unified Transform

Replace the manual transform calculation in `avatar-frame.tsx` with `computeFrameTransform`:
- Remove `frameSizeMap` (the per-size base scales)
- Remove the manual `baseScale * frameScale` multiplication
- Call `computeFrameTransform({ frameScale, frameOffsetX, frameOffsetY })` and apply the returned `transform` + `transformOrigin` directly to the frame overlay `div`
- This ensures offsets are `%`-based and scale is applied uniformly

### Step 2: Update `FramePreview` in the same file

Since `FramePreview` delegates to `AvatarFrame`, it automatically inherits the fix. No separate change needed.

### Step 3: Align Shop Fitting Room preview

The `FittingRoom.tsx` already passes `frameScale`, `frameOffsetX`, `frameOffsetY` to `AvatarFrame`. Once Step 1 is done, the Fitting Room preview will automatically match the Bounded Profile -- no code changes needed here.

### Step 4: Verify Admin previews

`AdminCosmeticsManager.tsx` uses `FramePreview` (aliased as `InlineFramePreview`). Since Step 1 fixes the underlying component, admin previews will also be correct. The `computeFrameTransform` import in AdminCosmeticsManager can remain for any direct usage.

### Step 5: Clean up the Unified Renderer module

Remove `frameSizeConfig` from `unified-frame-renderer.tsx` since the avatar/frame sizing is handled by `sizeMap` in `avatar-frame.tsx` (Tailwind classes). Keep `computeFrameTransform`, `FrameTransformParams`, and `FRAME_CONTAINER_SIZES` as documentation.

---

## Technical Details

The core change in `avatar-frame.tsx` line 66-76 goes from:

```text
// BEFORE (broken)
const baseScale = parseFloat(frameSizeMap[size]...);  // 1.2-1.4
const finalScale = baseScale * (frameScale || 1);
transform: scale(finalScale) translate(offsetX_px, offsetY_px)
```

to:

```text
// AFTER (unified)
const { transform, transformOrigin } = computeFrameTransform({
  frameScale, frameOffsetX, frameOffsetY
});
// Applied directly to the overlay div's style
```

This is a **single-file fix** (`avatar-frame.tsx`) that propagates to all 4 surfaces (Profile, Shop, Admin previews, Fitting Room) because they all use the same component.

