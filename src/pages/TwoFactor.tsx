import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OTPInput } from "input-otp";
import { toast } from "sonner";
import { useMfa } from "@/hooks/useMfa";
import { useCodesDeSecours, motifLisible } from "@/hooks/useCodesDeSecours";
import { ShieldCheck, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { messageDErreur } from "@/lib/erreurs";
import "@/styles/deuxieme-facteur.css";

type FromState = { from?: string };

/** Ce que `render` donne pour chaque case. */
type Fente = { char: string | null; isActive: boolean };

/**
 * UNE CASE.
 *
 * `InputOTPSlot` de components/ui est écarté : il impose six cases
 * COLLÉES, bordures partagées, coins arrondis aux seules extrémités.
 * Le dessin en veut six séparées, et lutter contre ces utilitaires à
 * coups de spécificité n'aurait tenu que jusqu'à la prochaine mise à
 * jour du composant.
 *
 * ═══ ELLE REÇOIT SA FENTE, ELLE NE LA CHERCHE PAS ═══
 *
 * Première version : `useContext(OTPInputContext)`, comme le fait
 * `InputOTPSlot`. Elle plantait au montage —
 * « Cannot read properties of undefined (reading '5') ».
 *
 * La source de la bibliothèque dit pourquoi :
 *
 *   render ? render(valeur) : createElement(Contexte.Provider, …, children)
 *
 * LE FOURNISSEUR DE CONTEXTE N'EXISTE QUE SUR LA VOIE `children`.
 * Passer par `render`, comme ici, le court-circuite : le contexte lu
 * est la valeur PAR DÉFAUT, son `slots` vaut `undefined`, et
 * `slots[5]` lève. `InputOTPSlot` fonctionne parce qu'il est un
 * enfant, pas parce que le contexte est toujours là.
 *
 * `render` donne déjà les fentes en argument. On les passe en
 * propriété : plus court, et vrai dans les deux voies.
 */
function Case({ fente }: { fente: Fente }) {
  return (
    <div className="sas-case" data-active={fente.isActive ? "true" : undefined} aria-hidden="true">
      {fente.char}
    </div>
  );
}

/**
 * Verification du second facteur sur une session existante.
 *
 * Un code valide fait reemettre le JWT avec `aal2`. C'est cette
 * revendication que les politiques RLS exigent : sortir de cet ecran sans
 * l'obtenir ne donne acces a rien.
 *
 * ═══ POURQUOI CET ÉCRAN A SON PROPRE MONDE ═══
 *
 * Il arrive JUSTE APRÈS celui de connexion : c'est le même geste en deux
 * temps. Il portait pourtant les composants génériques — carte arrondie,
 * bouton plein, champ standard — pendant que l'écran précédent avait le
 * sien. On changeait d'identité au milieu d'une seule action. Le style
 * vit maintenant dans `deuxieme-facteur.css`, qui reprend le vocabulaire
 * de `auth.css`.
 */
export default function TwoFactor() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const mfa = useMfa();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  /* DEUX CHEMINS POUR ENTRER.
     Le code de l application redonne `aal2`. Le code de secours ne le
     peut pas — seul `mfa.verify()` le delivre — il RETIRE le facteur :
     on revient a un compte sans second facteur, qu on rouvre puis qu on
     re-enrole. Cette page annonçait d ailleurs qu aucun code de secours
     n existait, et renvoyait au tableau de bord Supabase. */
  const [modeSecours, setModeSecours] = useState(false);
  const [codeSecours, setCodeSecours] = useState("");
  const { utiliser } = useCodesDeSecours(false);

  const from = useMemo(() => {
    const state = (location.state ?? {}) as FromState;
    const candidate = typeof state.from === "string" ? state.from : "";
    // N'accepter qu'un chemin interne. "//host" et "/\host" sont traites comme
    // des URL protocole-relatives par le routeur et sortiraient du site
    // (CVE-2025-68470 et son contournement par antislash).
    const isInternal = /^\/(?![/\\])/.test(candidate);
    return isInternal ? candidate : "/";
  }, [location.state]);

  /* Si le second facteur n'est plus attendu, ne pas retenir ici.

     `isFetching` EN PLUS DE `isLoading`, et c'est la sûreté de cette
     page. `isLoading` tombe à faux dès qu'une donnée existe en cache,
     fût-elle périmée. Après une déconnexion suivie d'une reconnexion
     du même compte, l'entrée de la session précédente — où
     currentLevel valait « aal2 » — était servie instantanément :
     `isRequired` retombait, et cet effet ouvrait la porte SANS code.

     La cause est traitée à la racine (AuthContext vide le cache à la
     déconnexion). Cette condition-ci est la seconde ligne : tant que
     la requête n'est pas posée, on ne quitte pas la porte. Un cache
     qui mentirait à nouveau, pour une raison qu'on n'a pas prévue,
     ne suffirait plus à la franchir. */
  useEffect(() => {
    if (!mfa.isLoading && !mfa.isFetching && !mfa.isRequired) navigate(from, { replace: true });
  }, [from, navigate, mfa.isLoading, mfa.isFetching, mfa.isRequired]);

  const submit = useCallback(async () => {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await mfa.verify(code);
      toast.success(t("twoFactor.porte.identiteConfirmee", "Identité confirmée"));
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(t("twoFactor.porte.codeRefuse", "Code refusé"), { description: messageDErreur(e) });
      setCode("");
    } finally {
      setBusy(false);
    }
  }, [code, from, mfa, navigate, t]);

  const soumettreSecours = useCallback(async () => {
    if (!codeSecours.trim()) return;
    setBusy(true);
    try {
      await utiliser(codeSecours);
      toast.success(t("twoFactor.porte.facteurRetire", "Second facteur retiré"), {
        description: t("twoFactor.porte.facteurRetireDetail", "Ton compte est de nouveau accessible. Pense à le réactiver."),
      });
      /* Le facteur n existe plus : `isRequired` retombe, et l effet
         ci-dessus renvoie l utilisateur d ou il venait. */
      await mfa.refresh();
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(t("twoFactor.porte.codeRefuse", "Code refusé"), {
        description: motifLisible(e instanceof Error ? e.message : String(e)),
      });
      setCodeSecours("");
    } finally {
      setBusy(false);
    }
  }, [codeSecours, from, mfa, navigate, utiliser, t]);

  // Validation automatique des que les six chiffres sont saisis.
  useEffect(() => {
    if (!modeSecours && code.length === 6 && !busy) void submit();
  }, [code, busy, submit, modeSecours]);

  if (mfa.isLoading) {
    return (
      <div className="sas-attente">
        <div className="sas-rond" role="status" aria-label={t("common.loading", "Chargement")} />
      </div>
    );
  }

  return (
    <div className="sas">
      <div className="sas-grille" aria-hidden="true" />

      <main className="sas-carte">
        <span className="sas-chip">
          <ShieldCheck aria-hidden="true" />
          {t("twoFactor.porte.titre", "Vérification requise")}
        </span>

        <h1 className="sas-titre">
          {modeSecours
            ? t("twoFactor.recoveryCode", "Code de secours")
            : t("twoFactor.porte.sixChiffres", "Six chiffres")}
        </h1>

        <p className="sas-consigne">
          {modeSecours
            ? t("twoFactor.porte.consigneSecours", "Saisis l’un des codes que tu as mis de côté au moment de l’activation.")
            : t("twoFactor.porte.consigne", "Saisis le code à six chiffres affiché par ton application d’authentification.")}
        </p>

        {modeSecours ? (
          <>
            <label className="sas-etiquette" htmlFor="code-de-secours">
              {t("twoFactor.recoveryCode", "Code de secours")}
            </label>
            <div className="sas-champ">
              <input
                id="code-de-secours"
                value={codeSecours}
                onChange={(e) => setCodeSecours(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void soumettreSecours(); }}
                placeholder="ABCDE-FGHJK"
                autoFocus
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button
              type="button"
              className="sas-valider"
              onClick={soumettreSecours}
              disabled={busy || !codeSecours.trim()}
            >
              {busy
                ? <span className="sas-rond" aria-hidden="true" />
                : t("twoFactor.porte.utiliserCeCode", "Utiliser ce code")}
            </button>

            <p className="sas-note">
              {t("twoFactor.porte.avertissementSecours", "Ce code retire ton second facteur au lieu de le vérifier : il te rend l’accès, il ne le contourne pas. Il ne servira qu’une fois.")}
            </p>
          </>
        ) : (
          <>
            {/* `autoComplete="one-time-code"` : c'est lui qui permet à un
                téléphone de proposer le code sans qu'on le recopie. */}
            <OTPInput
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={busy}
              autoFocus
              autoComplete="one-time-code"
              containerClassName="sas-cases"
              aria-label={t("twoFactor.porte.consigne", "Saisis le code à six chiffres affiché par ton application d’authentification.")}
              render={({ slots }) => (
                <>{slots.map((fente, i) => <Case key={i} fente={fente} />)}</>
              )}
            />

            <button
              type="button"
              className="sas-valider"
              onClick={submit}
              disabled={busy || code.length !== 6}
            >
              {busy
                ? <span className="sas-rond" aria-hidden="true" />
                : t("twoFactor.porte.valider", "Valider")}
            </button>
          </>
        )}

        <button
          type="button"
          className="sas-bascule"
          onClick={() => { setModeSecours((v) => !v); setCode(""); setCodeSecours(""); }}
          disabled={busy}
        >
          <KeyRound aria-hidden="true" />
          {modeSecours
            ? t("twoFactor.porte.revenirApplication", "Revenir au code de l’application")
            : t("twoFactor.useRecovery", "Utiliser un code de secours")}
        </button>
      </main>
    </div>
  );
}
