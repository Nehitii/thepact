
# Remove Pact Color

The `pactColor` field is stored in `pacts.color` but has zero visual effect anywhere in the app. This plan removes it from the settings UI and the save mutation to eliminate the dead field.

## Changes

### 1. `src/components/profile/PactIdentityCard.tsx`
- Remove `pactColor` and `onPactColorChange` from the props interface
- Remove the "Pact Color" section (lines 137-151): the color picker input and hex text input
- Remove the `Palette` icon import (no longer used)

### 2. `src/components/profile/ProfilePactSettings.tsx`
- Remove `pactColor` and `onPactColorChange` from the props interface
- Remove them from the `<PactIdentityCard>` JSX

### 3. `src/pages/profile/PactSettings.tsx`
- Remove the `pactColor` state (`useState("#f59e0b")`)
- Remove `setPactColor` from the pact data loader
- Remove `color: pactColor` from `handleSavePactIdentity`
- Remove `pactColor` / `onPactColorChange` props passed to `<ProfilePactSettings>`

### 4. DB column `pacts.color`
- The column stays in the database (no migration needed). It simply won't be written to or read from anymore in the UI. This avoids a destructive migration for a harmless text column.

## What does NOT change
- The `usePactMutation` hook still accepts an optional `color` field in its `PactUpdateData` interface -- this is harmless and keeps the hook generic. The save handler just won't pass it anymore.
- No database migration is needed.
