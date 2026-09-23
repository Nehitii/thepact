import { useMemo, type CSSProperties } from "react";
import { normaliserTeinte } from "@/domaines/succes";
import { useTailleDuNom } from "@/domaines/accueil/hooks/useTailleDuNom";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { graineDuTexte } from "@/domaines/accueil/logique/dessinsDuBandeau";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { BasculeDeMesure, SceauDuPacte } from "@/domaines/accueil/composants/bandeau/communs";
import { datePleine, nombre, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/enseigne.css";
import "@/domaines/accueil/composants/bandeau/caisson-du-palier.css";

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
 * LE PALIER A SA PROPRE ENSEIGNE. Le sceau en neon a gauche du nom, le
 * caisson du palier a droite : deux objets qui l encadrent, comme les
 * deux logos d une devanture. Voir « CaissonDuPalier » plus bas.
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

/**
 * LE CAISSON DU PALIER.
 *
 * L embleme du palier est une IMAGE que l utilisateur a choisie — un
 * tube de neon ne sait pas dessiner une image. Un caisson lumineux, si :
 * c est l objet des devantures qui porte un logo imprime sur un
 * diffuseur eclaire par l arriere. L embleme y est imprime ; sans
 * embleme, c est le numero du niveau qui prend le disque, comme sur le
 * noyau du tableau de bord actuel.
 *
 * AUTOUR, UN ANNEAU DE NEON EST LA JAUGE DU PALIER : la part allumee
 * est l avancement vers le palier suivant, le reste est du verre
 * eteint. C est la jauge du noyau actuel — un arc autour de l embleme —
 * dite avec un tube.
 *
 * Tout est a la teinte du palier, celle que le noyau lit deja ; une
 * teinte illisible retombe sur le gaz de l enseigne.
 */
function CaissonDuPalier({ p, famille, tube }: { p: ProprietesDuBandeau; famille: string; tube: string }) {
  const teinte = normaliserTeinte(p.rankTeinte) ?? tube;
  const avance = Math.min(100, Math.max(0, p.rankProgress ?? 0));
  const embleme = p.rankLogoUrl || null;
  const suite = p.nextRankName
    ? ` ${nombre(p.rankXP ?? 0)} sur ${nombre(p.rankXPTarget ?? 0)} XP avant ${p.nextRankName}.`
    : "";

  return (
    <div className="en-rang" style={{ "--en-rang": teinte } as CSSProperties}>
      <p className="en-lu">
        Niveau {p.level}{p.rankName && `, ${p.rankName}`} : {Math.round(avance)} % du palier.{suite}
      </p>
      <div className="en-caisson" aria-hidden="true">
        <svg className="en-anneau en-anneau--verre" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" />
        </svg>
        <svg className="en-anneau en-anneau--gaz" viewBox="0 0 100 100">
          {avance > 0 && (
            <circle
              cx="50" cy="50" r="46"
              pathLength={100}
              strokeDasharray={`${avance} 100`}
              transform="rotate(-90 50 50)"
            />
          )}
        </svg>
        <div className="en-disque" data-embleme={embleme ? "1" : undefined}>
          {embleme ? (
            <img className="en-embleme" src={embleme} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="en-disque-niveau" style={{ fontFamily: famille }}>
              <small>Niveau</small>{p.level}
            </span>
          )}
        </div>
      </div>
      <div className="en-rang-textes" aria-hidden="true">
        {embleme && (
          <p className="en-niveau" style={{ fontFamily: famille }}><small>Niv</small>{p.level}</p>
        )}
        {p.rankName && <p className="en-palier">{p.rankName}</p>}
      </div>
    </div>
  );
}

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

  /* Le niveau et le rang ont quitte le bandeau : ils sont sur le
     caisson. Le bandeau garde ce qui n a pas d autre place. */
  const diodes = [
    ...(l.jureLe ? [`Juré le ${datePleine(l.jureLe)}`] : []),
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
        <CaissonDuPalier p={p} famille={l.famille} tube={tube} />
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
