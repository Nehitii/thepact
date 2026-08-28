import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { totalSecondes } from "@/domaines/sante/logique/souffle";
import { serieDeJours } from "@/domaines/sante/logique/journee";

/* ═══════════════════════════════════════════════════════════════
   CE QUE LA RESPIRATION LAISSE DERRIERE ELLE

   Rien, jusqu ici. Ce hook lit et ecrit seances_de_souffle, la table
   posee par la migration du 22 aout — calquee sur focus_sessions, qui
   fait deja ce travail pour la concentration.
   ═══════════════════════════════════════════════════════════════ */

export interface SeanceDeSouffle {
  id: string;
  user_id: string;
  rythme: string;
  cycles_vises: number;
  cycles_tenus: number;
  duree_secondes: number;
  achevee: boolean;
  commencee_a: string;
  terminee_a: string;
  created_at: string;
}

/** Sur quelle profondeur on lit l historique. Assez pour une longue serie. */
export const FENETRE_SOUFFLE = 120;

export function useSeancesDeSouffle(userId: string | undefined, jours = FENETRE_SOUFFLE) {
  return useQuery({
    queryKey: ["souffle-seances", userId, jours],
    queryFn: async () => {
      if (!userId) return [];
      const depuis = subDays(new Date(), jours).toISOString();

      const { data, error } = await supabase
        .from("seances_de_souffle")
        .select("*")
        .eq("user_id", userId)
        .gte("terminee_a", depuis)
        .order("terminee_a", { ascending: false });

      if (error) throw error;
      return (data || []) as SeanceDeSouffle[];
    },
    enabled: !!userId,
  });
}

export interface BilanDuSouffle {
  /** Jours consecutifs avec au moins une seance. */
  serie: number;
  /** Somme des durees, en secondes. */
  total: number;
  /** Combien de seances au total sur la fenetre lue. */
  seances: number;
  /** La derniere en date, si elle existe. */
  derniere: SeanceDeSouffle | null;
}

/**
 * Le bilan se calcule ici plutot qu en SQL : le regroupement par jour
 * doit se faire dans le fuseau du navigateur, sinon une seance de
 * vingt-trois heures bascule au lendemain et casse la serie.
 */
export function useBilanDuSouffle(userId: string | undefined): BilanDuSouffle {
  const { data: seances = [] } = useSeancesDeSouffle(userId);

  return useMemo(() => {
    const jours = seances.map((s) => format(parseISO(s.terminee_a), "yyyy-MM-dd"));
    return {
      serie: serieDeJours(jours),
      total: totalSecondes(seances),
      seances: seances.length,
      derniere: seances[0] ?? null,
    };
  }, [seances]);
}

export interface SeanceAEnregistrer {
  rythme: string;
  cyclesVises: number;
  cyclesTenus: number;
  dureeSecondes: number;
  commenceeA: Date;
}

export function useEnregistrerSeance(userId: string | undefined) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (s: SeanceAEnregistrer) => {
      if (!userId) throw new Error("Aucun utilisateur");

      const { data, error } = await supabase
        .from("seances_de_souffle")
        .insert({
          user_id: userId,
          rythme: s.rythme,
          cycles_vises: s.cyclesVises,
          cycles_tenus: s.cyclesTenus,
          duree_secondes: s.dureeSecondes,
          /* Une seance sans cible n est jamais « achevee » : la formule
             seule dirait le contraire, 0 >= 0 etant vrai. */
          achevee: s.cyclesVises > 0 && s.cyclesTenus >= s.cyclesVises,
          commencee_a: s.commenceeA.toISOString(),
          terminee_a: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as SeanceDeSouffle;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["souffle-seances", userId] });
    },
  });
}
