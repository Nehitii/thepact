import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* LES SUCCES.
 *
 * Ils etaient juges sur achievement_tracking — quarante-cinq compteurs
 * incrementes par le code au moment de l action. Un chemin qui oublie
 * d incrementer, une suppression qui ne decremente pas, et le compteur
 * s ecarte. Mesure sur un compte reel : todos_created a zero pour
 * soixante-sept taches, guilds_joined a zero pour une guilde fondee,
 * pomodoro_sessions a vingt-neuf pour une table vide.
 *
 * Ils derivaient DANS LES DEUX SENS : des succes gagnes ne se
 * declenchaient pas, d autres s ouvraient sans raison. Vingt succes
 * merites n avaient jamais ete accordes.
 *
 * La base les juge maintenant sur les tables sources, et rend
 * l avancement de chacun — pas seulement l acquis. Un succes
 * verrouille sans jauge ne dit pas s il est a portee ou hors
 * d atteinte, et c est pourtant la seule chose qui donne envie. */

export interface Succes {
  cle: string;
  nom: string;
  categorie: string;
  rarete: string;
  description: string | null;
  saveur: string | null;
  icone: string | null;
  cache: boolean;
  points: number;
  bonds: number;
  mesure: string | null;
  seuil: number | null;
  valeur: number | null;
  obtenu: boolean;
  obtenu_le: string | null;
  avancement: number;
  /* Pourquoi il ne bouge pas, quand la raison n est pas « vous n avez
     pas encore commence » : module manquant, personne autour, ou une
     partie du produit ou rien n a jamais ete enregistre. */
  sommeil: "module" | "personne" | "inactif" | null;
}

export interface Coffre {
  categorie: string;
  total: number;
  obtenus: number;
  points: number;
  /* Une categorie entierement franchie vaut un trophee. C est ce qui
     transforme une liste de cent cases a cocher en une collection. */
  complet: boolean;
}

/* L ordre des raretes, du plus commun au plus rare. La base les rend
   en desordre alphabetique, ce qui ferait passer « common » avant
   « rare » mais aussi « epic » avant « legendary ». */
export const RARETES = ["common", "uncommon", "rare", "epic", "mythic", "legendary"] as const;
export type Rarete = (typeof RARETES)[number];

export function rangDeRarete(r: string): number {
  const i = RARETES.indexOf(r as Rarete);
  return i < 0 ? 0 : i;
}

export function useSucces(userId: string | undefined) {
  return useQuery({
    queryKey: ["succes", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Succes[]> => {
      const { data, error } = await supabase.rpc("succes_du_membre", { p_user_id: userId! });
      if (error) throw error;
      return (data || []).map((s) => ({
        ...s,
        points: s.points ?? 0,
        bonds: s.bonds ?? 0,
        avancement: Number(s.avancement ?? 0),
        seuil: s.seuil === null ? null : Number(s.seuil),
        valeur: s.valeur === null ? null : Number(s.valeur),
      })) as Succes[];
    },
  });
}

/** Les coffres : une ligne par categorie, et le trophee qui va avec. */
export function useCoffres(succes: Succes[]): Coffre[] {
  return useMemo(() => {
    const par = new Map<string, Coffre>();
    for (const s of succes) {
      const c = par.get(s.categorie) ?? {
        categorie: s.categorie, total: 0, obtenus: 0, points: 0, complet: false,
      };
      c.total++;
      if (s.obtenu) { c.obtenus++; c.points += s.points; }
      par.set(s.categorie, c);
    }
    return [...par.values()]
      .map((c) => ({ ...c, complet: c.total > 0 && c.obtenus === c.total }))
      /* Les coffres finis d abord — ce sont les trophees. Puis les plus
         avances, parce que ce sont les prochains. */
      .sort((a, b) =>
        Number(b.complet) - Number(a.complet)
        || b.obtenus / b.total - a.obtenus / a.total
        || b.total - a.total);
  }, [succes]);
}

/* MARQUER COMME VU.
 *
 * Vingt succes viennent d etre accordes d un coup par le rattrapage :
 * sans ce drapeau, la page les annoncerait comme neufs a chaque
 * visite, indefiniment. */
export function useMarquerVus(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cles: string[]) => {
      if (!userId || !cles.length) return 0;
      /* PAS D UPDATE DIRECT : user_achievements porte une politique de
         lecture et rien d autre. RLS etant actif, l ecriture etait
         refusee EN SILENCE — zero ligne touchee, aucune erreur — et la
         fenetre de deblocage se rejouait a chaque visite.
         Une fonction en base, parce que RLS s applique a la ligne et
         non a la colonne : ouvrir l UPDATE laisserait reecrire
         unlocked_at ou la clef du succes. */
      const { data, error } = await supabase.rpc("marquer_succes_vus", { p_cles: cles });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["succes-neufs", userId] }),
  });
}

/** Ceux qui n ont jamais ete montres. */
export function useNeufs(userId: string | undefined) {
  return useQuery({
    queryKey: ["succes-neufs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_key")
        .eq("user_id", userId!)
        .eq("seen", false);
      if (error) throw error;
      return new Set((data || []).map((r) => r.achievement_key));
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   LES TROPHEES DE CATEGORIE
   ═══════════════════════════════════════════════════════════════
   Franchir une categorie entiere etait le seul geste de la page qui
   se merite vraiment, et le seul qui ne rapportait rien : l anneau
   devenait dore, et c etait tout.

   Le trophee est ENREGISTRE en base, pas deduit a la lecture. Un
   succes desactive plus tard ne doit pas effacer un trophee deja
   gagne : ce qui a ete fait a ete fait, meme si le jeu change. */

export interface TropheeGagne {
  categorie: string;
  succes_dans_la_categorie: number;
  bonds: number;
  gagne_le: string;
  vu: boolean;
}

export function useTrophees(userId: string | undefined) {
  return useQuery({
    queryKey: ["trophees", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<TropheeGagne[]> => {
      const { data, error } = await supabase
        .from("trophees_gagnes")
        .select("categorie, succes_dans_la_categorie, bonds, gagne_le, vu")
        .eq("user_id", userId!)
        .order("gagne_le", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/* La reclamation est idempotente : un second passage ne verse rien.
   On peut donc la lancer a chaque visite sans precaution. */
export function useReclamerTrophees(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!userId) return { trophees_neufs: 0, bonds_verses: 0 };
      const { data, error } = await supabase.rpc("reclamer_les_trophees", { p_user_id: userId });
      if (error) throw error;
      return (data ?? {}) as { trophees_neufs?: number; bonds_verses?: number };
    },
    onSuccess: (r) => {
      if (r && (r.trophees_neufs ?? 0) > 0) {
        qc.invalidateQueries({ queryKey: ["trophees", userId] });
        qc.invalidateQueries({ queryKey: ["bond-balance", userId] });
      }
    },
  });
}
