import { useState } from "react";
import { Check, Clock, Trophy, UserMinus, UserPlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import type { Cadre } from "@/domaines/social/hooks/useCadres";

/* UNE LIGNE DE MEMBRE, DANS SES QUATRE ETATS.
 *
 * La page avait quatre composants de ligne pour quatre onglets —
 * FriendNode, RequestNode, un resultat de recherche dans SearchTab, et
 * une variante « compacte » pilotee par un bouton de densite. Quatre
 * rendus pour la meme chose : un avatar, un nom, ce qu on peut faire.
 *
 * Ici il n y en a qu un, et l etat dit quels boutons apparaissent. Les
 * demandes vivent dans la meme liste que les allies parce qu une
 * demande EST un allie en devenir : les separer obligeait a visiter un
 * onglet pour savoir s il s y passait quelque chose.
 *
 * Le nom passe par nomAffichable : trois profils sur quatre portent
 * une adresse e-mail dans display_name, et la recherche par nom les
 * exposait entieres. */

export type EtatMembre = "allie" | "demande-recue" | "demande-envoyee" | "inconnu";

interface Props {
  identifiant: string;
  nom: string | null;
  avatar?: string | null;
  cadre?: Cadre | null;
  etat: EtatMembre;
  /** Dernier signe de vie, pour un allie. */
  vuLe?: string | null;
  /** Objectifs menes a terme — ce qui donne envie de suivre quelqu un. */
  objectifs?: number;
  grade?: string | null;
  occupe?: boolean;
  onAccepter?: () => void;
  onRefuser?: () => void;
  onRetirer?: () => void;
  onAjouter?: () => void;
  onAnnuler?: () => void;
  onOuvrir?: () => void;
}

export function LigneMembre({
  identifiant, nom, avatar, cadre, etat, vuLe, objectifs, grade, occupe,
  onAccepter, onRefuser, onRetirer, onAjouter, onAnnuler, onOuvrir,
}: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  /* RETIRER UN ALLIE SE CONFIRME.
     L ancienne page ouvrait une fenetre pour cela ; elle est tombee
     avec les composants qu elle servait, et le bouton se serait
     retrouve sans garde-fou. Deux temps valent une fenetre : le
     bouton demande, puis agit. */
  const [confirme, setConfirme] = useState(false);
  const affiche = nomAffichable(nom, t("friends.unknownAgent", "Agent Inconnu"));

  /* « En ligne » se mesure : une trace de moins de cinq minutes. Le
     bandeau d avant affichait un tiret a la place de ce chiffre. */
  const enLigne = !!vuLe && Date.now() - new Date(vuLe).getTime() < 5 * 60 * 1000;

  return (
    <div
      className="co-post fr-ligne"
      role={onOuvrir ? "button" : undefined}
      tabIndex={onOuvrir ? 0 : undefined}
      onClick={onOuvrir}
      onKeyDown={(e) => {
        if (onOuvrir && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOuvrir(); }
      }}
    >
      <span className="fr-pastille" data-en-ligne={enLigne ? "oui" : "non"}>
        <Pastille identifiant={identifiant} nom={affiche} image={avatar} cadre={cadre} />
      </span>

      <div className="co-post-corps">
        <div className="co-post-tete">
          <span className="co-nom">{affiche}</span>
          {grade && <span className="fr-grade">{grade}</span>}
        </div>

        <div className="fr-mesures">
          {typeof objectifs === "number" && objectifs > 0 && (
            <span className="fr-mesure">
              <Trophy aria-hidden="true" />
              {t("friends.goalsDone", "{{count}} objectifs", { count: objectifs })}
            </span>
          )}
          {etat === "allie" && (
            <span className="fr-mesure">
              {enLigne
                ? t("friends.onlineNow", "En ligne")
                : vuLe
                  ? t("friends.lastSeen", "Vu {{quand}}", {
                      quand: formatDistanceToNow(new Date(vuLe), { addSuffix: true, locale }),
                    })
                  : t("friends.neverSeen", "Jamais vu en ligne")}
            </span>
          )}
          {etat === "demande-envoyee" && (
            <span className="fr-mesure">
              <Clock aria-hidden="true" />
              {t("friends.awaitingAnswer", "En attente de réponse")}
            </span>
          )}
        </div>
      </div>

      <div className="fr-actions" onClick={(e) => e.stopPropagation()}>
        {etat === "demande-recue" && (
          <>
            <button type="button" className="co-bouton" disabled={occupe} onClick={onAccepter}>
              <Check aria-hidden="true" />
              {t("friends.accept", "Accepter")}
            </button>
            <button
              type="button"
              className="co-puce"
              disabled={occupe}
              onClick={onRefuser}
              aria-label={t("friends.declineRequest", "Refuser la demande")}
            >
              <X aria-hidden="true" />
            </button>
          </>
        )}

        {etat === "demande-envoyee" && (
          <button type="button" className="co-puce" disabled={occupe} onClick={onAnnuler}>
            {t("friends.cancelRequest", "Annuler")}
          </button>
        )}

        {etat === "inconnu" && (
          <button type="button" className="co-bouton" disabled={occupe} onClick={onAjouter}>
            <UserPlus aria-hidden="true" />
            {t("friends.addAlly", "Ajouter")}
          </button>
        )}

        {etat === "allie" && onRetirer && (
          confirme ? (
            <>
              <button type="button" className="co-puce" onClick={() => { setConfirme(false); onRetirer(); }}>
                {t("friends.confirmRemove", "Confirmer")}
              </button>
              <button
                type="button"
                className="co-puce"
                onClick={() => setConfirme(false)}
                aria-label={t("friends.cancelRequest", "Annuler")}
              >
                <X aria-hidden="true" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="co-puce"
              onClick={() => setConfirme(true)}
              aria-label={t("friends.removeFriend", "Retirer de mes alliés")}
            >
              <UserMinus aria-hidden="true" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
