/**
 * VERIFICATION DE LA CADENCE — a lancer avec : npx tsx scripts/verif-cadence.mts
 *
 * Le projet na pas de lanceur de tests, et en installer un pour une
 * seule fonction serait disproportionne. Ces controles restent donc
 * un script, mais ils portent sur ce quil y a de plus delicat ici :
 * larrondi dun paiement en plusieurs fois. Deux cents euros en trois
 * fois ne tombent pas juste, et un ecart dun centime sur un tableau
 * de comptes fait douter de tout le reste.
 */
import {
  rangEcheance, tombeEn, montantDuMois, prochaineEcheance,
  totalDuMois, provisionMensuelle, cadenceDe,
  moisDuMotif, moisDeChute, motifDepuisMois, regulariser,
} from "../src/lib/finance/cadence.ts";

let echecs = 0;
const dit = (nom, obtenu, attendu) => {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) echecs++;
  console.log(`${ok ? "ok  " : "FAUX"} ${nom} → ${JSON.stringify(obtenu)}${ok ? "" : "  (attendu " + JSON.stringify(attendu) + ")"}`);
};

const loyer = { amount: 850, is_active: true };
const assurance = { amount: 600, is_active: true, periode_mois: 12, mois_ancre: "2026-03-01" };
const trimestre = { amount: 180, is_active: true, periode_mois: 3, mois_ancre: "2026-01-01" };
const casque = { amount: 0, is_active: true, periode_mois: 1, mois_ancre: "2026-03-01", echeances: 3, montant_total: 200 };

console.log("── une charge mensuelle tombe toujours ──");
dit("loyer en mars", montantDuMois(loyer, "2026-03"), 850);
dit("loyer en avril", montantDuMois(loyer, "2026-04"), 850);

console.log("\n── l annuelle ne tombe qu une fois ──");
dit("assurance en mars 2026", montantDuMois(assurance, "2026-03"), 600);
dit("assurance en avril 2026", montantDuMois(assurance, "2026-04"), 0);
dit("assurance en mars 2027", montantDuMois(assurance, "2027-03"), 600);
dit("assurance avant son ancre", montantDuMois(assurance, "2026-01"), 0);

console.log("\n── la trimestrielle : janvier, avril, juillet, octobre ──");
dit("mois ou elle tombe en 2026",
  ["01","02","03","04","05","06","07","08","09","10","11","12"]
    .filter(m => tombeEn(trimestre, `2026-${m}`)),
  ["01","04","07","10"]);

console.log("\n── l echeancier : 200 en 3 fois, la derniere absorbe le reste ──");
const parts = ["2026-03","2026-04","2026-05"].map(m => montantDuMois(casque, m));
dit("les trois echeances", parts, [66.66, 66.66, 66.68]);
dit("leur somme fait le prix paye", Math.round(parts.reduce((a,b)=>a+b,0) * 100) / 100, 200);
dit("rien apres la derniere", montantDuMois(casque, "2026-06"), 0);
dit("rien avant la premiere", montantDuMois(casque, "2026-02"), 0);
dit("le rang se lit", [1,2,3,4].map(i => rangEcheance(casque, `2026-0${i+2}`)), [1,2,3,0]);

console.log("\n── le total du mois ──");
const toutes = [loyer, assurance, trimestre, casque];
dit("mars 2026 : loyer + assurance + 1re echeance", totalDuMois(toutes, "2026-03"), 850 + 600 + 66.66);
dit("avril 2026 : loyer + trimestre + 2e echeance", totalDuMois(toutes, "2026-04"), 850 + 180 + 66.66);
dit("juin 2026 : le loyer seul", totalDuMois(toutes, "2026-06"), 850);

console.log("\n── la provision : les cadences longues seulement ──");
dit("600/12 + 180/3", provisionMensuelle(toutes), 50 + 60);
dit("l echeancier n en demande pas", provisionMensuelle([casque]), 0);
dit("le loyer non plus", provisionMensuelle([loyer]), 0);

