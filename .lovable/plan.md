

# Super Goal Cards: Visual Integration Fix

## Problem
The three Super Goal card variants (Grid, Bar, Bookmark) have sizing and styling issues that make them look inconsistent with regular goal cards:
- The "SUPER" tag is a separate floating badge that doesn't integrate with the card's tag system
- The Crown icon takes up the entire image area instead of being part of the tag
- Super goals don't display images like regular cards do (they show a giant Crown instead)
- In Bookmark view, the "SUPER" badge crowds the top alongside the difficulty badge

## Solution

Treat Super Goal cards as visually identical to their regular counterparts, with one distinctive addition: a premium "SUPER" tag that combines the Crown icon and text into a single, eye-catching badge.

---

## Changes Per View

### 1. Grid View (SuperGoalGridCard.tsx)
- **Image area**: Use the same image/placeholder logic as `GridViewGoalCard` -- show `goal.image_url` if available, otherwise show an `ImageOff` placeholder (not a giant Crown)
- **Remove**: The separate gold border glow overlay, the large Crown in the image area, and the small Crown in the glass panel header
- **"SUPER" tag**: Replace the current amber badge in the top-right with a distinctive tag placed in the glass panel's header row (where regular cards show tags). The tag uses a gold gradient background with a small inline Crown icon: `[Crown] SUPER`. Give it a shimmer/glow effect to stand out
- **Size**: Already matches regular grid cards (max-w-340, aspect 4/5) -- no change needed

### 2. Bar View (SuperGoalBarCard.tsx)
- **Image area**: Accept an `image_url` prop. Show the image in the frame if available, Crown placeholder only if no image (same as regular BarViewGoalCard shows Target placeholder)
- **"SUPER" tag**: Keep it inline in the `.tags-row` but restyle it as a distinctive gold gradient pill (matching the new tag design) with a small inline Crown icon. Same size as the difficulty tag
- **Size**: Already matches regular bar cards (max-w-680, 120px) -- no change needed

### 3. Bookmark View (SuperGoalBookmarkCard.tsx)
- **Image area**: Accept an `image_url` prop. Show the image in the top section if available, otherwise show a gradient with Target/Crown placeholder (same as regular UIVerseGoalCard)
- **"SUPER" tag**: Remove it from the top-right corner. Place it **below the card name** as a centered, distinctive gold gradient badge with Crown icon
- **Size**: Already matches regular bookmark cards (210x280) -- no change needed

---

## The "SUPER" Tag Design (shared across all 3 views)

A distinctive tag that truly stands out from difficulty and regular tags:
- Gold gradient background (`linear-gradient(135deg, #b8860b, #fbbf24, #b8860b)`)
- White text (for contrast against gold)
- Small Crown icon (10-12px) inline before the text
- Subtle gold glow/box-shadow: `0 0 8px rgba(251, 191, 36, 0.5)`
- Same font-size and padding as difficulty tags for visual harmony
- A subtle inner glossy highlight (matching the difficulty badge pattern in Bookmark view)

---

## Props Changes

All three variants need an optional `image_url?: string` prop added to their interfaces. This will be passed from `GoalsList.tsx` where we have access to the full `goal` object. Currently the super goal rendering in `GoalsList.tsx` only passes limited props -- we'll add `imageUrl={goal.image_url}` to the `SuperGoalCard` call.

---

## Technical Details

### Files to Edit

1. **`src/components/goals/super/SuperGoalGridCard.tsx`**
   - Add `imageUrl?: string | null` to props interface
   - Replace Crown hero section with regular image/placeholder logic (same as GridViewGoalCard)
   - Remove the gold border overlay div
   - Move "SUPER" tag into the glass panel header row as a gold gradient badge with inline Crown icon
   - Remove standalone Crown icon from glass panel header

2. **`src/components/goals/super/SuperGoalBarCard.tsx`**
   - Add `imageUrl?: string | null` to props interface
   - Update image-frame to show `img` when imageUrl exists, Crown placeholder otherwise
   - Restyle `.super-tag` as a gold gradient pill with white text and inline Crown icon, matching difficulty-tag sizing

3. **`src/components/goals/super/SuperGoalBookmarkCard.tsx`**
   - Add `imageUrl?: string | null` to props interface
   - Update top section to show image when available (same pattern as UIVerseGoalCard)
   - Remove "SUPER" badge from top-right
   - Add "SUPER" tag below the card name as a centered gold gradient badge

4. **`src/components/goals/super/SuperGoalCard.tsx`**
   - Add `imageUrl?: string | null` to the router props interface
   - Pass it through to each variant

5. **`src/components/goals/GoalsList.tsx`**
   - Pass `imageUrl={goal.image_url}` to the `SuperGoalCard` component

