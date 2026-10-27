/* REPARTAGER UNE PUBLICATION.
 *
 * Une publication peut en citer une autre. La citee garde tout : ses
 * reactions, ses reponses, son auteur. Le repartage est une
 * publication a part entiere, avec son propre texte s il en a un, et
 * qui MONTRE l originale sans la commenter.
 *
 * TROIS REFUS, TENUS EN BASE PAR « verifier_le_repartage ». Ce module
 * les redit pour ne pas OFFRIR un geste qui finira en message
 * d erreur : un bouton qu on ne peut pas presser n a pas a paraitre.
 * Les deux endroits disent la meme chose, et c est voulu — l ecran
 * previent, la base protege, et ni l un ni l autre ne suffit seul.
 *
 * ═══ L ORIGINALE SUPPRIMEE ═══
 *
 * Le repartage SURVIT : celui qui a repartage a ecrit quelque chose,
 * et ce quelque chose lui appartient. La base coupe la reference et
 * pose une marque, si bien que les trois etats se distinguent :
 *
 *   ni reference ni marque -> publication ordinaire
 *   reference              -> repartage, l originale existe
 *   marque sans reference  -> repartage, l originale est partie
 *
 * Sans la marque, le troisieme cas se lirait comme le premier, et la
 * carte paraitrait un message ordinaire ampute de sa raison d etre.
 */

/** Ce qu il faut d une publication pour decider du repartage. */
export interface PublicationCitable {
  id: string;
  user_id: string;
  is_public?: boolean | null;
  shared_post_id?: string | null;
  shared_post_gone?: boolean | null;
}

/** Ce que la carte doit montrer a la place de la citation. */
export type EtatDeLaCitation = "aucune" | "citee" | "disparue";

/**
 * Cette publication cite-t-elle quelque chose, et quoi ?
 *
 * L ordre compte : une marque posee l emporte, parce qu apres une
 * suppression la reference est nulle et se confondrait sinon avec une
 * publication qui n a jamais rien cite.
 */
export function etatDeLaCitation(p: PublicationCitable): EtatDeLaCitation {
  if (p.shared_post_id) return "citee";
  if (p.shared_post_gone) return "disparue";
  return "aucune";
}

/** Est-ce un repartage, que l originale soit encore la ou non ? */
export const estUnRepartage = (p: PublicationCitable): boolean =>
  etatDeLaCitation(p) !== "aucune";

/**
 * Peut-on repartager cette publication ?
 *
 * `moi` est l identifiant de qui regarde, ou `undefined` s il n est
 * pas connecte — auquel cas le geste n existe pas.
 */
export function peutEtreRepartagee(p: PublicationCitable, moi: string | undefined): boolean {
  if (!moi) return false;
  /* On cite la source, jamais celui qui l a citee avant soi : la
     citation ne s empile pas. */
  if (estUnRepartage(p)) return false;
  /* Ce qui n est pas public ne le devient pas parce qu un tiers l a
     repartage. */
  if (p.is_public === false) return false;
  /* Se citer soi-meme n est pas partager, c est republier — et le fil
     le montre deja. */
  if (p.user_id === moi) return false;
  return true;
}

/**
 * La raison du refus, pour la dire plutot que de griser sans
 * expliquer. `null` quand le geste est possible.
 */
export function pourquoiPasRepartageable(
  p: PublicationCitable, moi: string | undefined,
): "hors-ligne" | "deja-un-repartage" | "non-publique" | "la-mienne" | null {
  if (!moi) return "hors-ligne";
  if (estUnRepartage(p)) return "deja-un-repartage";
  if (p.is_public === false) return "non-publique";
  if (p.user_id === moi) return "la-mienne";
  return null;
}
