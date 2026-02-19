
# Fix: Community Page Off-Center Layout

## Root Cause (Final)

The fix applied so far (on `Community.tsx` lines 26 and 73) was correct but insufficient. The overflow escapes one level higher in the flex chain:

```text
SidebarProvider (flex container)
  Sidebar (fixed width)
  SidebarInset <main> (flex-1 flex-col)       <-- NO min-w-0 here!
    AppLayout div (flex-1 min-w-0 overflow-x-clip)
      Community root (flex-col min-w-0)
        LiveTicker (sticky overflow-hidden)
        Shield (overflow-hidden)
```

The `SidebarInset` component renders a `<main>` with `flex-1 flex-col` but **no `min-w-0`**. Because of Flexbox's default `min-width: auto`, the `<main>` stretches to accommodate the intrinsic width of any deep child -- even though the AppLayout inner div has `overflow-x-clip`, the `<main>` itself has already expanded beyond the viewport. The `mx-auto` centering then centers content within this too-wide `<main>`, pushing visible content to the right.

Other pages don't trigger this because they have no wide intrinsic content (no `whitespace-nowrap` animated ticker).

## The Fix

**File: `src/components/layout/AppLayout.tsx`** (1 line change)

Add `min-w-0 overflow-x-hidden` to the `SidebarInset` component via its className prop. This constrains the `<main>` element to never exceed its flex-allocated width.

```tsx
// Before:
<SidebarInset>

// After:
<SidebarInset className="min-w-0 overflow-x-hidden">
```

This is safe because:
- `min-w-0` prevents flexbox stretch -- the `<main>` respects its allocated width
- `overflow-x-hidden` clips any remaining overflow at this level
- The `sticky` LiveTicker still works because `overflow-x-hidden` on an ancestor only breaks sticky along the same axis if combined with `overflow-y` constraints (we're not adding that)
- All other pages are unaffected since they don't have overflowing content

## Technical Details

| File | Change |
|---|---|
| `src/components/layout/AppLayout.tsx` | Add `className="min-w-0 overflow-x-hidden"` to `<SidebarInset>` |

One prop addition. No business logic, hooks, routing, or i18n affected.
