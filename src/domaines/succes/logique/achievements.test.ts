/* LE CONTRAT DE CHAINES ENTRE CE FICHIER ET LA BASE.
 *
 * `achievements.ts` ne calcule presque rien : il APPELLE. Six
 * fonctions distantes, trois tables, seize noms de compteurs, deux
 * clefs de mise a jour, sept clefs de traduction. Trente-quatre
 * chaines, et pas une seule que le compilateur regarde.
 *
 * CE QUI REND CE CONTRAT DANGEREUX : IL ECHOUE EN SILENCE.
 * `increment_tracking_counter` est un CASE sur le nom du champ, avec
 * `ELSE NULL` au bout — un nom mal ecrit ne leve rien, n ecrit rien,
 * et rend un succes inatteignable pour toujours. Meme forme du cote
 * de `update_achievement_tracking` : sept champs lus par
 * `COALESCE((p_updates->>'nom')::type, colonne)`, et une huitieme
 * clef passerait sans laisser de trace.
 *
 * LES DEUX LISTES BLANCHES SONT RELEVEES DU CORPS DES FONCTIONS SQL
 * (`pg_get_functiondef`, lecture seule, 31 aout 2026). Elles ne sont
 * pas dans les types generes : un type ne connait que les colonnes de
 * la table, jamais le sous-ensemble qu une fonction accepte. C est
 * exactement l ecart ou une faute se cache — quarante-sept colonnes,
 * trente-trois incrementables, sept modifiables.
 *
 * CE QUI A ETE COUPE. `rarityColors` associait les six raretes a
 * autant de variables CSS `--achievement-*`. Rien ne le lisait :
 * l ecran des succes colore par `data-rarete` et les variables
 * `--su-*` de `succes.css`, qui couvrent bien les six raretes des
 * cent definitions. La table, sa reexportation par la barriere du
 * domaine, et les douze declarations CSS des deux themes sont parties
 * ensemble — trente et une lignes que personne ne lisait.
 */
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import en from "@/socle/i18n/locales/en.json";
import fr from "@/socle/i18n/locales/fr.json";
import { miseAJourDeConnexion } from "./connexion";

const SOURCE = fs.readFileSync("src/domaines/succes/logique/achievements.ts", "utf8");
const TYPES = fs.readFileSync("src/socle/supabase/types.ts", "utf8");

const toutes = (motif: RegExp) => [...SOURCE.matchAll(motif)].map((m) => m[1]);

/* ── LES DEUX LISTES BLANCHES DU SERVEUR ──────────────────────────
   Relevees dans le corps des fonctions, pas dans les types. */
const INCREMENTABLES = new Set([
  "total_goals_created", "easy_goals_created", "medium_goals_created",
  "hard_goals_created", "extreme_goals_created", "impossible_goals_created",
  "custom_goals_created", "goals_completed_total", "easy_goals_completed",
  "medium_goals_completed", "hard_goals_completed", "extreme_goals_completed",
  "impossible_goals_completed", "custom_goals_completed", "steps_completed_total",
  "todos_completed", "todos_created", "pomodoro_sessions", "pomodoro_total_minutes",
  "journal_entries", "friends_count", "guilds_joined", "guild_messages_sent",
  "community_posts", "wishlist_items_added", "wishlist_items_acquired",
  "modules_purchased", "cosmetics_owned", "calendar_events_created",
  "bonds_spent_total", "bonds_earned_total", "finance_months_validated",
  "transactions_logged",
]);

const MODIFIABLES = new Set([
  "consecutive_login_days", "last_login_date", "logins_at_same_hour_streak",
  "usual_login_hour", "midnight_logins_count", "has_pact", "has_edited_pact",
]);

/* La ligne `achievement_tracking: { Row: { ... } }` des types generes. */
const colonnesDeLaTable = (table: string) => {
  const debut = TYPES.indexOf("      " + table + ": {");
  expect(debut, table).toBeGreaterThan(-1);
  const bloc = TYPES.slice(debut, TYPES.indexOf("Insert:", debut));
  return new Set([...bloc.matchAll(/^\s{10}(\w+)\??:/gm)].map((m) => m[1]));
};

