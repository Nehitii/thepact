/* PREPARER UNE RESTAURATION.
 *
 * L export se relit ; l import, lui, ECRIT. Une erreur de preparation ne
 * se voit pas a l ecran : elle produit des lignes plausibles, acceptees
 * par la base, et fausses. C est la moitie de cette page qu il fallait
 * pouvoir eprouver.
 *
 * Trois questions y sont resolues, et chacune a un test :
 *
 *   LES IDENTIFIANTS. Une etape pointe son objectif par `goal_id` ;
 *   reinserer les objectifs leur donne de nouveaux identifiants. On les
 *   tire donc nous-memes AVANT d ecrire, et l on garde la correspondance
 *   ancien → nouveau. Se fier a l ordre de retour d un INSERT
 *   marcherait en pratique, sans etre garanti.
 *
 *   LE PROPRIETAIRE. Un fichier peut venir d un autre compte. Chaque
 *   ligne repart au nom de qui importe, jamais de qui a exporte.
 *
 *   LES ORPHELINES. Une etape dont l objectif n est pas du lot n a nulle
 *   part ou aller. On la laisse, et on le DIT — l accrocher au hasard
 *   serait pire que de la perdre.
 */
type Ligne = Record<string, unknown>;

export interface Restauration {
  journal: Ligne[];
  objectifs: Ligne[];
  etapes: Ligne[];
  /** Etapes laissees de cote faute d objectif dans le fichier. */
  orphelines: number;
}

export interface DemandeDeRestauration {
  /** Le contenu du fichier, deja analyse. Sa forme n est pas garantie. */
  fichier: unknown;
  /** Qui importe : c est lui le proprietaire des lignes ecrites. */
  utilisateurId: string;
  /** Le pacte d accueil des objectifs. */
  pacteId: string;
  /** Tire un identifiant. Passe pour que le test soit reproductible. */
  nouvelId?: () => string;
}

/** Ce qu on ne recopie jamais : la base les repose elle-meme. */
const POSES_PAR_LA_BASE = ["id", "created_at", "updated_at"];
const sansLesSiens = (l: Ligne, aussi: string[] = []) =>
  Object.fromEntries(Object.entries(l).filter(([c]) => !POSES_PAR_LA_BASE.includes(c) && !aussi.includes(c)));

const tableauDe = (v: unknown, cle: string): Ligne[] => {
  const x = (v as Record<string, unknown> | null)?.[cle];
  return Array.isArray(x) ? (x as Ligne[]) : [];
};

export function preparerLaRestauration({
  fichier, utilisateurId, pacteId, nouvelId = () => crypto.randomUUID(),
}: DemandeDeRestauration): Restauration {
  const journal = tableauDe(fichier, "journalEntries").map((e) => ({
    ...sansLesSiens(e, ["user_id"]),
    user_id: utilisateurId,
  }));

  const correspondance = new Map<string, string>();
  const objectifs = tableauDe(fichier, "goals").map((g) => {
    const ancien = g.id;
    const nouveau = nouvelId();
    if (typeof ancien === "string") correspondance.set(ancien, nouveau);
    return { ...sansLesSiens(g, ["pact_id"]), id: nouveau, pact_id: pacteId };
  });

  const brutes = tableauDe(fichier, "steps");
  const etapes = brutes
    .filter((s) => correspondance.has(String(s.goal_id)))
    .map((s) => ({
      ...sansLesSiens(s, ["goal_id"]),
      goal_id: correspondance.get(String(s.goal_id))!,
    }));

  return { journal, objectifs, etapes, orphelines: brutes.length - etapes.length };
}

/** Un fichier qui n apporte ni objectif ni journal n a rien a restaurer. */
export function riensARestaurer(r: Restauration): boolean {
  return !r.journal.length && !r.objectifs.length;
}

/* Ce que l ecran annonce a la fin. Le compte des orphelines en fait
   partie : une restauration silencieusement partielle est le meme
   defaut que la sauvegarde muette d a cote. */
export function bilanDeRestauration(r: Restauration): string[] {
  const pluriel = (n: number, un: string, plusieurs = un + "s") => `${n} ${n > 1 ? plusieurs : un}`;
  const dits: string[] = [];
  if (r.journal.length) dits.push(pluriel(r.journal.length, "entrée") + " de journal");
  if (r.objectifs.length) dits.push(pluriel(r.objectifs.length, "objectif"));
  if (r.etapes.length) dits.push(pluriel(r.etapes.length, "étape"));
  if (r.orphelines > 0) dits.push(`${pluriel(r.orphelines, "étape")} sans objectif, ${r.orphelines > 1 ? "ignorées" : "ignorée"}`);
  return dits;
}

/** Ce que l ecran montre AVANT d ecrire quoi que ce soit. */
export function apercuDuFichier(fichier: unknown) {
  const f = fichier as Record<string, unknown> | null;
  return {
    category: (f?.category as string) || "unknown",
    exportedAt: (f?.exportedAt as string) || "unknown",
    goals: tableauDe(fichier, "goals").length,
    steps: tableauDe(fichier, "steps").length,
    journalEntries: tableauDe(fichier, "journalEntries").length,
  };
}
