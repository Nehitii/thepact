import { ETAT_VIDE, type EtatDuRite } from "@/domaines/onboarding/logique/rite";

/** Ce que la base sait deja du pacte, tel qu on le relit. */
export interface PacteRelu {
  nomDuPorteur: string | null;
  nom: string | null;
  mantra: string | null;
  symbole: string | null;
  couleur: string | null;
  /** Les valeurs DANS LEUR ORDRE DE RANG. */
  valeurs: readonly string[];
}

/**
 * L ETAT DU RITE, RECONSTRUIT DEPUIS CE QUI A DEJA ETE JURE.
 *
 * Le second passage ne repart pas de rien. « LeRite » ne lit son etat
 * initial qu au montage, et sans celui-ci le rite abrege repartait de
 * « ETAT_VIDE » : le porteur redeclarait tout a l aveugle, et
 * « useSceller » ecrasait son pacte par ce qu il venait de retaper.
 *
 * L ORDRE DES VALEURS EST REPRIS TEL QUEL, parce que c est lui qui
 * dessine la corde du sceau : le relire trie autrement redessinerait
 * un sceau que le porteur n a pas jure.
 *
 * DEUX CHAMPS NE SE REPRENNENT JAMAIS. Les clauses et la signature
 * repartent a faux : jurer de nouveau est le sujet meme du second
 * passage, et un consentement recopie n en serait pas un. L objectif
 * reste nul — le rite abrege saute la rencontre, et le porteur a deja
 * des objectifs.
 *
 * ELLE EST PURE, et c est voulu : la lecture en base vit dans
 * « usePacteJure », la conversion se relit et se teste ici.
 */
export function etatDuPacteJure(relu: PacteRelu): EtatDuRite {
  return {
    ...ETAT_VIDE,
    nomDuPorteur: relu.nomDuPorteur ?? "",
    nomDuPacte: relu.nom ?? "",
    mantra: relu.mantra ?? "",
    symbole: relu.symbole ?? "",
    couleur: relu.couleur ?? "",
    valeurs: [...relu.valeurs],
    clausesAcceptees: false,
    signe: false,
    objectif: null,
  };
}