describe("les seize compteurs que le client incremente", () => {
  const champs = toutes(/p_field: '(\w+)'/g);

  it("sont bien seize, et tous distincts", () => {
    expect(champs).toHaveLength(16);
    expect(new Set(champs).size).toBe(16);
  });

  it("sont tous des colonnes de achievement_tracking", () => {
    const colonnes = colonnesDeLaTable("achievement_tracking");
    expect(colonnes.size).toBeGreaterThan(40);
    for (const c of champs) expect(colonnes.has(c), c).toBe(true);
  });

  it("sont tous dans la liste blanche de la fonction distante", () => {
    /* LE POINT DE TOUT LE FICHIER. Une colonne peut exister sans que
       la fonction sache l incrementer : quarante-sept colonnes pour
       trente-trois noms acceptes. Un champ hors liste ne leve pas
       d erreur — le CASE tombe sur ELSE NULL, l appel reussit, et le
       compteur reste a zero pour toujours. */
    for (const c of champs) expect(INCREMENTABLES.has(c), c).toBe(true);
  });

  it("les quatorze colonnes non incrementables ne sont jamais passees", () => {
    const colonnes = colonnesDeLaTable("achievement_tracking");
    const muettes = [...colonnes].filter((c) => !INCREMENTABLES.has(c));
    expect(muettes).toHaveLength(14);
    for (const c of muettes) expect(champs, c).not.toContain(c);
  });
});

