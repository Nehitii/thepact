#!/usr/bin/env node
/* LE VOCABULAIRE NE DOIT PAS SE DEFAIRE.
 *
 * Ce depot parle deux langues, et ce n est pas un accident a corriger.
 * La regle tient en trois clauses, dans cet ordre :
 *
 *   1. UN MOT QUE NOMME UNE BIBLIOTHEQUE reste dans sa langue.
 *      `onSuccess`, `queryKey`, `mutationFn`, `useState`. Les traduire,
 *      c est mentir sur ce qu on appelle.
 *
 *   2. UN MOT QUE NOMME LA BASE reste comme la base le nomme.
 *      C est la clause qu on a failli ecrire a l envers. On a compte :
 *      `goal` apparait dans 58 noms de tables ou colonnes, `user` dans
 *      85, `guild` dans 26. Appeler `objectifs` la variable qui sort de
 *      `from("goals")` ajoute une traduction a chaque lecture, pour
 *      rien. Sur les 39 mots anglais du domaine releves dans les
 *      identifiants, UN SEUL — `phase` — n existe pas en base.
 *
 *   3. TOUT CE QUE LE PROJET INVENTE EST EN FRANCAIS.
 *      La variable locale, l aide, le concept derive, le commentaire.
 *      C est deja le cas : `apresEcriture`, `useFournisseursActifs`,
 *      `moisAffiche`, `PanneauAllies`.
 *
 * CE QUE CE SCRIPT VERIFIE, ET RIEN D AUTRE. On ne peut pas decider par
 * machine qu un mot invente « aurait du » etre en francais. On peut en
 * revanche verifier deux choses avec certitude :
 *
 *   (a) LE GLOSSAIRE NE MENT PAS SUR LE SCHEMA. Chaque `base` de
 *       glossaire.json existe dans le schema checke dans le depot. Un
 *       glossaire qui derive de la base est pire que pas de glossaire.
 *
 *   (b) AUCUN SYNONYME REFUSE n apparait dans un identifiant ni dans du
 *       texte affiche. Les commentaires sont exemptes : ils sont de la
 *       prose, et « un rituel » dans une phrase n est pas un deuxieme
 *       nom pour « habitude ».
 *
 * ET IL NE RENOMME RIEN. Le stock existant se resorbe quand on ouvre un
 * fichier pour une autre raison. Renommer 170 fichiers d un coup
 * couterait trois jours et ne ferait trouver aucun fichier plus vite.
 *
 *   npm run langue:check
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const RACINE = path.resolve(process.cwd(), "src");
const GLOSSAIRE = path.resolve(process.cwd(), "scripts/glossaire.json");
const SCHEMA = path.join(RACINE, "socle/supabase/types.ts");

const { concepts } = JSON.parse(fs.readFileSync(GLOSSAIRE, "utf8"));
const schema = fs.readFileSync(SCHEMA, "utf8");

/* ── (a) le glossaire ment-il sur le schema ? ─────────────── */

const menteurs = [];
for (const c of concepts) {
  for (const t of c.base) {
    /* Le schema genere declare chaque table comme une cle nue suivie de
       « : { ». Chercher le nom seul suffirait a valider une colonne
       homonyme d une autre table — on exige la forme d une declaration. */
    if (!new RegExp(`^\\s{6}${t}: \\{`, "m").test(schema)) {
      menteurs.push({ concept: c.concept, table: t });
    }
  }
}

/* ── (b) un synonyme refuse a-t-il repris pied ? ──────────── */

function sources(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") sources(p, acc);
    } else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/* Les accents : on compare sans, pour qu « allié » et « allie » soient
   le meme mot aux yeux de la garde. */
const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const refuses = new Map();
for (const c of concepts)
  for (const r of c.refuses) refuses.set(sansAccent(r).toLowerCase(), c);

const rechutes = [];

