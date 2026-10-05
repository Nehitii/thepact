import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useProfileSettings } from "@/hooks/useProfileSettings";

export function ProfilePreferencesSync() {
  const { profile } = useProfileSettings();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    if (!profile) return;
    if (profile.theme_preference && profile.theme_preference !== theme) {
      setTheme(profile.theme_preference);
    }
  }, [profile, setTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = !!profile?.reduce_motion;
    root.setAttribute("data-reduce-motion", reduce ? "true" : "false");
  }, [profile?.reduce_motion]);

  return null;
}
