import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MISSION, PACTE } from "@/domaines/accueil/logique/scenarioDuTableau";
import { dateLongue, heure, resteAvant } from "@/domaines/accueil/logique/lectureDuTableau";
import { usePoliceDuBanc, type DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";
import { BoutonTampon, Tampon, Trombone } from "@/domaines/accueil/composants/refonte/PiecesDuDossier";
import { FeuilletsDuDossier, type Onglet } from "@/domaines/accueil/composants/refonte/FeuilletsDuDossier";
import "@/domaines/accueil/composants/refonte/dossier.css";

/* ═══════════════════════════════════════════════════════════════
   LE DOSSIER SCELLE — le contrat de la direction.

   THESE. Le pacte est un serment : le tableau de bord en est le
   dossier, qu on ouvre chaque jour. L etat ne se colore pas, il se
   tamponne. Il refuse la grille de panneaux sombres a filets neon.

   MONDE. Une chemise de carton noir mat ; dedans, des feuillets de
   papier pelure gris-bleu, tapes a la machine en encre carbone.
   Deux encres de tampon : violette pour ce qui est acte, rouge pour
   ce qui presse — le rouge est la seule couleur d action. La teinte
   du pacte ne vit que dans la cire du cachet.

   RECIT. On ouvre le dossier ; a gauche le proces-verbal du jour —
   les ordres a viser, la mission agrafee, la main courante ; a
   droite la fiche du pacte, le delai tamponne, et la question que
   pose tout serment : le plan tient-il dans le temps qui reste ?

   PREMIER ECRAN. La chemise ouverte sur toute la largeur. Le
   proces-verbal a gauche, la fiche a droite sous trois onglets
   (Le pacte, Objectifs, Rang), le cachet de cire a cheval sur le
   bord du feuillet. L action — tamponner un ordre — est en haut a
   gauche, a portee du premier regard.

   FORME. « Le dossier scelle », cinquieme de la liste, cle 78d3a9c2.
   Rehausse par les mondes ecartes : la jaquette de cassette (le plan
   doit tenir dans le delai), la livree de course (des chiffres de
   carrosserie), le labo photo (un geste irreversible se tient
   appuye), la tensegrite (chaque objectif rattache a sa valeur), la
   cape a cordon (une seule couleur d action).

   FIN. Unreviewed and undocumented is unfinished; this build ends
   with the finish review, the verdict, DESIGN.md, and every shipping
   raster carrying its provenance.
   ═══════════════════════════════════════════════════════════════ */

const COURIER = "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Oswald:wght@500;700&display=swap";

export function Dossier(d: DonneesDuTableau) {
  usePoliceDuBanc(COURIER);
  const { maintenant, ordres, journee, reclamer } = d;
  const [onglet, setOnglet] = useState<Onglet>("pacte");
  const [initiaux] = useState(() => new Set(ordres.filter((o) => o.reclame).map((o) => o.id)));
  const tenus = ordres.filter((o) => o.reclame).length;

  return (
    <div className="do">
      <div className="do-chemise">
        <motion.div className="do-couverture" aria-hidden="true"
          initial={{ rotateY: 0 }} animate={{ rotateY: -178 }}
          transition={{ duration: 1.1, ease: [0.3, 0.7, 0.2, 1], delay: 0.25 }}>
          <span className="do-couverture-titre">Pacte « {PACTE.nom} »</span>
          <span className="do-couverture-mention">Dossier personnel — ne pas sortir</span>
        </motion.div>

        {/* ── LE FEUILLET DE GAUCHE : le proces-verbal du jour ── */}
        <section className="do-feuille do-gauche" aria-labelledby="do-pv">
          <header className="do-entete">
            <div>
              <p className="do-imprime">Formulaire P-7 · Procès-verbal du jour</p>
              <h2 id="do-pv" className="do-tape">{dateLongue(maintenant, maintenant)}</h2>
              <p className="do-tape do-discret">Relevé à {heure(maintenant).replace(":", " h ")}.</p>
            </div>
            <Tampon encre="violette" rotation={-4} className="do-dateur">
              <b>{maintenant.getDate()} {maintenant.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}</b>
              <i>{maintenant.getFullYear()}</i>
            </Tampon>
          </header>

          <table className="do-ordres">
            <caption className="do-imprime">
              Ordres du jour — {tenus} visé{tenus > 1 ? "s" : ""} sur {ordres.length}, à rendre avant 2 h
            </caption>
            <thead>
              <tr><th scope="col">Ordre</th><th scope="col">Fait</th><th scope="col">Prime</th><th scope="col">Visa</th></tr>
            </thead>
            <tbody>
              {ordres.map((o) => {
                const pret = o.progres >= o.cible && !o.reclame;
                return (
                  <tr key={o.id}>
                    <td className="do-tape">{o.titre}</td>
                    <td className="do-tape do-chiffre">{o.progres}/{o.cible}</td>
                    <td className="do-tape do-chiffre">{o.prime}</td>
                    <td className="do-visa">
                      {o.reclame ? (
                        <Tampon encre="violette" rotation={-8} taille="petit" anime={!initiaux.has(o.id)}>Tenu</Tampon>
                      ) : pret ? (
                        <BoutonTampon onTamponne={() => reclamer(o.id)}>Tamponner</BoutonTampon>
                      ) : (
                        <span className="do-tape do-discret">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <aside className="do-fiche" aria-label="Mission en cours">
            <Trombone />
            <p className="do-imprime do-fiche-titre">Mission en cours</p>
            <p className="do-tape do-fiche-mission">« {MISSION.titre} »</p>
            <p className="do-tape">{MISSION.objectif} — étape 8 sur 12.</p>
            <p className="do-tape">
              Échéance : {dateLongue(MISSION.echeance, maintenant)}, {heure(MISSION.echeance).replace(":", " h ")}.
            </p>
            <p className="do-reste">
              Reste <b>{resteAvant(MISSION.echeance, maintenant)}</b>
            </p>
          </aside>

          <section className="do-main-courante" aria-labelledby="do-mc">
            <h3 id="do-mc" className="do-imprime">Main courante</h3>
            <ol>
              <AnimatePresence initial={false}>
                {journee.map((e) => (
                  <motion.li key={`${e.heure}-${e.titre}`} className="do-tape"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    <time>{e.heure.replace(":", " h ")}</time> {e.titre}{e.detail ? ` — ${e.detail}` : ""}.
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </section>
        </section>

        <div className="do-pli" aria-hidden="true" />

        {/* ── LE FEUILLET DE DROITE : sous trois onglets ── */}
        <section className="do-feuille do-droite" aria-label="Fiche du pacte">
          <div className="do-onglets" role="tablist" aria-label="Pièces du dossier">
            {(["pacte", "objectifs", "rang"] as const).map((o) => (
              <button key={o} type="button" role="tab" aria-selected={onglet === o}
                className="do-onglet" onClick={() => setOnglet(o)}>
                {o === "pacte" ? "Le pacte" : o === "objectifs" ? "Objectifs" : "Rang"}
              </button>
            ))}
          </div>
          <FeuilletsDuDossier {...d} onglet={onglet} />
        </section>
      </div>
    </div>
  );
}
