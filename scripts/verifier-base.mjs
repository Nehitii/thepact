#!/usr/bin/env node
/* CE QUE LE CODE DEMANDE A LA BASE EXISTE-T-IL VRAIMENT ?
 *
 * Quatrieme et derniere classe du plan : les chaines de caracteres qui
 * designent quelque chose en base. Noms de tables, de colonnes, de
 * fonctions distantes, de champs de compteur. Le compilateur n en
 * regarde aucune, et LEUR ECHEC EST SILENCIEUX :
 *
 *   `increment_tracking_counter` est un CASE sur le nom du champ, avec
 *   `ELSE NULL` au bout : un nom mal ecrit ne leve rien, n ecrit rien,
 *   et rend un succes inatteignable pour toujours.
 *
 *   `update_achievement_tracking` lit sept champs par
 *   `COALESCE((p_updates->>'nom')::type, colonne)` : une huitieme clef
 *   passerait sans laisser de trace.
 *
 *   Une colonne mal orthographiee dans un `select` rend une erreur au
 *   moment de l appel — donc a l ecran, chez l utilisateur, et jamais
 *   a la construction.
 *
 * L ORACLE EST `src/socle/supabase/types.ts`, engendre depuis le
 * schema. Cent six tables, soixante et onze fonctions.
 *
 * ═══ CE QU IL A FALLU APPRENDRE POUR NE PAS ACCUSER A TORT ═══
 *
 * La premiere version relevait quatre colonnes inconnues. LES QUATRE
 * ETAIENT FAUSSES, et pour trois raisons differentes :
 *
 *   `steps.name` — la selection etait « id, title, goals!inner(name) » :
 *   `name` appartient a la relation IMBRIQUEE, pas a `steps`. Il faut
 *   retirer les groupes « relation(...) » avant de decouper.
 *
 *   `guilds.user_id` — la selection reelle etait « * ». La regex avait
 *   apparie un `.from()` avec le `.select()` d une AUTRE requete, plus
 *   bas. Il faut refuser l appariement des qu un autre `.from(`
 *   s intercale.
 *
 *   `goal_cost_items.order` — « step:steps(title, order) » : un alias
 *   suivi d une relation imbriquee.
 *
 * On ne verifie donc que ce qu on sait lire sans ambiguite, et on dit
 * ce qu on laisse de cote : les selections « * », les colonnes
 * imbriquees, les chemins pointes des filtres — `goals.pacts.user_id`
 * traverse deux relations et ne se resout pas ici.
 *
 *   npm run base:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const TYPES_CHEMIN = "src/socle/supabase/types.ts";
const TYPES = fs.readFileSync(TYPES_CHEMIN, "utf8");

/* Le fichier porte deux jeux de blocs : un gabarit vide en tete, puis
   le vrai schema. On prend le dernier de chaque. */
const dernier = (m) => TYPES.lastIndexOf(m);
const blocTables = TYPES.slice(dernier("    Tables: {"), dernier("    Views: {"));
const blocVues = TYPES.slice(dernier("    Views: {"), dernier("    Functions: {"));
const blocFonctions = TYPES.slice(dernier("    Functions: {"), dernier("    Enums: {"));

const nomsDe = (bloc) => new Set([...bloc.matchAll(/^ {6}(\w+): \{/gm)].map((m) => m[1]));
const tables = nomsDe(blocTables);
const vues = nomsDe(blocVues);
const fonctions = nomsDe(blocFonctions);

const colonnes = new Map();
for (const bloc of [blocTables, blocVues])
  for (const m of bloc.matchAll(/^ {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/gm))
    colonnes.set(m[1], new Set([...m[2].matchAll(/^ {10}(\w+)\??:/gm)].map((c) => c[1])));

/* La liste blanche de `increment_tracking_counter`, relevee dans le
   corps de la fonction (`pg_get_functiondef`, 31 aout 2026) : les types
   engendres ne connaissent que les colonnes, jamais le sous-ensemble
   qu une fonction accepte, et c est justement l ecart ou la faute se
   cache — quarante-sept colonnes, trente-trois incrementables. */
const INCREMENTABLES = new Set([
  "total_goals_created", "easy_goals_created", "medium_goals_created", "hard_goals_created",
  "extreme_goals_created", "impossible_goals_created", "custom_goals_created",
  "goals_completed_total", "easy_goals_completed", "medium_goals_completed",
  "hard_goals_completed", "extreme_goals_completed", "impossible_goals_completed",
  "custom_goals_completed", "steps_completed_total", "todos_completed", "todos_created",
  "pomodoro_sessions", "pomodoro_total_minutes", "journal_entries", "friends_count",
  "guilds_joined", "guild_messages_sent", "community_posts", "wishlist_items_added",
  "wishlist_items_acquired", "modules_purchased", "cosmetics_owned",
  "calendar_events_created", "bonds_spent_total", "bonds_earned_total",
  "finance_months_validated", "transactions_logged",
]);
/* Les sept champs que `update_achievement_tracking` sait ecrire. */
const MODIFIABLES = new Set([
  "consecutive_login_days", "last_login_date", "logins_at_same_hour_streak",
  "usual_login_hour", "midnight_logins_count", "has_pact", "has_edited_pact",
]);

const fichiers = [];
const parcourir = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join("/");
    if (e.isDirectory()) { parcourir(p); continue; }
    if (/\.tsx?$/.test(p) && !p.includes(".test.")) fichiers.push(p);
  }
};
parcourir("src");

