import { useEffect } from "react";
import { useSound } from "@/contexts/SoundContext";
import { useSoundSettings } from "@/hooks/useSoundSettings";

/**
 * Loads per-user sound preferences and applies them to the global SoundProvider.
 * Kept as a tiny component to avoid mixing concerns into App.tsx.
 */
export function SoundSettingsSync() {
  const sound = useSound();
  const { settings } = useSoundSettings();

  useEffect(() => {
    if (settings) sound.setSettings(settings);
  }, [settings, sound]);

  return null;
}
