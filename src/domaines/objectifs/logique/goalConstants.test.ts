import { describe, expect, it } from "vitest";
import { Activity, Archive, CheckCircle2, Circle, PauseCircle, XCircle } from "lucide-react";
import en from "@/socle/i18n/locales/en.json";
import fr from "@/socle/i18n/locales/fr.json";
import {
  COST_ITEM_CATEGORIES, DIFFICULTY_OPTIONS, DIFFICULTY_ORDER, GOAL_TAGS, STATUS_CONFIG,
  getCostCategoryLabel, getDifficultyIntensity, getDifficultyLabel, getGoalStatusIcon,
  getStatusBadgeClass, getStatusColor, getStatusLabel, getTagColor, getTagLabel, mapToValidTag,
} from "./goalConstants";
import { TYPES_OBJECTIF } from "./typeDObjectif";

const lire = (o: unknown, k: string) =>
  k.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown> | null)?.[p], o);

/* Les six valeurs de l enum `goal_difficulty`, relevees en base le
   30/08/2026 : easy, medium, hard, extreme, custom, impossible. */
const DIFFICULTES_EN_BASE = ["easy", "medium", "hard", "extreme", "custom", "impossible"];

/* Les neuf valeurs de l enum `goal_status`, meme releve. */
const STATUTS_EN_BASE = [
  "active", "completed", "paused", "cancelled", "not_started",
  "in_progress", "validated", "fully_completed", "archived",
];

/* ═══════════════════════════════════════════════════════════════
   CINQUANTE-QUATRE CLES QUE LA GARDE i18n NE VOIT PAS.

   Elle ne releve que les appels de traduction dont la cle est ecrite en
   toutes lettres dans le code. Ici elles sont des CHAMPS DE DONNEE,
   lues au moment du rendu — dix-huit etiquettes, cinq difficultes, neuf
   statuts, vingt et une categories de cout, plus la difficulte sur
   mesure.

   ET IL EN MANQUAIT UNE. `goals.statuses.archived` n existait dans
   AUCUNE des deux langues, alors que `STATUS_CONFIG` la designe et que
   `useGoalDetailActions` pose bien ce statut-la. Archiver un objectif
   affichait donc « goals.statuses.archived » en toutes lettres sur son
   badge — i18next rend la cle quand il ne trouve rien, et la langue de
   repli ne l avait pas non plus.

   MESURE : aucun des 38 objectifs du compte n est archive — les trois
   statuts en usage sont `not_started`, `in_progress` et
   `fully_completed`. Le defaut etait donc atteignable d un clic et
   jamais atteint. Les deux libelles ont ete ajoutes ; ce test est ce
   qui les tient.
   ═══════════════════════════════════════════════════════════════ */
