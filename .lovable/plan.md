

# Complete Journal Module Redesign: CHRONOLOG

## Overview

Replace the current journal UI with the premium cyberpunk "CHRONOLOG" design from the uploaded reference file. This includes a new animated header with rotating rings, hex stat badges, search/filter toolbar, redesigned entry cards with per-entry styling (accent color, font, size, alignment), and a full-screen 3-panel editor (Write / Style / Meta).

## Database Migration

Add 4 new columns to `journal_entries` to support per-entry styling:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `accent_color` | text | `'cyan'` | Per-entry accent color (cyan, purple, red, gold, blue, green) |
| `font_id` | text | `'mono'` | Font selection (mono, mono-i, raj) |
| `size_id` | text | `'md'` | Text size (xs, sm, md, lg, xl) |
| `align_id` | text | `'left'` | Text alignment (left, center, right) |
| `line_numbers` | boolean | `false` | Show line numbers in entry body |

Also update the `mood` column: existing values (`contemplative`, `reflective`, etc.) will remain valid in the DB but the UI will present 6 new mood options: `flow`, `tension`, `static`, `signal`, `void`, `surge`. Old entries keep their mood value and display gracefully.

## File Changes

### 1. `src/types/journal.ts` -- Update constants

- Replace `MOOD_CONFIG` with new `MOOD_OPTIONS` array matching the reference (flow/tension/static/signal/void/surge with geometric symbols)
- Add `ACCENT_COLORS`, `FONT_OPTIONS`, `SIZE_OPTIONS`, `ALIGN_OPTIONS` constants
- Add helper functions: `getAccent()`, `getMood()`, `getFont()`, `getSize()`, `getAlign()`
- Update `JournalEntry` interface to include new fields: `accent_color`, `font_id`, `size_id`, `align_id`, `line_numbers`

### 2. `src/index.css` -- Add journal animations

Add keyframes and utility classes for the CHRONOLOG design:
- `@keyframes scanline` -- scanning line effect
- `@keyframes pulse` -- pulsing glow
- `@keyframes rotate-slow` / `rotate-slow-r` -- rotating ring decorations
- `@keyframes dash-march` -- dashed stroke animation
- `@keyframes hud-blink` -- HUD corner blinking
- `@keyframes float-up` -- particle float effect
- `@keyframes grid-scroll` -- background grid scrolling
- Classes: `.journal-scanline`, `.journal-noise`, `.journal-grid-bg`, `.journal-orb-left`, `.journal-orb-right`

### 3. `src/components/journal/JournalDecorations.tsx` -- New file

Extract reusable sci-fi decoration components from the reference:
- `HUDCorner` -- corner bracket decoration
- `RotatingRing` -- SVG rotating ring
- `SciFiDivider` -- divider with tick marks and center label
- `HexBadge` -- hexagonal stat badge (SVG)
- `HUDStatusLine` -- animated progress bar with label/value

### 4. `src/pages/Journal.tsx` -- Complete redesign

Replace the current simple layout with the CHRONOLOG design:
- **Background layer**: Grid background, orbs, scanline, noise overlay, corner frames, side decorations with live clock
- **Header**: Centered layout with rotating rings around a status orb, "CHRONOLOG" title with gradient text, system label, hex stat badges (entries count, pinned count, word count)
- **Toolbar**: Full-width search input with geometric icon prefix, mood filter pills row (6 moods), "NEW ENTRY" button with HUD corner decorations
- **Entry list**: `SciFiDivider` between entries, `AnimatePresence` for smooth transitions, infinite scroll sentinel at bottom, "END_OF_LOG" terminator
- **Delete dialog**: Keep existing AlertDialog but match new visual style

### 5. `src/components/journal/JournalEntryCard.tsx` -- Complete redesign

