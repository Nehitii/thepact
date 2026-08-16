import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["mfa", user?.id, session?.access_token],
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

      const totp: MfaFactor[] = (factorsData?.totp ?? []).map((f) => ({
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
    // Un enrôlement inachevé laisse un facteur non vérifié qui bloquerait
    // le suivant : on nettoie avant de recommencer.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.totp ?? []) {
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
      refresh();
    },
    [refresh, verifiedFactor],
  );

  /** Retire le second facteur. Le JWT retombe en aal1 à la prochaine émission. */
  const disable = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    refresh();
  }, [refresh]);

  return {
    isLoading: query.isLoading,
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
    refresh,
  };
}
