import type { EtatDuJour } from "@/domaines/mia/types";
import { gestesConnus, reflexesConnus as _r } from "./possibles";
import type { ExpressionMia } from "@/domaines/mia/logique/visages";

/**
 * Les réflexes de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QU'ELLE SAIT DÉJÀ, ELLE N'A PAS À LE DEMANDER.
 *
 * La clé du fournisseur est sur le palier gratuit de Gemini : vingt
 * requêtes par minute, et un tour avec outil en coûte deux. Chaque
 * question qui n'atteint pas le modèle est une question qui aboutit.
 *
 * L'état du jour est déjà calculé (`useEtatDuJour`). « Où j'en suis »,
 * « il me reste combien », « c'est quoi mes tâches » : la réponse est
 * dans ces champs, et sortir une phrase en coûte zéro.
 *
 * CE N'EST PAS DE LA COMPRÉHENSION DU LANGAGE. C'est une table
 * d'intentions et des motifs. Elle se trompe rarement parce qu'elle ne
 * tente rien : au moindre doute, elle laisse passer au modèle.
 *
 * TROIS À CINQ FORMULATIONS PAR INTENTION, tirées au sort et jamais deux
 * fois la même d'affilée. C'est ce qui sépare un personnage d'un
 * répondeur — et ça ne coûte rien.
 * ═══════════════════════════════════════════════════════════════
 */

export interface Reflexe {
  intention: string;
  texte: string;
  expression: ExpressionMia;
}

