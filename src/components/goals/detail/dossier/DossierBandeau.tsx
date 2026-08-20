/**
 * L en-tete du dossier.
 *
 * Le visuel encadre a la couleur du palier, le nom sous la barre
 * jaune de la page Goals, les releves en etiquettes, la progression
 * en cellules. Les sept actions deviennent une rangee d outils : en
 * boutons a texte elles occupaient deux lignes et pesaient autant que
 * le nom de l objectif.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Pencil, Check, CheckCheck, Pause, Play, Archive, Copy,
  Lock, LockOpen, Trash2, Star, Target, Link2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getTagLabel } from "@/lib/goalConstants";
import { encreSurFond } from "./encre";
import type { GoalDetailData } from "@/hooks/useGoalDetail";

interface Props {
  goal: GoalDetailData;
  teinte: string;
  progression: number;
  faites: number;
  total: number;
  uniteAvancement: string;
  libellePalier: string;
  libelleEtat: string;
  etiquettes: string[];
  estHonore: boolean;
  partageActif: boolean;
  onRetour: () => void;
  onModifier: () => void;
  onToutValider: () => void;
  onPause: () => void;
  onReprendre: () => void;
  onArchiver: () => void;
  onDupliquer: () => void;
  onSupprimer: () => void;
  onBasculerVerrou: () => void;
  onBasculerFocus: (e: React.MouseEvent) => void;
  onPartager: () => void;
}

export const DossierBandeau = React.memo(function DossierBandeau({
  goal, teinte, progression, faites, total, uniteAvancement,
  libellePalier, libelleEtat, etiquettes, estHonore, partageActif,
  onRetour, onModifier, onToutValider, onPause, onReprendre, onArchiver,
  onDupliquer, onSupprimer, onBasculerVerrou, onBasculerFocus, onPartager,
}: Props) {
  const { t } = useTranslation();

  const enCours = !estHonore && goal.status !== "paused" && goal.status !== "archived";
  const arretable = goal.status !== "fully_completed" && goal.status !== "archived";

  return (
    <>
      <button type="button" className="gd-retour" onClick={onRetour}>
        <ArrowLeft size={13} aria-hidden="true" />
        {t("goals.detail.back", "Retour aux objectifs")}
      </button>

      <div className="cp-cadre gd-bandeau">
        <div className="cp-fond">
          <span className="cp-equerre cp-equerre-hg" aria-hidden="true" />
          <span className="cp-equerre cp-equerre-bd" aria-hidden="true" />
          {estHonore && <span className="gd-sceau">{t("goals.detail.honoured", "HONORÉ")}</span>}

          <div className="gd-bandeau-in">
            <div className="gd-vignette" data-honore={estHonore ? "1" : "0"} style={{ ["--t" as string]: teinte }}>
              {goal.image_url
                ? <img src={goal.image_url} alt="" />
                : <div className="gd-vignette-vide"><Target size={34} aria-hidden="true" /></div>}
              <button
                type="button"
                className="gd-focus"
                data-actif={goal.is_focus ? "1" : "0"}
                onClick={onBasculerFocus}
                title={t("goals.detail.focus", "Mettre en avant")}
                aria-label={t("goals.detail.focus", "Mettre en avant")}
                aria-pressed={!!goal.is_focus}
              >
                <Star size={12} aria-hidden="true" />
              </button>
            </div>

            <div className="gd-centre">
              <h1 className="gd-nom" title={goal.name}>{goal.name}</h1>

              <div className="gd-releves">
                <span className="cp-tag" style={{ background: teinte, color: encreSurFond(teinte) }}>{libellePalier}</span>
                <span className="cp-tag cp-tag-sombre">{libelleEtat}</span>
                <span className="gd-xp">{goal.potential_score ?? 0} XP</span>
                {etiquettes.map((e) => (
                  <span key={e} className="gd-etiq">{getTagLabel(e, t)}</span>
                ))}
              </div>

              <div className="gd-jauge-ligne">
                <div className="cp-segments" style={{ ["--c" as string]: teinte }}>
                  <i style={{ width: `${progression}%` }} />
                </div>
                <span className="gd-jauge-val">
                  {faites}/{total} {uniteAvancement} · {Math.round(progression)}%
                </span>
              </div>
            </div>

            <div className="gd-outils">
              <Outil icone={Pencil} nom={t("common.edit", "Modifier")} onClick={onModifier} />

              {enCours && (
                <Outil
                  icone={CheckCheck}
                  nom={t("goals.detail.completeAll", "Tout valider")}
                  onClick={onToutValider}
                  variante="valider"
                />
              )}

              {arretable && (goal.status === "paused"
                ? <Outil icone={Play} nom={t("goals.detail.resume", "Reprendre")} onClick={onReprendre} />
                : <Outil icone={Pause} nom={t("goals.detail.pause", "Mettre en pause")} onClick={onPause} />)}

              {goal.status !== "archived" && (
                <Outil icone={Archive} nom={t("goals.detail.archive", "Archiver")} onClick={onArchiver} />
              )}

              <Outil icone={Copy} nom={t("goals.detail.duplicate", "Dupliquer")} onClick={onDupliquer} />

              <Outil
                icone={goal.is_locked ? LockOpen : Lock}
                nom={goal.is_locked
                  ? t("goals.detail.unlock", "Déverrouiller")
                  : t("goals.detail.lock", "Verrouiller")}
                onClick={onBasculerVerrou}
                variante={goal.is_locked ? "verrou" : undefined}
              />

              {partageActif && (
                <Outil icone={Link2} nom={t("goals.detail.share", "Partager")} onClick={onPartager} />
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="gd-outil gd-outil--danger"
                    title={t("common.delete", "Supprimer")}
                    aria-label={t("common.delete", "Supprimer")}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("goals.detail.deleteTitle", "Supprimer cet objectif ?")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("goals.detail.deleteBody", "L'objectif et toutes ses étapes seront supprimés. Cette action est définitive.")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel", "Annuler")}</AlertDialogCancel>
                    <AlertDialogAction onClick={onSupprimer} className="bg-destructive text-destructive-foreground">
                      {t("common.delete", "Supprimer")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

function Outil({
  icone: Icone, nom, onClick, variante,
}: {
  icone: typeof Check;
  nom: string;
  onClick: () => void;
  variante?: "valider" | "verrou";
}) {
  return (
    <button
      type="button"
      className={`gd-outil${variante ? ` gd-outil--${variante}` : ""}`}
      onClick={onClick}
      title={nom}
      aria-label={nom}
    >
      <Icone size={14} aria-hidden="true" />
    </button>
  );
}
