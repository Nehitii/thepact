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
import type { JournalEntry } from "@/domaines/journal/types";
import { trackJournalEntry } from "@/domaines/succes";

export type { JournalEntry, JournalMood } from "@/domaines/journal/types";
export { MOOD_CONFIG } from "@/domaines/journal/types";

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
  /* Voir useTheCall : le pouls de la barre systeme compte ce geste. */
  client.invalidateQueries({ queryKey: ["pouls-du-jour"] });
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

/* ── L appartenance a la liste des epinglees ────────────────
 *
 * Epingler ne change pas le contenu d une entree : cela change la
 * liste a laquelle elle appartient. Or « les epinglees » est une
 * requete a part entiere, avec sa propre cle. Remplacer l entree sur
 * place ne pouvait donc pas l y faire entrer : il fallait actualiser
 * la page pour que le serveur reponde de nouveau.
 */
type PageJournal = { data: JournalEntry[]; suivant: Curseur | null };
type CacheJournal = { pages: PageJournal[]; pageParams: unknown[] };
type ComptesJournal = { total: number; epinglees: number; ceMois: number };

/** L ordre de la liste : du plus recent au plus ancien, id en second. */
const vientApres = (a: JournalEntry, b: JournalEntry) =>
  a.created_at < b.created_at || (a.created_at === b.created_at && a.id < b.id);

function retirerDuCache(ancien: CacheJournal, id: string): CacheJournal {
  return { ...ancien, pages: ancien.pages.map((p) => ({ ...p, data: p.data.filter((e) => e.id !== id) })) };
}

function insererDansLeCache(ancien: CacheJournal, entree: JournalEntry): CacheJournal {
  if (ancien.pages.length === 0) return ancien;
  if (ancien.pages.some((p) => p.data.some((e) => e.id === entree.id))) return ancien;

  /* Si elle se range apres tout ce qui est charge et qu il reste des
     pages a lire, elle arrivera avec la suivante : l ajouter ici la
     ferait remonter a une place qui n est pas la sienne. */
  const derniere = ancien.pages[ancien.pages.length - 1];
  const dernierElement = derniere.data[derniere.data.length - 1];
  if (dernierElement && derniere.suivant && vientApres(entree, dernierElement)) return ancien;

  const pages = ancien.pages.map((p) => ({ ...p, data: [...p.data] }));
  for (const p of pages) {
    const i = p.data.findIndex((e) => vientApres(e, entree));
    if (i !== -1) {
      p.data.splice(i, 0, entree);
      return { ...ancien, pages };
    }
  }
  pages[pages.length - 1].data.push(entree);
  return { ...ancien, pages };
}

/** L entree telle que le cache la connait, pour la modifier de tete. */
function entreeDuCache(
  client: ReturnType<typeof useQueryClient>,
  userId: string,
  id: string,
): JournalEntry | undefined {
  for (const [, donnees] of client.getQueriesData<CacheJournal>({ queryKey: ["journal-entries", userId] })) {
    for (const p of donnees?.pages ?? []) {
      const trouvee = p.data.find((e) => e.id === id);
      if (trouvee) return trouvee;
    }
  }
  return undefined;
}

/**
 * Pose l entree epinglee ou desepinglee partout ou elle doit l etre :
 * a jour dans les listes qui la contiennent deja, presente ou absente
 * de la liste des epinglees.
 */
function appliquerEpinglage(
  client: ReturnType<typeof useQueryClient>,
  userId: string,
  entree: JournalEntry,
) {
  remplacerDansLeCache(client, userId, entree);

  for (const requete of client.getQueryCache().findAll({ queryKey: ["journal-entries", userId] })) {
    const cle = requete.queryKey as [string, string, string, string | null, boolean];
    /* Seule la liste des epinglees change de membres. */
    if (cle[4] !== true) continue;
    const recherche = cle[2];
    const humeur = cle[3];

    if (!entree.is_favorite) {
      client.setQueryData<CacheJournal>(cle, (a) => (a ? retirerDuCache(a, entree.id) : a));
      continue;
    }
    /* Une liste filtree par une recherche ne se complete pas de tete :
       ce que le serveur retient ne se devine pas ici. */
    if (recherche) continue;
    if (humeur && humeur !== entree.mood) continue;
    client.setQueryData<CacheJournal>(cle, (a) => (a ? insererDansLeCache(a, entree) : a));
  }
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
    /* On n attend pas le serveur pour deplacer l entree : le geste doit
       repondre sous le doigt. Si la base refuse, tout revient. */
    onMutate: async ({ id, userId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ["journal-entries", userId] });
      await queryClient.cancelQueries({ queryKey: ["journal-counts", userId] });

      const listes = queryClient.getQueriesData<CacheJournal>({ queryKey: ["journal-entries", userId] });
      const comptes = queryClient.getQueryData<ComptesJournal>(["journal-counts", userId]);

      const connue = entreeDuCache(queryClient, userId, id);
      if (connue) appliquerEpinglage(queryClient, userId, { ...connue, is_favorite: isFavorite });
      if (comptes) {
        queryClient.setQueryData<ComptesJournal>(["journal-counts", userId], {
          ...comptes,
          epinglees: Math.max(0, comptes.epinglees + (isFavorite ? 1 : -1)),
        });
      }
      return { listes, comptes, userId };
    },

    onSuccess: ({ entry, userId }) => {
      appliquerEpinglage(queryClient, userId, entry);
      queryClient.invalidateQueries({ queryKey: ["journal-counts", userId] });
      /* Les listes d epinglees filtrees par une recherche n ont pas pu
         etre completees de tete : le serveur tranche. */
      queryClient.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "journal-entries" && q.queryKey[1] === userId
          && q.queryKey[4] === true && !!q.queryKey[2],
      });
    },

    /* Elle etait la seule mutation muette en cas d echec. */
    onError: (error: Error, _variables, contexte) => {
      for (const [cle, donnees] of contexte?.listes ?? []) queryClient.setQueryData(cle, donnees);
      if (contexte?.comptes) queryClient.setQueryData(["journal-counts", contexte.userId], contexte.comptes);
      toast.error(tr("journal.toasts.pinFailed"), { description: error.message });
    },
  });
}
