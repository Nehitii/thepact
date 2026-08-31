import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { CHAMPS_SUIVIS, estChampSuivi, verdictDuClient } from "./deblocage";
import type { SuiviDuMembre } from "./deblocage";

const juge = (type: string, value: unknown, suivi: SuiviDuMembre = {}) =>
  verdictDuClient({ type, value } as { type: string; value?: number }, suivi);

/* ═══════════════════════════════════════════════════════════════
   LES QUARANTE-HUIT TYPES QUE PORTENT LES DEFINITIONS EN BASE.

   Releves le 30/08/2026 sur `achievement_definitions`. Le client en
   juge TRENTE-QUATRE ; les quatorze autres sont evaluees par le
   serveur, qui les calcule depuis les tables elles-memes
   (`mesures_du_membre`) et les accorde par `rattraper_les_succes`.

   Cette liste est ecrite ici a la main, et c est voulu : un test qui
   irait la chercher en base ne pourrait pas tourner hors ligne, et
   surtout il suivrait la base au lieu de la surveiller. Le jour ou un
   type apparait ou disparait, ce test tombe et quelqu un regarde.
   ═══════════════════════════════════════════════════════════════ */
const TYPES_EN_BASE = [
  // ── les vingt-neuf compteurs, moins ceux qu aucune definition n emploie ──
  "consecutive_login_days", "logins_at_same_hour_streak", "midnight_logins_count",
  "total_goals_created", "goals_completed_total", "steps_completed_total",
  "easy_goals_completed", "medium_goals_completed", "hard_goals_completed",
  "impossible_goals_completed", "custom_goals_completed",
  "todos_completed", "pomodoro_sessions", "pomodoro_total_minutes",
  "journal_entries", "friends_count", "guilds_joined", "guild_messages_sent",
  "community_posts", "wishlist_items_added", "wishlist_items_acquired",
  "modules_purchased", "cosmetics_owned", "calendar_events_created",
  "bonds_spent_total", "finance_months_validated", "transactions_logged",
  // ── les quatre que le client sait juger autrement ──
  "all_difficulties_created", "has_pact", "has_edited_pact", "speed_complete",
  // ── les quatorze que seul le serveur juge ──
  "health_checkins", "health_streak", "health_low_stress", "health_sleep_average",
  "health_hydration_streak", "tous_les_modules", "toutes_categories_cosmetiques",
  "extreme_goal_72h", "extreme_goal_48h", "goal_completed_3min", "impossible_goal_30d",
  "objectif_franchi_de_nuit", "silent_goal_completion", "huit_etapes_en_un_jour",
  "mystic_hours_login", "succes_debloques", "rang_gagne",
];

describe("le partage du travail avec le serveur", () => {
  it("juge trente des quarante-huit types en base, et laisse les autres", () => {
    expect(TYPES_EN_BASE).toHaveLength(48);
    const juges = TYPES_EN_BASE.filter((t) => juge(t, 1) !== "hors-de-portee");
    const laisses = TYPES_EN_BASE.filter((t) => juge(t, 1) === "hors-de-portee");
    expect(juges).toHaveLength(30);
    expect(laisses).toHaveLength(18);
    expect(laisses).toContain("health_checkins");
    expect(laisses).toContain("tous_les_modules");
    expect(laisses).toContain("rang_gagne");
    /* Un instant, juge ailleurs — pas un oubli. */
    expect(laisses).toContain("speed_complete");
  });

  /* DEUX COMPTEURS QU AUCUNE DEFINITION N EMPLOIE. Le client sait juger
     `extreme_goals_completed` et `bonds_earned_total`, mais rien en base
     ne les demande. Ce n est pas un defaut — c est la place laissee a un
     succes qu on n a pas encore ecrit. */
  it("sait juger deux compteurs que rien ne demande encore", () => {
    const inemployes = CHAMPS_SUIVIS.filter((c) => !TYPES_EN_BASE.includes(c));
    expect([...inemployes].sort()).toEqual(["bonds_earned_total", "extreme_goals_completed"]);
  });

  /* ═══ CE QU IL NE SAIT PAS JUGER, IL NE L ACCORDE PAS ═══
     C est la seule garde qui compte : `grant_achievement` ne verifie
     aucune condition, donc tout ce que le client declare debloque est
     insere ET PAYE en bonds. Un type inconnu doit sortir « hors de
     portee » — jamais « debloque », meme avec un suivi genereux. */
  it("ne debloque jamais un type qu il ne connait pas", () => {
    const genereux: SuiviDuMembre = {
      has_pact: true, has_edited_pact: true, current_rank_tier: 99,
      health_checkins: 9999, tous_les_modules: true, succes_debloques: 9999,
    };
    for (const t of ["health_checkins", "tous_les_modules", "rang_gagne", "zzz", "", "toString"]) {
      expect(juge(t, 1, genereux), t).toBe("hors-de-portee");
    }
  });

  /* ═══ CONSTATE : LA BRANCHE « rank_up » NE PEUT PLUS SE DECLENCHER ═══
     Aucune definition ne porte ce type — celle du rang s appelle
     « rang_gagne » et se juge cote serveur. La branche fonctionne
     encore, mais plus rien ne l appelle. */
  it("garde une branche « rank_up » que plus aucune definition n emploie", () => {
    expect(TYPES_EN_BASE).not.toContain("rank_up");
    expect(juge("rank_up", true, { current_rank_tier: 2 })).toBe("debloque");
    expect(juge("rank_up", true, { current_rank_tier: 1 })).toBe("pas-encore");
    expect(juge("rank_up", true, {})).toBe("pas-encore");
  });

  /* « L INSTANT » NE LAISSE PAS DE COMPTEUR : un objectif boucle en
     trois minutes se juge au moment ou il se boucle, pas apres coup. Il
     est donc hors de portee ICI, mais pas oublie — `trackGoalCompleted`
     le tranche sur-le-champ. */
  it("laisse les instants a celui qui les voit passer", () => {
    expect(juge("speed_complete", 1, { goals_completed_total: 999 })).toBe("hors-de-portee");
  });
});

