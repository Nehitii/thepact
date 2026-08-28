import { useEffect, useRef } from "react";
import { useSound } from "@/socle/contextes/SoundContext";
import { useSoundSettings } from "@/domaines/profil";

/**
 * Loads per-user sound preferences and applies them to the global SoundProvider.
 * Kept as a tiny component to avoid mixing concerns into App.tsx.
 */
export function SoundSettingsSync() {
  const { setSettings } = useSound();
  const { settings } = useSoundSettings();
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only sync once when settings first load to avoid re-render loops
    if (settings && !syncedRef.current) {
      syncedRef.current = true;
      setSettings(settings);
    }
  }, [settings, setSettings]);

  return null;
}