describe("les libelles, dans les deux langues", () => {
  const toutesLesCles = [
    ...GOAL_TAGS.map((x) => x.labelKey),
    ...DIFFICULTY_OPTIONS.map((x) => x.labelKey),
    ...Object.values(STATUS_CONFIG).map((x) => x.labelKey),
    ...COST_ITEM_CATEGORIES.map((x) => x.labelKey),
    "goals.difficulties.custom",
  ];

  it("porte une traduction pour chaque cle citee par les tables", () => {
    expect(new Set(toutesLesCles).size).toBe(54);
    for (const k of new Set(toutesLesCles)) {
      expect(typeof lire(fr, k), "fr " + k).toBe("string");
      expect(typeof lire(en, k), "en " + k).toBe("string");
    }
  });

  it("traduit le statut archive, celui qui manquait", () => {
    expect(lire(fr, "goals.statuses.archived")).toBe("Archivé");
    expect(lire(en, "goals.statuses.archived")).toBe("Archived");
  });

  it("derive chaque cle du nom de sa valeur", () => {
    for (const x of GOAL_TAGS) expect(x.labelKey).toBe("goals.tags." + x.value);
    for (const x of DIFFICULTY_OPTIONS) expect(x.labelKey).toBe("goals.difficulties." + x.value);
    for (const x of COST_ITEM_CATEGORIES) expect(x.labelKey).toBe("goals.costCategories." + x.value);
    for (const [statut, x] of Object.entries(STATUS_CONFIG)) {
      expect(x.labelKey).toBe("goals.statuses." + statut);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   CE QUE LA BASE PEUT ECRIRE DOIT AVOIR UNE COULEUR ET UN MOT.

   Le decalage inverse est deja connu et garde ailleurs : `GOAL_TAGS`
   propose DIX-HUIT etiquettes quand l enum `goal_type` n en accepte que
   NEUF, et `typeDObjectif.ts` filtre ce qui part en base.

   Ce qui n etait garde nulle part, c est le sens qui compte vraiment :
   une valeur que la base PEUT contenir et que ces tables ignorent
   s afficherait avec le gris generique et son nom brut en majuscule.
   Ajouter une valeur a un enum Postgres sans l ajouter ici ne ferait
   rougir aucune chaine.
   ═══════════════════════════════════════════════════════════════ */
describe("l accord avec les enums de la base", () => {
  it("donne une etiquette a chacun des neuf types que la base accepte", () => {
    const connues = GOAL_TAGS.map((t) => t.value) as readonly string[];
    for (const t of TYPES_OBJECTIF) expect(connues, t).toContain(t);
  });

  it("donne un statut a chacun des neuf que la base accepte, et pas un de plus", () => {
    expect(Object.keys(STATUS_CONFIG).sort()).toEqual([...STATUTS_EN_BASE].sort());
  });

  /* `DIFFICULTY_OPTIONS` N EN PORTE QUE CINQ, ET C EST VOULU : la
     difficulte « sur mesure » vient du profil de la personne, pas d une
     liste fixe. C est `DIFFICULTY_ORDER` qui la remet dans le rang. */
  it("couvre les six difficultes de la base, dont une venue d ailleurs", () => {
    expect([...DIFFICULTY_ORDER].sort()).toEqual([...DIFFICULTES_EN_BASE].sort());
    expect(DIFFICULTY_OPTIONS.map((d) => d.value)).toEqual(
      DIFFICULTY_ORDER.filter((d) => d !== "custom"),
    );
  });

  it("classe les difficultes de la plus douce a la plus dure", () => {
    expect(DIFFICULTY_ORDER).toEqual(["easy", "medium", "hard", "extreme", "impossible", "custom"]);
  });

  it("ne cite chaque valeur qu une fois dans chaque table", () => {
    for (const table of [GOAL_TAGS, DIFFICULTY_OPTIONS, COST_ITEM_CATEGORIES]) {
      const v = table.map((x) => x.value);
      expect(new Set(v).size).toBe(v.length);
    }
  });
});

describe("le mot d un statut", () => {
  it("passe par la traduction quand on lui en donne une", () => {
    expect(getStatusLabel("paused", ((k: string) => "[" + k + "]") as never)).toBe("[goals.statuses.paused]");
  });

  it("retombe sur l anglais sans traduction", () => {
    expect(getStatusLabel("not_started", undefined as never)).toBe("Not Started");
    expect(getStatusLabel("archived", undefined as never)).toBe("Archived");
  });

  /* ═══ DEUX STATUTS, LE MEME MOT ═══
     `completed` est l etiquette d avant, `fully_completed` celle
     d aujourd hui. Les deux s affichent « Terminé » en francais comme
     « Completed » en anglais : un objectif portant l ancienne ne se
     distingue de l autre par AUCUN signe visible. MESURE : aucune des
     38 lignes du compte ne porte `completed`. */
  it("rend le meme mot pour l ancienne et la nouvelle facon d en finir", () => {
    expect(getStatusLabel("completed", undefined as never))
      .toBe(getStatusLabel("fully_completed", undefined as never));
    expect(lire(fr, "goals.statuses.completed")).toBe(lire(fr, "goals.statuses.fully_completed"));
  });

  /* UN STATUT INCONNU N EST PAS TRADUIT : il est rendu lisible. Les
     tirets bas deviennent des espaces et la premiere lettre monte, ce
     qui donne « Zzz Bidon » plutot que « zzz_bidon ». */
  it("rend lisible un statut que la table ignore", () => {
    expect(getStatusLabel("zzz_bidon", ((k: string) => "[" + k + "]") as never)).toBe("Zzz bidon");
    expect(getStatusLabel("zzz", undefined as never)).toBe("Zzz");
  });
});

/* ═══════════════════════════════════════════════════════════════
   UN STATUT INCONNU RESSEMBLE EXACTEMENT A « NON COMMENCE ».

   Sa couleur est `bg-muted text-muted-foreground` — celle de
   `not_started` au caractere pres — et son icone est le meme cercle
   vide. Ce n est pas un defaut : un statut qu on ne connait pas n a pas
   commence, de notre point de vue. Mais rien ne le disait, et une
   valeur ajoutee a l enum sans l etre ici serait donc INVISIBLE plutot
   que voyante.
   ═══════════════════════════════════════════════════════════════ */
describe("la couleur et l icone d un statut", () => {
  it("donne a chaque statut connu sa couleur et sa pastille", () => {
    expect(getStatusColor("in_progress")).toBe("bg-blue-500/10 text-blue-400");
    expect(getStatusBadgeClass("in_progress")).toBe("bg-blue-500/15 text-blue-400 border-blue-500/30");
  });

  it("confond un statut inconnu avec « non commence »", () => {
    expect(getStatusColor("zzz")).toBe(getStatusColor("not_started"));
    expect(getStatusBadgeClass("zzz")).toBe(getStatusBadgeClass("not_started"));
    expect(getGoalStatusIcon("zzz")).toBe(getGoalStatusIcon("not_started"));
  });

  /* L ICONE EXISTE POUR CEUX QUI NE LISENT PAS LA COULEUR. Neuf statuts
     pour six icones : les trois facons d en finir partagent la coche,
     les deux facons d etre en route partagent l onde. */
  it("range les neuf statuts sous six icones", () => {
    expect(getGoalStatusIcon("not_started")).toBe(Circle);
    expect(getGoalStatusIcon("in_progress")).toBe(Activity);
    expect(getGoalStatusIcon("active")).toBe(Activity);
    for (const s of ["validated", "fully_completed", "completed"]) {
      expect(getGoalStatusIcon(s), s).toBe(CheckCircle2);
    }
    expect(getGoalStatusIcon("paused")).toBe(PauseCircle);
    expect(getGoalStatusIcon("archived")).toBe(Archive);
    expect(getGoalStatusIcon("cancelled")).toBe(XCircle);
    expect(new Set(STATUTS_EN_BASE.map(getGoalStatusIcon)).size).toBe(6);
  });
});

describe("l etiquette et sa couleur", () => {
  it("traduit une etiquette connue et rend lisible une inconnue", () => {
    expect(getTagLabel("diy", ((k: string) => "[" + k + "]") as never)).toBe("[goals.tags.diy]");
    expect(getTagLabel("diy", undefined as never)).toBe("DIY");
    expect(getTagLabel("zzz", ((k: string) => "[" + k + "]") as never)).toBe("Zzz");
  });

  /* UNE ETIQUETTE INCONNUE PREND LA COULEUR D « AUTRE », au chiffre
     pres. Meme motif que pour les statuts : ce qu on ne connait pas se
     range dans le fourre-tout plutot que de se signaler. */
  it("donne a une etiquette inconnue la couleur d « autre »", () => {
    expect(getTagColor("zzz")).toBe(getTagColor("other"));
    expect(getTagColor("zzz")).toBe("hsl(210 30% 50%)");
  });

  /* DEUX COULEURS PASSENT PAR UNE VARIABLE DE THEME plutot que par un
     HSL fixe : la sante et la difficulte facile empruntent le vert des
     succes, qui descend sur fond clair. Le repli entre parentheses est
     ce qui s affiche si la variable n est pas posee — le retirer
     rendrait ces deux couleurs vides hors du theme. */
  it("laisse deux couleurs suivre le theme, avec leur repli", () => {
    const parTheme = GOAL_TAGS.filter((t) => t.color.startsWith("var("));
    expect(parTheme.map((t) => t.value)).toEqual(["health"]);
    expect(getTagColor("health")).toBe("var(--succes-papier, hsl(142 70% 50%))");
    expect(DIFFICULTY_OPTIONS.find((d) => d.value === "easy")!.color)
      .toBe("var(--succes-papier, hsl(142 70% 50%))");
  });

  it("ecrit toutes les autres couleurs en HSL", () => {
    for (const t of GOAL_TAGS) {
      if (t.color.startsWith("var(")) continue;
      expect(t.color, t.value).toMatch(/^hsl\(\d{1,3} \d{1,3}% \d{1,3}%\)$/);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   RAMENER UNE VIEILLE ETIQUETTE DANS LE RANG.

   Dix noms d avant sont traduits vers leur equivalent d aujourd hui ;
   tout le reste tombe dans « autre ». Ce qui doit tenir, et que rien ne
   verifiait : LES DIX CIBLES SONT ELLES-MEMES DES ETIQUETTES VALIDES.
   Une faute de frappe dans cette table rendrait une valeur que la
   suite prendrait pour bonne.
   ═══════════════════════════════════════════════════════════════ */
describe("ramener une etiquette dans le rang", () => {
  const ANCIENNES = ["growth", "career", "fitness", "art", "money",
    "education", "social", "craft", "sport", "job"];

  it("rend toujours une etiquette que les tables connaissent", () => {
    const connues = GOAL_TAGS.map((t) => t.value) as readonly string[];
    for (const a of [...ANCIENNES, "zzz", "", "GROWTH"]) {
      expect(connues, a).toContain(mapToValidTag(a));
    }
  });

  it("traduit chacune des dix anciennes vers une autre etiquette", () => {
    for (const a of ANCIENNES) expect(mapToValidTag(a), a).not.toBe(a);
    expect(mapToValidTag("career")).toBe("professional");
    expect(mapToValidTag("fitness")).toBe("health");
    expect(mapToValidTag("sport")).toBe("health");
  });

  /* LA CASSE NE COMPTE PAS, NI A L ENTREE NI DANS LA TABLE : une
     etiquette venue d un import majuscule doit retrouver son rang. */
  it("ignore la casse", () => {
    expect(mapToValidTag("HEALTH")).toBe("health");
    expect(mapToValidTag("Career")).toBe("professional");
  });

  it("range dans « autre » ce qu elle ne reconnait pas", () => {
    expect(mapToValidTag("zzz")).toBe("other");
    expect(mapToValidTag("")).toBe("other");
  });
});

describe("la difficulte", () => {
  it("traduit une difficulte connue et rend lisible une inconnue", () => {
    expect(getDifficultyLabel("hard", ((k: string) => "[" + k + "]") as never))
      .toBe("[goals.difficulties.hard]");
    expect(getDifficultyLabel("hard", undefined as never)).toBe("Hard");
    expect(getDifficultyLabel("zzz", undefined as never)).toBe("Zzz");
  });

  /* LA DIFFICULTE SUR MESURE PORTE LE NOM QUE LA PERSONNE LUI A DONNE.
     Sans nom, elle retombe sur sa traduction ; sans traduction non
     plus, sur le mot anglais. Trois etages, dans cet ordre. */
  it("prefere le nom choisi pour la difficulte sur mesure", () => {
    const t = ((k: string) => "[" + k + "]") as never;
    expect(getDifficultyLabel("custom", t, "Titan")).toBe("Titan");
    expect(getDifficultyLabel("custom", t)).toBe("[goals.difficulties.custom]");
    expect(getDifficultyLabel("custom", undefined as never)).toBe("Custom");
    /* Un nom vide ne compte pas pour un nom. */
    expect(getDifficultyLabel("custom", t, "")).toBe("[goals.difficulties.custom]");
  });

  /* ═══ CONSTATE, NON CORRIGE : UNE DIFFICULTE INCONNUE PARAIT FACILE ═══
     L intensite sert aux effets visuels — plus elle monte, plus la
     fiche s agite. Le repli est 1, celui d « easy », et non 0 : une
     valeur ajoutee a l enum sans l etre ici serait donc rendue comme la
     plus douce des cinq, ce qui est le contraire de se signaler. */
  it("compte de un a cinq, et retombe sur un", () => {
    expect(DIFFICULTES_EN_BASE.map(getDifficultyIntensity)).toEqual([1, 2, 3, 4, 5, 5]);
    expect(getDifficultyIntensity("zzz")).toBe(1);
    expect(getDifficultyIntensity("zzz")).toBe(getDifficultyIntensity("easy"));
  });

  /* « SUR MESURE » VAUT AUTANT QU « IMPOSSIBLE » : c est le rang le
     plus haut, partage. */
  it("met la difficulte sur mesure au niveau d impossible", () => {
    expect(getDifficultyIntensity("custom")).toBe(getDifficultyIntensity("impossible"));
    expect(getDifficultyIntensity("custom")).toBe(5);
  });
});

describe("les categories de cout", () => {
  it("traduit une categorie connue", () => {
    expect(getCostCategoryLabel("tools", ((k: string) => "[" + k + "]") as never))
      .toBe("[goals.costCategories.tools]");
  });

  /* SANS TRADUCTION, LE NOM BRUT PREND UNE MAJUSCULE — et c est le
     meme traitement pour une categorie connue et pour une inconnue.
     Contrairement aux statuts et aux etiquettes, il n y a pas de table
     de repli anglaise ici : « electronics » et « zzz » sortent tous
     deux capitalises. */
  it("capitalise le nom brut, connue ou non, quand rien ne traduit", () => {
    expect(getCostCategoryLabel("electronics")).toBe("Electronics");
    expect(getCostCategoryLabel("zzz")).toBe("Zzz");
  });
});
