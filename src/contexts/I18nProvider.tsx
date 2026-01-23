import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { DEFAULT_LANGUAGE, type SupportedLanguage } from "@/i18n/i18n";

const STORAGE_KEY = "pact.language";

function normalizeLanguage(value: unknown): SupportedLanguage {
  return value === "fr" ? "fr" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lastApplied = useRef<string | null>(null);

  // Initialize from localStorage for instant UX; then reconcile with per-user persisted preference.
  useEffect(() => {
    const saved = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    if (lastApplied.current !== saved) {
      lastApplied.current = saved;
      void i18n.changeLanguage(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.id) {
      // Signed out: revert to default.
      if (lastApplied.current !== DEFAULT_LANGUAGE) {
        lastApplied.current = DEFAULT_LANGUAGE;
        localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
        void i18n.changeLanguage(DEFAULT_LANGUAGE);
      }
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[i18n] Failed to load profile language", error);
      }

      const lang = normalizeLanguage(data?.language ?? DEFAULT_LANGUAGE);
      if (lastApplied.current !== lang) {
        lastApplied.current = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        await i18n.changeLanguage(lang);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [i18n, user?.id]);

  return <>{children}</>;
}
