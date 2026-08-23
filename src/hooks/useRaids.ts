import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

/* LE RAID.
 *
 * Un objectif de guilde se remplissait avec un champ ou l on tapait un
 * nombre a la main : on pouvait le remplir sans rien faire, ou tout
 * faire sans qu il bouge. C etait un tableur avec une barre de
 * progression.
 *
 * Un raid ne se remplit pas — il SE MESURE. La base lit les
 * horodatages que l application ecrit deja (etapes validees, objectifs
 * franchis, taches faites, jours ecrits) et en tire l avancement. On
 * ne peut ni tricher ni oublier de declarer.
 *
 * Et il demande QUATRE choses a la fois. Une personne seule couvre mal
 * les quatre ; plusieurs se repartissent naturellement. C est la seule
 * reponse honnete a « pourquoi une guilde plutot que mes propres
 * objectifs ». */

export const METRIQUES = ["etapes", "objectifs", "taches", "journal"] as const;
export type Metrique = (typeof METRIQUES)[number];

export type Compte = Record<Metrique, number>;

export interface Raid {
  id: string;
  guild_id: string;
  titre: string;
  intention: string | null;
  commence_le: string;
  finit_le: string;
  cible_etapes: number;
  cible_objectifs: number;
  cible_taches: number;
  cible_journal: number;
  etat: string;
  resultat: Json | null;
  clos_le: string | null;
  cree_par: string;
  created_at: string;
}

export interface Avancement {
  fige: boolean;
  totaux: Compte;
  membres: Array<{ user_id: string } & Compte>;
  /* Presents seulement sur un raid clos. */
  reussi?: boolean;
  xp?: number;
}

const VIDE: Compte = { etapes: 0, objectifs: 0, taches: 0, journal: 0 };

/** Les cibles d un raid, sous la meme forme que ce qui est mesure. */
export function ciblesDe(r: Raid): Compte {
  return {
    etapes: r.cible_etapes,
    objectifs: r.cible_objectifs,
    taches: r.cible_taches,
    journal: r.cible_journal,
  };
}

/** Les seules metriques que ce raid demande vraiment. */
export function metriquesDemandees(r: Raid): Metrique[] {
  const c = ciblesDe(r);
  return METRIQUES.filter((m) => c[m] > 0);
}

/** Part franchie, de 0 a 1 : la moyenne des cibles demandees. */
export function partFranchie(r: Raid, fait: Compte): number {
  const demandees = metriquesDemandees(r);
  if (!demandees.length) return 0;
  const c = ciblesDe(r);
  const somme = demandees.reduce((t, m) => t + Math.min(1, fait[m] / c[m]), 0);
  return somme / demandees.length;
}

export function useRaids(guildId: string | undefined) {
  return useQuery({
    queryKey: ["guild-raids", guildId],
    enabled: !!guildId,
    queryFn: async (): Promise<Raid[]> => {
      const { data, error } = await supabase
        .from("guild_raids")
        .select("*")
        .eq("guild_id", guildId!)
        .order("finit_le", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/* L AVANCEMENT EST CALCULE EN BASE, PAS ICI.
 *
 * Le faire cote client demanderait de rapatrier toutes les etapes,
 * tous les objectifs, toutes les taches et tout le journal de chaque
 * membre — pour n en garder que quatre nombres. La base agrege et rend
 * les quatre.
 *
 * Un raid clos rend ce qui a ete FIGE a la cloture : son resultat ne
 * doit pas bouger parce que des donnees ont change depuis. */
export function useAvancementRaid(raidId: string | undefined) {
  return useQuery({
    queryKey: ["raid-avancement", raidId],
    enabled: !!raidId,
    staleTime: 60_000,
    queryFn: async (): Promise<Avancement> => {
      const { data, error } = await supabase.rpc("guild_raid_avancement", { p_raid_id: raidId! });
      if (error) throw error;
      const r = (data ?? {}) as Record<string, unknown>;
      return {
        fige: r.fige === true,
        totaux: { ...VIDE, ...((r.totaux as Partial<Compte>) || {}) },
        membres: (r.membres as Avancement["membres"]) || [],
        reussi: typeof r.reussi === "boolean" ? r.reussi : undefined,
        xp: typeof r.xp === "number" ? r.xp : undefined,
      };
    },
  });
}

export function useRaidActions(guildId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ["guild-raids", guildId] });
    qc.invalidateQueries({ queryKey: ["guild", guildId] });
  };

  const lancer = useMutation({
    mutationFn: async (v: {
      titre: string;
      intention?: string;
      jours: number;
      cibles: Compte;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const fin = new Date();
      fin.setDate(fin.getDate() + v.jours);
      const { error } = await supabase.from("guild_raids").insert({
        guild_id: guildId!,
        titre: v.titre,
        intention: v.intention || null,
        finit_le: fin.toISOString(),
        cible_etapes: v.cibles.etapes,
        cible_objectifs: v.cibles.objectifs,
        cible_taches: v.cibles.taches,
        cible_journal: v.cibles.journal,
        cree_par: user.id,
      });
      if (error) throw error;
    },
    onSuccess: rafraichir,
  });

  const clore = useMutation({
    mutationFn: async (raidId: string) => {
      const { data, error } = await supabase.rpc("clore_raid", { p_raid_id: raidId });
      if (error) throw error;
      return (data ?? {}) as { success?: boolean; reussi?: boolean; xp?: number };
    },
    onSuccess: (_, raidId) => {
      rafraichir();
      qc.invalidateQueries({ queryKey: ["raid-avancement", raidId] });
    },
  });

  return { lancer, clore };
}
