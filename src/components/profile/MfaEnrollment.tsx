import { useState } from "react";
import { toast } from "sonner";
import { Bouton, Reglage } from "@/components/profile/console-ui";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, ShieldOff, Copy } from "lucide-react";
import { useMfa, type MfaEnrollment as Enrollment } from "@/hooks/useMfa";
import { noterEvenementSecurite } from "@/lib/journalSecurite";
import { CodesDeSecours } from "@/components/profile/CodesDeSecours";
import "@/styles/mfa.css";

/**
 * Enrôlement d'un facteur TOTP via Supabase Auth.
 *
 * IL VIVAIT ENCORE DANS L ANCIEN STYLE. Ce composant est monte DANS
 * un `Panneau` de la console, et se dessinait pourtant sa propre
 * carte : `p-4 bg-card/40 border` — une carte dans une carte, avec
 * des boutons pleins que plus aucun ecran de reglages n emploie.
 *
 * Il parle desormais la langue de la console : `Reglage` pour la
 * ligne intitule/note/controle, `Bouton` pour les gestes. Seul
 * l enrolement garde une mise en page propre — c est un parcours en
 * deux etapes, pas un reglage.
 *
 * Le QR code et le secret sont fournis par Supabase : rien n'est genere ni
 * stocke par l'application. Tant que le code de confirmation n'est pas
 * valide, le facteur reste au statut "unverified" et ne protege rien.
 */
/* `userId` et `onEvenement` : l activation et le retrait d un second
   facteur sont des gestes de securite, et doivent laisser une trace
   dans le journal — c est meme la raison pour laquelle on le relit. */
export function MfaEnrollment({ userId, onEvenement }: { userId?: string; onEvenement?: () => void } = {}) {
  const mfa = useMfa();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      setEnrollment(await mfa.enroll("Vowpact"));
      setCode("");
    } catch (e) {
      toast.error("Enrôlement impossible", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!enrollment || code.length !== 6) return;
    setBusy(true);
    try {
      await mfa.confirmEnrollment(enrollment.factorId, code);
      setEnrollment(null);
      setCode("");
      await noterEvenementSecurite(userId, "mfa_enrolled");
      onEvenement?.();
      toast.success("Second facteur activé", {
        description: "Ta session porte désormais le niveau aal2.",
      });
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      /* « Factor not found » NE VEUT PAS DIRE « MAUVAIS CODE ».
         Le facteur visé n'existe plus : un autre onglet, ou un nouvel
         enrôlement lancé entre-temps, l'a remplacé. Répéter « code
         refusé » envoie chercher une erreur de saisie qui n'existe pas.
         On rend la main au début du parcours, où un code neuf attend. */
      if (/not found|introuvable/i.test(m)) {
        setEnrollment(null);
        setCode("");
        toast.error("Cet enrôlement a expiré", {
          description: "Il a été remplacé entre-temps. Relance l'activation : un nouveau code sera affiché.",
        });
      } else {
        toast.error("Code refusé", { description: m });
        setCode("");
      }
    } finally {
      setBusy(false);
    }
  };

  const annuler = async () => {
    const factorId = enrollment?.factorId;
    setEnrollment(null);
    setCode("");
    if (factorId) await mfa.retirerFacteur(factorId);
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await mfa.disable();
      await noterEvenementSecurite(userId, "mfa_revoked");
      onEvenement?.();
      toast.success("Second facteur retiré");
    } catch (e) {
      toast.error("Retrait impossible", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  if (mfa.isLoading) {
    return (
      <p className="rg-attente" role="status">
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> Chargement…
      </p>
    );
  }

  // ── Facteur actif ──
  if (mfa.enabled && !enrollment) {
    return (
      <>
        <Reglage
          nom="Application d’authentification"
          note={`Niveau de session : ${mfa.currentLevel ?? "inconnu"}`}
          icone={<ShieldCheck aria-hidden="true" />}
        >
          <Bouton role="danger" onClick={revoke} disabled={busy}>
            <ShieldOff /> Retirer
          </Bouton>
        </Reglage>

        {/* Perdre son telephone, c etait perdre son compte. */}
        <CodesDeSecours actif />
      </>
    );
  }

  // ── Enrôlement en cours ──
  if (enrollment) {
    return (
      <div className="mfa-enrolement">
        <p className="mfa-etape">1 — Scanne ce code dans ton application</p>

        <img
          src={enrollment.qrCode}
          alt="QR code d’enrôlement du second facteur"
          className="mfa-qr"
        />

        <p className="mfa-etape">Ou saisis la clé à la main</p>
        <button
          type="button"
          className="mfa-secret"
          title="Copier la clé"
          onClick={() => {
            navigator.clipboard?.writeText(enrollment.secret);
            toast.success("Clé copiée");
          }}
        >
          <Copy aria-hidden="true" />
          {enrollment.secret}
        </button>

        {/* L'ÉTAPE 2 EST LA DESTINATION DU PARCOURS, PAS UNE NOTE.
            Elle se lisait en dix pixels gris clair, sous un QR blanc de
            176 px qui prend tout le regard — on la ratait. Ici elle a son
            cadre, son titre lisible, des cases nettement plus grandes, et
            le curseur y est déjà. */}
        <div className="mfa-final">
          <p className="mfa-final-titre">2 — Saisis le code affiché par ton application</p>
          <div className="mfa-code">
            <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy} autoFocus>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-14 w-11 text-xl font-mono border-primary/45"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="mfa-final-note">Six chiffres, valables trente secondes.</p>
        </div>

        <div className="mfa-gestes">
          <Bouton role="primaire" onClick={confirm} disabled={busy || code.length !== 6}>
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Confirmer
          </Bouton>
          {/* ANNULER RETIRE VRAIMENT LE FACTEUR.

              Il ne vidait que l etat React : le facteur non verifie
              restait sur le compte jusqu au prochain essai, ou
               fait le menage. Sans consequence — un facteur
              non verifie ne protege rien — mais laisser un residu
              qu on sait retirer, c est le laisser exprès. */}
          <Bouton
            role="discret"
            onClick={annuler}
            disabled={busy}
          >
            Annuler
          </Bouton>
        </div>
      </div>
    );
  }

  // ── Aucun facteur, ou un enrôlement resté en plan ──
  //
  // On distingue les deux. Un enrôlement inachevé laisse une entrée
  // « Vowpact » dans l'application d'authentification qui ne servira
  // jamais : recommencer produit un NOUVEAU secret, et l'ancienne
  // entrée devient un code qui ne marchera pas. Le dire évite de
  // chercher pendant dix minutes pourquoi le code est refusé.
  const enPlan = mfa.factors.some((f) => f.status !== "verified");

  return (
    <Reglage
      nom="Application d’authentification"
      note={enPlan
        ? "Un enrôlement précédent n'a pas été confirmé. Recommencer donnera un nouveau code : supprime l'ancienne entrée « Vowpact » de ton application."
        : "Aucun second facteur. Ton mot de passe protège seul ton compte."}
      icone={<ShieldOff aria-hidden="true" />}
    >
      <Bouton role="primaire" onClick={start} disabled={busy}>
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Activer
      </Bouton>
    </Reglage>
  );
}
