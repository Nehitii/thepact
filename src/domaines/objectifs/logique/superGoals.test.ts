import { describe, expect, it } from "vitest";
import { estFranchi, estPretAHonorer, membresDuGroupe } from "./superGoals";
import type { ObjectifPourGroupe } from "./superGoals";

const but = (p: Partial<ObjectifPourGroupe> & { id: string }): ObjectifPourGroupe =>
  ({ goal_type: "normal", status: "in_progress", ...p });

const groupe = (p: Partial<ObjectifPourGroupe> & { id: string }): ObjectifPourGroupe =>
  ({ goal_type: "super", status: "in_progress", ...p });

/* ═══════════════════════════════════════════════════════════════
   CE QUE « FRANCHI » VEUT DIRE — DEUX STATUTS SUR NEUF.

   L enum `goal_status` en porte neuf. Celui-ci en reconnait DEUX.
   Les sept autres comptent comme non franchis, y compris
   « completed » — une etiquette d avant que l enum garde encore et
   qu aucune ecriture de l application ne pose.

   MESURE LE 30/08/2026 : aucune des 38 lignes du compte ne porte
   « completed ». Le trou n est donc pas atteint — mais un import qui
   poserait cette etiquette ferait disparaitre le membre du compte de
   son groupe, sans un mot.
   ═══════════════════════════════════════════════════════════════ */
describe("ce qui compte comme franchi", () => {
  it("reconnait les deux facons d en finir", () => {
    expect(estFranchi({ status: "fully_completed" })).toBe(true);
    expect(estFranchi({ status: "validated" })).toBe(true);
  });

  it("ne reconnait rien d autre", () => {
    for (const s of ["in_progress", "not_started", "paused", "archived", "active", "cancelled"]) {
      expect(estFranchi({ status: s }), s).toBe(false);
    }
  });

  /* « COMPLETED » RESSEMBLE A UN FRANCHI ET N EN EST PAS. C est
     l etiquette d avant ; la reconnaitre ici sans la reconnaitre
     ailleurs ferait diverger le compte d un groupe de ce que la fiche
     affiche. */
  it("ne prend pas l etiquette d avant pour un franchi", () => {
    expect(estFranchi({ status: "completed" })).toBe(false);
  });

  it("ne prend pas une absence de statut pour un franchi", () => {
    expect(estFranchi({})).toBe(false);
    expect(estFranchi({ status: null })).toBe(false);
  });
});

describe("les membres d un groupe declare", () => {
  const vivier = [
    but({ id: "a", status: "fully_completed" }),
    but({ id: "b" }),
    but({ id: "c", status: "validated" }),
  ];

  it("prend les objectifs cites, dans l ordre des identifiants", () => {
    const m = membresDuGroupe(groupe({ id: "g", child_goal_ids: ["c", "a"] }), vivier);
    expect(m.map((x) => x.id)).toEqual(["c", "a"]);
  });

  /* ═══ UN IDENTIFIANT QUI NE DESIGNE PLUS RIEN DISPARAIT ═══
   *
   * `.map(find).filter(Boolean)` : un membre supprime sort du compte
   * sans laisser de trace. Le groupe ne dit pas « quatre membres dont
   * un introuvable », il dit « trois membres » — et si les trois sont
   * franchis, il se declare PRET A HONORER alors qu il en manque un.
   *
   * MESURE LE 30/08/2026 : les six groupes du compte citent vingt-deux
   * identifiants, et les vingt-deux designent un objectif existant.
   * Zero fantome aujourd hui — rien ne l empeche demain, la colonne
   * etant un simple tableau d uuid sans cle etrangere. */
  it("laisse tomber un identifiant qui ne designe plus rien", () => {
    const m = membresDuGroupe(groupe({ id: "g", child_goal_ids: ["a", "disparu", "b"] }), vivier);
    expect(m.map((x) => x.id)).toEqual(["a", "b"]);
    expect(m).toHaveLength(2);
  });

  it("rend une liste vide quand rien n est cite", () => {
    expect(membresDuGroupe(groupe({ id: "g" }), vivier)).toEqual([]);
    expect(membresDuGroupe(groupe({ id: "g", child_goal_ids: [] }), vivier)).toEqual([]);
    expect(membresDuGroupe(groupe({ id: "g", child_goal_ids: null }), vivier)).toEqual([]);
  });

  /* UN GROUPE NE CONTIENT PAS UN GROUPE. Le vivier est filtre avant
     tout : citer un groupe dans `child_goal_ids` ne le fait pas
     entrer. Le declencheur en base ne refuse que l auto-reference et
     l imbrication circulaire — l appartenance simple, elle, passe, et
     c est ici qu elle est ecartee. */
  it("n admet pas un groupe pour membre", () => {
    const avecGroupe = [...vivier, groupe({ id: "autre", status: "fully_completed" })];
    const m = membresDuGroupe(groupe({ id: "g", child_goal_ids: ["a", "autre"] }), avecGroupe);
    expect(m.map((x) => x.id)).toEqual(["a"]);
  });
});

