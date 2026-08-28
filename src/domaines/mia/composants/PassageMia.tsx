import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEtatDuJour } from "@/domaines/mia/hooks/useEtatDuJour";
import { chercherPassage, passageDuJour, type Passage } from "@/domaines/mia/logique/humeur";
import { PREF } from "@/lib/preferencesAffichage";
import { VisageMia } from "./VisageMia";
import "@/domaines/mia/mia.css";

/**
 * Les passages de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * ELLE APPARAÎT AUX PASSAGES, PAS TOUS LES JOURS.
 *
 * Un pacte qui bascule de phase, une journée close, un pacte qui arrive
 * à son terme. Trois évènements, et aucun n'arrive deux fois de suite :
 * l'empreinte de ce qui a été montré est retenue, et un passage déjà vu
 * ne se rejoue pas.
 *
 * C'EST CE QUI SÉPARE UNE APPARITION D'UN BANDEAU. Un compagnon qui
 * parle à chaque ouverture devient un décor qu'on ne lit plus — la pile
 * d'insights automatiques retirée à la passe 1 en était la preuve : 42
 * produits, 36 balayés.
 *
 * Elle se retire seule au bout de douze secondes, et on peut la
 * congédier d'un geste.
 * ═══════════════════════════════════════════════════════════════
 */
const DUREE_MS = 12_000;

export function PassageMia() {
  const { data: etat } = useEtatDuJour();
  const [passage, setPassage] = useState<Passage | null>(null);

  useEffect(() => {
    if (!etat) return;
    let vu: string | null = null;
    try {
      vu = localStorage.getItem(PREF.MIA_PASSAGE);
    } catch {
      /* navigation privée : chaque visite sera une première fois */
    }

    /* La journée close passe avant le reste : c'est la bonne nouvelle. */
    const candidat = passageDuJour(etat, vu) ?? chercherPassage(etat, vu);
    if (!candidat) return;

    try {
      localStorage.setItem(PREF.MIA_PASSAGE, candidat.empreinte);
    } catch {
      /* rien à faire : au pire elle se répétera une fois */
    }

    /* Une empreinte sans texte sert à retenir un état sans rien dire —
       la première visite ne bascule rien, elle découvre. */
    if (!candidat.texte) return;
    setPassage(candidat);
  }, [etat]);

  useEffect(() => {
    if (!passage) return;
    const t = window.setTimeout(() => setPassage(null), DUREE_MS);
    return () => window.clearTimeout(t);
  }, [passage]);

  return (
    <AnimatePresence>
      {passage && (
        <motion.aside
          className="mia-passage"
          data-cle={passage.cle}
          role="status"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ type: "spring", damping: 26, stiffness: 240 }}
        >
          <VisageMia expression={passage.expression} taille={112} />
          <div className="mia-passage-dit">
            <span className="mia-passage-nom">M.I.A</span>
            <p>{passage.texte}</p>
          </div>
          <button
            type="button"
            className="mia-passage-fermer"
            onClick={() => setPassage(null)}
            aria-label="Congédier M.I.A"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
