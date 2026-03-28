

# Adopt AccountSettings Design System Across All Settings Pages

## Current State

**AccountSettings** (`ProfileAccountSettings.tsx`) uses a unique, more immersive design:
- `CyberPanel` with clip-path corners, animated dot, `font-orbitron` headers
- `CyberInput` with `>` prompt prefix, borderless dark inputs
- Tab navigation (IDENTITY/SECURITY/SYSTEM) with `motion.div` animated indicator
- Sticky bottom command bar with live status ticker + ping dot + save button
- All rendered directly (no `ProfileSettingsShell` wrapper)

**Other settings pages** (DisplaySound, Notifications, Privacy, Data, PactSettings) use `ProfileSettingsShell` + `DataPanel`/`SettingRow`/`SettingsBreadcrumb` from `settings-ui.tsx` — a different, less immersive aesthetic.

## Plan: Propagate AccountSettings DA to All Pages

### Phase 1 — Extract reusable primitives from AccountSettings into `settings-ui.tsx`

Add to `settings-ui.tsx`:
- `CyberPanel` component (with `accent` prop: cyan/red)
- `CyberInput` component (with `>` prompt label)
- `CyberSelect` component (same dark style as AccountSettings selects)
- `CyberBirthdayPicker` (move from AccountSettings)
- `SettingsTabBar` — generic tab bar with animated indicator (accepts `tabs` array, `activeTab`, `onChange`)
- `StickyCommandBar` — bottom bar with status ticker + optional save button (accepts `latestLog`, `hasChanges`, `isSaving`, `onSave`)

Keep existing `SettingRow`, `SettingContentRow`, `SyncIndicator`, `TerminalLog` — they still work inside `CyberPanel` body sections.

### Phase 2 — Convert DisplaySound (DSP.03)

- Remove `ProfileSettingsShell` wrapper → render directly like AccountSettings
- Use `CyberBackground` + same page structure (max-w-4xl, header with icon/title)
- Wrap each section (Visual, Sound, Particles, Accent) in `CyberPanel` instead of `DataPanel`
- Add `StickyCommandBar` at bottom (for instant-save toggles, show ticker only — no explicit save button needed since changes auto-save)
- Replace `SettingsBreadcrumb` with the AccountSettings-style header
- Keep `SettingRow` / `SettingContentRow` inside panels (they work well)

### Phase 3 — Convert NotificationSettings (NTF.04)

- Remove `ProfileSettingsShell` → same page structure
- Wrap "Alert Flux", "System Controls", "Quiet Hours" in `CyberPanel`
- Move `TerminalLog` into `StickyCommandBar` (ticker at bottom)
- Keep existing toggle logic

### Phase 4 — Convert PrivacyControl (PRV.05)

- Remove `ProfileSettingsShell` → same structure
- Wrap "Visibility", "Sharing", "Blocked Users" in `CyberPanel`
- Add `StickyCommandBar` with ticker
- Shared Data Overview section → `CyberPanel` with list styled like SessionsSection

### Phase 5 — Convert DataPortability (DAT.06)

- Remove `ProfileSettingsShell` → same structure
- Wrap "Data Overview", "Export", "Import", "Danger Zone" in `CyberPanel` (red accent for danger)
- Use `CyberInput` for confirmation inputs
- Delete confirmation dialog styled like AccountSettings delete modal (dark, red border, rounded-none)

### Phase 6 — Convert PactSettings

- Remove `ProfileSettingsShell` → same structure
- Wrap pact config sections in `CyberPanel`

### Phase 7 — Convert BoundedProfile

- Same treatment — `CyberPanel` sections

### Design Constants (applied everywhere)

- Page background: `bg-[#03060A]` with `CyberBackground`
- Page header: centered icon (w-16 h-16 rounded-full border `#00F2FF/40` bg-black/50) + subtitle mono label + h1 `font-orbitron`
- All `Select` components: `bg-white/5 border-none rounded-none h-[68px]` trigger, `bg-black border-[#00F2FF]/30 rounded-none` content
- All labels: `text-[10px] font-mono tracking-[0.2em] text-white/40 uppercase` with `> ` prefix
- Panel clips: `clipPath: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)`

---

## Files Impact

| Action | File |
|--------|------|
| **Edit** | `src/components/profile/settings-ui.tsx` — add `CyberPanel`, `CyberInput`, `CyberSelect`, `SettingsTabBar`, `StickyCommandBar` |
| **Edit** | `src/pages/profile/DisplaySound.tsx` — convert to CyberPanel DA |
| **Edit** | `src/pages/profile/NotificationSettings.tsx` — convert to CyberPanel DA |
| **Edit** | `src/pages/profile/PrivacyControl.tsx` — convert to CyberPanel DA |
| **Edit** | `src/pages/profile/DataPortability.tsx` — convert to CyberPanel DA |
| **Edit** | `src/pages/profile/PactSettings.tsx` — convert to CyberPanel DA |
| **Edit** | `src/pages/profile/BoundedProfile.tsx` — convert to CyberPanel DA |
| **Edit** | `src/components/profile/ProfileAccountSettings.tsx` — import shared `CyberPanel`/`CyberInput`/`StickyCommandBar` from settings-ui instead of local definitions |

`ProfileSettingsShell.tsx` becomes unused after conversion — can be deleted or kept for reference.

No database changes needed.

