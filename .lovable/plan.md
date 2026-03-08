
## Fix: Progress bar shine overflow in Bar View

**Problem**: `.bar-card-track` has `position: relative` but no `overflow: hidden`. The `.bar-card-shine` animation (`translateX(-100%)` → `translateX(200%)`) visually leaks beyond the filled portion of the progress bar, especially noticeable when the bar is partially filled.

**Fix** (single file edit in `src/index.css`):

1. Add `overflow: hidden` to `.bar-card-track` to clip the shine animation within the filled area
2. Soften the `.bar-card-fill` gradient so it doesn't end in pure white (which amplifies the visual leak) — change `#fff` to a lighter tint of the accent color

**Lines affected**: ~2525–2537 in `src/index.css`
