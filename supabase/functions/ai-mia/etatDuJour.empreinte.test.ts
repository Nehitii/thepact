import { describe, expect, it } from "vitest";
import { zoneHoraireValide } from "./etatDuPacte.ts";
import { lignesDeLEtat, type DonneesDuJour } from "./etatDuJour.ts";

const PARIS = "Europe/Paris";

/* ═══════════════════════════════════════════════════════════════
   L EMPREINTE.

   Ces quatre textes ne sont pas ecrits a la main : ils ont ete
   PRODUITS PAR LE CODE D AVANT LA COUPE, extrait de git et branche sur
   ces memes lignes, puis compares octet pour octet a ce que rend le
   module. C est l equivalent, pour du code serveur, du rechargement
   complet des deux cotes.
   ═══════════════════════════════════════════════════════════════ */

const COMPTE_PLEIN: DonneesDuJour = {
  maintenant: new Date("2026-08-30T09:15:00+02:00"),
  zone: PARIS,
  nom: "Geoffrey",
  actifId: "p1",
  pactes: [
    { id: "p1", name: "Ascension", project_start_date: "2026-01-01", project_end_date: "2026-12-31" },
    { id: "p2", name: "Second souffle", project_start_date: null, project_end_date: null },
  ],
  objectifs: [
    { name: "Courir 10 km", status: "in_progress", validated_steps: 3, total_steps: 8, pact_id: "p1", is_focus: true },
    { name: "Lire douze livres", status: "in_progress", validated_steps: 5, total_steps: 12, pact_id: "p1", is_focus: false },
    { name: "Refaire la cave", status: "not_started", validated_steps: 0, total_steps: 4, pact_id: "p1", is_focus: false },
    { name: "Apprendre le piano", status: "fully_completed", validated_steps: 6, total_steps: 6, pact_id: "p2", is_focus: false },
    { name: "Orphelin", status: "in_progress", validated_steps: 1, total_steps: 9, pact_id: "p9", is_focus: false },
  ],
  ordres: [
    { title: "Marcher", progress: 3, target: 5, status: "claimed", reward_bonds: 10 },
    { title: "Boire", progress: 8, target: 8, status: "completed", reward_bonds: 5 },
  ],
  focus: [{ duration_minutes: 25 }, { duration_minutes: 50 }],
  taches: [
    { name: "Appeler le garage", deadline: "2026-08-30T14:00:00+02:00" },
    { name: "Rendre le livre", deadline: "2026-08-31T09:00:00+02:00" },
    { name: "Declaration", deadline: "2026-09-15T09:00:00+02:00" },
    { name: "Vidange", deadline: "2026-10-01T09:00:00+02:00" },
    { name: "Cinquieme", deadline: "2026-11-01T09:00:00+02:00" },
    { name: "Sans echeance", deadline: null },
  ],
  solde: 412,
};

const TEXTE_PLEIN = [
  "ÉTAT DU JOUR — dimanche 30 août 2026.",
  "Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.",
  "Ton interlocuteur s appelle Geoffrey.",
  "Pacte actif : Ascension — jour 241 / 364, 123 jours restants, fin le 31/12/2026.",
  "Autres pactes : Second souffle.",
  "Objectifs : 2 en cours (12 étapes restantes), 1 non commencés (4 étapes restantes), 1 terminés.",
  "Étapes, toutes catégories : 14 faites sur 30, 16 restantes.",
  "Plus gros restes en cours : Lire douze livres (7), Courir 10 km (5).",
  "Brigade (objectifs épinglés) : Courir 10 km.",
  "Ordres du jour : Marcher 3/5 · Boire 8/8 — prime 10/15 bonds.",
  "Focus aujourd'hui : 75 minutes.",
  "Tâches ouvertes : 6. Prochaines échéances : Appeler le garage (aujourd'hui), " +
    "Rendre le livre (demain), Declaration (15/09/2026), Vidange (01/10/2026).",
  "Solde : 412 bonds.",
];

