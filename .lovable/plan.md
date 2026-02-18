
# Shop Overhaul: Gamified Video Game Store Experience

## Current State Assessment

The shop already has solid foundations: rarity-based styling, Hold-to-Buy mechanic, Fitting Room preview, UnlockAnimation, CyberItemCard with scanlines, and a tabbed layout. However, the experience still feels like a standard e-commerce page rather than a true in-game store.

### Key Weaknesses Identified
- **Shop.tsx header** is flat text -- no immersive "entering the shop" feeling
- **ShopTabs** are plain pills with no gaming personality
- **CosmeticShop** uses a desktop sidebar layout that breaks on mobile and feels static
- **CyberItemCard** has scanlines/grid but lacks dynamic hover interactions (no 3D tilt, no particle trails, no rarity shimmer on borders)
- **DailyDealCard** is a basic horizontal card -- should feel urgent and premium like a "featured item" showcase
- **BundleCard** is functional but flat -- no visual hierarchy between rarities
- **WishlistPanel** and **PurchaseHistory** are plain list UIs with no gamified flavor
- **UnlockAnimation** plays a basic burst -- could be more cinematic with rarity-specific effects
- **ShopBondDisplay** is a simple pill -- should feel like a HUD currency counter
- **No ambient effects** -- no floating particles, no background pulse on tab changes
- **No "Featured/Spotlight" hero banner** at the top of the Cosmetics tab

---

## Improvement Plan (8 Phases)

### Phase 1: Immersive Shop Header and HUD Currency

**Shop.tsx -- Cinematic Header**
- Replace flat h1/subtitle with a full-width "shop entrance" hero banner
- Add a subtle animated grid/circuit-board background behind the title
- Title rendered with animated gradient shimmer (left-to-right sweep)
- Tagline uses a typewriter-style reveal on mount
- Add floating particle emitters (2-3 slow-moving orbs) behind the header

**ShopBondDisplay -- HUD-Style Currency Counter**
- Redesign as a "holographic HUD" element with animated border segments
- Bond balance animates (count-up) when it changes
- Add a subtle pulse glow when balance is low (< 500 bonds)
- Show a small "+Buy" button that switches to the Bonds tab

### Phase 2: Premium Tab Navigation

**ShopTabs -- Game Menu Style**
- Replace pill bar with segmented HUD-style tabs featuring:
  - Active tab gets an animated underline beam (left-to-right sweep)
  - Icon gets a glow effect when active
  - Tab labels use Orbitron font with letter-spacing animation on hover
  - Add a subtle "click" haptic-style scale animation on tab change
  - Wishlist tab heart icon pulses when count > 0

### Phase 3: Featured Spotlight Section (New Component)

**ShopSpotlight.tsx (NEW)**
- Large hero card at the top of the Cosmetics tab (replaces current plain DailyDeals position)
- Full-width card featuring the rarest/most expensive item with:
  - Large preview image/frame with parallax-on-hover effect
  - Rarity-specific animated border (rainbow shimmer for legendary)
  - Countdown timer with dramatic styling
  - "FEATURED" holographic badge
  - One-click "Quick Buy" or "Preview" CTA

### Phase 4: CyberItemCard V2 -- 3D Hover and Rarity Shimmer

**CyberItemCard.tsx -- Visual Upgrade**
- Add CSS perspective + rotateX/rotateY on mouse move for 3D tilt effect
- Legendary/Epic cards get animated gradient border shimmer (rotating conic-gradient)
- On hover: card slightly lifts (translateZ), inner glow intensifies, item name gets text-shadow
- Rarity badge becomes a glowing chip with animated dot
- Price display: Bond icon gets a micro-spin animation
- "BUY" button replaced with a mini Hold-to-Buy bar for consistency
- Owned state: display a holographic "ACQUIRED" stamp overlay instead of just opacity reduction

### Phase 5: Daily Deals and Bundles -- Premium Showcase

**DailyDealsSection.tsx -- Urgent & Cinematic**
- Section header gets a pulsing "LIVE" dot + animated countdown timer
- Cards arranged in a horizontal scroll carousel (snap scrolling) instead of vertical stack
- Each deal card gets a "glitch" text effect on the discount percentage
- Timer display with flip-clock style digits