console.log("\n── la prochaine echeance ──");
const iso = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : null;
dit("apres mars, l assurance revient en mars prochain", iso(prochaineEcheance(assurance, "2026-03")), "2027-03");
dit("apres avril, le trimestre revient en juillet", iso(prochaineEcheance(trimestre, "2026-04")), "2026-07");
dit("apres la derniere echeance, plus rien", prochaineEcheance(casque, "2026-05"), null);

console.log("\n── les noms ──");
dit("cadences", [loyer, assurance, trimestre, casque].map(cadenceDe),
  ["mensuel", "annuel", "trimestriel", "echeancier"]);

console.log("\n── une ligne inactive ne pese jamais ──");
dit("inactive", montantDuMois({ ...loyer, is_active: false }, "2026-03"), 0);

console.log("\n── la grille des douze mois : lire un motif ──");
/* Ce que la grille doit allumer pour une ligne enregistree. */
dit("le trimestre allume 4 cases", moisDeChute(trimestre), [0, 3, 6, 9]);
dit("l annuelle n en allume qu une", moisDeChute(assurance), [2]);
dit("une mensuelle les allume toutes", moisDeChute(loyer).length, 12);
dit("un echeancier n a pas de motif annuel", moisDeChute(casque), []);
dit("l ancre ne decide que du reste", moisDuMotif({ periode: 3, ancre: 7 }), [1, 4, 7, 10]);

console.log("\n── la grille des douze mois : deduire une cadence ──");
dit("janv avr juil oct → tous les 3 mois", motifDepuisMois([0, 3, 6, 9]), { periode: 3, ancre: 0 });
dit("fevr aout → tous les 6 mois", motifDepuisMois([1, 7]), { periode: 6, ancre: 1 });
dit("juin seul → une fois par an", motifDepuisMois([5]), { periode: 12, ancre: 5 });
dit("les douze → mensuel", motifDepuisMois([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), { periode: 1, ancre: 0 });
dit("l ordre de saisie est indifferent", motifDepuisMois([9, 0, 6, 3]), { periode: 3, ancre: 0 });
/* Le bon nombre de cases ne suffit pas : il faut l equidistance. */
dit("janv fevr juil aout : 4 cases mais irregulier", motifDepuisMois([0, 1, 6, 7]), null);
dit("cinq cases ne divisent pas douze", motifDepuisMois([0, 2, 4, 6, 8]), null);
dit("rien de coche, rien a deduire", motifDepuisMois([]), null);

console.log("\n── la grille des douze mois : completer en deux gestes ──");
/* Le cas que decrit l utilisateur : deux clics doivent suffire. */
dit("janv puis avr se complete", moisDuMotif(regulariser([0, 3])!), [0, 3, 6, 9]);
dit("janv puis juil se complete", moisDuMotif(regulariser([0, 6])!), [0, 6]);
dit("mars puis mai se complete", moisDuMotif(regulariser([2, 4])!), [0, 2, 4, 6, 8, 10]);
dit("un seul mois reste annuel", regulariser([5]), { periode: 12, ancre: 5 });
dit("un motif deja regulier n est pas touche", regulariser([1, 7]), { periode: 6, ancre: 1 });
/* Une case de trop ne doit pas faire basculer tout le motif : l ecart
   median resiste la ou le minimum cederait. */
dit("janv avr mai juil oct → reste trimestriel", regulariser([0, 3, 4, 6, 9])!.periode, 3);
dit("rien a regulariser", regulariser([]), null);

console.log("\n── les nouveaux noms de cadence ──");
dit("bimestriel", cadenceDe({ amount: 1, is_active: true, periode_mois: 2, mois_ancre: "2026-01-01" }), "bimestriel");
dit("quadrimestriel", cadenceDe({ amount: 1, is_active: true, periode_mois: 4, mois_ancre: "2026-01-01" }), "quadrimestriel");


console.log(`\n${echecs === 0 ? "TOUT PASSE" : echecs + " ECHEC(S)"}`);
process.exit(echecs === 0 ? 0 : 1);
