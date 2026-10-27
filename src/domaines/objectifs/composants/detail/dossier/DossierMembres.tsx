/* LE VOLET DES MEMBRES D UN OBJECTIF DE GROUPE.
 *
 * Cent dix lignes sorties de `DossierVolets.tsx`, qui en faisait 472 et
 * tenait quatre volets sans rapport les uns avec les autres.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { BoutonHonneur } from "@/domaines/objectifs/composants/detail/dossier/BoutonHonneur";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { deuxChiffres, TRIS, ICONE_TRI, type Tri } from "@/domaines/objectifs/logique/triDuDossier";

export interface MembreDossier {
  id: string;
  name: string;
  difficulty: string;
  status: string | null;
  progress: number;
  isCompleted: boolean;
  isMissing?: boolean;
}

export const DossierMembres = React.memo(function DossierMembres({
  membres, teintePar, dynamique, onOuvrir, auSeuil, onHonorer, onEclat,
}: {
  membres: MembreDossier[];
  teintePar: (difficulte: string) => string;
  dynamique: boolean;
  onOuvrir: (id: string) => void;
  /** Tous les membres sont franchis, le groupe n est pas encore honore. */
  auSeuil: boolean;
  onHonorer: () => void;
  onEclat?: (x: number, y: number, couleur: string) => void;
}) {
  const { t } = useTranslation();
  const franchis = membres.filter((m) => m.isCompleted).length;

  /* Le choix se garde d un groupe a l autre et d une session a la
     suivante : qui lit ses groupes par avancement les lit tous ainsi. */
  const [tri, setTri] = React.useState<Tri>(() => {
    const garde = typeof localStorage !== "undefined" ? localStorage.getItem(PREF.DOSSIER_TRI) : null;
    return (TRIS as readonly string[]).includes(garde ?? "") ? (garde as Tri) : "ordre";
  });

  const changerTri = () => {
    const suivant = TRIS[(TRIS.indexOf(tri) + 1) % TRIS.length];
    setTri(suivant);
    try { localStorage.setItem(PREF.DOSSIER_TRI, suivant); } catch { /* mode prive */ }
  };

  const ordonnes = React.useMemo(() => {
    if (tri === "ordre") return membres;
    /* Le tri de JavaScript est stable : a avancement egal, les membres
       gardent l ordre du groupe. Un objectif introuvable n a pas
       d avancement — il finit en bas, dans les deux sens. */
    const rang = (m: MembreDossier) => (m.isMissing ? -1 : m.progress);
    return [...membres].sort((a, b) => {
      if (a.isMissing !== b.isMissing) return a.isMissing ? 1 : -1;
      return tri === "avance" ? rang(b) - rang(a) : rang(a) - rang(b);
    });
  }, [membres, tri]);

  const IconeTri = ICONE_TRI[tri];
  const nomTri = tri === "ordre"
    ? t("goals.detail.sortOrder", "Ordre")
    : t("goals.detail.sortProgress", "Avancement");

  return (
    <section className="gd-volet">
      <header className="gd-tete">
        {dynamique
          ? t("goals.detail.dynamicGroup", "Constellation vivante")
          : t("goals.detail.group", "Constellation")}
        <span className="gd-tete-fin">
          <b>{franchis}/{membres.length}</b>
          {membres.length > 1 && (
            <button
              type="button"
              className="gd-tete-bouton gd-tri"
              onClick={changerTri}
              title={t("goals.detail.sortHint", "Changer l'ordre d'affichage")}
              aria-label={`${t("goals.detail.sortHint", "Changer l'ordre d'affichage")} — ${nomTri}`}
            >
              <IconeTri size={11} aria-hidden="true" />
              {nomTri}
            </button>
          )}
        </span>
      </header>
      <div className="gd-liste">
        {ordonnes.map((m, i) => {
          const t2 = teintePar(m.difficulty);
          const cellules = 10;
          const pleines = Math.round((m.progress / 100) * cellules);
          return (
            <button
              key={m.id}
              type="button"
              className="gd-membre"
              style={{ ["--t" as string]: t2 }}
              onClick={() => onOuvrir(m.id)}
              disabled={m.isMissing}
            >
              <span className="gd-num">{deuxChiffres(i + 1)}</span>
              <span className="gd-membre-nom" title={m.name}>
                {m.isMissing ? t("goals.detail.missingGoal", "Objectif introuvable") : m.name}
              </span>
              <span className="gd-membre-jauge" aria-hidden="true">
                {Array.from({ length: cellules }, (_, k) => (
                  <u key={k} className={k < pleines ? "on" : ""} />
                ))}
              </span>
              <span className="gd-membre-pct">{m.progress}%</span>
            </button>
          );
        })}
        {membres.length === 0 && (
          <p className="gd-vide">{t("goals.detail.noMembers", "Aucun astre dans cette constellation")}</p>
        )}
      </div>
      {auSeuil && (
        <BoutonHonneur total={membres.length} onHonorer={onHonorer} onEclat={onEclat} />
      )}
    </section>
  );
});
