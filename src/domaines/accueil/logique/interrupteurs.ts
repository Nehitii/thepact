/* LES INTERRUPTEURS DE L ENSEIGNE.
 *
 * La bascule entre objectifs atteints et etapes franchies est un objet
 * visse au mur de l enseigne. Il en existe plusieurs, tous du meme
 * monde — un tableau electrique, un poste de radio, un pupitre — pour
 * que l utilisateur choisisse le sien au banc.
 *
 * Chacun dit la meme chose de deux facons : sa POSITION (le levier en
 * haut ou en bas, la cle droite ou tournee, la fiche dans une prise ou
 * dans l autre) et une ETIQUETTE ALLUMEE. Aucun ne compte sur la
 * couleur seule.
 *
 * CHOISI LE 23/09 : LE CORDON. C est lui que l accueil monte ; les six
 * autres restent au banc, sur la planche des interrupteurs, pour qu on
 * puisse y revenir. */

export const INTERRUPTEURS = [
  {
    id: "levier",
    nom: "Le levier",
    idee: "Un interrupteur à levier de tableau électrique : il claque en passant devant, et montre l’étiquette allumée.",
  },
  {
    id: "bascule",
    nom: "La bascule lumineuse",
    idee: "Un interrupteur à bascule éclairé de l’intérieur : la moitié enfoncée s’allume.",
  },
  {
    id: "rotatif",
    nom: "Le sélecteur rotatif",
    idee: "Un bouton moleté qui tourne d’un cran ; un voyant s’allume devant la position choisie.",
  },
  {
    id: "cle",
    nom: "La clé",
    idee: "Un contacteur à clé : on tourne la clé du pacte d’un quart de tour.",
  },
  {
    id: "touches",
    nom: "Les touches de poste",
    idee: "Deux touches de radio ancienne : enfoncer l’une fait remonter l’autre.",
  },
  {
    id: "glissiere",
    nom: "La glissière",
    idee: "Un curseur moleté qui glisse d’un bout de sa fente à l’autre.",
  },
  {
    id: "cordon",
    nom: "Le cordon",
    idee: "Un tableau de brassage : on débranche la fiche et on la rebranche dans l’autre prise.",
  },
] as const;

export type IdInterrupteur = (typeof INTERRUPTEURS)[number]["id"];

export const INTERRUPTEUR_PAR_DEFAUT: IdInterrupteur = "cordon";

/** Un identifiant lu d une adresse ou d un reglage : inconnu, c est le modele retenu. */
export function lireLInterrupteur(brut: string | null | undefined): IdInterrupteur {
  return INTERRUPTEURS.find((i) => i.id === brut)?.id ?? INTERRUPTEUR_PAR_DEFAUT;
}
