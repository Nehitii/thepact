import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* RIT.01 — LA DONNEE DE L APPEL
 *
 * Elle vivait dans la page : une requete a la main, une ecriture non
 * attendue dont l erreur n etait jamais lue, et un compteur incremente
 * cote client. Trois consequences — un appel pouvait ne rien
 * enregistrer pendant que la page annoncait le contraire, deux onglets
 * ecrasaient le meme total, et la serie ne se cassait jamais.
 *
 * Tout passe desormais par une seule fonction en base, qui verrouille
 * la ligne, casse la serie quand la veille manque, et refuse un second
 * passage le meme jour.
 */

export interface PacteAppel {
  id: string;
  total: number;
  serie: number;
  /** « AAAA-MM-JJ », gardee en texte : la reparser en Date la ramenait
      a minuit UTC, donc a la veille pour tout fuseau negatif. */
  dernierJour: string | null;
}

/** Le jour de l utilisateur, pas celui du serveur. */
export const jourLocal = (d: Date = new Date()) => d.toLocaleDateString("en-CA");

interface ReponseAppel {
  total: number;
  serie: number;
  jour: string;
  deja_fait: boolean;
}

/* « types.ts » est genere, et il date d avant cette fonction : on la
   nomme ici, avec sa signature exacte, le temps qu il soit regenere. */
type AppelRpc = (
  nom: "enregistrer_appel",
  args: { p_pact_id: string; p_jour: string },
) => Promise<{ data: ReponseAppel[] | null; error: { message: string } | null }>;

export function useTheCall() {
  const { user } = useAuth();
  const client = useQueryClient();
  const cle = ["the-call", user?.id];

  const requete = useQuery({
    queryKey: cle,
    enabled: !!user,
    queryFn: async (): Promise<PacteAppel | null> => {
      const { data, error } = await supabase
        .from("pacts")
        .select("id, checkin_total_count, checkin_streak, last_checkin_date")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        total: data.checkin_total_count ?? 0,
        serie: data.checkin_streak ?? 0,
        dernierJour: data.last_checkin_date,
      };
    },
  });

  const pacte = requete.data ?? null;

  /* Comparaison de deux textes : aucune conversion, aucun fuseau. */
  const dejaFait = useMemo(
    () => !!pacte?.dernierJour && pacte.dernierJour === jourLocal(),
    [pacte?.dernierJour],
  );

  const enregistrement = useMutation({
    mutationFn: async (): Promise<PacteAppel> => {
      if (!pacte) throw new Error("PACTE_ABSENT");

      const { data, error } = await (supabase.rpc as unknown as AppelRpc)("enregistrer_appel", {
        p_pact_id: pacte.id,
        p_jour: jourLocal(),
      });

      if (error) throw new Error(error.message);
      const ligne = data?.[0];
      if (!ligne) throw new Error("REPONSE_VIDE");

      return { id: pacte.id, total: ligne.total, serie: ligne.serie, dernierJour: ligne.jour };
    },
    onSuccess: (majour) => {
      /* On ecrit ce que la base a rendu, jamais un « + 1 » calcule ici :
         l etat verrouille affichait un total invente. */
      client.setQueryData(cle, majour);
    },
  });

  const enregistrer = useCallback(() => enregistrement.mutateAsync(), [enregistrement]);

  return {
    pacte,
    chargement: requete.isLoading,
    erreurLecture: requete.error as Error | null,
    /** La page ne peut pas conclure tant que le pacte n est pas la. */
    pret: !!pacte,
    dejaFait,
    enregistrer,
    enregistrementEnCours: enregistrement.isPending,
    erreurEcriture: enregistrement.error as Error | null,
    reinitialiserErreur: enregistrement.reset,
    relire: requete.refetch,
  };
}
