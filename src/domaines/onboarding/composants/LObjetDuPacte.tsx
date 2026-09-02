import { useMemo } from "react";
import { motion } from "framer-motion";
import { PactVisual, sigilDuPacte } from "@/domaines/objectifs";

interface Props {
  nomDuPacte: string;
  valeurs: readonly string[];
  symbole: string;
  mantra: string;
  /** La teinte du pacte, en couleur CSS resolue. */
  teinte: string;
  /** Vrai une fois le serment signe : l anneau se ferme. */
  scelle?: boolean;
  sansAnimation?: boolean;
}

/* Deux anneaux, et vingt-quatre graduations. */
const ANNEAUX = [0.97, 0.82];
const GRADUATIONS = 24;

/* EN PIXELS D ECRAN, et c est le point. « non-scaling-stroke » compte
   l epaisseur en pixels rendus, pas en unites du repere : l ancien
   sigil demandait « 0.014 », soit quatorze MILLIEMES de pixel. Les
   traits etaient calcules, poses, et invisibles — le porteur voyait un
   anneau vide et croyait l animation plantee. Elle ne plantait pas. */
const EPAISSEUR_TRAIT = 1.7;
const EPAISSEUR_CORDE = 1.1;

/**
 * L OBJET DU PACTE.
 *
 * LE RITE N EST PLUS UNE SUITE DE FENETRES : c est un objet qu on
 * forge, et qui reste sous les yeux du debut a la fin. Chaque reponse
 * le change pour de vrai — le nom fait naitre les glyphes, le symbole
 * bat en son centre, la teinte gagne tout l ecran, les valeurs
 * viennent s ancrer a l anneau et la corde les relie.
 *
 * C EST CE QUI REMPLACE LA BARRE DE PROGRESSION. On ne lit pas
 * combien il reste : on voit ce qu on a deja.
 *
 * Les glyphes se DEDUISENT du pacte, et le meme pacte donne toujours
 * le meme dessin — voir « sigil.ts », dans le domaine du pacte.
 */
export function LObjetDuPacte({
  nomDuPacte, valeurs, symbole, mantra, teinte, scelle, sansAnimation,
}: Props) {
  const sigil = useMemo(() => sigilDuPacte(nomDuPacte, valeurs), [nomDuPacte, valeurs]);

  const rayonDesTraits = 0.9;
  const tailleDuTrait = 0.115;

  return (
    <div className="ob-objet" style={{ "--ob-teinte": teinte } as React.CSSProperties}>
      {/* LE CERCLE DANS SA PROPRE BOITE CARREE. Le halo, l anneau et
          le coeur se posent en absolu : sans ce cadre a eux, ils se
          calaient sur tout l objet, et la legende — posee sous lui en
          absolu — passait SOUS la voie sur ecran etroit. Une legende
          hors du flux ne reserve pas sa place. */}
      <div className="ob-objet-cadre">
      <div className="ob-objet-halo" aria-hidden="true" />

      <svg className="ob-objet-anneau" viewBox="-1.2 -1.2 2.4 2.4" aria-hidden="true">
        {ANNEAUX.map((r, i) => (
          <circle
            key={r}
            className="ob-anneau"
            cx="0" cy="0" r={r}
            strokeWidth={i === 0 ? 1.4 : 0.9}
            vectorEffect="non-scaling-stroke"
            opacity={i === 0 ? 0.55 : 0.28}
          />
        ))}

        {/* L anneau du serment : il se ferme au moment ou l on signe. */}
        <motion.circle
          className="ob-anneau-scelle"
          cx="0" cy="0" r="1.06"
          strokeWidth={2.2}
          vectorEffect="non-scaling-stroke"
          initial={false}
          animate={{ pathLength: scelle ? 1 : 0, opacity: scelle ? 1 : 0 }}
          transition={{ duration: sansAnimation ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        {Array.from({ length: GRADUATIONS }, (_, i) => {
          const a = (i / GRADUATIONS) * Math.PI * 2;
          const longue = i % 6 === 0;
          const r1 = longue ? 0.88 : 0.92;
          return (
            <line
              key={i}
              className="ob-graduation"
              x1={Math.cos(a) * r1} y1={Math.sin(a) * r1}
              x2={Math.cos(a) * 0.97} y2={Math.sin(a) * 0.97}
              strokeWidth={longue ? 1.5 : 0.8}
              vectorEffect="non-scaling-stroke"
              opacity={longue ? 0.6 : 0.3}
            />
          );
        })}

        {/* LA CORDE DES VALEURS, dans leur ordre de rang : deux porteurs
            qui ont choisi les memes valeurs dans un ordre different
            n ont pas le meme sceau. */}
        {sigil.polygone.length > 1 && (
          <motion.polygon
            className="ob-corde"
            points={sigil.polygone.map((p) => `${p.x * 0.97},${p.y * 0.97}`).join(" ")}
            strokeWidth={EPAISSEUR_CORDE}
            vectorEffect="non-scaling-stroke"
            initial={sansAnimation ? false : { opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {sigil.ancres.map((a, i) => (
          <motion.circle
            key={a.valeur}
            className="ob-ancre"
            cx={Math.cos(a.angle) * 0.97}
            cy={Math.sin(a.angle) * 0.97}
            r="0.032"
            initial={sansAnimation ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, delay: sansAnimation ? 0 : i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
          />
        ))}

        {/* LES GLYPHES DU NOM. Chaque trait est dessine dans sa boite
            unitaire, ramene a sa taille, puis pose a son angle — et il
            SE TRACE, parce qu un nom qui apparait d un bloc n a pas
            l air d avoir ete forge. */}
        {sigil.traits.map((trait, i) => (
          <g
            key={`${i}-${trait.d}`}
            transform={
              `translate(${Math.cos(trait.angle) * rayonDesTraits} ${Math.sin(trait.angle) * rayonDesTraits})`
              + ` rotate(${(trait.angle * 180) / Math.PI + 90})`
              + ` scale(${tailleDuTrait}) translate(-0.5 -0.5)`
            }
          >
            <motion.path
              className="ob-glyphe"
              d={trait.d}
              strokeWidth={EPAISSEUR_TRAIT}
              vectorEffect="non-scaling-stroke"
              initial={sansAnimation ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: sansAnimation ? 0 : 0.5,
                delay: sansAnimation ? 0 : Math.min(i * 0.045, 0.6),
                ease: "easeOut",
              }}
            />
          </g>
        ))}
      </svg>

      {/* LE SYMBOLE VIVANT — celui-la meme que porte le tableau de bord
          une fois le pacte scelle. Le rite ne montre pas une doublure. */}
      <div className="ob-objet-coeur">
        <PactVisual symbol={symbole} size="lg" elan={scelle ? 1 : 0.55} />
      </div>
      </div>

      <div className="ob-objet-legende">
        <b className="ob-objet-nom">{nomDuPacte || "—"}</b>
        {mantra && <span className="ob-objet-mantra">{mantra}</span>}
      </div>
    </div>
  );
}