describe("les colonnes suivies", () => {
  /* CHAQUE COLONNE CITEE DOIT EXISTER. La liste est ecrite a la main ;
     une faute de frappe y rendrait le compteur introuvable, donc nul,
     donc le succes ingagnable — sans que rien ne rougisse. On la
     confronte au type genere par Supabase. */
  it("ne cite que des colonnes que la table porte vraiment", () => {
    const types = fs.readFileSync("src/socle/supabase/types.ts", "utf8");
    const debut = types.indexOf("achievement_tracking: {");
    const bloc = types.slice(debut, types.indexOf("Insert:", debut));
    const colonnes = new Set([...bloc.matchAll(/^\s{10}(\w+):/gm)].map((m) => m[1]));
    expect(colonnes.size).toBeGreaterThan(40);
    for (const champ of CHAMPS_SUIVIS) expect(colonnes, champ).toContain(champ);
  });

  it("reconnait ses vingt-neuf colonnes et rien d autre", () => {
    expect(CHAMPS_SUIVIS).toHaveLength(29);
    expect(new Set(CHAMPS_SUIVIS).size).toBe(29);
    for (const c of CHAMPS_SUIVIS) expect(estChampSuivi(c), c).toBe(true);
    /* Des colonnes voisines qui ne sont PAS des compteurs a seuil : une
       date, un booleen, un identifiant. Les admettre ferait comparer
       « >= » sur une date. */
    for (const c of ["last_login_date", "has_pact", "user_id", "usual_login_hour", "zzz"]) {
      expect(estChampSuivi(c), c).toBe(false);
    }
  });
});

