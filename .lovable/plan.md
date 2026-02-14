
# Avatar Frame UX Fixes & Admin Border Control

## Issues Identified

1. **Upload overlay misaligned**: The upload circle (`div` with `rounded-full` at line 378) covers `absolute inset-0` of the parent wrapper, but the parent wrapper includes the glow effect which extends beyond the avatar. The overlay needs to be scoped to the avatar element only, not the full `AvatarFrame` wrapper.

2. **Upload overlay triggers on card hover**: The `group` class is on the outer wrapper (line 357), so hovering anywhere on the card area triggers the overlay. The `group` + `group-hover` must be moved to a tighter container around just the avatar.

3. **Blue border always visible**: The `AvatarFrame` component hardcodes `border-2` on the Avatar (line 54). Some frames (like Rapunzel, Cherry Blossom) cover the avatar entirely, making the border look bad. This should be configurable per frame.

4. **No color preview for RGBA inputs**: The admin form has plain text inputs for `border_color` and `glow_color` with no visual swatch.

---

## Plan

### Step 1: Database Migration -- Add `show_border` and `avatar_border_color` to `cosmetic_frames`

Add two new columns:
- `show_border` (BOOLEAN, default TRUE) -- whether to display the avatar border ring
- `avatar_border_color` (TEXT, default '#5bb4ff') -- customizable border color per frame

This lets admins decide per-frame whether the border appears and what color it is.

### Step 2: Fix Upload Overlay Alignment in `ProfileBoundedProfile.tsx`

- Move the `group` class from the outer wrapper (line 357) to a new inner wrapper that wraps only the `AvatarFrame` component
- Scope the upload overlay `div` to sit exactly over the avatar, not the glow area
- Change hover detection: only show upload icon when hovering directly over the avatar circle

### Step 3: Update `AvatarFrame` Component -- Conditional Border

- Add `showBorder` prop (default `true`) to `AvatarFrame`
- When `showBorder` is false, remove the `border-2` class from the Avatar element
- The `borderColor` prop already exists, so it continues to work when border is shown

### Step 4: Wire Frame Border Settings Through the System

- Update `CosmeticFrame` interfaces in `ProfileBoundedProfile.tsx` and `AdminCosmeticsManager.tsx` to include `show_border` and `avatar_border_color`
- Pass `showBorder={activeFrame?.show_border !== false}` and `borderColor={activeFrame?.avatar_border_color || activeFrame?.border_color}` to `AvatarFrame`
- Do the same in `FittingRoom.tsx` (Shop preview)

### Step 5: Admin Form -- Add Border Control Fields

In the Frame creation/editing dialog of `AdminCosmeticsManager.tsx`:
- Add a "Show Avatar Border" toggle (Switch) -- visible for both Classic and Image modes
- Add an "Avatar Border Color" input with a color swatch preview

### Step 6: Add Color Preview Swatches to All Color Inputs

For every color/RGBA text input in the admin forms (border_color, glow_color, gradient_start, gradient_end, text_color, avatar_border_color):
- Add a small colored square (`div`) next to the input that renders the current value as its `backgroundColor`
- This gives immediate visual feedback without needing a full color picker

---

## Technical Details

**Migration SQL:**
```text
ALTER TABLE cosmetic_frames
  ADD COLUMN show_border BOOLEAN DEFAULT TRUE,
  ADD COLUMN avatar_border_color TEXT DEFAULT '#5bb4ff';
```

**AvatarFrame prop change:**
```text
// New prop
showBorder?: boolean;  // default true

// Avatar element: conditionally apply border
<Avatar className={cn(
  showBorder ? "border-2" : "",
  "relative z-10 bg-background",
  sizeMap[size]
)} style={{ borderColor: showBorder ? borderColor : "transparent" }}>
```

**Upload overlay fix (ProfileBoundedProfile):**
The current structure nests the overlay as a sibling to `AvatarFrame` inside a `group` div. The fix wraps only the `Avatar` area in the `group` scope and positions the overlay to match the avatar dimensions using the same `sizeMap` classes.

**Color swatch pattern for admin inputs:**
```text
<div className="flex items-center gap-2">
  <div
    className="w-8 h-8 rounded border border-primary/30 shrink-0"
    style={{ backgroundColor: value }}
  />
  <Input value={value} onChange={...} />
</div>
```

**Files to modify:**
- `supabase/migrations/` -- new migration for `show_border` + `avatar_border_color`
- `src/components/ui/avatar-frame.tsx` -- add `showBorder` prop
- `src/components/profile/ProfileBoundedProfile.tsx` -- fix overlay, wire new props
- `src/pages/AdminCosmeticsManager.tsx` -- add border toggle, color swatches
- `src/components/shop/FittingRoom.tsx` -- wire new props to preview
