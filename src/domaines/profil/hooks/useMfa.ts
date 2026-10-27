import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { useAuth } from "@/socle/contextes/AuthContext";

/**
 * MFA adossé à Supabase Auth (TOTP), en remplacement du 2FA maison.
 *
 * La différence tient en un point : la validation du second facteur ne
 * produit plus un booléen dans le navigateur, elle réémet le JWT avec une
 * revendication `aal` à `aal2`. Les politiques RLS peuvent donc l'exiger,
 * ce qu'aucun état côté client ne permettait.
 */

export type MfaFactor = {
  id: string;
  friendlyName: string | null;
  status: "verified" | "unverified";
};

export type MfaEnrollment = {
  factorId: string;
  qrCode: string; // SVG en data URI, fourni par Supabase
  secret: string; // saisie manuelle si le QR est inutilisable
  uri: string; // otpauth://
};

export function useMfa() {
  /* `session` n'est plus lu ici : le jeton a quitté la clé de requête. */
  const { user } = useAuth();
  const qc = useQueryClient();

  /* ═══ LE JETON N'EST PLUS DANS LA CLÉ ═══

     Elle valait ["mfa", user.id, session.access_token]. Or le jeton
     change pour des raisons qui n'ont RIEN à voir avec le second
     facteur : rafraîchissement automatique, réémission après un
     `verify`, retour d'onglet. À chaque changement, React Query voit
     une clé neuve — donc une requête neuve, donc `isLoading` à vrai.

     Sur l'écran du second facteur, cela donnait : formulaire, rond de
     chargement, formulaire, rond de chargement. Rapporté depuis
     l'usage : « la page où rentrer le code scintille ».

     RIEN NE SE PERD À L'ENLEVER. Le seul moment où l'état MFA change
     vraiment est la vérification du code, et `verify` appelle déjà
     `qc.resetQueries()` juste après — ce qui vide cette requête-ci
     avec les autres et la force à repartir. Le client supabase porte
     le nouveau jeton en interne ; la clé n'a pas à le savoir.
     Un changement d'utilisateur reste couvert par `user?.id`. */
  const query = useQuery({
    queryKey: ["mfa", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: factorsData, error: factorsError }, { data: aalData, error: aalError }] =
        await Promise.all([
          supabase.auth.mfa.listFactors(),
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        ]);
      if (factorsError) throw factorsError;
      if (aalError) throw aalError;

      /* « all » ET NON « totp ». La bibliothèque type le champ `totp`
         comme « Factor<'totp', 'verified'>[] » : il ne contient QUE les
         facteurs vérifiés. Lire `totp` rendait donc les enrôlements
         inachevés invisibles au hook — et le filtre sur le statut, juste
         en dessous, ne pouvait rien écarter. Seul « all » les porte. */
      const totp: MfaFactor[] = (factorsData?.all ?? [])
        .filter((f) => f.factor_type === "totp")
        .map((f) => ({
          id: f.id,
          friendlyName: f.friendly_name ?? null,
          status: f.status as MfaFactor["status"],
        }));

      return {
        factors: totp,
        currentLevel: aalData?.currentLevel ?? null,
        nextLevel: aalData?.nextLevel ?? null,
      };
    },
  });

  const factors = query.data?.factors ?? [];
  const verifiedFactor = factors.find((f) => f.status === "verified") ?? null;

  /** Un facteur vérifié existe : le compte est protégé. */
  const enabled = !!verifiedFactor;

  /**
   * Le second facteur est attendu mais pas encore fourni sur cette session.
   * `nextLevel` vaut aal2 dès qu'un facteur vérifié existe ; `currentLevel`
   * ne passe à aal2 qu'après un challenge réussi.
   */
  const isRequired =
    !!user &&
    query.data?.nextLevel === "aal2" &&
    query.data?.currentLevel !== "aal2";

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["mfa"] });
  }, [qc]);

  /** Crée un facteur non vérifié et renvoie de quoi l'afficher. */
  const enroll = useCallback(async (friendlyName = "Authenticator"): Promise<MfaEnrollment> => {
    /* UN ENRÔLEMENT INACHEVÉ BLOQUAIT TOUS LES SUIVANTS.
       Cette boucle existait déjà — et ne nettoyait rien. Elle parcourait
       « existing.totp », que la bibliothèque garantit VÉRIFIÉ : la
       condition « status !== verified » n'était jamais vraie, pas un
       facteur n'était retiré, et le nouvel enrôlement se heurtait à
       « A factor with the friendly name "…" already exists ».
       Sans écran pour le voir ni bouton pour le défaire : un cul-de-sac.
       « all » porte les deux statuts. */
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });
    if (error) throw error;
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  }, []);

  /** Valide le code d'enrôlement ; le facteur devient vérifié. */
  const confirmEnrollment = useCallback(
    async (factorId: string, code: string) => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      refresh();
    },
    [refresh],
  );

  /** Valide le second facteur d'une session existante : le JWT passe en aal2. */
  const verify = useCallback(
    async (code: string) => {
      const factorId = verifiedFactor?.id;
      if (!factorId) throw new Error("Aucun facteur vérifié sur ce compte");
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      /* PENDANT LA FENÊTRE aal1 — après le mot de passe, avant le code —
         les politiques RLS filtrent toutes les tables protégées. Les
         requêtes ne renvoient pas d'erreur : elles renvoient du VIDE, que
         React Query met en cache. Le jeton vient de passer en aal2, donc
         ces réponses vides sont toutes fausses.

         ON EFFACE, ON N'INVALIDE PAS — et la nuance était le bogue.
         « invalidateQueries » marque périmé et ne rafraîchit que les
         requêtes ACTIVES. Or au moment du code, seule la page du second
         facteur est montée : la requête du pacte est inactive, donc
         marquée mais pas rechargée. On navigue, Home se monte, React
         Query lui sert INSTANTANÉMENT le null périmé — avec isLoading à
         faux, puisqu'il y a une donnée en cache — et la redirection vers
         l'onboarding part avant que le rechargement n'aboutisse.
         Rapporté depuis l'usage : « ça m'emmène dans l'onboarding après
         avoir entré le code ».

         « resetQueries » RETIRE la donnée. Au montage il n'y a plus rien
         à servir : isLoading est vrai, et la redirection attend la vraie
         réponse. Ce qui est faux ne doit pas être gardé le temps d'être
         corrigé — il doit disparaître. */
      await qc.resetQueries();
    },
    [qc, verifiedFactor],
  );

  /** Retire le second facteur. Le JWT retombe en aal1 à la prochaine émission. */
  const disable = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    refresh();
  }, [refresh]);

  /** Retire UN facteur precis — un enrolement abandonne, par exemple.
   *   les retire tous : c est le bon geste pour desactiver le
   *  second facteur, le mauvais pour renoncer a en poser un. */
  const retirerFacteur = useCallback(async (factorId: string) => {
    await supabase.auth.mfa.unenroll({ factorId });
    refresh();
  }, [refresh]);

  return {
    isLoading: query.isLoading,
    /* EXPOSÉ EXPRÈS, ET PAS COSMÉTIQUE. `isLoading` est faux dès
       qu'une donnée existe en cache, même périmée et même pendant
       qu'on la revérifie. La porte du second facteur ne doit pas
       s'ouvrir sur cette donnée-là : elle attend que la requête soit
       POSÉE, pas seulement qu'elle réponde quelque chose. */
    isFetching: query.isFetching,
    isError: query.isError,
    factors,
    verifiedFactor,
    enabled,
    isRequired,
    currentLevel: query.data?.currentLevel ?? null,
    nextLevel: query.data?.nextLevel ?? null,
    enroll,
    confirmEnrollment,
    verify,
    disable,
    retirerFacteur,
    refresh,
  };
}
