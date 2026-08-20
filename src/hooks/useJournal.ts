/**
 * LOG.01 — les donnees du journal.
 *
 * La recherche et le filtre s appliquaient a « allEntries », c est-a-dire
 * aux pages deja telechargees : chercher un mot ecrit il y a six mois ne
 * rendait rien, et la page repondait « aucune entree ». Tout part
 * maintenant en base.
 *
 * La pagination passe du decalage au curseur : une entree ecrite pendant
 * qu on defile ne decale plus les pages suivantes.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import i18n from "@/i18n/i18n";
import type { JournalEntry } from "@/types/journal";
import { trackJournalEntry } from "@/lib/achievements";

export type { JournalEntry, JournalMood } from "@/types/journal";
export { MOOD_CONFIG } from "@/types/journal";

const PAGE_SIZE = 20;
const tr = (cle: string, params?: Record<string, unknown>) => i18n.t(cle, params) as string;

export interface FiltreJournal {
  recherche?: string;
  humeur?: string | null;
  /* Les epinglees etaient remontees APRES coup, ce qui reordonnait la
     liste a chaque page chargee. C est un filtre, pas un tri. */
  epinglees?: boolean;
}

/** Un curseur : la position exacte de la derniere ligne rendue. */
interface Curseur { created_at: string; id: string }

/* PostgREST lit ses filtres dans l URL : une virgule, une parenthese ou
   une etoile dans la recherche cassent la requete. On cite la valeur. */
const citer = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export function useJournalEntries(userId: string | undefined, filtre: FiltreJournal = {}) {
  const recherche = (filtre.recherche ?? "").trim();
  const humeur = filtre.humeur ?? null;

  return useInfiniteQuery({
    queryKey: ["journal-entries", userId, recherche, humeur, !!filtre.epinglees],
    enabled: !!userId,
    initialPageParam: null as Curseur | null,
    getNextPageParam: (derniere: { data: JournalEntry[]; suivant: Curseur | null }) => derniere.suivant,
    queryFn: async ({ pageParam }) => {
      if (!userId) return { data: [] as JournalEntry[], suivant: null };

      let requete = supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);

      if (humeur) requete = requete.eq("mood", humeur);
      if (filtre.epinglees) requete = requete.eq("is_favorite", true);
      if (recherche) {
        const m = citer(`%${recherche}%`);
        requete = requete.or(`title.ilike.${m},content.ilike.${m}`);
      }

      const c = pageParam as Curseur | null;
      if (c) {
        /* « plus ancien que cette date, ou meme date et identifiant plus
           petit » — la seule facon de ne rien sauter ni repeter. */
        requete = requete.or(
          `created_at.lt.${citer(c.created_at)},and(created_at.eq.${citer(c.created_at)},id.lt.${citer(c.id)})`,
        );
      }

      const { data, error } = await requete;
      if (error) throw error;

      const lignes = (data ?? []) as JournalEntry[];
      const derniere = lignes[lignes.length - 1];
      return {
        data: lignes,
        suivant: lignes.length === PAGE_SIZE && derniere
          ? { created_at: derniere.created_at, id: derniere.id }
          : null,
      };
    },
  });
}

/** Des comptes VRAIS : ceux de l en-tete comptaient les pages chargees. */
export function useJournalCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["journal-counts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const debutDuMois = new Date();
      debutDuMois.setDate(1);
      debutDuMois.setHours(0, 0, 0, 0);

      const base = () =>
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId!);

      const [total, epinglees, ceMois] = await Promise.all([
        base(),
        base().eq("is_favorite", true),
        base().gte("created_at", debutDuMois.toISOString()),
      ]);
      for (const r of [total, epinglees, ceMois]) if (r.error) throw r.error;
      return {
        total: total.count ?? 0,
        epinglees: epinglees.count ?? 0,
        ceMois: ceMois.count ?? 0,
      };
    },
  });
}

/** Tout ce qui change la liste la rend perimee, comptes compris. */
function rafraichir(client: ReturnType<typeof useQueryClient>, userId: string) {
  client.invalidateQueries({ queryKey: ["journal-entries", userId] });
  client.invalidateQueries({ queryKey: ["journal-counts", userId] });
}

/** Une modification sur place : epingler ne doit pas recharger dix pages. */
function remplacerDansLeCache(
  client: ReturnType<typeof useQueryClient>,
  userId: string,
  entree: JournalEntry,
) {
  client.setQueriesData<{ pages: { data: JournalEntry[]; suivant: unknown }[]; pageParams: unknown[] }>(
    { queryKey: ["journal-entries", userId] },
    (ancien) => {
      if (!ancien) return ancien;
      return {
        ...ancien,
        pages: ancien.pages.map((p) => ({
          ...p,
          data: p.data.map((e) => (e.id === entree.id ? entree : e)),
        })),
      };
    },
  );
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      user_id: string; title: string; content: string; mood: string;
      life_context?: string | null; energy_level?: number | null; valence_level?: number | null;
      linked_goal_id?: string | null; tags?: string[]; is_favorite?: boolean;
      accent_color?: string; font_id?: string; size_id?: string; align_id?: string; line_numbers?: boolean;
    }) => {
      const { data, error } = await supabase.from("journal_entries").insert(entry).select().single();
      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: (data) => {
      rafraichir(queryClient, data.user_id);
      toast.success(tr("journal.toasts.created"));
      trackJournalEntry(data.user_id);
    },
    onError: (error: Error) => {
      toast.error(tr("journal.toasts.createFailed"), { description: error.message });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, updates }: {
      id: string; userId: string;
      updates: Partial<Pick<JournalEntry,
        "title" | "content" | "mood" | "life_context" | "energy_level" | "valence_level"
        | "linked_goal_id" | "tags" | "is_favorite" | "accent_color" | "font_id" | "size_id"
        | "align_id" | "line_numbers">>;
    }) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .update(updates)
        .eq("id", id)
        /* La portee ne tenait qu a la regle en base — laquelle etait
           incomplete. Elle est ecrite ici aussi. */
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return { entry: data as JournalEntry, userId };
    },
    onSuccess: ({ entry, userId }) => {
      remplacerDansLeCache(queryClient, userId, entry);
      toast.success(tr("journal.toasts.updated"));
    },
    onError: (error: Error) => {
      toast.error(tr("journal.toasts.updateFailed"), { description: error.message });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      /* Sans « select », une suppression refusee par la regle de securite
         ne renvoie pas d erreur : zero ligne, et « journal purge » quand
         meme. On regarde ce qui est parti. */
      const { data, error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error(tr("journal.toasts.deleteNothing"));
      return { userId };
    },
    onSuccess: ({ userId }) => {
      rafraichir(queryClient, userId);
      toast.success(tr("journal.toasts.deleted"));
    },
    onError: (error: Error) => {
      toast.error(tr("journal.toasts.deleteFailed"), { description: error.message });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId, isFavorite }: { id: string; userId: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return { entry: data as JournalEntry, userId };
    },
    onSuccess: ({ entry, userId }) => {
      remplacerDansLeCache(queryClient, userId, entry);
      queryClient.invalidateQueries({ queryKey: ["journal-counts", userId] });
    },
    /* Elle etait la seule mutation muette en cas d echec. */
    onError: (error: Error) => {
      toast.error(tr("journal.toasts.pinFailed"), { description: error.message });
    },
  });
}
