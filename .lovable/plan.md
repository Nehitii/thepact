

# Fix Notification Badges & Move Inbox to Dropdown

## Problems Identified

1. **Expanded sidebar badges** (line 206): Use `bg-destructive/20 border border-destructive text-destructive animate-pulse` — transparent red with pulsing animation, overlaps the "ACTV" label making it unreadable.
2. **Mini sidebar badges** (line 139): Use solid `bg-destructive` with `animate-pulse` — better but still pulses.
3. **Avatar badge** (line 534-540): Solid, small, clean square — this is the target style.
4. **Inbox** is a standalone sidebar item but should be in the dropdown menu replacing the current "Notifications" entry.

## Changes — Single File: `src/components/layout/AppSidebar.tsx`

### 1. Fix expanded sidebar badge (line 206)
Replace the transparent red badge with a solid compact square matching the avatar badge style:
- `bg-destructive text-destructive-foreground` (solid, not transparent)
- Remove `animate-pulse`
- Small square: `min-w-[16px] h-[16px] text-[8px] font-black`
- `rounded-sm` (square-ish like avatar badge)
- Position: keep `ml-auto` but ensure `z-20` so it sits above the "ACTV" text

### 2. Fix mini sidebar badge (line 139)
- Remove `animate-pulse`
- Keep solid style but match sizing with avatar badge

### 3. Remove Inbox from sidebar navigation
- Remove the Inbox entry from `baseNavigation.network` (line 79)
- Remove `Mail` from lucide imports

### 4. Replace dropdown "Notifications" with "Inbox"
- Change the dropdown item (line 605-621) to navigate to `/inbox` (already does) but update icon from `Bell` to `Mail` and label from "Notifications" to "Inbox"
- Keep the `totalUnread` badge on this item

