

# Shop Module: Graphic Overhaul Plan

## Audit Summary

### Current State
The shop has **27 component files** with a solid functional foundation (3D tilt cards, hold-to-buy, fitting room, unlock animation, rarity systems). However, the visual execution has several weaknesses:

### Visual Issues Found

1. **Header is underwhelming**: The "SHOP" title + typewriter subtitle sits in a low-contrast panel with barely visible grid/orbs. No visual weight to anchor the page.

2. **Featured Spotlight is flat**: The "Void Purple" legendary card is just a rectangle with a gold border. No dramatic staging -- should be the most eye-catching element on the page.

3. **CyberItemCards look identical**: All frames show the same structure regardless of rarity. The "ACQUIRED" stamp is a plain rotated text box. The 3D tilt effect is subtle to the point of being invisible. Card backgrounds are uniformly dark.

4. **Empty states are boring**: "No Bundles Available" and "No Daily Deals" are plain text with a dim icon. Missed opportunity for atmospheric design.

5. **Category sidebar (Cosmetics tab) is utilitarian**: Plain text buttons with no visual identity per category.

6. **Tab bar lacks punch**: The beam underline animation is good but the overall bar is too muted -- gets lost against the background.

7. **BondsShop is over-designed relative to the rest**: The Bonds tab has `rounded-[2.5rem]` cards, 6xl text, and heavy gradients that clash with the subtler aesthetic of the other tabs.

8. **ModulesShop uses CyberItemCard instead of ModuleCard**: The sidebar `/shop` `ModulesShop` renders `CyberItemCard` components (small grid), while `ModuleCard` (the elaborate neon-glow card from `index.css`) exists but isn't used here. This creates an inconsistency.

9. **Scan lines and grid overlays are overused**: Nearly every component has the same `opacity-[0.03]` grid and scan-line pattern, creating visual noise without differentiation.

10. **No depth hierarchy**: Header, featured spotlight, daily deals, bundles, and item grid all sit at the same visual plane with identical card treatments.

---

## Redesign Plan

### Phase 1: Elevated Header -- "Black Market Terminal"

**File: `src/pages/Shop.tsx`**

Transform the header into a commanding presence:
- Replace the low-contrast grid panel with a **full-bleed gradient hero strip** using a dramatic `linear-gradient(135deg, hsl(var(--background)), hsl(270 30% 8%), hsl(var(--background)))` -- adding a subtle purple tint to distinguish from page background
- Add **animated "signal bars"** next to the title: 3 thin vertical bars that pulse in sequence (like a signal strength indicator), colored in primary
- Replace the typewriter with a **static** styled subtitle in `font-mono uppercase tracking-[0.3em]` (typewriter animations replay on every render and feel jittery)
- Make the `ShopBondDisplay` larger and more prominent with a stronger glow halo
- Add a **thin horizontal "data stream"** line below the header: a `1px` gradient line with a small bright dot that travels left-to-right continuously (CSS animation)

### Phase 2: Featured Spotlight -- "Holographic Showcase"

**File: `src/components/shop/ShopSpotlight.tsx`**

Make it the visual centerpiece:
- Increase the preview area size from `w-24/32` to `w-36/48` for more visual impact
- Add a **holographic prismatic reflection**: a moving diagonal gradient stripe that sweeps across the card every 4 seconds (CSS `background-position` animation on a pseudo-overlay)
- The "FEATURED" badge should pulse with a star particle burst effect
- Add a **"SPOTLIGHT"** watermark text behind the preview at 3% opacity in massive `font-orbitron` (rotated -12deg) for dramatic staging
- Improve the parallax -- currently the `mousePos` calculation moves items by only 8px. Increase to 16px for the preview and add a counter-parallax on the info block (-6px)

### Phase 3: CyberItemCard -- "Rarity-Differentiated Panels"

**File: `src/components/shop/CyberItemCard.tsx`**

Make each rarity tier visually distinct:
- **Common**: Keep current flat style but add a very faint diagonal stripe pattern (like carbon fiber) at 3% opacity
- **Rare**: Add a subtle blue ambient gradient in the preview area (`radial-gradient` at top-center)
- **Epic**: Add a slow-breathing purple border glow that pulses every 3 seconds (not just on hover)
- **Legendary**: Add animated golden light particles (3-4 small dots that float up inside the card) using CSS keyframes -- always visible, not just on hover

For the **"ACQUIRED" stamp**, redesign it:
- Replace the simple rotated text with a **holographic badge overlay**: a centered hexagonal stamp with a checkmark inside, using `backdrop-filter: blur(4px)` and a green-tinted border
- Add a subtle shimmer sweep across the stamp every 5 seconds

### Phase 4: Daily Deals -- "Emergency Broadcast"

**File: `src/components/shop/DailyDealCard.tsx`**