for (const f of sources(RACINE)) {
  const rel = path.relative(RACINE, f).replace(/\\/g, "/");
  if (rel.startsWith("socle/supabase/")) continue;
  const brut = fs.readFileSync(f, "utf8");

  /* On retire les commentaires AVANT tout le reste : de la prose peut
     contenir n importe quel mot sans que ce soit du vocabulaire. */
  const sansComm = brut.replace(/\/\*[\s\S]*?\*\//g, "\n").replace(/\/\/[^\n]*/g, "");

  /* Ce qui reste se lit en deux temps : le code (identifiants) et les
     chaines (texte affiche). Les deux comptent, pas les memes degats :
     un identifiant fatigue le lecteur, un texte fatigue l utilisateur. */
  const chaines = sansComm.match(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g) ?? [];
  const code = sansComm.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');

  const cherche = (texte, ou) => {
    /* ON DECOUPE LE CHAMELEAU AVANT DE CHERCHER.
       Premiere version : on exigeait un caractere non-alphabetique avant
       le mot. Elle a laisse passer `listeDesCamarades` — le « C » de
       Camarades est precede d un « s », donc d une lettre, donc la
       frontiere ne se declenchait jamais au milieu d un identifiant
       compose. On insere donc une coupure a chaque bascule minuscule →
       majuscule, et « \\b » retrouve son sens. */
    const plat = sansAccent(texte.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));
    for (const [mot, concept] of refuses) {
      /* Le francais accorde : « ami » doit attraper « amis », « amie »,
         « amies ». On tolere un suffixe court, jamais un mot plus long
         (« amical » n est pas « ami »). */
      const n = (plat.match(new RegExp(`\\b${mot}(e?s?)\\b`, "gi")) ?? []).length;
      if (n > 0) rechutes.push({ rel, mot, n, ou, concept });
    }
  };

  cherche(code, "identifiant");
  cherche(chaines.join("\n"), "texte affiche");
}

/* LE TEXTE QUE L UTILISATEUR LIT NE VIT PAS DANS LES COMPOSANTS.
 *
 * Premiere version : on ne scannait que `.ts` et `.tsx`. Elle a trouve
 * trois « ami » dans du code et declare le vocabulaire tenu. Il y en
 * avait QUINZE de plus dans `fr.json`, c est-a-dire a l endroit meme ou
 * l utilisateur les lit. Une garde du vocabulaire qui ignore les
 * traductions garde le mauvais fichier.
 *
 * On ne regarde que le francais : `en.json` est une traduction, et
 * l anglais d Overwrite n est pas gouverne par ce glossaire. */
const FR = path.join(RACINE, "socle/i18n/locales/fr.json");
const plat = [];
(function marche(n, chemin = "") {
  if (typeof n === "string") { plat.push([chemin, n]); return; }
  if (Array.isArray(n)) { n.forEach((v, i) => marche(v, `${chemin}[${i}]`)); return; }
  if (n && typeof n === "object")
    for (const [k, v] of Object.entries(n)) marche(v, chemin ? `${chemin}.${k}` : k);
})(JSON.parse(fs.readFileSync(FR, "utf8")));

for (const [cle, valeur] of plat) {
  const plate = sansAccent(valeur);
  for (const [mot, concept] of refuses) {
    /* Le francais accorde : « ami » doit attraper « amis », « amie »,
       « amies ». On tolere donc un suffixe court apres le mot. */
    if (new RegExp(`\\b${mot}(e?s?)\\b`, "i").test(plate)) {
      rechutes.push({
        rel: `i18n/locales/fr.json → ${cle}`,
        mot, n: 1, ou: "traduction", concept,
      });
    }
  }
}

/* ── verdict ───────────────────────────────────────────────── */

const nbBase = concepts.reduce((s, c) => s + c.base.length, 0);
const nbRefuses = refuses.size;
console.log(
  `langue : ${concepts.length} concepts, ${nbBase} nom(s) de base verifie(s), ` +
  `${nbRefuses} synonyme(s) refuse(s).`,
);

if (menteurs.length) {
  console.log(`\n${menteurs.length} ENTREE(S) DE GLOSSAIRE QUI NE CORRESPONDENT A AUCUNE TABLE :`);
  for (const m of menteurs) console.log(`  « ${m.concept} » declare la table ${m.table} — absente du schema.`);
  console.log("\nCorrigez glossaire.json, ou regenerez types.ts si le schema a change.");
}

if (rechutes.length) {
  console.log(`\n${rechutes.length} EMPLOI(S) D UN MOT REFUSE :`);
  for (const r of rechutes) {
    console.log(`  ${r.rel}`);
    console.log(`      « ${r.mot} » ×${r.n} dans ${r.ou} — le mot du projet est « ${r.concept.francais} » (${r.concept.concept}).`);
  }
  console.log("\nUn concept, un mot. Si le concept est VRAIMENT different, ajoutez-le au glossaire");
  console.log("plutot que de laisser deux mots designer la meme chose.");
}

const casse = menteurs.length + rechutes.length;
if (casse === 0) console.log("\nle vocabulaire tient.");
process.exit(casse === 0 ? 0 : 1);
