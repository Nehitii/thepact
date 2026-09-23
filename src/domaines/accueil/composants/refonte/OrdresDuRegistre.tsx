import { motion } from "framer-motion";
import { Check, Circle, Sparkles } from "lucide-react";
import { resteAvant } from "@/domaines/accueil/logique/lectureDuTableau";
import type { DonneesDuTableau } from "@/domaines/accueil/composants/refonte/communs";

/* LES ORDRES DU JOUR, DANS LE RAIL DU REGISTRE.
 *
 * LA PRIME VOLE. Reclamer un ordre ne coche pas une case : la prime
 * quitte le rail et vient se poser dans le registre, a l heure qu il
 * est, au-dessus de la ligne MAINTENANT. Ce qui vient d etre fait
 * rejoint ce qui a ete fait — c est la these du registre, jouee en un
 * geste. Le solde, dans le bandeau, roule du meme montant. */

export function OrdresDuRegistre({ ordres, maintenant, reclamer }: DonneesDuTableau) {
  const minuitUtc = new Date(Date.UTC(
    maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate() + 1,
  ));
  const acquise = ordres.filter((o) => o.reclame).reduce((s, o) => s + o.prime, 0);
  const totale = ordres.reduce((s, o) => s + o.prime, 0);

  return (
    <section className="rb-panneau rb-ordres" aria-label="Ordres du jour">
      <h2>Ordres du jour</h2>
      <p className="rb-ordres-tete">
        <span><b>{acquise}</b>/{totale} bonds</span>
        <span>tombent dans {resteAvant(minuitUtc, maintenant)}</span>
      </p>
      <ul>
        {ordres.map((o) => {
          const pret = o.progres >= o.cible && !o.reclame;
          return (
            <li key={o.id} data-etat={o.reclame ? "tenu" : pret ? "pret" : "en-cours"}>
              <span className="rb-ordre-marque" aria-hidden="true">
                {o.reclame ? <Check /> : pret ? <Sparkles /> : <Circle />}
              </span>
              <span className="rb-ordre-titre">
                {o.titre}
                <em>{o.reclame ? "tenu" : `${o.progres}/${o.cible}`}</em>
              </span>
              {pret ? (
                <button type="button" className="rb-reclamer" onClick={() => reclamer(o.id)}>
                  Réclamer
                  <motion.span layoutId={`prime-${o.id}`} className="rb-prime">+{o.prime}</motion.span>
                </button>
              ) : (
                <span className="rb-ordre-prime">{o.prime}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
