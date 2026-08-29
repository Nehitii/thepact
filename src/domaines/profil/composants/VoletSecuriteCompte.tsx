/* LE VOLET SECURITE DU COMPTE : mot de passe, sessions, journal.
 *
 * Deux cents lignes sorties de `ProfileAccountSettings.tsx`, qui en
 * faisait 547. Elles forment un tout : on change son mot de passe, on
 * regarde ses sessions ouvertes, on relit le journal de connexions —
 * trois panneaux d un meme ecran.
 */
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Eye, EyeOff, KeyRound, LogOut, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { noterEvenementSecurite, LIBELLES_EVENEMENT, type EvenementSecurite } from "@/domaines/profil/logique/journalSecurite";
import { Panneau, Reglage, Bouton, Alerte, ChampTexte } from "@/socle/ds/console-ui";
import { CodeDeVerrouillage } from "@/domaines/profil/composants/CodeDeVerrouillage";
import { MfaEnrollment } from "@/domaines/profil/composants/MfaEnrollment";

/* Le minimum impose par Supabase. */
const LONGUEUR_MINIMALE = 6;

export function PanneauMotDePasse({ userId, onEvenement }: { userId: string; onEvenement: () => void }) {
  const { t } = useTranslation();
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const tropCourt = nouveau.length > 0 && nouveau.length < LONGUEUR_MINIMALE;
  const desaccord = confirme.length > 0 && nouveau !== confirme;

  /* LA CONFIRMATION EST DESORMAIS EXIGEE.
     L ancienne condition tenait dans `!!confirmPassword && …` : un
     champ vide ne produisait aucun desaccord, donc le bouton
     s activait des le premier champ rempli. Or c est exactement le cas
     contre lequel une confirmation existe — la faute de frappe dans le
     seul champ qu on a rempli. */
  const pret = nouveau.length >= LONGUEUR_MINIMALE && confirme === nouveau;

  const changer = async () => {
    if (!pret) return;
    setEnCours(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nouveau });
      if (error) throw error;
      setNouveau(""); setConfirme("");
      await noterEvenementSecurite(userId, "password_changed");
      onEvenement();
      toast.success(t("profile.passwordChanged", "Mot de passe changé"), {
        description: t("profile.changePassword.success"),
      });
    } catch (e) {
      toast.error(t("common.error"), { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Panneau
      code={t("profile.passwordPanel", "Mot de passe")}
      etat={pret ? t("profile.readyToChange", "prêt") : t("settings.console.waiting", "en attente")}
      ton={pret ? "actif" : "neutre"}
      rang="primaire"
      taille="pleine"
    >
      <div className="rg-champs">
        <ChampTexte
          etiquette={t("profile.changePassword.newPassword")}
          type={visible ? "text" : "password"}
          value={nouveau}
          autoComplete="new-password"
          onChange={(e) => setNouveau(e.target.value)}
          faute={tropCourt}
          aide={t("profile.changePassword.minLength")}
        />
        <ChampTexte
          etiquette={t("profile.changePassword.confirmPassword")}
          type={visible ? "text" : "password"}
          value={confirme}
          autoComplete="new-password"
          onChange={(e) => setConfirme(e.target.value)}
          faute={desaccord}
          aide={desaccord
            ? t("profile.changePassword.mismatch")
            : t("profile.confirmHint", "Retape-le à l’identique — il est obligatoire.")}
        />
      </div>

      <div className="rg-pied">
        <Bouton role="discret" type="button" onClick={() => setVisible((v) => !v)}>
          {visible ? <EyeOff /> : <Eye />}
          {visible ? t("profile.hidePassword", "Masquer") : t("profile.showPassword", "Afficher")}
        </Bouton>
        <Bouton role="primaire" onClick={changer} disabled={!pret || enCours}>
          {enCours ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {t("profile.changePassword.title")}
        </Bouton>
      </div>
    </Panneau>
  );
}

export function PanneauSessions({ userId, onEvenement }: { userId: string; onEvenement: () => void }) {
  const { t } = useTranslation();
  const [enCours, setEnCours] = useState(false);

  const fermerLesAutres = async () => {
    setEnCours(true);
    try {
      /* `signOut` NE LEVE PAS : il rend `{ error }`.
         L ancienne version l ignorait et affichait « toutes les autres
         sessions ont ete deconnectees » quoi qu il arrive — sur le
         bouton qu on presse justement quand on soupconne quelqu un
         d autre d etre connecte. */
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      await noterEvenementSecurite(userId, "sessions_revoked");
      onEvenement();
      toast.success(t("profile.sessionsClosed", "Autres sessions fermées"), {
        description: t("profile.sessionsClosedDesc", "Seul cet appareil reste connecté."),
      });
    } catch (e) {
      toast.error(t("profile.sessionsFailed", "Fermeture impossible"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Panneau code={t("profile.sessionsPanel", "Sessions")} taille="pleine">
      <Reglage
        nom={t("profile.closeOthers", "Fermer les autres sessions")}
        note={t("profile.closeOthersDesc", "Déconnecte tous les autres appareils. Celui-ci reste ouvert.")}
        icone={<LogOut />}
      >
        <Bouton onClick={fermerLesAutres} disabled={enCours}>
          {enCours ? <Loader2 className="animate-spin" /> : <LogOut />}
          {t("profile.closeOthersAction", "Fermer")}
        </Bouton>
      </Reglage>
    </Panneau>
  );
}

export function PanneauJournal({ userId, cle }: { userId: string; cle: number }) {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["security-events", userId, cle],
    enabled: !!userId,
    queryFn: async () => {
      /* L ancienne version faisait `data || []` et jetait l erreur :
         une panne de lecture devenait indiscernable d un historique
         vide. Ici elle remonte, et le panneau le dit. */
      const { data, error } = await supabase
        .from("security_events")
        .select("id, event_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Panneau
      code={t("profile.journalPanel", "Journal de sécurité")}
      etat={data?.length ? t("profile.journalCount", "{{n}} derniers", { n: data.length }) : undefined}
      taille="pleine"
    >
      {error ? (
        <Alerte>{t("profile.journalError", "Le journal n’a pas pu être lu : {{m}}", { m: error.message })}</Alerte>
      ) : isLoading ? (
        <p className="rg-releve-vide">{t("common.loading", "Chargement…")}</p>
      ) : !data?.length ? (
        <p className="rg-releve-vide">
          {t("profile.journalEmpty", "Aucun geste de sécurité enregistré. Les changements de mot de passe, l’activation du second facteur et la fermeture des sessions apparaîtront ici.")}
        </p>
      ) : (
        <div className="rg-releve">
          {data.map((ev) => (
            <div key={ev.id} className="rg-releve-ligne">
              <span>{LIBELLES_EVENEMENT[ev.event_type as EvenementSecurite] ?? ev.event_type}</span>
              <span className="rg-releve-quand">
                {new Date(ev.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panneau>
  );
}

export function VoletSecurite({ userId }: { userId: string }) {
  const { t } = useTranslation();
  /* Un compteur suffit a refaire lire le journal apres un geste : il
     change la cle de la requete. */
  const [cle, setCle] = useState(0);
  const rafraichir = useCallback(() => setCle((n) => n + 1), []);

  return (
    <>
      <PanneauMotDePasse userId={userId} onEvenement={rafraichir} />

      <Panneau code={t("profile.mfaPanel", "Double authentification")} taille="pleine">
        <MfaEnrollment userId={userId} onEvenement={rafraichir} />
      </Panneau>

      {/* Il vivait dans « Regles du pacte », entre l echeance et la
          difficulte — alors qu il ne regle rien du pacte : il masque le
          contenu d un objectif a qui regarde l ecran. */}
      <CodeDeVerrouillage userId={userId} />

      <PanneauSessions userId={userId} onEvenement={rafraichir} />
      <PanneauJournal userId={userId} cle={cle} />
    </>
  );
}
