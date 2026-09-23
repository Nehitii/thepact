import fs from "node:fs";
import path from "node:path";

/* ═══════════════════════════════════════════════════════════════
   LE SCHEMA, TEL QUE LES TYPES ENGENDRES LE DECRIVENT

   Meme lecture que `scripts/verifier-base.mjs` : le fichier porte un
   gabarit vide en tete, puis le vrai schema — on prend le dernier
   bloc de chaque sorte.

   Il sert aux tests qui doivent savoir quelles tables parlent d une
   personne : la suppression et l export de « toutes mes donnees ».
   Une table ajoutee demain aux types les fera echouer tant que
   personne n aura decide de son sort.

   IL VIT A COTE DE `types.ts`, et pas dans `src/tests/`, a cause du
   garde des couches : un test de `logique/` (rang 1) n a pas le droit
   d importer la racine (rang 6). Il n importe que Node — rien d un rang
   superieur — et seuls des tests l importent : il n entre jamais dans
   le paquet servi au navigateur.
   ═══════════════════════════════════════════════════════════════ */

/** Les colonnes qui designent une personne, relevees le 23/09 sur les
 *  105 tables. Un nom nouveau — « auteur_id » — n y serait pas : c est
 *  ici qu il faudra l ajouter. */
export const COLONNES_DE_PERSONNE: ReadonlySet<string> = new Set([
  "user_id", "owner_id", "sender_id", "receiver_id", "reporter_id", "member_id",
  "blocked_user_id", "inviter_id", "invitee_id", "author_id", "created_by",
  "cree_par", "changed_by", "admin_user_id",
]);

let memoire: Map<string, Set<string>> | null = null;

/** Chaque table, avec ses colonnes. */
export function colonnesDesTables(): Map<string, Set<string>> {
  if (memoire) return memoire;
  const types = fs
    .readFileSync(path.resolve(process.cwd(), "src/socle/supabase/types.ts"), "utf8")
    .replace(/\r\n/g, "\n");
  const dernier = (m: string) => types.lastIndexOf(m);
  const bloc = types.slice(dernier("    Tables: {"), dernier("    Views: {"));
  memoire = new Map();
  for (const m of bloc.matchAll(/^ {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/gm))
    memoire.set(m[1], new Set([...m[2].matchAll(/^ {10}(\w+)\??:/gm)].map((c) => c[1])));
  return memoire;
}

/** Chaque couple « table.colonne » qui designe une personne. */
export function colonnesPersonnelles(): string[] {
  const couples: string[] = [];
  for (const [table, colonnes] of colonnesDesTables())
    for (const c of colonnes) if (COLONNES_DE_PERSONNE.has(c)) couples.push(`${table}.${c}`);
  return couples.sort();
}
