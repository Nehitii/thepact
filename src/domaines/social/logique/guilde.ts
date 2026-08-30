/* CE QU UNE GUILDE ENREGISTRE, ET COMBIEN ELLE PEUT ETRE.
 *
 * Deux nombres et une signature, poses en clair dans le formulaire de
 * reglages — et le premier des deux est ecrit a SIX endroits
 * differents dans le domaine.
 */

/* VINGT-CINQ MEMBRES PAR DEFAUT, ET CE NOMBRE EST PARTOUT.
 *
 * `guild.max_members || 25` apparait dans le formulaire de reglages
 * (trois fois : a l initialisation, a la synchronisation, a
 * l enregistrement), dans la creation, dans la carte du panneau et
 * dans la page de guilde. Six copies du meme nombre, dont aucune ne
 * sait que les autres existent. La colonne a pourtant son propre
 * defaut en base — `NOT NULL DEFAULT 25` — de sorte que le repli
 * cote application ne sert que si quelqu un y a ecrit zero. */
export const MEMBRES_PAR_DEFAUT = 25;

/* COMBIEN DE MEMBRES UNE GUILDE PEUT PORTER : ce que la saisie donne.
 *
 * AUCUNE BORNE, NI ICI NI EN BASE. La colonne est declaree
 * `integer NOT NULL DEFAULT 25`, sans contrainte de verification :
 *
 *   « 0 »       -> 25, parce que zero est faux et que le repli tombe ;
 *   « -5 »      -> -5, parce que -5 est vrai. La barre de remplissage
 *                 du panneau calcule alors membres / -5, et affiche
 *                 un pourcentage NEGATIF ;
 *   « 999999 »  -> 999999 ;
 *   « 3 » sur une guilde qui compte trente membres -> 3, et la page
 *                 annonce « 30 membres sur 3 » ;
 *   « abc »     -> 25, parce que parseInt rend NaN ;
 *   « 25abc »   -> 25, parce que parseInt s arrete au premier
 *                 caractere qui n est pas un chiffre.
 *
 * Cette fonction reproduit le comportement actuel sans le corriger :
 * lui donner des bornes changerait ce qu un fondateur peut
 * enregistrer. Elle existe pour que le trou ait un nom et des tests. */
export function nombreDeMembresMax(saisie: string): number {
  return parseInt(saisie, 10) || MEMBRES_PAR_DEFAUT;
}

/** Ce qu affiche « x sur y » : le plafond, ou son repli. */
export function plafondAffiche(max: number | null | undefined): number {
  return max || MEMBRES_PAR_DEFAUT;
}

/* LA PART REMPLIE, EN POURCENT. Ecretee a cent par le haut — une
   guilde peut depasser son plafond si celui-ci a ete abaisse apres
   coup — mais PAS par le bas : un plafond negatif donne une part
   negative. Constate, non corrige. */
export function partRemplie(membres: number, max: number | null | undefined): number {
  return Math.min(100, Math.round((membres / plafondAffiche(max)) * 100));
}

/* ── LA SIGNATURE QUI TIENT LE FORMULAIRE A JOUR ─────────────── */

/** Les onze champs que le formulaire de reglages enregistre. */
export interface ChampsDeGuilde {
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  banner_url: string | null;
  emblem_url: string | null;
  motd: string | null;
  blason_pose: string;
  emblem_bg: string | null;
  is_public: boolean;
  max_members: number;
}

/* ON JOINT AVEC UN CARACTERE NUL, ET CE N EST PAS DECORATIF.
 *
 * Avec une virgule, deux etats differents pourraient donner la meme
 * signature : une devise « a,b » suivie d une icone « c » se lirait
 * comme une devise « a » suivie d une icone « b,c ». Le formulaire
 * cesserait alors de se remettre a jour, en silence. Le caractere nul
 * ne peut apparaitre dans aucune de ces colonnes.
 *
 * LA SIGNATURE NE RETIENT QUE LES CHAMPS ENREGISTRES : le formulaire
 * se remet a jour quand ils changent en base, et pas quand une
 * colonne qui ne le concerne pas bouge — l XP d un raid, par
 * exemple. */
export const SEPARATEUR = "\u0000";

export function signatureDeGuilde(g: Partial<ChampsDeGuilde>): string {
  return [
    g.name, g.description, g.icon, g.color,
    g.banner_url, g.emblem_url, g.motd,
    g.blason_pose, g.emblem_bg, g.is_public, g.max_members,
  ].join(SEPARATEUR);
}

/* ── CE QUI PART EN BASE ─────────────────────────────────────── */

export interface SaisieDeGuilde {
  name: string;
  description: string;
  icon: string;
  color: string;
  banniere: string | null;
  embleme: string | null;
  motd: string;
  pose: string;
  fondEmbleme: string;
  isPublic: boolean;
  maxMembres: string;
}

/* LES BLANCS SONT COUPES, ET UN CHAMP VIDE DEVIENT « RIEN » plutot
   qu une chaine vide : la difference se voit a l affichage, ou une
   devise vide laisse un bloc sans texte au lieu de disparaitre. */
export function champsAEnregistrer(s: SaisieDeGuilde): ChampsDeGuilde {
  return {
    name: s.name.trim(),
    description: s.description.trim() || null,
    icon: s.icon,
    color: s.color,
    banner_url: s.banniere,
    emblem_url: s.embleme,
    motd: s.motd.trim() || null,
    blason_pose: s.pose,
    emblem_bg: s.fondEmbleme || null,
    is_public: s.isPublic,
    max_members: nombreDeMembresMax(s.maxMembres),
  };
}

/** Le nom d une guilde doit etre recopie a l identique pour la detruire. */
export function peutDetruire(saisie: string, nomDeLaGuilde: string): boolean {
  return saisie === nomDeLaGuilde;
}
