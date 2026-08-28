import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/socle/ui/button";
import { useMfa } from "@/domaines/profil";

/**
 * LA PORTE DE L'ADMINISTRATION.
 *
 * ═══════════════════════════════════════════════════════════════
 * POURQUOI LE RÔLE NE SUFFIT PAS COMME CLÉ
 *
 * Jusqu'ici, entrer demandait une seule chose : porter le rôle
 * « admin ». Un jeton de session volé le porte aussi. Et le rôle est
 * permanent : il ouvre la porte à trois heures du matin depuis une
 * machine inconnue exactement comme depuis la vôtre.
 *
 * C'est ce que font les applications sérieuses, sous des noms
 * différents — « sudo mode » chez GitHub, ré-authentification chez
 * Stripe, élévation de session ailleurs : le rôle dit QUI vous êtes,
 * le second facteur dit que c'est BIEN VOUS, MAINTENANT.
 *
 * La machinerie existait déjà dans ce dépôt et ne servait presque à
 * rien. La politique « mfa_aal2_requis » posée sur les tables dit « si
 * tu as un facteur, utilise-le » — ce qui ne protège personne tant que
 * personne n'en a. RELEVÉ : zéro facteur vérifié en base. Ici,
 * l'exigence est franche.
 *
 * TROIS ÉTATS, ET AUCUN N'EST UN CUL-DE-SAC :
 *
 *   · aucun facteur   → on conduit à l'enrôlement, on n'affiche pas un
 *                       refus sec.
 *   · facteur, aal1   → on demande le code, ici même.
 *   · aal2            → on entre.
 *
 * Ce qui reste HORS de cette porte, et qu'aucun écran ne remplace :
 * l'adresse /admin n'est liée nulle part dans l'application — ce n'est
 * pas de la sécurité, mais ça évite qu'elle se trouve par hasard. Le
 * vrai cran suivant serait de la mettre derrière un réseau privé
 * (Cloudflare Access, un VPN) : la page ne répondrait même pas à qui
 * n'est pas sur le réseau. C'est ce que font les grosses maisons, et
 * cela ne se code pas ici — cela se configure devant.
 * ═══════════════════════════════════════════════════════════════
 */
export function PorteAdmin({ children }: { children: React.ReactNode }) {
  const mfa = useMfa();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (mfa.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (mfa.currentLevel === "aal2") return <>{children}</>;

  const confirmer = async () => {
    if (code.length !== 6 || envoi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await mfa.verify(code);
      setCode("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Code refusé");
    } finally {
      setEnvoi(false);
    }
  };

  const cadre = "max-w-md mx-auto mt-16 rounded-lg border border-primary/25 bg-card/70 p-6";

  /* Aucun second facteur sur ce compte : on ne refuse pas, on conduit.

     ON DISTINGUE « JAMAIS COMMENCÉ » DE « COMMENCÉ SANS ALLER AU BOUT ».
     La première version affichait le même texte dans les deux cas :
     quelqu'un qui venait d'installer l'application d'authentification
     et de scanner le code lisait « protégez ce compte d'abord » sans
     comprendre — il l'avait fait. Un enrôlement s'achève par les six
     chiffres, et c'est cette étape-là qui manque. */
  const enPlan = mfa.factors.some((f) => f.status !== "verified");

  if (!mfa.enabled) {
    return (
      <div className={cadre}>
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          <h1 className="text-lg font-orbitron text-primary">
            {enPlan ? "Enrôlement à terminer" : "Protégez ce compte d'abord"}
          </h1>
        </div>
        {enPlan ? (
          <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed mb-5">
            Un second facteur a été créé sur ce compte mais n'a jamais été
            confirmé par un code à six chiffres — il ne protège donc rien.
            Reprenez depuis les réglages : un nouveau code y sera proposé, et
            l'entrée précédente de votre application d'authentification
            peut être supprimée.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed mb-2">
              L'administration écrit à tous les utilisateurs, distribue des récompenses
              et donne les droits. Le mot de passe seul ne suffit pas à l'ouvrir : il
              faut un second facteur sur ce compte.
            </p>
            <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed mb-5">
              L'enrôlement prend une minute et se fait depuis les réglages du compte.
            </p>
          </>
        )}
        <Button onClick={() => navigate("/profile/security")} className="w-full">
          <KeyRound className="h-4 w-4 mr-2" />
          {enPlan ? "Reprendre l'enrôlement" : "Activer le second facteur"}
        </Button>
      </div>
    );
  }

  /* Facteur présent, session pas encore élevée : le code, ici. */
  return (
    <div className={cadre}>
      <div className="flex items-center gap-3 mb-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-orbitron text-primary">Confirmez que c'est vous</h1>
      </div>
      <p className="text-sm text-muted-foreground font-rajdhani leading-relaxed mb-5">
        Votre compte est protégé. Entrez le code à six chiffres de votre application
        d'authentification pour élever cette session.
      </p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => { if (e.key === "Enter") confirmer(); }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        aria-label="Code à six chiffres"
        placeholder="000000"
        className="w-full text-center tracking-[0.5em] text-xl font-mono bg-muted/40 border border-primary/25 rounded-md py-3 mb-3 focus:outline-none focus:border-primary"
      />

      {erreur && <p className="text-sm text-destructive font-rajdhani mb-3">{erreur}</p>}

      <Button onClick={confirmer} disabled={code.length !== 6 || envoi} className="w-full">
        {envoi ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Entrer
      </Button>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground font-rajdhani"
      >
        Revenir à l'application
      </button>
    </div>
  );
}