describe("un compteur contre un seuil", () => {
  it("debloque des que le compte atteint le seuil", () => {
    expect(juge("todos_completed", 10, { todos_completed: 10 })).toBe("debloque");
    expect(juge("todos_completed", 10, { todos_completed: 11 })).toBe("debloque");
    expect(juge("todos_completed", 10, { todos_completed: 9 })).toBe("pas-encore");
  });

  /* UN COMPTEUR ABSENT VAUT ZERO, PAS « INCONNU ». La ligne de suivi
     est creee vide : au premier passage, tous les compteurs sont nuls
     ou absents, et aucun succes ne doit partir. */
  it("lit un compteur absent, nul ou illisible comme zero", () => {
    for (const v of [undefined, null, "12", true, {}, NaN]) {
      expect(juge("journal_entries", 1, { journal_entries: v }), String(v)).toBe("pas-encore");
    }
    expect(juge("journal_entries", 1, {})).toBe("pas-encore");
  });

  /* UN SEUIL DE ZERO DEBLOQUE TOUT DE SUITE — et il en existe un en
     base : une definition de `todos_completed` porte la valeur zero.
     C est un succes de bienvenue, pas un defaut. */
  it("debloque au premier passage quand le seuil est zero", () => {
    expect(juge("todos_completed", 0, {})).toBe("debloque");
    expect(juge("todos_completed", 0, { todos_completed: 0 })).toBe("debloque");
  });

  /* UN SEUIL ILLISIBLE NE DEBLOQUE RIEN. `0 >= undefined` et
     `0 >= "dix"` valent faux : une definition dont la valeur manque ou
     n est pas un nombre reste ingagnable, en silence. C est le bon sens
     de l erreur — on ne paie pas des bonds sur une definition qu on ne
     comprend pas. */
  it("refuse plutot que d accorder quand le seuil est illisible", () => {
    for (const v of [undefined, "dix", {}, NaN]) {
      expect(juge("todos_completed", v, { todos_completed: 9999 }), String(v)).toBe("pas-encore");
    }
  });

  /* ═══ CONSTATE : UN SEUIL A `null` SE LIT COMME ZERO ═══
     JavaScript ramene `null` a zero dans une comparaison numerique :
     `0 >= null` vaut VRAI. Une definition sans valeur serait donc
     accordee a tout le monde des le premier passage — et payee, puisque
     `grant_achievement` ne verifie rien.

     MESURE DU 30/08/2026 : SEPT definitions portent une valeur nulle
     (`health_checkins`, `health_streak`, `health_low_stress`,
     `health_sleep_average`, `health_hydration_streak`), pour 920 bonds
     au total. Aucune n est atteignable ici : leurs types sont tous
     juges par le SERVEUR, donc rendus hors de portee avant meme que le
     seuil soit lu. La meme garde qui ecarte l inconnu desamorce ce
     piege-la. */
  it("lirait un seuil nul comme zero, si un type juge ici en portait un", () => {
    expect(juge("todos_completed", null, {})).toBe("debloque");
    /* Mais les sept qui en portent un ne passent pas par la. */
    for (const t of ["health_checkins", "health_streak", "health_low_stress",
      "health_sleep_average", "health_hydration_streak"]) {
      expect(juge(t, null, {}), t).toBe("hors-de-portee");
    }
  });

  /* ET UN SEUIL A `true` SE LIT COMME UN. JavaScript compare
     `1 >= true` en ramenant le booleen a un. Aucune definition de
     compteur ne porte `true` aujourd hui — les quatre qui le portent
     sont des conditions booleennes — mais si l une le faisait, elle
     deviendrait « au moins un ». */
  it("lit un seuil booleen comme le nombre un", () => {
    expect(juge("todos_completed", true, { todos_completed: 1 })).toBe("debloque");
    expect(juge("todos_completed", true, { todos_completed: 0 })).toBe("pas-encore");
  });
});

describe("les conditions qui ne sont pas des compteurs", () => {
  /* ═══ CONSTATE : LE CLIENT EST PLUS SEVERE QUE LE SERVEUR ═══
     La condition s appelle « toutes les difficultes ». Le client exige
     les SIX — sur mesure comprise. Le serveur, lui, compte
     `count(distinct difficulty) >= 5`, donc CINQ suffisent.

     Cinq objectifs de cinq difficultes differentes donnent donc deux
     reponses opposees selon qui juge. Comme le client ne fait
     qu ACCORDER, la difference se voit seulement en retard : le succes
     n arrive pas quand on le merite, et tombe plus tard au rattrapage. */
  it("exige les six difficultes la ou le serveur en demande cinq", () => {
    const cinq: SuiviDuMembre = {
      easy_goals_created: 1, medium_goals_created: 1, hard_goals_created: 1,
      extreme_goals_created: 1, impossible_goals_created: 1,
    };
    expect(juge("all_difficulties_created", true, cinq)).toBe("pas-encore");
    expect(juge("all_difficulties_created", true, { ...cinq, custom_goals_created: 1 }))
      .toBe("debloque");
  });

  it("veut au moins un objectif de chaque difficulte, pas seulement la colonne", () => {
    const toutes = Object.fromEntries(
      ["easy", "medium", "hard", "extreme", "impossible", "custom"].map((d) => [d + "_goals_created", 1]),
    );
    expect(juge("all_difficulties_created", true, toutes)).toBe("debloque");
    for (const d of ["easy", "custom", "extreme"]) {
      expect(juge("all_difficulties_created", true, { ...toutes, [d + "_goals_created"]: 0 }), d)
        .toBe("pas-encore");
    }
  });

  /* SEUL `true` COMPTE, pas ce qui lui ressemble. La colonne est un
     booleen ; une chaine non vide arrivee d ailleurs ne doit pas
     valoir un pacte. */
  it("ne prend que le vrai pour un pacte scelle", () => {
    expect(juge("has_pact", true, { has_pact: true })).toBe("debloque");
    for (const v of [false, null, undefined, 1, "oui", "true"]) {
      expect(juge("has_pact", true, { has_pact: v }), String(v)).toBe("pas-encore");
    }
    expect(juge("has_edited_pact", true, { has_edited_pact: true })).toBe("debloque");
    expect(juge("has_edited_pact", true, { has_pact: true })).toBe("pas-encore");
  });
});
