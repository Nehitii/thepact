import { useState, type CSSProperties } from "react";
import { INTERRUPTEURS, type IdInterrupteur } from "@/domaines/accueil/logique/interrupteurs";
import type { MesureProgression, ProprietesDuBandeau } from "@/domaines/accueil/types";
import { InterrupteurDeMesure } from "@/domaines/accueil/composants/bandeau/InterrupteurDeMesure";
import { gazDuTube, useLectureDuBandeau } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/enseigne.css";
import "@/domaines/accueil/composants/bandeau/planche-des-interrupteurs.css";

/* LA PLANCHE DES INTERRUPTEURS — AU BANC SEULEMENT.
 *
 * Les sept commandes de mesure sur le meme mur de beton que
 * l enseigne, chacune avec son compteur. Chacune a SA mesure : on les
 * manoeuvre une a une, pour juger le geste et la bascule de chacune —
 * pas sept objets qui claqueraient ensemble.
 *
 * Par etapes, le chiffre est derive comme au banc : un peu plus haut
 * que par objectifs, pour que la bascule se voie. */

function Cellule({ p, id, nom, idee }: { p: ProprietesDuBandeau; id: IdInterrupteur; nom: string; idee: string }) {
  const [mesure, setMesure] = useState<MesureProgression>("goals");
  const etapes = Math.min(100, Math.round(p.progression * 1.12 + 4));
  const l = useLectureDuBandeau({ ...p, mesure, progression: mesure === "steps" ? etapes : p.progression });
  return (
    <figure className="pdi-cellule">
      <InterrupteurDeMesure
        lecture={l}
        famille={l.famille}
        modele={id}
        onChanger={() => setMesure((m) => (m === "goals" ? "steps" : "goals"))}
      />
      <figcaption><b>{nom}</b>{idee}</figcaption>
    </figure>
  );
}

export function PlancheDesInterrupteurs(p: ProprietesDuBandeau) {
  const l = useLectureDuBandeau(p);
  return (
    <section
      className="en pdi"
      aria-label="Les interrupteurs de l’enseigne"
      style={{ "--en-tube": gazDuTube(l.effet, l.teinte) } as CSSProperties}
    >
      <div className="en-lueur" aria-hidden="true" />
      <div className="pdi-grille">
        {INTERRUPTEURS.map((i) => <Cellule key={i.id} p={p} id={i.id} nom={i.nom} idee={i.idee} />)}
      </div>
    </section>
  );
}
