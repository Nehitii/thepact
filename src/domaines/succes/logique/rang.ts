/* LE NIVEAU, QUI EST UN RANG DANS UNE LISTE.
 *
 * Il n existe aucune colonne « niveau ». Le niveau EST la position du
 * palier atteint dans la liste des paliers, comptee a partir de un.
 *
 * CETTE REGLE ETAIT ECRITE DEUX FOIS — sur le hub et sur la fiche
 * publique — et le commentaire de la seconde le disait : « le hub le
 * calcule de la meme facon ». Il le savait, et personne ne les avait
 * reunies. Deux ecritures de la meme regle sont deux facons de deriver,
 * et ces deux ecrans montrent le meme nombre a la meme personne.
 */
export function niveauDuRang(
  donnees: { currentRank?: { id: string } | null; ranks?: { id: string }[] | null } | null | undefined,
): number {
  if (!donnees?.currentRank || !donnees.ranks?.length) return 1;
  const i = donnees.ranks.findIndex((r) => r.id === donnees.currentRank!.id);
  /* UN PALIER INTROUVABLE VAUT LE PREMIER, pas zero ni rien : la liste
     a pu changer sous le palier enregistre, et « niveau 0 » ne veut rien
     dire pour qui le lit. */
  return i >= 0 ? i + 1 : 1;
}
