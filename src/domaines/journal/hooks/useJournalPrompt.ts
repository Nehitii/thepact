import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/socle/supabase/client";
import { useProfile } from "@/domaines/profil";
import { famillesRetenues } from "@/domaines/journal/logique/familles";

/* ═══════════════════════════════════════════════════════════════
   LA QUESTION DU JOUR

   Deux choses ont change ici.

   LE NOM DE LA TABLE N EST PLUS TRANSTYPE. « journal_prompts as never »
   coupait toute inference sur la requete, alors que la table figure
   dans les types generes. Le transtypage etait un reliquat.

   ET LA QUESTION SUIT L ORIENTATION CHOISIE. L utilisateur decide
   quelles familles il veut voir tomber ; rien de choisi vaut tout
   choisi, pour qu un journal ne se retrouve jamais sans question.

   LE COMPTE ET LE TIRAGE FILTRENT PAREIL. C est la seule chose fragile
   de ce fichier : si les deux requetes divergeaient d un filtre, l index
   tire porterait sur un ensemble et irait chercher dans un autre.
   ═══════════════════════════════════════════════════════════════ */

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
 * La question du jour, pour la langue active et l utilisateur courant.
 */
export function useDailyJournalPrompt(userId: string | undefined) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "fr").slice(0, 2);
  const { data: profil } = useProfile(userId);

  const familles = famillesRetenues(profil?.journal_prompt_families);

  return useQuery({
    queryKey: ["journal-prompt-daily", lang, userId, familles.join(","), new Date().toDateString()],
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      /* On rapportait TOUTES les questions actives de la langue pour en
         tirer une seule. On compte, puis on va chercher celle du jour. */
      const { count, error: erreurCompte } = await supabase
        .from("journal_prompts")
        .select("id", { count: "exact", head: true })
        .eq("language", lang)
        .eq("is_active", true)
        .in("category", familles);
      if (erreurCompte) throw erreurCompte;
      if (!count) return null;

      const idx = dayHash(new Date(), userId ?? "anon") % count;
      const { data, error } = await supabase
        .from("journal_prompts")
        .select("id, prompt, category, language")
        .eq("language", lang)
        .eq("is_active", true)
        .in("category", familles)
        .order("id", { ascending: true })
        .range(idx, idx);
      if (error) throw error;
      return ((data ?? [])[0] as JournalPrompt) ?? null;
    },
  });
}

/**
 * Enregistre l orientation choisie.
 *
 * Un tableau vide est stocke tel quel : c est famillesRetenues() qui
 * decide qu il vaut « toutes ». Ecrire null a la place ferait perdre la
 * difference entre « je n ai jamais choisi » et « j ai tout decoche ».
 */
export function useEnregistrerOrientation(userId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (familles: string[]) => {
      if (!userId) throw new Error("Aucun utilisateur");
      const { error } = await supabase
        .from("profiles")
        .update({ journal_prompt_families: familles })
        .eq("id", userId);
      if (error) throw error;
      return familles;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["profile", userId] });
      client.invalidateQueries({ queryKey: ["journal-prompt-daily"] });
    },
  });
}
