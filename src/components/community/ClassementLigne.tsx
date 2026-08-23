import { useTranslation } from "react-i18next";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";
import { Initiales, nomAffichable } from "./vocabulaire";

/* LE CLASSEMENT, EN UN SEUL EXEMPLAIRE.
 *
 * RankBadge et LeaderboardRow existaient en double : dans
 * pages/Leaderboard.tsx, et recopies dans pages/Community.tsx. Les
 * deux copies avaient diverge — la passe de traduction avait corrige
 * l une et rate l autre, si bien que la meme ligne affichait
 * « Agent Anonyme » sur une page et « Anonymous Agent » sur l autre,
 * avec les quatre cles pourtant deja ecrites.
 *
 * Une seule definition, deux consommateurs. La divergence redevient
 * impossible.
 *
 * Les medailles ont disparu avec le doublon : trois icones pour dire
 * 1, 2 et 3 quand le chiffre est deja la. La place se colore, et
 * c est tout. */

function Pastille({ entree, taille }: { entree: LeaderboardEntry; taille: "co-avatar" | "co-avatar co-avatar--petit" }) {
  return entree.avatar_url ? (
    <img className={taille} src={entree.avatar_url} alt="" loading="lazy" />
  ) : (
    <span className={taille} aria-hidden="true">{Initiales(nomAffichable(entree.display_name, "··"))}</span>
  );
}

interface Props {
  entree: LeaderboardEntry;
  place: number;
  estMoi: boolean;
  /** « rail » pour la colonne de droite, « plein » pour l onglet. */
  forme?: "rail" | "plein";
  onOuvrir?: (userId: string) => void;
}

export function ClassementLigne({ entree, place, estMoi, forme = "plein", onOuvrir }: Props) {
  const { t } = useTranslation();
  const nom = nomAffichable(entree.display_name, t("leaderboard.anonymousAgent", "Agent Anonyme"));
  const podium = place <= 3 ? "oui" : "non";

  if (forme === "rail") {
    return (
      <div className="co-rang" data-podium={podium} data-moi={estMoi ? "oui" : "non"}>
        <span className="co-rang-place">{place}</span>
        <Pastille entree={entree} taille="co-avatar co-avatar--petit" />
        <span className="co-rang-nom">{nom}</span>
        <span className="co-rang-xp">{entree.points.toLocaleString()}</span>
      </div>
    );
  }

  return (
    <div
      className="co-ligne-rang"
      data-podium={podium}
      data-moi={estMoi ? "oui" : "non"}
      role={onOuvrir ? "button" : undefined}
      tabIndex={onOuvrir ? 0 : undefined}
      onClick={() => onOuvrir?.(entree.user_id)}
      onKeyDown={(e) => {
        if (onOuvrir && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOuvrir(entree.user_id);
        }
      }}
    >
      <span className="co-ligne-rang-place">{place}</span>
      <Pastille entree={entree} taille="co-avatar" />
      <span style={{ minWidth: 0 }}>
        <span className="co-rang-nom" style={{ display: "block" }}>
          {nom}
          {estMoi && <span style={{ color: "var(--co-accent)", marginLeft: 6 }}>{t("leaderboard.you", "(TOI)")}</span>}
        </span>
        {entree.rank_name && <span className="co-ligne-rang-grade">{entree.rank_name}</span>}
      </span>
      <span className="co-ligne-rang-chiffre">
        {entree.points.toLocaleString()}
        <small>{t("leaderboard.xp", "XP")}</small>
      </span>
      <span className="co-ligne-rang-chiffre">
        {entree.goals_completed}
        <small>{t("leaderboard.goals", "Objectifs")}</small>
      </span>
    </div>
  );
}