Increase urgency:
- Add a **pulsing red border-left accent** (3px) to create an "alert" visual
- The countdown timer digits should use a **darker background** with stronger amber glow
- Add a subtle **diagonal "DEAL" watermark** across the card at 2% opacity
- The discount badge should have a **starburst** shape instead of a simple rounded rectangle (using `clip-path: polygon()` with zigzag points)

### Phase 5: Tab Bar -- "Command Selector"

**File: `src/components/shop/ShopTabs.tsx`**

Make tabs more commanding:
- Increase overall height from `py-2.5` to `py-3.5`
- Add a **corner notch** on the active tab (a small triangular cut at top-left using `clip-path`) to make it feel like a hardware selector switch
- Each tab icon should have a **faint glow dot** underneath it when active (a `2px` circle)
- On tab hover (non-active), add a brief `hud-flicker` animation to the icon

### Phase 6: Empty States -- "Signal Lost"

**Files: `src/components/shop/BundlesSection.tsx`, `src/components/shop/DailyDealsSection.tsx`, `src/components/shop/WishlistPanel.tsx`**

Replace boring empty states with atmospheric ones:
- Center a **large circular "static" animation**: a div with randomly positioned small dots that flicker at different rates, simulating TV static
- Text: "NO SIGNAL" in `font-orbitron` with `animate-hud-flicker`
- Subtitle: "Check back later" in `font-mono` with a blinking cursor
- Add thin horizontal scan lines across the empty area at 5% opacity

### Phase 7: ModulesShop Consistency

**File: `src/components/shop/ModulesShop.tsx`**

The ModulesShop currently uses CyberItemCard in a 3-col grid, which makes modules look like cosmetic items. Switch to the dedicated `ModuleCard` component which has the elaborate neon-glow hover effect and features list, matching the sidebar modules tab.

### Phase 8: Bonds Shop -- Visual Harmony

**File: `src/components/shop/BondsShop.tsx`**

The Bonds tab is visually disconnected from the rest (over-rounded, over-sized). Tone it down:
- Reduce border-radius from `rounded-[2.5rem]` to `rounded-2xl` to match the rest of the shop
- Reduce the balance number from `text-5xl` to `text-3xl`
- Use the same card style (border + subtle glow) as CyberItemCard for the bond packs instead of the heavy gradient panels
- Keep the "Trust Footer" but reduce its padding

### Phase 9: Cosmetic Category Sidebar

**File: `src/components/shop/CosmeticShop.tsx`**

Give each category a small icon badge with a rarity-colored dot indicator showing how many items of each rarity exist in that category:
- Next to the count number, add tiny colored dots (blue for rare count, purple for epic, gold for legendary)
- Active category: add a vertical `2px` left-border accent in primary color

### Phase 10: Page-Level Ambient Enhancements

**File: `src/pages/Shop.tsx`**

- Replace the `CyberBackground` floating orbs with a **more subtle animated hexagonal grid** at 3% opacity (matching the health module's HUD aesthetic for cross-app consistency)
- Add a **floating "NEW" notification dot** near the tab bar if there are items the user hasn't seen before (based on creation date vs last visit -- cosmetic only, no DB change needed)
- The glitch transition between tabs should be more pronounced: increase opacity from `0.04` to `0.08` and add a brief horizontal offset (`translateX(2px)`) to simulate CRT distortion

---

## Technical Summary

### Files Modified
- `src/pages/Shop.tsx` -- header redesign, ambient enhancements, glitch improvement
- `src/components/shop/ShopTabs.tsx` -- taller tabs, corner notch, glow dots
- `src/components/shop/ShopSpotlight.tsx` -- holographic sweep, larger preview, watermark
- `src/components/shop/CyberItemCard.tsx` -- rarity-differentiated backgrounds, new ACQUIRED stamp
- `src/components/shop/DailyDealCard.tsx` -- alert accent, starburst badge, stronger timer
- `src/components/shop/BundlesSection.tsx` -- atmospheric empty state
- `src/components/shop/DailyDealsSection.tsx` -- atmospheric empty state
- `src/components/shop/WishlistPanel.tsx` -- atmospheric empty state
- `src/components/shop/ModulesShop.tsx` -- switch to ModuleCard
- `src/components/shop/BondsShop.tsx` -- reduce over-design, harmonize with shop style
- `src/components/shop/CosmeticShop.tsx` -- sidebar rarity dots

### Files NOT Modified
- All hooks (useShop, useWishlist, useBundles, etc.) -- no logic changes
- Database schema -- no changes
- PurchaseConfirmModal, UnlockAnimation, HoldPurchaseButton, FittingRoom -- already well-designed
- ShopFilters, ShopLoadingState, PromoCodeRedemption -- functional, low priority
- ModuleCard component -- already has good styling, just needs to be used

