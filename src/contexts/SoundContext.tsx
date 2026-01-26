import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type SoundCategory = "ui" | "success" | "progress" | "neutral";

export type SoundSettings = {
  masterEnabled: boolean;
  volume: number; // 0..1
  uiEnabled: boolean;
  successEnabled: boolean;
  progressEnabled: boolean;
};

type SoundContextValue = {
  settings: SoundSettings;
  setSettings: (next: SoundSettings) => void;
  play: (category: SoundCategory, variant?: "soft" | "reward") => void;
};

const DEFAULT_SETTINGS: SoundSettings = {
  masterEnabled: true,
  volume: 0.35,
  uiEnabled: true,
  successEnabled: true,
  progressEnabled: true,
};

const SoundContext = createContext<SoundContextValue | null>(null);

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

/**
 * Subtle, futuristic synth cues using Web Audio.
 * - Lazy AudioContext creation (requires user gesture)
 * - Category-based throttling to avoid stacking
 */
export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<SoundSettings>(DEFAULT_SETTINGS);
  
  // Stable setter that only updates if values actually changed
  const setSettings = useCallback((next: SoundSettings) => {
    setSettingsState((prev) => {
      if (
        prev.masterEnabled === next.masterEnabled &&
        prev.volume === next.volume &&
        prev.uiEnabled === next.uiEnabled &&
        prev.successEnabled === next.successEnabled &&
        prev.progressEnabled === next.progressEnabled
      ) {
        return prev; // No change, prevent re-render
      }
      return next;
    });
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<Record<SoundCategory, number>>({
    ui: 0,
    success: 0,
    progress: 0,
    neutral: 0,
  });

  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtxRef.current = new Ctx();
    return audioCtxRef.current;
  }, []);

  // Suspend when tab is hidden to reduce CPU + avoid odd behavior.
  useEffect(() => {
    const handler = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (document.visibilityState === "hidden") {
        void ctx.suspend().catch(() => {});
      } else {
        void ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const playTone = useCallback(
    (category: SoundCategory, variant: "soft" | "reward" = "soft") => {
      if (!settings.masterEnabled) return;

      if (category === "ui" && !settings.uiEnabled) return;
      if (category === "success" && !settings.successEnabled) return;
      if (category === "progress" && !settings.progressEnabled) return;

      const now = performance.now();
      const minGapMs: Record<SoundCategory, number> = {
        ui: 45,
        success: 220,
        progress: 140,
        neutral: 120,
      };
      if (now - lastPlayedRef.current[category] < minGapMs[category]) return;
      lastPlayedRef.current[category] = now;

      const ctx = ensureAudio();
      if (!ctx) return;

      // Browser may keep AudioContext suspended until a gesture occurs.
      if (ctx.state === "suspended") {
        // Resume is best-effort; if blocked, the sound simply won’t play.
        void ctx.resume().catch(() => {});
      }

      const t0 = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = clamp01(settings.volume);
      master.connect(ctx.destination);

      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t0);
      out.gain.exponentialRampToValueAtTime(1.0, t0 + 0.006);
      out.gain.exponentialRampToValueAtTime(0.0001, t0 + (variant === "reward" ? 0.16 : 0.08));
      out.connect(master);

      // A touch of filtering for a clean, futuristic “digital” feel.
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(220, t0);
      filter.connect(out);

      const oscA = ctx.createOscillator();
      oscA.type = "triangle";
      const oscB = ctx.createOscillator();
      oscB.type = "sine";

      // Frequency “motifs” by category.
      const motif = (() => {
        switch (category) {
          case "ui":
            return variant === "reward" ? [740, 980] : [560, 720];
          case "success":
            return [520, 780, 1040];
          case "progress":
            return [460, 620];
          case "neutral":
          default:
            return [320, 420];
        }
      })();

      // Subtle pitch glide.
      oscA.frequency.setValueAtTime(motif[0], t0);
      oscA.frequency.exponentialRampToValueAtTime(motif[motif.length - 1], t0 + (variant === "reward" ? 0.09 : 0.05));
      oscB.frequency.setValueAtTime(motif[0] * 0.5, t0);
      oscB.frequency.exponentialRampToValueAtTime(motif[motif.length - 1] * 0.5, t0 + (variant === "reward" ? 0.09 : 0.05));

      // Mix levels
      const gainA = ctx.createGain();
      gainA.gain.value = variant === "reward" ? 0.8 : 0.65;
      const gainB = ctx.createGain();
      gainB.gain.value = 0.35;

      oscA.connect(gainA).connect(filter);
      oscB.connect(gainB).connect(filter);

      oscA.start(t0);
      oscB.start(t0);
      oscA.stop(t0 + (variant === "reward" ? 0.18 : 0.1));
      oscB.stop(t0 + (variant === "reward" ? 0.18 : 0.1));
    },
    [ensureAudio, settings.masterEnabled, settings.progressEnabled, settings.successEnabled, settings.uiEnabled, settings.volume]
  );

  const value = useMemo<SoundContextValue>(
    () => ({
      settings,
      setSettings,
      play: playTone,
    }),
    [playTone, setSettings, settings]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
}