/* Une selection debarrassee de ses relations imbriquees : « id,
   goals!inner(name, pacts!inner(user_id)) » ne laisse que « id ». */
function colonnesPropres(selection) {
  let s = selection;
  let avant;
  do { avant = s; s = s.replace(/[\w!:]*\([^()]*\)/g, ""); } while (s !== avant);
  return s.split(",").map((c) => c.trim())
    .filter((c) => c && c !== "*" && !c.includes(":") && /^\w+$/.test(c));
}

const fautes = [];
let nTables = 0, nRpc = 0, nSelect = 0, nFiltres = 0, nChamps = 0;
const vus = new Set();
const noter = (quoi, quoiQui, ou) => {
  const cle = quoi + " " + quoiQui;
  if (vus.has(cle)) return;
  vus.add(cle);
  fautes.push({ quoi, quoiQui, ou });
};

for (const f of fichiers) {
  const src = fs.readFileSync(f, "utf8");
  const ligneDe = (i) => f + ":" + (src.slice(0, i).split("\n").length);

  for (const m of src.matchAll(/\.from\(\s*["'](\w+)["']\s*\)/g)) {
    nTables++;
    if (!tables.has(m[1]) && !vues.has(m[1])) noter("TABLE INCONNUE", m[1], ligneDe(m.index));
  }
  for (const m of src.matchAll(/\.rpc\(\s*["'](\w+)["']/g)) {
    nRpc++;
    if (!fonctions.has(m[1])) noter("FONCTION DISTANTE INCONNUE", m[1], ligneDe(m.index));
  }
  /* La selection doit suivre son `.from()` SANS qu un autre s intercale. */
  for (const m of src.matchAll(/\.from\(\s*["'](\w+)["']\s*\)((?:(?!\.from\()[\s\S])*?)\.select\(\s*["']([^"']+)["']/g)) {
    const cols = colonnes.get(m[1]);
    if (!cols) continue;
    for (const c of colonnesPropres(m[3])) {
      nSelect++;
      if (!cols.has(c)) noter("COLONNE INCONNUE (selection)", m[1] + "." + c, ligneDe(m.index));
    }
  }
  /* Les filtres, jusqu au prochain `.from(`. Les chemins pointes
     traversent des relations : on les laisse de cote. */
  for (const m of src.matchAll(/\.from\(\s*["'](\w+)["']\s*\)((?:(?!\.from\()[\s\S])*)/g)) {
    const cols = colonnes.get(m[1]);
    if (!cols) continue;
    for (const c of m[2].matchAll(/\.(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|order|contains|overlaps)\(\s*["'](\w+)["']/g)) {
      nFiltres++;
      if (!cols.has(c[1])) noter("COLONNE INCONNUE (filtre)", m[1] + "." + c[1], ligneDe(m.index));
    }
  }
  for (const m of src.matchAll(/p_field:\s*["'](\w+)["']/g)) {
    nChamps++;
    if (!INCREMENTABLES.has(m[1]))
      noter("CHAMP NON INCREMENTABLE", m[1], ligneDe(m.index));
  }
  for (const m of src.matchAll(/p_updates:\s*\{\s*(\w+):/g)) {
    nChamps++;
    if (!MODIFIABLES.has(m[1])) noter("CHAMP NON MODIFIABLE", m[1], ligneDe(m.index));
  }
}

console.log("base : " + tables.size + " tables et " + fonctions.size + " fonctions dans les types engendres.");
console.log("       " + nTables + " lectures de table, " + nRpc + " appels distants, "
  + nSelect + " colonnes selectionnees, " + nFiltres + " colonnes filtrees, "
  + nChamps + " champs de compteur.");
console.log("       laisses de cote, faute de pouvoir les lire sans ambiguite : les selections « * »,");
console.log("       les colonnes des relations imbriquees, et les chemins pointes des filtres.");

if (fautes.length === 0) {
  console.log("\ntout ce que le code demande existe dans le schema.");
  process.exit(0);
}
console.log("\n" + fautes.length + " demande(s) sans repondant :");
for (const f of fautes) console.log("  " + f.quoi + "  " + f.quoiQui + "   " + f.ou);
console.log("\nLes types se regenerent depuis le schema ; les deux listes blanches de compteurs,");
console.log("elles, sont relevees a la main dans le corps des fonctions et vivent dans ce script.");
process.exit(1);
