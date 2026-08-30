/* ═══════════════════════════════════════════════════════════════
   `deno check` SUR CHAQUE FONCTION EDGE

   `npm run typecheck` ne regarde que `src/` : le tsconfig de
   l'application exclut `supabase/functions/`, et il a raison — ce code
   tourne sous Deno, avec d'autres types globaux et des imports par URL
   que tsc ne sait pas résoudre.

   Conséquence : vingt fonctions déployées en production n'étaient
   vérifiées par rien. Une faute de frappe dans un appel partagé se
   découvrait au premier utilisateur qui déclenchait la fonction.

   Ce script les vérifie une par une. Il rend un code de sortie non nul
   si l'une échoue, pour qu'il puisse servir de garde.

     npm run edge:check
   ═══════════════════════════════════════════════════════════════ */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = "supabase/functions";

const cibles = fs
  .readdirSync(RACINE, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => path.posix.join(RACINE, d.name, "index.ts"))
  .filter((f) => fs.existsSync(f))
  /* Le code partagé n'est pas une fonction, mais il est importé par
     toutes : le vérifier seul localise la faute plus vite. */
  .concat(
    fs
      .readdirSync(path.join(RACINE, "_shared"))
      .filter((f) => f.endsWith(".ts") && !f.endsWith("_test.ts"))
      .map((f) => path.posix.join(RACINE, "_shared", f)),
  );

/* DENO ABSENT SE DIT EN UNE LIGNE, PAS EN VINGT-CINQ ECHECS. Sans ce
   controle, chaque `deno check` echouait avec un ENOENT et la chaine
   annoncait vingt-cinq fonctions cassees pour un outil manquant. */
try {
  execFileSync("deno", ["--version"], { stdio: "ignore" });
} catch {
  console.error("deno introuvable : installe-le (https://deno.com) — c'est lui qui vérifie les fonctions edge.");
  process.exit(1);
}

let echecs = 0;

for (const cible of cibles) {
  try {
    execFileSync("deno", ["check", cible], { stdio: ["ignore", "ignore", "pipe"] });
    console.log(`  ok    ${cible}`);
  } catch (e) {
    echecs++;
    console.log(`  ÉCHEC ${cible}`);
    console.log(String(e.stderr ?? "").trimEnd());
  }
}

console.log(`\n${cibles.length - echecs}/${cibles.length} vérifiées`);
process.exit(echecs ? 1 : 0);