describe("l empreinte du texte", () => {
  it("rend mot pour mot ce que rendait le code d avant", () => {
    expect(lignesDeLEtat(COMPTE_PLEIN)).toEqual(TEXTE_PLEIN);
  });

  it("rend cinq lignes sur un compte vide", () => {
    expect(lignesDeLEtat({
      maintenant: new Date("2026-08-30T09:15:00Z"), zone: "UTC",
      pactes: [], objectifs: [], ordres: [], focus: [], taches: [],
    })).toEqual([
      "ÉTAT DU JOUR — dimanche 30 août 2026.",
      "Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.",
      "Aucun pacte enregistré.",
      "Focus aujourd'hui : 0 minute.",
      "Tâches ouvertes : aucune.",
    ]);
  });

  it("rend un pacte sans dates et une minute au singulier", () => {
    expect(lignesDeLEtat({
      maintenant: new Date("2026-08-30T23:30:00+12:00"), zone: "Pacific/Auckland",
      actifId: null,
      pactes: [{ id: "p7", name: "Sans bornes" }],
      objectifs: [{ name: "Un seul", status: "not_started", validated_steps: 0, total_steps: 1, pact_id: "p7" }],
      ordres: [], focus: [{ duration_minutes: 1 }],
      taches: [{ name: "Sans date", deadline: null }],
      solde: 0,
    })).toEqual([
      "ÉTAT DU JOUR — dimanche 30 août 2026.",
      "Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.",
      "Pacte actif : Sans bornes (pas de dates posées).",
      "Objectifs : 0 en cours (0 étapes restantes), 1 non commencés (1 étapes restantes), 0 terminés.",
      "Étapes, toutes catégories : 0 faites sur 1, 1 restantes.",
      "Focus aujourd'hui : 1 minute.",
      "Tâches ouvertes : 1.",
      "Solde : 0 bonds.",
    ]);
  });
});

describe("l horloge du pacte", () => {
  /* UNE SEULE HORLOGE, ET C EST CELLE QU ON DONNE.
   *
   * Le code d avant lisait `new Date()` pour dater le texte et
   * `Date.now()` pour compter les jours du pacte : deux lectures a
   * quelques microsecondes d intervalle, donc jamais un jour d ecart
   * en pratique — mais deux sources pour un seul instant, et rien qui
   * puisse etre fige dans un test. La date choisie ici est loin
   * d aujourd hui : si la fonction retournait a l horloge du serveur,
   * ce compte tomberait. */
  it("compte les jours avec l instant recu, pas avec celui du serveur", () => {
    expect(lignesDeLEtat({
      maintenant: new Date("2027-03-15T12:00:00Z"), zone: "UTC",
      actifId: "p1",
      pactes: [{ id: "p1", name: "Long", project_start_date: "2027-01-01", project_end_date: "2027-12-31" }],
      objectifs: [], ordres: [], focus: [], taches: [],
    })).toContain("Pacte actif : Long — jour 73 / 364, 291 jours restants, fin le 31/12/2027.");
  });

  /* UNE FIN AVANT LE DEBUT NE COMPTE RIEN : le pacte s annonce « pas
     de dates posées » plutot que « jour -12 / -40 ». */
  it("se tait plutot que d annoncer des jours negatifs", () => {
    expect(lignesDeLEtat({
      maintenant: new Date("2027-03-15T12:00:00Z"), zone: "UTC",
      actifId: "p1",
      pactes: [{ id: "p1", name: "A l envers", project_start_date: "2027-12-31", project_end_date: "2027-01-01" }],
      objectifs: [], ordres: [], focus: [], taches: [],
    })).toContain("Pacte actif : A l envers (pas de dates posées).");
  });
});

/* ── CE QUE LE TEXTE DIT DE TRAVERS, ET QU ON N A PAS CHANGE ─── */

describe("les accords que le texte n a jamais faits", () => {
  /* « 1 non commencés », « 1 étapes restantes », « 1 terminés ». Le
     seul accord qui existe est celui de « minute(s) ». Le corriger
     changerait ce que M.I.A recopie mot pour mot : ce n est pas une
     decision de decoupage. Epingle pour qu on la prenne expres. */
  it("accorde au pluriel meme pour un seul objectif", () => {
    const lignes = lignesDeLEtat({
      maintenant: new Date("2026-08-30T09:15:00Z"), zone: "UTC",
      pactes: [{ id: "p1", name: "P" }],
      objectifs: [{ name: "Seul", status: "not_started", validated_steps: 0, total_steps: 1, pact_id: "p1" }],
      ordres: [], focus: [], taches: [],
    });
    expect(lignes).toContain("Objectifs : 0 en cours (0 étapes restantes), 1 non commencés (1 étapes restantes), 0 terminés.");
  });

  it("accorde le seul mot qui l est : la minute", () => {
    const avec = (m: number) => lignesDeLEtat({
      maintenant: new Date("2026-08-30T09:15:00Z"), zone: "UTC",
      pactes: [], objectifs: [], ordres: [], focus: [{ duration_minutes: m }], taches: [],
    }).find((l) => l.startsWith("Focus"));
    expect(avec(0)).toBe("Focus aujourd'hui : 0 minute.");
    expect(avec(1)).toBe("Focus aujourd'hui : 1 minute.");
    expect(avec(2)).toBe("Focus aujourd'hui : 2 minutes.");
  });
});