**BundlesSection.tsx -- Loot Crate Aesthetic**
- Bundle cards redesigned as "crate" visuals with a 3D box perspective
- Items inside shown as stacked layers with a peek/reveal animation on hover
- Savings amount displayed as a glowing "VALUE" badge
- Legendary bundles get particle effects around the card border

### Phase 6: Wishlist and History -- Gamified Lists

**WishlistPanel.tsx -- Inventory Style**
- Redesign as a "mission loadout" interface
- Items displayed in a grid (2 columns) instead of a plain list
- Each item gets a mini rarity border glow
- "Can afford" items get a pulsing green indicator
- Add a "Total Cost" summary bar at the bottom with a "Buy All Affordable" button
- Empty state: animated hologram placeholder

**PurchaseHistory.tsx -- Mission Log**
- Redesign as a "transaction ledger" with terminal-style rows
- Dates shown as "mission timestamps" with monospace font
- Add subtle scan-line animation across the list
- Earning transactions get a green "CREDIT" tag, spending gets amber "DEBIT"
- Summary cards at bottom get animated count-up numbers

### Phase 7: Enhanced Purchase Flow

**PurchaseConfirmModal.tsx -- Dramatic Confirmation**
- Add a rarity-specific background animation (particle field)
- Item preview area gets a spotlight/glow effect
- Price breakdown uses animated number transitions
- "Confirm" button replaced with HoldPurchaseButton for consistency across all purchase flows
- Add a "Balance Warning" threshold indicator when purchase leaves < 100 bonds

**UnlockAnimation.tsx -- Cinematic Reveal**
- Stage 1 (burst): Screen flash + shockwave ring expanding outward
- Stage 2 (reveal): Item materializes with a "digital assembly" effect (scanlines converging)
- Stage 3 (complete): Rarity-specific confetti (gold for legendary, purple sparks for epic)
- Add rarity-specific sound variations (deeper/more dramatic for higher rarity)
- Show "+1 [item type]" floating text that fades up

### Phase 8: Ambient Effects and Polish

**Global Shop Atmosphere**
- Add a subtle vignette overlay to the shop page edges
- CyberBackground gets shop-specific configuration (slower particles, rarity-colored based on active tab)
- Tab transitions use a brief "static/glitch" flash effect
- Scroll position triggers parallax on background elements
- Add a subtle ambient hum/drone sound option (respecting sound settings)

---

## Technical Details

### Files Modified
| File | Change |
|---|---|
| `src/pages/Shop.tsx` | Header redesign, vignette overlay, ambient config |
| `src/components/shop/ShopTabs.tsx` | HUD beam tabs, glow effects, animations |
| `src/components/shop/ShopBondDisplay.tsx` | HUD counter, count-up animation, low-balance pulse |
| `src/components/shop/CyberItemCard.tsx` | 3D tilt, shimmer borders, ACQUIRED stamp, enhanced hover |
| `src/components/shop/CosmeticShop.tsx` | Integrate Spotlight, responsive sidebar |
| `src/components/shop/DailyDealsSection.tsx` | Carousel layout, flip timer, glitch discount |
| `src/components/shop/DailyDealCard.tsx` | Urgent styling, flip-clock timer |
| `src/components/shop/BundlesSection.tsx` | Crate aesthetic, particle borders |
| `src/components/shop/BundleCard.tsx` | 3D crate look, hover reveal, VALUE badge |
| `src/components/shop/WishlistPanel.tsx` | Grid layout, loadout style, "Buy All" button |
| `src/components/shop/PurchaseHistory.tsx` | Terminal ledger, scan-lines, animated counters |
| `src/components/shop/PurchaseConfirmModal.tsx` | Hold-to-Buy integration, particle bg, spotlight |
| `src/components/shop/UnlockAnimation.tsx` | Shockwave, digital assembly, rarity confetti |

### New Files
| File | Purpose |
|---|---|
| `src/components/shop/ShopSpotlight.tsx` | Featured item hero banner with parallax |

### Dependencies
- No new packages needed -- all effects built with existing `framer-motion`, Tailwind CSS, and vanilla CSS

### Implementation Order
Phases 1-2 first (header + tabs = immediate visual impact), then 4 (cards = most visible), then 3 + 5 (sections), then 6-7 (flows), then 8 (polish).