/** Sans accents, sans casse, sans ponctuation : on compare des mots. */
export function aplatir(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Le dernier texte servi par intention : on ne répète pas. */
const dernier = new Map<string, string>();

function choisir(intention: string, variantes: string[]): string {
  if (variantes.length === 1) return variantes[0];
  const precedent = dernier.get(intention);
  const possibles = variantes.filter((v) => v !== precedent);
  const choix = possibles[Math.floor(Math.random() * possibles.length)] ?? variantes[0];
  dernier.set(intention, choix);
  return choix;
}

const nb = (n: number) => n.toLocaleString("fr-FR");

const enFrancais = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "sans échéance";

/* La liste vient de miaPossibles, qui n'importe rien : ce module est
   importé PAR miaGestes (pour `aplatir`), et un aller-retour direct
   ferait un cycle. Elle existait ici en double, à la main. */
const GESTES_CONNUS = gestesConnus();

interface Regle {
  intention: string;
  /** Tous les mots d'un groupe doivent être là ; un groupe suffit. */
  motifs: string[][];
  /**
   * Au-delà de tant de mots, ce n'est plus cette intention.
   *
   * UN MOT COURANT NE PORTE PAS UNE INTENTION À LUI SEUL. « résume »,
   * « aide », « super », « stupide » apparaissent dans des phrases qui
   * ne demandent rien de tel — et le motif teste l'APPARTENANCE, pas
   * une séquence : un groupe se satisfait de ses mots présents
   * n'importe où.
   *
   * Le plafond dit combien de mots une phrase peut avoir tout en
   * restant CETTE demande-là. Il diffère par intention parce que les
   * intentions diffèrent : une salutation se permet « bonjour,
   * comment vas-tu aujourd'hui ? », un remerciement non.
   */
  motsMax?: number;
  repondre: (e: EtatDuJour) => Reflexe | null;
}

const REGLES: Regle[] = [
  /* ── L'ÉTAT ── */
  {
    intention: "etat",
    motsMax: 6,
    motifs: [
      ["ou", "j", "en", "suis"],
      ["ou", "en", "suis", "je"],
      ["ou", "on", "en", "est"],
      ["resume"],
      ["ca", "donne", "quoi"],
      ["fais", "le", "point"],
      ["point", "de", "situation"],
    ],
    repondre: (e) => {
      if (!e.pacte) return null;
      const o = e.objectifs;
      const bouts = [
        `Jour ${nb(e.pacte.jour)} sur ${nb(e.pacte.total)}, ${Math.round(e.pacte.pctEcoule)} % écoulé.`,
        `${nb(o.restantEnCours)} étapes restantes sur tes ${o.enCours} objectifs en cours${
          o.plusGros[0] ? `, dont ${o.plusGros[0].reste} pour ${o.plusGros[0].nom}` : ""
        }.`,
        e.taches.ouvertes > 0
          ? `${e.taches.ouvertes} tâche${e.taches.ouvertes > 1 ? "s" : ""} ouverte${e.taches.ouvertes > 1 ? "s" : ""}${
              e.taches.prochaines.some((t) => t.enRetard) ? ", dont une en retard" : ""
            }.`
          : "Aucune tâche ouverte.",
      ];
      return {
        intention: "etat",
        texte: bouts.join(" "),
        expression: e.taches.prochaines.some((t) => t.enRetard) ? "contrariee" : "neutre",
      };
    },
  },

  /* ── LE TEMPS QUI RESTE ── */
  {
    intention: "reste",
    motsMax: 12,
    /* « il reste combien » SANS « jours » attrapait « combien
       d'étapes il me reste ? », qui appartient à l'intention
       suivante. Cette règle-ci parle de l'échéance du pacte : elle
       doit le dire. */
    motifs: [
      ["combien", "jours"],
      ["reste", "jours"],
      ["il", "reste", "combien", "jours"],
      ["echeance", "pacte"],
      ["quand", "finit"],
      ["quand", "se", "termine"],
    ],
    repondre: (e) => {
      if (!e.pacte || !e.pacte.total) return null;
      const { reste, jour, total, pctEcoule, nom } = e.pacte;
      return {
        intention: "reste",
        texte: choisir("reste", [
          `${nb(reste)} jours sur ${nom}. Jour ${nb(jour)} sur ${nb(total)}, ${Math.round(pctEcoule)} % écoulé.`,
          `Il te reste ${nb(reste)} jours. On est au jour ${nb(jour)} des ${nb(total)}.`,
          `${nb(reste)} jours. ${Math.round(pctEcoule)} % du pacte est passé.`,
        ]),
        expression: e.phase === "critique" ? "menacante" : e.phase === "attention" ? "neutre" : "calme",
      };
    },
  },

  /* ── LES ÉTAPES ── */
  {
    intention: "etapes",
    motsMax: 12,
    motifs: [
      ["combien", "etapes"],
      ["reste", "etapes"],
      ["mes", "objectifs"],
      ["ou", "en", "sont", "mes", "objectifs"],
      ["combien", "objectifs"],
    ],
    repondre: (e) => {
      const o = e.objectifs;
      if (!o.etapes) return null;
      const gros = o.plusGros[0];
      return {
        intention: "etapes",
        texte: choisir("etapes", [
          `${nb(o.restantEnCours)} étapes restantes sur tes ${o.enCours} objectifs en cours.${
            gros ? ` ${gros.nom} en concentre ${gros.reste} à lui seul.` : ""
          }`,
          `${nb(o.faites)} étapes faites sur ${nb(o.etapes)}. ${nb(o.restantEnCours)} restent sur ce qui est en cours, ${nb(o.restantAVenir)} sur ce qui n'a pas commencé.`,
        ]),
        expression: "neutre",
      };
    },
  },

  /* ── LES TÂCHES ── */
  {
    intention: "taches",
    motsMax: 8,
    /* ["a", "faire"] ÉTAIT LE GROUPE LE PLUS LARGE DU FICHIER. Deux
       mots parmi les plus courants du français, testés en
       appartenance : « ça a l'air de faire du bien » le déclenchait.
       Il faut un troisième mot pour que la demande existe. */
    motifs: [
      ["mes", "taches"],
      ["quoi", "faire"],
      ["reste", "a", "faire"],
      ["ma", "todo"],
      ["taches", "ouvertes"],
      ["qu", "est", "ce", "qu", "il", "reste", "a", "faire"],
    ],
    repondre: (e) => {
      const t = e.taches;
      if (!t.ouvertes) {
        return { intention: "taches", texte: "Aucune tâche ouverte.", expression: "calme" };
      }
      const liste = t.prochaines
        .slice(0, 3)
        .map((x) => `${x.nom} (${enFrancais(x.echeance)}${x.enRetard ? ", en retard" : ""})`)
        .join(", ");
      const retard = t.prochaines.filter((x) => x.enRetard).length;
      return {
        intention: "taches",
        texte:
          `${t.ouvertes} tâche${t.ouvertes > 1 ? "s" : ""} ouverte${t.ouvertes > 1 ? "s" : ""}.` +
          (liste ? ` Les plus proches : ${liste}.` : "") +
          (retard ? ` ${retard} en retard.` : ""),
        expression: retard ? "contrariee" : "neutre",
      };
    },
  },

  /* ── LE FOCUS ── */
  {
    intention: "focus",
    motsMax: 12,
    motifs: [
      ["combien", "focus"],
      ["mon", "focus"],
      ["j", "ai", "bosse", "combien"],
      ["temps", "de", "concentration"],
      ["combien", "de", "minutes"],
    ],
    repondre: (e) => {
      const m = e.focusMinutes;
      return {
        intention: "focus",
        texte: m
          ? choisir("focus", [
              `${m} minutes de focus aujourd'hui.`,
              `${m} minutes aujourd'hui.`,
            ])
          : choisir("focus-vide", [
              "Aucune séance de focus aujourd'hui.",
              "Rien en focus aujourd'hui pour l'instant.",
            ]),
        expression: m >= 25 ? "contente" : "neutre",
      };
    },
  },

  /* ── LES ORDRES DU JOUR ── */
  {
    intention: "ordres",
    motsMax: 12,
    motifs: [
      ["ordres", "du", "jour"],
      ["mes", "quetes"],
      ["mes", "ordres"],
      ["quetes", "du", "jour"],
    ],
    repondre: (e) => {
      if (!e.ordres.length) return { intention: "ordres", texte: "Pas d'ordre du jour aujourd'hui.", expression: "neutre" };
      const total = e.ordres.reduce((s, o) => s + o.prime, 0);
      const acquis = e.ordres.filter((o) => o.reclame).reduce((s, o) => s + o.prime, 0);
      const liste = e.ordres.map((o) => `${o.titre} ${o.progression}/${o.cible}`).join(" · ");
      const tousPris = e.ordres.every((o) => o.reclame);
      return {
        intention: "ordres",
        texte: `${liste}. Prime ${acquis}/${total} bonds.`,
        expression: tousPris ? "joie" : "neutre",
      };
    },
  },

  /* ── LE SOLDE ── */
  {
    intention: "solde",
    motsMax: 12,
    motifs: [["mon", "solde"], ["combien", "bonds"], ["j", "ai", "combien", "de", "bonds"]],
    repondre: (e) =>
      e.solde == null
        ? null
        : { intention: "solde", texte: `${nb(e.solde)} bonds.`, expression: "neutre" },
  },

  /* ── L'AIDE ──
     Elle ne récite pas une notice : elle dit ce qu'elle sait faire
     GRATUITEMENT, parce que c'est la seule chose que l'utilisateur ne
     peut pas deviner. Ce qu'elle sait faire avec le modèle, il le sait
     déjà — c'est une conversation. */
  {
    intention: "aide",
    motsMax: 5,
    motifs: [["aide"], ["aide", "moi"], ["tu", "sais", "faire", "quoi"], ["que", "sais", "tu", "faire"], ["commandes"]],
    repondre: () => ({
      intention: "aide",
      texte:
        "Sans modèle, je réponds à : " +
        _r().join(" · ") +
        ". Et je fais : " +
        GESTES_CONNUS.join(" · ") +
        ". Pour le reste, pose la question normalement.",
      expression: "complice",
    }),
  },

  /* ── LA POLITESSE ──
     Elle répond, elle ne meuble pas. Pas de « comment puis-je t'aider
     aujourd'hui ? » : la question suivante viendra toute seule. */
  {
    intention: "salut",
    motsMax: 8,
    motifs: [["bonjour"], ["salut"], ["hey"], ["coucou"], ["bonsoir"], ["yo"]],
    repondre: (e) => ({
      intention: "salut",
      texte: choisir("salut", [
        e.nom ? `Salut ${e.nom}.` : "Salut.",
        "Là.",
        e.pacte ? `Salut. Jour ${nb(e.pacte.jour)}.` : "Salut.",
      ]),
      expression: "calme",
    }),
  },
  {
    intention: "merci",
    motsMax: 4,
    motifs: [["merci"], ["nickel"], ["parfait"], ["super"]],
    repondre: () => ({
      intention: "merci",
      texte: choisir("merci", ["De rien.", "Quand tu veux.", "C'est noté."]),
      expression: "contente",
    }),
  },
  {
    intention: "adieu",
    motsMax: 6,
    motifs: [["a", "plus"], ["bonne", "nuit"], ["salut", "a", "demain"], ["au", "revoir"], ["bye"]],
    repondre: () => ({
      intention: "adieu",
      texte: choisir("adieu", ["À plus.", "À demain.", "Ferme quand tu veux."]),
      expression: "calme",
    }),
  },

  /* ── LA PROVOCATION ──
     Un seul retour, sec, et elle passe. Ni vexée ni servile : elle
     enregistre, elle ne juge pas. */
  {
    intention: "provocation",
    motsMax: 6,
    /* ["idiote"] ET ["stupide"] SEULS ÉTAIENT UNE ERREUR DE NATURE.
       Une insulte se définit par son DESTINATAIRE, pas par sa
       longueur : « cette approche est stupide » fait quatre mots,
       « tu es stupide » aussi. Aucun plafond ne les sépare — seul le
       sujet le fait. On exige donc qu'on la lui adresse. */
    motifs: [
      ["tu", "sers", "a", "rien"],
      ["t", "es", "nulle"],
      ["tu", "es", "nulle"],
      ["tu", "es", "stupide"],
      ["t", "es", "stupide"],
      ["tu", "es", "idiote"],
      ["t", "es", "idiote"],
      ["ferme", "la"],
      ["tais", "toi"],
    ],
    repondre: () => ({
      intention: "provocation",
      texte: choisir("provocation", [
        "Noté.",
        "Si tu veux.",
        "Ça ne change pas les chiffres.",
      ]),
      expression: "severe",
    }),
  },
];

/**
 * Cherche un réflexe. Renvoie null si rien ne colle — et c'est le cas le
 * plus important : au moindre doute, la question part au modèle.
 */
export function chercherReflexe(question: string, etat: EtatDuJour | undefined): Reflexe | null {
  if (!etat) return null;
  const mots = aplatir(question).split(" ").filter(Boolean);
  if (!mots.length) return null;
  const ensemble = new Set(mots);

  /* Une question longue n'est presque jamais un réflexe : « où j'en suis
     et pourquoi Ananta stagne » mérite le modèle. Le seuil est haut
     exprès — on préfère rater un réflexe que rater une vraie question. */
  if (mots.length > 12) return null;

  /* ═══ LE GROUPE LE PLUS LONG L'EMPORTE, PAS LE PREMIER DÉCLARÉ ═══

     On rendait la première règle qui collait. L'ordre de déclaration
     décidait donc des conflits, et il décidait mal : « tu sais faire
     quoi ? » collait à ["quoi", "faire"] de « taches » avant
     d'atteindre ["tu", "sais", "faire", "quoi"] de « aide », qui
     décrit pourtant exactement la question posée.

     Le nombre de mots d'un groupe mesure ce qu'il a fallu reconnaître
     pour conclure. Quatre mots reconnus valent mieux que deux : c'est
     une lecture plus engagée, donc plus sûre. À égalité, l'ordre de
     déclaration tranche encore — d'où le « > » strict. */
  const candidates: { regle: Regle; poids: number }[] = [];

  for (const regle of REGLES) {
    /* Le plafond d'abord : au-delà, ce n'est plus cette intention,
       quel que soit le groupe qui collerait. */
    if (regle.motsMax !== undefined && mots.length > regle.motsMax) continue;
    let poids = 0;
    for (const groupe of regle.motifs) {
      if (groupe.length > poids && groupe.every((m) => ensemble.has(m))) poids = groupe.length;
    }
    if (poids) candidates.push({ regle, poids });
  }

  /* ON GARDE LE REPLI DE LA VERSION D'AVANT. Elle parcourait les règles
     et ne rendait que si `repondre` donnait quelque chose : une règle
     qui colle mais ne peut pas répondre — « où j'en suis » sans pacte —
     laissait sa place à la suivante. Trier ne doit pas supprimer ce
     repli, seulement en changer l'ordre.

     `sort` est stable en JavaScript depuis ES2019 : à poids égal,
     l'ordre de déclaration est conservé. */
  candidates.sort((x, y) => y.poids - x.poids);
  for (const { regle } of candidates) {
    const r = regle.repondre(etat);
    if (r) return r;
  }
  return null;
}

/** La liste de ce qu'elle sait faire sans le modèle, pour l'intention « aide ». */
export { reflexesConnus } from "./possibles";
