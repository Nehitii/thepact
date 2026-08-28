import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";

/**
 * LES CODES DE SECOURS DU SECOND FACTEUR.
 *
 * Perdre son telephone, c etait perdre son compte : l enrolement TOTP
 * n offrait aucun chemin de retour, et `mfa_aal2_requis` etant
 * restrictive sur `profiles`, la porte etait bel et bien close.
 *
 * Un code brule ne redonne PAS `aal2` — seul `mfa.verify()` le delivre.
 * Il RETIRE le facteur : on revient a un compte sans second facteur,
 * qu on rouvre normalement puis qu on re-enrole. C est ce qu une
 * recuperation doit faire, rendre l acces sans contourner la
 * verification.
 *
 * Rien ne passe par la table : `mfa_recovery_codes` n a aucune
 * politique RLS, et la fonction edge en est le seul lecteur.
 */

const CLE = (userId: string | undefined) => ["codes-de-secours", userId];

async function appeler<T>(action: string, code?: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke("mfa-recovery", {
    body: code ? { action, code } : { action },
  });
  if (error) {
    /* `functions.invoke` jette le corps de toute reponse non-2xx ; le
       motif y est, et c est lui qu on veut montrer. */
    if (error.context instanceof Response) {
      try {
        const corps = await error.context.clone().json();
        if (corps?.error) throw new Error(corps.error);
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
      }
    }
    throw error;
  }
  return data as T;
}

export const MOTIFS: Record<string, string> = {
  aal2_requis: "Saisis d’abord un code de ton application d’authentification.",
  code_refuse: "Ce code ne correspond à aucun code de secours valide.",
  code_manquant: "Saisis un code.",
  non_authentifie: "Ta session a expiré.",
};

export const motifLisible = (message: string) => MOTIFS[message] ?? message;

export function useCodesDeSecours(actif: boolean) {
  const { user } = useAuth();
  const qc = useQueryClient();
  /* Les codes en clair n existent qu une fois, dans la reponse qui les
     cree. Ils vivent donc en memoire, jamais en cache de requete. */
  const [codesEnClair, setCodesEnClair] = useState<string[] | null>(null);

  const restants = useQuery({
    queryKey: CLE(user?.id),
    enabled: !!user?.id && actif,
    staleTime: 30_000,
    queryFn: async () => (await appeler<{ restants: number }>("compter")).restants,
  });

  const generer = useCallback(async () => {
    const { codes } = await appeler<{ codes: string[] }>("generer");
    setCodesEnClair(codes);
    await qc.invalidateQueries({ queryKey: CLE(user?.id) });
    return codes;
  }, [qc, user?.id]);

  const utiliser = useCallback(async (code: string) => {
    return appeler<{ retire: boolean }>("utiliser", code);
  }, []);

  return {
    restants: restants.data ?? null,
    enChargement: restants.isLoading,
    codesEnClair,
    oublierLesCodes: () => setCodesEnClair(null),
    generer,
    utiliser,
  };
}
