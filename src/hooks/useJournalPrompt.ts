import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export interface JournalPrompt {
  id: string;
  prompt: string;
  category: string;
  language: string;
}

function dayHash(date: Date, salt: string): number {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${salt}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Returns the daily rotating prompt for the active language and current user.
 */
export function useDailyJournalPrompt(userId: string | undefined) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "fr").slice(0, 2);

  return useQuery({
    queryKey: ["journal-prompt-daily", lang, userId, new Date().toDateString()],
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      /* On rapportait TOUTES les questions actives de la langue pour en
         tirer une seule. On compte, puis on va chercher celle du jour. */
      const { count, error: erreurCompte } = await supabase
        .from("journal_prompts" as never)
        .select("id", { count: "exact", head: true })
        .eq("language", lang)
        .eq("is_active", true);
      if (erreurCompte) throw erreurCompte;
      if (!count) return null;

      const idx = dayHash(new Date(), userId ?? "anon") % count;
      const { data, error } = await supabase
        .from("journal_prompts" as never)
        .select("id, prompt, category, language")
        .eq("language", lang)
        .eq("is_active", true)
        .order("id", { ascending: true })
        .range(idx, idx);
      if (error) throw error;
      return ((data ?? [])[0] as unknown as JournalPrompt) ?? null;
    },
  });
}