describe("les membres d un groupe automatique", () => {
  const vivier = [
    but({ id: "a", difficulty: "extreme", status: "fully_completed" }),
    but({ id: "b", difficulty: "easy" }),
    but({ id: "c", difficulty: "extreme" }),
  ];
  const regle = { difficulties: ["extreme"] };

  it("prend ce que la regle designe, et ignore la liste declaree", () => {
    const m = membresDuGroupe(
      groupe({ id: "g", is_dynamic_super: true, super_goal_rule: regle, child_goal_ids: ["b"] }),
      vivier,
    );
    expect(m.map((x) => x.id).sort()).toEqual(["a", "c"]);
  });

  /* IL FAUT LES DEUX : dynamique ET une regle. Un groupe marque
     dynamique dont la regle a disparu retombe sur sa liste declaree —
     qui est NULLE pour un groupe dynamique, donc sur rien. C est le
     seul chemin par lequel un groupe peut se vider tout seul. */
  it("retombe sur la liste declaree quand la regle manque", () => {
    const sansRegle = groupe({ id: "g", is_dynamic_super: true, child_goal_ids: ["b"] });
    expect(membresDuGroupe(sansRegle, vivier).map((x) => x.id)).toEqual(["b"]);
    const dynamiqueEtVide = groupe({ id: "g", is_dynamic_super: true, child_goal_ids: null });
    expect(membresDuGroupe(dynamiqueEtVide, vivier)).toEqual([]);
  });

  it("ne prend pas la regle d un groupe qui n est pas dynamique", () => {
    const m = membresDuGroupe(
      groupe({ id: "g", is_dynamic_super: false, super_goal_rule: regle, child_goal_ids: ["b"] }),
      vivier,
    );
    expect(m.map((x) => x.id)).toEqual(["b"]);
  });

  /* ═══ UNE GARDE DOMINEE PAR SES DEUX APPELANTS ═══
   *
   * La regle s applique au vivier PRIVE DU GROUPE LUI-MEME. Or le
   * vivier a deja ecarte les groupes, et les deux appelants du depot
   * ne passent que des groupes — `estPretAHonorer` le verifie,
   * `synchroniserGroupes` filtre avant. La garde ne peut donc rien
   * attraper aujourd hui.
   *
   * ELLE N EST PAS DOMINEE PAR CONSTRUCTION : la signature accepte
   * n importe quel objectif. Un appelant qui passerait un objectif
   * ORDINAIRE se retrouverait membre de lui-meme si la regle le
   * designe. Ce test emprunte ce chemin-la, que le depot n emprunte
   * pas, pour que la garde ait une raison ecrite de rester. */
  it("n admet pas un objectif pour membre de lui-meme", () => {
    const pasUnGroupe = but({ id: "a", difficulty: "extreme", is_dynamic_super: true, super_goal_rule: regle });
    const m = membresDuGroupe(pasUnGroupe, vivier);
    expect(m.map((x) => x.id)).toEqual(["c"]);
    expect(m.map((x) => x.id)).not.toContain("a");
  });
});

/* ═══════════════════════════════════════════════════════════════
   PRET A HONORER — L ETAT ENTRE « EN COURS » ET « FRANCHI ».

   Un groupe ne s honore pas tout seul : quand tout le travail est
   fait, il reste le geste. Ce moment a un nom depuis qu il a fallu le
   montrer dans la liste.
   ═══════════════════════════════════════════════════════════════ */
describe("le moment ou il ne reste que le geste", () => {
  const finis = [but({ id: "a", status: "fully_completed" }), but({ id: "b", status: "validated" })];

  it("l annonce quand tous les membres sont franchis", () => {
    expect(estPretAHonorer(groupe({ id: "g", child_goal_ids: ["a", "b"] }), finis)).toBe(true);
  });

  it("ne l annonce pas s il en reste un", () => {
    const vivier = [...finis, but({ id: "c" })];
    expect(estPretAHonorer(groupe({ id: "g", child_goal_ids: ["a", "b", "c"] }), vivier)).toBe(false);
  });

  /* UN GROUPE VIDE N ATTEND PAS UN GESTE, IL ATTEND DES MEMBRES.
     Sans cette garde, `every` sur une liste vide rend VRAI et le
     groupe se declarerait pret a etre honore sans avoir rien
     contenu. */
  it("ne l annonce pas pour un groupe vide", () => {
    expect(estPretAHonorer(groupe({ id: "g", child_goal_ids: [] }), finis)).toBe(false);
    expect(estPretAHonorer(groupe({ id: "g" }), finis)).toBe(false);
    /* Le piege, en clair. */
    expect([].every(() => false)).toBe(true);
  });

  /* DEJA HONORE N EST PLUS A HONORER : le bouton doit disparaitre une
     fois le geste fait, sans quoi il appelle une seconde fois. */
  it("ne l annonce plus une fois le groupe franchi", () => {
    for (const s of ["fully_completed", "validated"]) {
      expect(estPretAHonorer(groupe({ id: "g", status: s, child_goal_ids: ["a", "b"] }), finis), s)
        .toBe(false);
    }
  });

  /* SEULS LES GROUPES CONNAISSENT CET ETAT. Un objectif ordinaire
     passe a « franchi » de lui-meme des sa derniere etape : il
     n attend rien de personne. */
  it("ne concerne pas un objectif ordinaire", () => {
    expect(estPretAHonorer(but({ id: "x", child_goal_ids: ["a", "b"] }), finis)).toBe(false);
    expect(estPretAHonorer(but({ id: "x", goal_type: "habit", child_goal_ids: ["a"] }), finis)).toBe(false);
  });
});
