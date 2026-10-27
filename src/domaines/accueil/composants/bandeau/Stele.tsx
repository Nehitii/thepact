import type { CSSProperties } from "react";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { interponctuer, romain } from "@/domaines/accueil/logique/bandeaux";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { nombre, useApparition, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/stele.css";

/* VARIANTE E — LA STELE.
 *
 * THESE. Un pacte, c est ce qu on grave. Tout le reste de l interface
 * bouge, brille, se met a jour ; ici rien ne bouge. Une dalle de
 * basalte — de calcaire en theme clair —, le sceau taille en medaillon,
 * le nom grave, et dessous l inscription dans la capitale des
 * monuments, Cinzel, avec le point a mi-hauteur que les Romains
 * mettaient entre les mots : « TENIR·CE·QUI·EST·JURÉ ».
 *
 * LES NOMBRES EN CHIFFRES ROMAINS : niveau XII, XLVII missions, XCI
 * jours. Le chiffre arabe reste dessous, en petit — la pierre est
 * solennelle, pas obscure.
 *
 * LA PROGRESSION EST UN SILLON. Une rainure taillee sur toute la
 * largeur, qu un email a la teinte du pacte remplit jusqu a 62 %. A
 * l ouverture, l email coule dans la rainure : c est le seul
 * mouvement, et il ne se repete pas.
 *
 * L EFFET CHOISI DEVIENT UNE FINITION DE GRAVEUR. Doré : les lettres
 * sont dorees a la feuille. Cyan, feu, violet : peintes a l email.
 * « Parasites » : la dalle est fendue. Sans effet, les lettres sont
 * rechampies a la chaux, comme sur les monuments aux morts — c est ce
 * qui les rend lisibles de loin. */

const CINZEL = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&display=swap";

const FINITIONS: Readonly<Record<string, string>> = {
  "gold-glow": "dorure",
  "cyan-glow": "email",
  "fire-glow": "email",
  "purple-glow": "email",
  glitch: "fissure",
};
const EMAUX: Readonly<Record<string, string>> = {
  "cyan-glow": "#3bb3d4",
  "fire-glow": "#d8622a",
  "purple-glow": "#9a6ad8",
};

export function Stele(p: ProprietesDuBandeau) {
  usePoliceDuBanc(CINZEL);
  const l = useLectureDuBandeau(p);
  const pret = useApparition();
  const { cadre, taille, tient } = useTailleDuNom<HTMLDivElement>({
    texte: l.nom, famille: l.famille, graisse: 900, espacement: 0.14, part: 0.9, min: 26, max: 88,
  });
  const finition = FINITIONS[l.effet] ?? "chaux";
  const jure = l.jureLe
    ? [l.jureLe.getDate(), l.jureLe.getMonth() + 1, l.jureLe.getFullYear()].map(romain).join(" · ")
    : null;

  return (
    <section
      className="st"
      aria-labelledby="st-nom"
      data-finition={finition}
      style={{
        "--st-p": pret ? l.part : 0,
        "--st-teinte": l.teinte,
        "--st-email": finition === "dorure" ? "#d9b25a" : EMAUX[l.effet] ?? l.teinte,
      } as CSSProperties}
    >
      <div className="st-dalle" ref={cadre}>
        {finition === "fissure" && (
          <svg className="st-fissure" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
            <path d="M628 0 L611 44 L624 71 L596 118 L606 150 L577 199 L590 231 L563 284 L574 318 L549 371 L560 409 L538 458 L546 500" />
          </svg>
        )}

        <div className="st-medaillon">
          <SceauDuPacte
            nom={l.nom}
            valeurs={l.valeurs}
            version={p.sigilVersion}
            part={1}
            elan={0}
            symbole={p.pactSymbol}
            enCours={p.enCours ?? 0}
          />
        </div>

        <h1 id="st-nom" className="st-nom st-lettre" style={{ fontFamily: l.famille, fontSize: taille, whiteSpace: tient ? "nowrap" : undefined }}>
          {l.nom}
        </h1>
        {l.mantra && <p className="st-raison st-lettre">{interponctuer(l.mantra)}</p>}

        {l.valeurs.length > 0 && (
          <ul className="st-valeurs" aria-label="Valeurs jurées">
            {l.valeurs.map((v, i) => <li key={v + i} className="st-lettre">{v}</li>)}
          </ul>
        )}

        <dl className="st-nombres">
          <div>
            <dt className="st-lettre">Niveau {p.level}{p.rankName && <> · {p.rankName}</>}</dt>
            <dd className="st-romain st-lettre">{romain(p.level)}</dd>
          </div>
          <div>
            <dt className="st-lettre">{nombre(p.totalMissions)} missions</dt>
            <dd className="st-romain st-lettre">{romain(p.totalMissions)}</dd>
          </div>
          <div>
            <dt className="st-lettre">{nombre(p.activeDays)} jours</dt>
            <dd className="st-romain st-lettre">{romain(p.activeDays)}</dd>
          </div>
        </dl>

        <div className="st-sillon" aria-hidden="true"><span className="st-coulee" /></div>

        <p className="st-pied">
          <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="st-bascule st-lettre">
            {l.progression} % des {l.mesureLue}
          </BasculeDeMesure>
          {p.rankXPTarget ? (
            <span className="st-lettre">
              {nombre(p.rankXP ?? 0)} / {nombre(p.rankXPTarget)} XP{p.nextRankName && <> vers {p.nextRankName}</>}
            </span>
          ) : null}
          {jure && <span className="st-lettre">Juré le {jure}</span>}
        </p>
      </div>
    </section>
  );
}
