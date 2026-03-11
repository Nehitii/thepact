import { useEffect } from "react";
import { useProfileSettings } from "@/hooks/useProfileSettings";

/**
 * Syncs the user's accent_color and font_size preferences to CSS variables on :root.
 * Mount once in AppProviders.
 */
export function AccentColorSync() {
  const { profile } = useProfileSettings();

  useEffect(() => {
    if (!profile) return;

    // Apply accent color
    const accent = profile.accent_color || "#5bb4ff";
    // Convert hex to HSL for CSS variable compatibility
    const hsl = hexToHSL(accent);
    if (hsl) {
      document.documentElement.style.setProperty("--primary", hsl);
    }

    // Apply font size
    const fontSize = profile.font_size || 16;
    document.documentElement.style.fontSize = `${fontSize}px`;

    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.fontSize = "";
    };
  }, [profile?.accent_color, profile?.font_size]);

  return null;
}

function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
