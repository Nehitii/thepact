

# Focus Mode — Active Session Effects

## Current State
When a focus session is running:
- Subtle scan lines overlay (`opacity-[0.02]`)
- Toolbar and panels are hidden
- Timer ring shows progress with glow

## Proposed Effects During Active Focus

### 1. Ambient Floating Particles
Soft glowing particles drifting upward around the timer ring — creates a sense of energy and immersion.

### 2. Pulsing Vignette
A subtle radial gradient that pulses gently at the edges of the screen, reinforcing focus on the center.

### 3. Enhanced Ring Breathing
The outer decorative rings pulse/breathe slowly to indicate active state.

### 4. Subtle Glow Aura
A soft glow behind the timer that intensifies as progress increases.

### 5. Phase Transition Flash
Brief flash effect when transitioning between work ↔ break phases.

---

## Implementation

### New Component: `FocusAmbientEffects.tsx`
Contains all ambient effects, activated only when `timer.isRunning`:
- **Floating particles**: CSS-animated orbs drifting upward
- **Pulsing vignette**: Radial gradient with breathing animation
- **Respects user settings**: Uses `particles_enabled` preference

### Changes to `FocusTimerRing.tsx`
- Add breathing animation to outer decorative rings during active session
- Increase glow intensity based on `progress`

### Changes to `Focus.tsx`
- Add `<FocusAmbientEffects />` component when running
- Brief flash overlay on phase change

---

## Files

| File | Action |
|------|--------|
| `src/components/focus/FocusAmbientEffects.tsx` | **Create** |
| `src/components/focus/index.ts` | Export new component |
| `src/components/focus/FocusTimerRing.tsx` | Add breathing animation to rings |
| `src/pages/Focus.tsx` | Integrate ambient effects + phase flash |