Replace the current card with the reference's `EntryCard` design:
- Dark glassmorphic card with subtle left accent line (colored by entry's accent)
- Pinned entries get a glow bar at the top
- Vertical "ENTRY::001" index watermark on the right
- Meta row: mood dot + label badge, date in `YYYY.MM.DD // HH:MM` format, pin indicator
- Action menu: 3-dot button opening an animated dropdown (Edit, Pin/Unpin, Delete)
- Title in Orbitron font, respects per-entry alignment
- Body with optional line numbers, uses per-entry font/size/alignment
- Footer: tags as `/tag` badges, valence (V) and energy (E) HUD status bars
- Content rendered as HTML (from Tiptap) via `dangerouslySetInnerHTML`

### 6. `src/components/journal/JournalNewEntryModal.tsx` -- Replace with full-screen editor

Replace the Dialog modal with a full-screen overlay editor matching the reference:
- **Top bar**: Status dot + "NEW_ENTRY"/"EDIT_ENTRY" label, 3 panel tabs (WRITE / STYLE / META), word count, ESC button, SAVE button with glow
- **WRITE panel**: Large title input (Orbitron font), Tiptap rich text editor (keep existing `JournalEditor` component but adapt styling)
- **STYLE panel**: 2-column grid with accent color selector (6 colors), mood selector (6 moods with geometric symbols), font selector (3 options with preview), size selector (5 options), alignment selector (3 options), line numbers toggle
- **META panel**: 2-column grid with valence bar selector (10 clickable bars with gradient fill), energy bar selector (10 bars), tags input with `/tag` display, live mini-preview card, goal linking, life context input
- All panels use `StyleSection` sub-component (dot + label + line separator pattern)

### 7. `src/components/journal/JournalEditor.tsx` -- Minor styling update

Keep the Tiptap editor but adjust its container styling to blend with the full-screen editor:
- Remove outer border/rounded styling (the parent provides context)
- Adjust toolbar to match the dark full-screen aesthetic
- Keep all formatting buttons (Bold, Italic, Underline, Strikethrough)

### 8. `src/hooks/useJournal.ts` -- Update mutation payloads

- Update `useCreateJournalEntry` mutation type to accept new fields: `accent_color`, `font_id`, `size_id`, `align_id`, `line_numbers`
- Update `useUpdateJournalEntry` to include new fields in the `updates` partial type

## Technical Details

### Data Mapping (Reference to DB)

| Reference field | DB column | Notes |
|---|---|---|
| `accentId` | `accent_color` | String: cyan/purple/red/gold/blue/green |
| `fontId` | `font_id` | String: mono/mono-i/raj |
| `sizeId` | `size_id` | String: xs/sm/md/lg/xl |
| `alignId` | `align_id` | String: left/center/right |
| `lineNumbers` | `line_numbers` | Boolean |
| `pinned` | `is_favorite` | Reuse existing column |
| `mood` | `mood` | New values: flow/tension/static/signal/void/surge |
| `valence` | `valence_level` | Integer 1-10 (unchanged) |
| `energy` | `energy_level` | Integer 1-10 (unchanged) |
| `body` | `content` | HTML string from Tiptap (unchanged) |

### Backward Compatibility

- Old mood values (contemplative, reflective, etc.) won't match any MOOD_OPTION; the `getMood()` helper defaults to `flow`, so legacy entries display gracefully
- Old entries without accent/font/size/align values use column defaults (cyan, mono, md, left)

### Component Architecture

```text
Journal.tsx (page)
  +-- Background decorations (inline)
  +-- RotatingRing (header)
  +-- HexBadge x3 (stats)
  +-- Search input
  +-- Mood filter pills
  +-- SciFiDivider (between entries)
  +-- JournalEntryCard (per entry)
  |     +-- HUDStatusLine (valence/energy bars)
  +-- JournalFullEditor (full-screen overlay)
        +-- Panel tabs: WRITE / STYLE / META
        +-- JournalEditor (Tiptap, in WRITE panel)
        +-- StyleSection sub-components (in STYLE/META)
```

## Summary

| Item | Action |
|---|---|
| Database | Add 5 columns to `journal_entries` |
| `src/types/journal.ts` | Rewrite constants, update interface |
| `src/index.css` | Add ~60 lines of journal animations |
| `src/components/journal/JournalDecorations.tsx` | New file (5 decoration components) |
| `src/pages/Journal.tsx` | Complete redesign |
| `src/components/journal/JournalEntryCard.tsx` | Complete redesign |
| `src/components/journal/JournalNewEntryModal.tsx` | Replace with full-screen editor |
| `src/components/journal/JournalEditor.tsx` | Minor style adjustments |
| `src/hooks/useJournal.ts` | Update mutation types for new fields |

