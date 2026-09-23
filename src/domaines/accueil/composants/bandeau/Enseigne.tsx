import { useMemo, type CSSProperties } from "react";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { graineDuTexte } from "@/domaines/accueil/logique/dessinsDuBandeau";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { nombre, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/enseigne.css";

/* VARIANTE C — L ENSEIGNE.
 *
 * THESE. Le nom du pacte n est pas affiche, il est ALLUME : des tubes
 * de verre sur un mur de beton, la nuit, comme une enseigne de rue.
 * C est la matiere dont le cyberpunk est fait — pas des panneaux
 * translucides, des objets de ville qui gresillent.
 *
 * Une enseigne a sa grammaire, et on la suit : un nom en capitales,
 * une ligne en cursive dans un autre tube (la raison), un pochoir peint
 * a la bombe sur le mur (les valeurs), une plaque emaillee sous le
 * chiffre, et un bandeau a diodes qui fait defiler le reste.
 *
 * L EFFET CHOISI DEVIENT LE GAZ DU TUBE : halo cyan, feu, violet ou
 * dore donnent la couleur ; sans effet, c est la teinte du pacte.
 * « Parasites » fait gresiller une lettre.
 *
 * UN TUBE QUI FAIBLIT DIT QUELQUE CHOSE. Quand aucun chantier n est
 * ouvert, une lettre du nom vacille de temps en temps, comme un tube en
 * fin de vie. Un pacte au repos se voit de loin — c est la meme regle
 * que le logo qui ralentit, dite dans la langue de la rue.
 *
 * A l ouverture, les tubes s allument un par un. C est le seul
 * mouvement voulu de la variante ; le defilement des diodes n est
 * que la nature d un bandeau a diodes. */

const POLICES = "https://fonts.googleapis.com/css2?family=Neonderthaw&family=Allerta+Stencil&display=swap";

/* Le gaz du tube, selon l effet choisi. */
const TUBES: Readonly<Record<string, string>> = {
  "cyan-glow": "#19d8ff",
  "fire-glow": "#ff5a1f",
  "purple-glow": "#b862ff",
  "gold-glow": "#ffc23a",
};

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

export function Enseigne(p: ProprietesDuBandeau) {
  usePoliceDuBanc(POLICES);
  const l = useLectureDuBandeau(p);
  const tube = TUBES[l.effet] ?? l.teinte;
  const { cadre, taille, tient } = useTailleDuNom<HTMLDivElement>({
    texte: l.nom, famille: l.famille, graisse: 500, espacement: 0.08, min: 30, max: 112,
  });
  const lettres = [...l.nom.toLocaleUpperCase("fr-FR")];
  const enCours = p.enCours ?? 0;
  const parasites = l.effet === "glitch";
  const faiblit = enCours === 0 || parasites;

  /* La lettre qui faiblit est tiree du nom : toujours la meme pour un
     pacte donne, jamais un espace. */
  const faible = useMemo(() => {
    const pleines = [...l.nom].map((c, i) => (c.trim() ? i : -1)).filter((i) => i >= 0);
    return pleines.length ? pleines[graineDuTexte(l.nom) % pleines.length] : -1;
  }, [l.nom]);

  const diodes = [
    `Niveau ${p.level}${p.rankName ? ` — ${p.rankName}` : ""}`,
    `${nombre(p.totalMissions)} ${pluriel(p.totalMissions, "mission", "missions")}`,
    `Jour ${nombre(p.activeDays)}`,
    ...(p.rankXPTarget
      ? [`${nombre(p.rankXP ?? 0)} / ${nombre(p.rankXPTarget)} XP${p.nextRankName ? ` vers ${p.nextRankName}` : ""}`]
      : []),
    enCours > 0 ? `${enCours} ${pluriel(enCours, "chantier ouvert", "chantiers ouverts")}` : "Aucun chantier ouvert",
  ];

  return (
    <section
      className="en"
      aria-labelledby="en-nom"
      data-faiblit={faiblit || undefined}
      data-parasites={parasites || undefined}
      style={{ "--en-tube": tube } as CSSProperties}
    >
      <div className="en-lueur" aria-hidden="true" />

      <div className="en-enseigne">
        <div className="en-rond" aria-hidden="true">
          <SceauDuPacte
            nom={l.nom}
            valeurs={l.valeurs}
            version={p.sigilVersion}
            part={l.part}
            elan={l.elan}
            symbole={p.pactSymbol}
            enCours={enCours}
          />
        </div>
        <div className="en-textes" ref={cadre}>
          <h1 id="en-nom" className="en-nom" data-tient={tient || undefined} style={{ fontFamily: l.famille, fontSize: taille }}>
            <span className="en-lu">{l.nom}</span>
            {lettres.map((c, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={i === faible ? "en-l en-l--faible" : "en-l"}
                style={{ "--i": i } as CSSProperties}
              >
                {c}
              </span>
            ))}
          </h1>
          {l.mantra && <p className="en-script">{l.mantra}</p>}
        </div>
      </div>

      <div className="en-bas">
        {l.valeurs.length > 0 && <p className="en-pochoir">{l.valeurs.join(" · ")}</p>}
        <div className="en-compteur">
          <span className="en-chiffre" style={{ fontFamily: l.famille }}>
            {l.progression}<small>%</small>
          </span>
          <BasculeDeMesure lecture={l} onChanger={p.onChangerMesure} className="en-plaque">
            {l.mesureLue}
          </BasculeDeMesure>
        </div>
      </div>

      <div className="en-diodes">
        <p className="en-lu">{diodes.join(". ")}.</p>
        <div className="en-matrice" aria-hidden="true">
          <div className="en-bande">
            {[0, 1].map((copie) => (
              <span key={copie} className="en-boucle">
                {diodes.map((texte, i) => (
                  <span key={i}>{texte}<i className="en-sep" /></span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
