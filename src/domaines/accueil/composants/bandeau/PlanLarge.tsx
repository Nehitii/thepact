import { useMemo, type CSSProperties } from "react";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { cheminDeLaVille, fenetres, silhouetteDeVille } from "@/domaines/accueil/logique/dessinsDuBandeau";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { datePleine, nombre, useApparition, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/plan-large.css";

/* VARIANTE F — LE PLAN LARGE.
 *
 * THESE. Le pacte est un film dont on est le seul acteur, et le
 * tableau de bord en montre le plan d ouverture : un cadre en 2,39:1
 * entre deux bandes noires, une ville a l horizon, le titre au milieu.
 *
 * LE SOLEIL SE LEVE AVEC LE PACTE. Sa hauteur au-dessus de l horizon
 * EST la progression : a 0 %, il est encore sous la ville et c est la
 * nuit ; a 100 %, il est haut, et le ciel a pris la teinte du pacte.
 * On lit ou l on en est comme on lit l heure au ciel.
 *
 * LA RAISON EST LE SOUS-TITRE — en bas de l image, blanc cerne de
 * noir, precede d un tiret de dialogue. Et les chiffres sont le
 * GENERIQUE, dans la typographie etroite des affiches : « un pacte en
 * 47 missions, avec Liberté, Discipline et Création ». Les valeurs sont
 * la distribution ; le rang suivant, ce qui passe « prochainement ».
 *
 * La ville est tiree du nom : chaque pacte a sa ligne d horizon, et
 * elle ne change jamais. Sous 560 px, le plan large devient une
 * affiche en hauteur. */

const SIX_CAPS = "https://fonts.googleapis.com/css2?family=Six+Caps&display=swap";

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

export function PlanLarge(p: ProprietesDuBandeau) {
  usePoliceDuBanc(SIX_CAPS);
  const l = useLectureDuBandeau(p);
  const pret = useApparition();
  const { cadre, taille, tient } = useTailleDuNom<HTMLDivElement>({
    texte: l.nom, famille: l.famille, graisse: 900, espacement: 0.3, part: 0.84, min: 22, max: 96,
  });
  const ville = useMemo(() => {
    const immeubles = silhouetteDeVille(l.nom);
    return { chemin: cheminDeLaVille(immeubles), fenetres: fenetres(immeubles, l.nom) };
  }, [l.nom]);
  const enCours = p.enCours ?? 0;
  const [premieres, derniere] = [l.valeurs.slice(0, -1), l.valeurs.at(-1)];

  return (
    <section
      className="pl"
      aria-labelledby="pl-nom"
      data-pret={pret || undefined}
      style={{ "--pl-p": pret ? l.part : 0, "--pl-teinte": l.teinte } as CSSProperties}
    >
      <div className="pl-bande pl-bande--haut">
        <span>{l.jureLe ? <>En salle depuis le {datePleine(l.jureLe)}</> : "En salle"}</span>
        <span>{l.terme ? <>Dernière séance le {datePleine(l.terme)}</> : "Sans dernière séance"}</span>
      </div>

      <div className="pl-image" ref={cadre}>
        <div className="pl-ciel" aria-hidden="true" />
        <div className="pl-etoiles" aria-hidden="true" />
        <div className="pl-soleil" aria-hidden="true" />
        <svg className="pl-ville" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={ville.chemin} />
          <g className="pl-fenetres">
            {ville.fenetres.map((f, i) => <rect key={i} x={f.x} y={f.y} width="1.7" height="1.9" />)}
          </g>
        </svg>
        <h1 id="pl-nom" className="pl-titre" style={{ fontFamily: l.famille, fontSize: taille, whiteSpace: tient ? "nowrap" : undefined, ...l.styleEffet }}>
          {l.nom}
        </h1>
        {l.mantra && <p className="pl-sous-titre">— {l.mantra}</p>}
        <div className="pl-grain" aria-hidden="true" />
      </div>

      <div className="pl-bande pl-bande--bas">
        <div className="pl-generique">
          <small>Overwrite présente</small>
          <b>un pacte en {nombre(p.totalMissions)} {pluriel(p.totalMissions, "mission", "missions")}</b>
          {l.valeurs.length > 0 && (
            <>
              <small>avec</small>
              {premieres.map((v, i) => <b key={v + i}>{v}</b>)}
              {premieres.length > 0 && <small>et</small>}
              <b>{derniere}</b>
            </>
          )}
          <small>niveau</small>
          <b>{p.level}{p.rankName && <> · {p.rankName}</>}</b>
          <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="pl-bascule">
            <b>{l.progression} %</b><small>des {l.mesureLue}</small>
          </BasculeDeMesure>
          <small>jour</small>
          <b>{nombre(p.activeDays)}</b>
          {enCours > 0 && (
            <>
              <small>en tournage</small>
              <b>{enCours} {pluriel(enCours, "chantier", "chantiers")}</b>
            </>
          )}
          {p.nextRankName && (
            <>
              <small>prochainement</small>
              <b>{p.nextRankName}</b>
              {p.rankXPTarget ? <small>{nombre(p.rankXP ?? 0)} / {nombre(p.rankXPTarget)} XP</small> : null}
            </>
          )}
          <span className="pl-logo" aria-hidden="true">
            <SceauDuPacte
              taille={30}
              nom={l.nom}
              valeurs={l.valeurs}
              version={p.sigilVersion}
              part={l.part}
              elan={l.elan}
              symbole={p.pactSymbol}
              enCours={enCours}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
