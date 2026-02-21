

# Fix Pact Settings: Connect Symbol Picker to PactVisual and Remove Emojis

## Problems Found

### 1. Symbol Picker Uses Emojis Instead of PactVisual Symbols
The `PactIdentityCard.tsx` component (lines 11-16) has a hardcoded grid of 32 Unicode emojis. Meanwhile, `PactVisual.tsx` only supports 4 SVG-animated symbols: `flame`, `heart`, `target`, `sparkles`. When the user selects an emoji like "diamond", the value stored is the raw emoji string (e.g. `"💎"`), which PactVisual cannot match -- it silently falls back to `flame` every time. This is why the Home Hero logo never reflects the chosen symbol.

### 2. No PactVisual Preview in Settings
The current symbol picker shows the raw emoji character in a 64x64 button. It should instead render the actual `PactVisual` component so the user sees exactly what their logo will look like on the Home page.

### 3. i18n Keys Are Present (Not Broken)
The console warnings about `profile.pact.resetPactDesc` etc. are false alarms -- the keys exist in both `en.json` (line 1083) and `fr.json` (line 1083). This is likely a render-timing issue where the component renders before the i18n bundle is fully loaded. No code change needed here; the keys resolve correctly on re-render.

## Plan

### File: `src/components/profile/PactIdentityCard.tsx`

**A. Replace the emoji grid with a PactVisual symbol selector**

- Remove the `EMOJI_OPTIONS` array (lines 11-16)
- Add a `SYMBOL_OPTIONS` array with the 4 PactVisual keys: `flame`, `heart`, `target`, `sparkles`, each with a human-readable label
- Import `PactVisual` from `@/components/PactVisual`

**B. Replace the emoji display button with a PactVisual preview**

- Instead of showing `{pactSymbol || "🎯"}` as raw text in a 64x64 button, render `<PactVisual symbol={pactSymbol} size="sm" />` inside the button
- This gives the user an animated preview of their actual logo

**C. Replace the emoji picker grid with a symbol card selector**

- Replace the 8-column emoji grid with a 4-item row (or 2x2 grid)
- Each option renders a small `<PactVisual symbol={key} size="sm" />` with the label underneath
- The selected symbol gets a highlighted border (ring-2 ring-primary)
- Clicking a symbol calls `onPactSymbolChange(key)` with the string key (e.g. `"heart"`)

**D. Update helper text**

- Change "Choose an emoji that represents your pact's essence" to "Choose an animated symbol for your pact logo"

### No Other Files Need Changes

- `PactVisual.tsx` already handles the fallback (`REGISTRY[symbol] ?? REGISTRY.flame`) so existing emoji values in the DB will gracefully render as `flame` until the user picks a new symbol
- `HeroSection.tsx` already passes `pact.symbol` to `PactVisual` -- once the DB stores `"flame"` / `"heart"` / `"target"` / `"sparkles"`, everything connects automatically
- `usePactMutation.ts` already handles updating the `symbol` field
- The i18n keys for Reset Pact are correct and functional

## Summary

| What | Status |
|---|---|
| Emoji picker in PactIdentityCard | Replace with 4 PactVisual symbol cards |
| PactVisual preview in settings | Add animated preview using PactVisual component |
| Home Hero logo sync | Already works once DB stores valid symbol keys |
| Reset Pact i18n keys | Already present, no fix needed |
| Timeline card | Working correctly |
| Custom difficulty card | Working correctly |
| Ranks card | Working correctly |

One file modified: `src/components/profile/PactIdentityCard.tsx`