/* ── LE COMPTE DES TACHES EST CELUI QU ON LUI DONNE ──────────── */

describe("le nombre de taches ouvertes", () => {
  /* CE MODULE COMPTE CE QU IL RECOIT, ET L APPELANT LUI EN DONNE AU
     PLUS QUARANTE (`.limit(40)` sur `todo_tasks`, dans index.ts). A
     partir de quarante et une taches ouvertes, la ligne annonce 40 et
     M.I.A le repete comme un fait. Le plafond n est pas ici, mais son
     effet se lit ici. */
  it("annonce exactement ce qu on lui passe", () => {
    const taches = Array.from({ length: 40 }, (_, i) => ({ name: `T${i}`, deadline: null }));
    const ligne = lignesDeLEtat({
      maintenant: new Date("2026-08-30T09:15:00Z"), zone: "UTC",
      pactes: [], objectifs: [], ordres: [], focus: [], taches,
    }).find((l) => l.startsWith("Tâches"));
    expect(ligne).toBe("Tâches ouvertes : 40.");
  });
});

/* ── LE FUSEAU DE REPLI ──────────────────────────────────────── */

describe("un fuseau que personne ne connait", () => {
  it("retombe sur UTC plutot que de faire lever Intl", () => {
    const zone = zoneHoraireValide("Mars/Olympus", new Date("2026-08-30T09:15:00Z"));
    expect(zone).toBe("UTC");
    expect(lignesDeLEtat({
      maintenant: new Date("2026-08-30T09:15:00Z"), zone,
      nom: "Sans fuseau", actifId: "p1",
      pactes: [{ id: "p1", name: "Repli", project_start_date: "2026-08-01", project_end_date: "2026-09-30" }],
      objectifs: [], ordres: [], focus: [],
      taches: [{ name: "Demain", deadline: "2026-08-31T10:00:00Z" }],
    })).toEqual([
      "ÉTAT DU JOUR — dimanche 30 août 2026.",
      "Cette donnée est fraîche : n'appelle pas d'outil pour la retrouver.",
      "Ton interlocuteur s appelle Sans fuseau.",
      "Pacte actif : Repli — jour 29 / 60, 31 jours restants, fin le 30/09/2026.",
      "Focus aujourd'hui : 0 minute.",
      "Tâches ouvertes : 1. Prochaines échéances : Demain (demain).",
    ]);
  });
});

/* ── CE QUI EST COMPTE, ET CE QUI NE L EST PAS ───────────────── */

describe("les objectifs qu on ne voit pas", () => {
  /* UN OBJECTIF RATTACHE A UN PACTE QUE L UTILISATEUR N A PAS
     DISPARAIT ENTIEREMENT : ni dans les comptes, ni dans les etapes,
     ni dans les plus gros restes. Les politiques RLS peuvent laisser
     passer une ligne dont le pacte n est plus la ; elle est ecartee
     ici, silencieusement. Ses huit etapes restantes ne sont nulle
     part. */
  it("ecarte un objectif dont le pacte n est pas dans la liste", () => {
    const sansOrphelin = { ...COMPTE_PLEIN, objectifs: COMPTE_PLEIN.objectifs.filter((g) => g.pact_id !== "p9") };
    expect(lignesDeLEtat(sansOrphelin)).toEqual(lignesDeLEtat(COMPTE_PLEIN));
  });

  it("compte le pacte fini comme termine, pas comme absent", () => {
    const ligne = lignesDeLEtat(COMPTE_PLEIN).find((l) => l.startsWith("Objectifs"));
    expect(ligne).toContain("1 terminés");
  });
});

describe("le solde", () => {
  const base: DonneesDuJour = {
    maintenant: new Date("2026-08-30T09:15:00Z"), zone: "UTC",
    pactes: [], objectifs: [], ordres: [], focus: [], taches: [],
  };

  /* ZERO EST UN SOLDE, PAS UNE ABSENCE : le test est `!= null`, pas
     une verite. Un compte a zero bond le voit ecrit. */
  it("annonce un solde nul", () => {
    expect(lignesDeLEtat({ ...base, solde: 0 })).toContain("Solde : 0 bonds.");
  });

  it("se tait quand la ligne n existe pas", () => {
    expect(lignesDeLEtat({ ...base, solde: null }).join()).not.toContain("Solde");
    expect(lignesDeLEtat(base).join()).not.toContain("Solde");
  });

  it("ecrit un solde negatif tel quel", () => {
    expect(lignesDeLEtat({ ...base, solde: -12 })).toContain("Solde : -12 bonds.");
  });
});
