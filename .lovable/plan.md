

# Fix: Community Tab Horizontal Overflow Bug

## Root Cause Analysis

The overflow comes from **one primary culprit** and **one secondary contributor**. Other pages don't have this problem because they don't use these patterns.

### Cause 1: LiveTicker `motion.div` with `whitespace-nowrap` and `translateX` animation

The `LiveTicker` component (lines 38-48 of `Community.tsx`) contains a `motion.div` with:
- `whitespace-nowrap` -- forces all ticker items onto one line
- `animate={{ x: ["0%", "-50%"] }}` -- translates the element horizontally

The ticker content is duplicated (`[...items, ...items]`), so the intrinsic width of this `motion.div` is roughly **2x the text width** (easily 1500px+). The parent `div` at line 37 has `overflow-hidden flex-1 min-w-0`, which **should** contain it. However, the **grandparent** at line 29 is a plain `flex` container with `w-full`, and the LiveTicker root at line 26 uses `sticky top-0 z-50 w-full`.

The problem: the LiveTicker sits **outside** the "shield" `div` (line 80: `overflow-hidden`). It is a direct child of the root `flex-col` container (line 73). Because of Flexbox's default `min-width: auto`, the root flex container's width is influenced by the intrinsic content width of the LiveTicker's animated child, even though the immediate parent clips it. The `min-w-0` at line 37 helps, but the ticker's sticky wrapper at line 26 itself lacks `min-w-0` and `overflow-hidden`.

### Cause 2: The `sticky` vs `overflow` conflict

The LiveTicker needs `position: sticky` to pin to the top. The current architecture places it **before** the `overflow-hidden` shield (line 80). This is correct for sticky behavior -- `position: sticky` breaks when any ancestor has `overflow: hidden`.

However, this means the ticker must **self-contain** its overflow. Currently it doesn't fully do so because the outer flex wrapper (line 29) doesn't prevent its children from stretching the flex parent.

### Why other pages work fine

Pages like `/home` and `/goals` don't have a `whitespace-nowrap` animated element at the top level of their content. They sit cleanly inside the `SidebarInset > div.flex-1.min-w-0.overflow-x-clip` chain from `AppLayout.tsx`, which clips any overflow. The Community page's LiveTicker breaks out of this chain because its intrinsic width pushes the flex container before clipping can occur.

---

## The Fix (3 surgical changes, no `overflow-x-hidden` on body)

### Change 1: Isolate the LiveTicker's overflow

In the LiveTicker wrapper (line 26), add `overflow-hidden` so the animated content cannot push the flex parent:

```
- className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl w-full"
+ className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl w-full overflow-hidden"
```

This is safe because the ticker has no child that needs to visually escape its bounds. The `sticky` positioning still works because `overflow-hidden` on the sticky element itself does not break sticky -- only `overflow-hidden` on an **ancestor** would.

### Change 2: Add `min-w-0` to the root container

On line 73, the root `div` is a flex column child of `SidebarInset`. Add `min-w-0` to prevent Flexbox from using the intrinsic content width:

```
- className="min-h-screen bg-background relative w-full flex flex-col"
+ className="min-h-screen bg-background relative w-full flex flex-col min-w-0"
```

### Change 3: Defensive `max-w-full` on the inner content wrapper

On line 81, the content wrapper already has `max-w-[760px]`, but on very small screens where 760px exceeds viewport width, `mx-auto` can misalign. Add `max-w-full` as a floor:

```
- className="relative z-10 w-full mx-auto px-4 pb-20 max-w-[760px]"
+ className="relative z-10 w-full mx-auto px-4 pb-20 max-w-[min(760px,100%)]"
```

Or equivalently using Tailwind's approach, keep `max-w-[760px]` and add `w-full` (already present) -- the existing code is fine here since `w-full` + `max-w-[760px]` + `mx-auto` handles it. The key fix is Changes 1 and 2.

---

## Files Modified

| File | Line(s) | Change |
|---|---|---|
| `src/pages/Community.tsx` | 26 | Add `overflow-hidden` to LiveTicker sticky wrapper |
| `src/pages/Community.tsx` | 73 | Add `min-w-0` to root flex-col container |

Two lines changed. No business logic, hooks, routing, or i18n affected.

## Why This Works

```text
AppLayout
  SidebarInset (flex-1, flex-col)
    AppLayout inner div (flex-1, min-w-0, overflow-x-clip)  <-- clips children
      Community root (flex-col, min-w-0)                     <-- NEW: won't stretch
        LiveTicker (sticky, overflow-hidden)                 <-- NEW: self-contains animation
          motion.div (whitespace-nowrap, translateX)          <-- no longer pushes parent
        Shield div (overflow-hidden, flex-1)
          Content (max-w-760px, mx-auto)                      <-- properly centered
```

The `sticky` element works because its own `overflow-hidden` does not create a scroll container for sticky positioning -- only ancestor overflow matters. The `min-w-0` on the root prevents Flexbox's `min-width: auto` from using the ticker's intrinsic width as the minimum.