describe("les clefs de mise a jour", () => {
  it("les deux clefs ecrites en dur sont acceptees par le serveur", () => {
    const clefs = toutes(/p_updates: \{ (\w+):/g);
    expect(clefs).toEqual(["has_pact", "has_edited_pact"]);
    for (const c of clefs) expect(MODIFIABLES.has(c), c).toBe(true);
  });

  it("la mise a jour de connexion ne produit que des clefs acceptees", () => {
    /* Elle est construite ailleurs — `connexion.ts` — et passee telle
       quelle. Une clef ajoutee la-bas serait ignoree ici sans bruit. */
    const suivis = [
      {},
      { last_login_date: "2026-08-30", consecutive_login_days: 3 },
      { last_login_date: "2026-08-25", usual_login_hour: 9, logins_at_same_hour_streak: 2 },
      { last_login_date: "2026-08-30", usual_login_hour: 23, midnight_logins_count: 1 },
    ];
    const heures = [new Date(2026, 7, 31, 9, 30), new Date(2026, 7, 31, 0, 2), new Date(2026, 7, 31, 23, 58)];
    const vues = new Set<string>();
    for (const s of suivis)
      for (const h of heures) {
        const maj = miseAJourDeConnexion(h, s);
        if (maj) for (const k of Object.keys(maj)) vues.add(k);
      }
    expect(vues.size).toBeGreaterThan(3);
    for (const k of vues) expect(MODIFIABLES.has(k), k).toBe(true);
  });
});

describe("les fonctions distantes et les tables", () => {
  it("les six fonctions appelees existent dans les types generes", () => {
    const rpc = [...new Set(toutes(/supabase\.rpc\(["'](\w+)["']/g))].sort();
    expect(rpc).toEqual([
      "grant_achievement", "increment_tracking_counter", "init_achievement_tracking",
      "mesures_du_membre", "resynchroniser_compteurs_succes", "update_achievement_tracking",
    ]);
    const bloc = TYPES.slice(TYPES.indexOf("    Functions: {"));
    for (const f of rpc) expect(bloc, f).toContain("      " + f + ":");
  });

  it("les trois tables lues existent", () => {
    const tables = [...new Set(toutes(/\.from\("(\w+)"\)/g))].sort();
    expect(tables).toEqual(["achievement_definitions", "achievement_tracking", "user_achievements"]);
    for (const t of tables) expect(colonnesDeLaTable(t).size, t).toBeGreaterThan(0);
  });

  it("les colonnes selectionnees a la main existent sur LEUR table", () => {
    /* BALAYAGE : la premiere version de ce test verifiait que
       « nom_fr » existe — sans jamais verifier que le fichier le
       DEMANDE. Renommer la selection en « name_fr » survivait. On lit
       donc les quatre selections dans la source, appariees a leur
       table, et on confronte chaque colonne nommee. */
    const paires = [...SOURCE.matchAll(/\.from\("(\w+)"\)[\s\S]{0,120}?\.select\("([^"]+)"\)/g)]
      .map((m) => [m[1], m[2]] as [string, string]);
    expect(paires.map(([t, s]) => t + " → " + s)).toEqual([
      "achievement_tracking → *",
      "achievement_definitions → *",
      "user_achievements → achievement_key",
      "achievement_definitions → name, nom_fr, rarity",
    ]);
    for (const [table, selection] of paires) {
      if (selection === "*") continue;
      const colonnes = colonnesDeLaTable(table);
      for (const c of selection.split(",").map((x) => x.trim()))
        expect(colonnes.has(c), table + "." + c).toBe(true);
    }
  });
});

describe("les sept clefs de traduction", () => {
  const lire = (o: unknown, k: string) =>
    k.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown> | null)?.[p], o);

  it("l annonce et les six raretes sont traduites dans les deux langues", () => {
    /* LA GARDE i18n NE VOIT PAS CELLES-LA. Elle ne releve que les
       appels dont la clef est ecrite en toutes lettres ; ici la
       rarete est INTERPOLEE — `achievements.rarity.${rarete}` — et
       vient de la base. Une septieme rarete ajoutee en base
       afficherait sa propre clef sur l ecran, chaine verte. */
    const cles = ["achievements.justUnlocked", ...["common", "uncommon", "rare", "epic",
      "legendary", "mythic"].map((r) => "achievements.rarity." + r)];
    expect(cles).toHaveLength(7);
    for (const k of cles) {
      expect(typeof lire(fr, k), "fr " + k).toBe("string");
      expect(typeof lire(en, k), "en " + k).toBe("string");
    }
  });

  it("la rarete passe bien par la traduction, et non par sa valeur brute", () => {
    /* BALAYAGE : coller `${rarete}` a la place de l appel survivait —
       le test verifiait que les six clefs EXISTENT sans verifier que
       le fichier les DEMANDE. Sur une interface francaise, l annonce
       aurait affiche « legendary » au lieu de « Légendaire ». */
    expect(SOURCE).toContain("i18n.t(`achievements.rarity.${rarete}`, rarete)");
  });

  it("l annonce porte un repli en francais, jamais en anglais", () => {
    /* Le second argument de `t()` s affiche quand la clef manque. Il
       etait « Achievement Unlocked! » sur une interface francaise. */
    expect(SOURCE).toContain('i18n.t("achievements.justUnlocked", "Succès débloqué")');
  });
});

describe("la forme du fichier", () => {
  it("chaque incrementation est suivie d une verification", () => {
    /* Un compteur monte sans que rien ne regarde si un seuil vient
       d etre franchi : le succes n arriverait qu au geste SUIVANT. On
       decoupe le fichier en fonctions exportees et on exige que
       chacune qui incremente verifie ensuite. */
    const corps = SOURCE.split(/export async function /).slice(1);
    const incrementent = corps.filter((c) => c.includes("increment_tracking_counter"));
    expect(incrementent).toHaveLength(15);
    for (const c of incrementent) {
      const nom = c.slice(0, c.indexOf("("));
      expect(c.indexOf("checkAchievements"), nom).toBeGreaterThan(c.lastIndexOf("increment_tracking_counter"));
    }
  });

  it("les deux ecritures directes debloquent leur succes sans passer par la verification", () => {
    /* `has_pact` et `has_edited_pact` sont des booleens : aucune
       condition cote client ne les lit, et attendre une verification
       ne donnerait rien. Ils debloquent donc en direct. */
    for (const [fn, cle] of [["trackPactCreated", "the_sealed_pact"], ["trackPactEdited", "keeper_of_the_oath"]]) {
      const corps = SOURCE.slice(SOURCE.indexOf("export async function " + fn));
      const bloc = corps.slice(0, corps.indexOf("\n}"));
      expect(bloc, fn).toContain("unlockAchievement(userId, '" + cle + "')");
      expect(bloc, fn).not.toContain("checkAchievements");
    }
  });

  it("rien n ouvre plus le deblocage a la main", () => {
    /* `unlockAchievement` credite des bonds et `grant_achievement` ne
       verifie aucune condition. La fonction reste privee. */
    expect(SOURCE).not.toMatch(/export (async )?function unlockAchievement/);
    expect(SOURCE).toMatch(/^async function unlockAchievement\(/m);
  });

  it("la table de couleurs coupee n est reclamee nulle part", () => {
    expect(SOURCE).not.toContain("rarityColors");
    expect(fs.readFileSync("src/domaines/succes/index.ts", "utf8")).not.toContain("rarityColors");
    expect(fs.readFileSync("src/index.css", "utf8")).not.toContain("--achievement-");
  });
});
