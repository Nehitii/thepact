import type { EtatDuJour } from "@/hooks/useEtatDuJour";
import type { ExpressionMia } from "@/components/mia/VisageMia";
import { aplatir } from "./miaReflexes";

/**
 * Les gestes de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QU'ELLE FAIT SANS DEMANDER LA PERMISSION AU MODÈLE.
 *
 * Elle savait déjà cocher une tâche : elle dépensait une requête pour
 * comprendre qu'on le lui demandait, puis une autre pour répondre. Deux
 * requêtes sur un quota de vingt par minute, pour un geste que trois
 * mots suffisent à reconnaître.
 *
 * ELLE NE DEVINE PAS. Quand deux tâches peuvent correspondre, elle
 * demande laquelle. Quand aucune ne correspond, elle le dit. Un geste
 * exécuté sur la mauvaise ligne coûte plus cher qu'un geste refusé.
 *
 * ELLE NE DÉTRUIT RIEN, ici non plus : ouvrir, cocher, ajouter,
 * reporter. Aucune suppression n'est outillée — ce qui n'est pas outillé
 * ne peut pas arriver.
 * ═══════════════════════════════════════════════════════════════
 */

export interface Geste {
  intention: string;
  texte: string;
  expression: ExpressionMia;
  /** Ce qu'il reste à faire au composant : naviguer, appeler un hook. */
  action?:
    | { type: "naviguer"; vers: string }
    | { type: "cocher"; id: string; nom: string }
    | { type: "ajouter"; nom: string }
    | { type: "reporter"; id: string; nom: string; a: string }
    | { type: "focus" };
}

/* ── LES PAGES ──
   Le vocabulaire de l'utilisateur, pas celui des routes. On accepte les
   deux : « ouvre le journal » et « ouvre /journal ». */
const PAGES: { mots: string[]; route: string; nom: string }[] = [
  { mots: ["journal", "chronolog"], route: "/journal", nom: "le journal" },
  { mots: ["objectifs", "goals", "missions"], route: "/goals", nom: "les objectifs" },
  { mots: ["taches", "todo", "liste"], route: "/todo", nom: "la liste de tâches" },
  { mots: ["focus", "concentration", "pomodoro"], route: "/focus", nom: "Focus" },
  { mots: ["sante", "health"], route: "/health", nom: "la santé" },
  { mots: ["finance", "budget", "argent"], route: "/finance", nom: "la finance" },
  { mots: ["calendrier", "agenda", "calendar"], route: "/calendar", nom: "le calendrier" },
  { mots: ["souhaits", "wishlist", "envies"], route: "/wishlist", nom: "la liste de souhaits" },
  { mots: ["analytics", "statistiques", "stats"], route: "/analytics", nom: "les statistiques" },
  { mots: ["boutique", "shop"], route: "/shop", nom: "la boutique" },
  { mots: ["tableau", "bord", "accueil", "dashboard"], route: "/", nom: "le tableau de bord" },
];

const VERBES_OUVRIR = ["ouvre", "ouvrir", "montre", "montrer", "affiche", "affiches", "va", "amene", "emmene"];
const VERBES_COCHER = ["coche", "cocher", "coches", "termine", "terminer", "fini", "finis", "valide", "valider", "fait", "faite"];
const VERBES_AJOUTER = ["ajoute", "ajouter", "cree", "creer", "note", "noter", "rappelle"];
const VERBES_REPORTER = ["reporte", "reporter", "decale", "decaler", "repousse", "repousser"];

/** Distance de Levenshtein, plafonnée : on cherche « proche », pas « exact ». */
function distance(a: string, b: string, plafond = 4): number {
  if (Math.abs(a.length - b.length) > plafond) return plafond + 1;
  const precedent = Array.from({ length: b.length + 1 }, (_, i) => i);
  const courant = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    courant[0] = i;
    let minLigne = i;
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      courant[j] = Math.min(courant[j - 1] + 1, precedent[j] + 1, precedent[j - 1] + cout);
      minLigne = Math.min(minLigne, courant[j]);
    }
    if (minLigne > plafond) return plafond + 1;
    for (let j = 0; j <= b.length; j++) precedent[j] = courant[j];
  }
  return precedent[b.length];
}

/** Les tâches qui ressemblent à ce qu'on a écrit, de la plus proche à la moins. */
function tachesProches(cible: string, etat: EtatDuJour) {
  const c = aplatir(cible);
  if (c.length < 3) return [];
  return etat.taches.prochaines
    .map((t) => {
      const n = aplatir(t.nom);
      const contient = n.includes(c) || c.includes(n);
      const d = contient ? 0 : distance(c, n);
      return { t, score: d, contient };
    })
    .filter((x) => x.contient || x.score <= 3)
    .sort((a, b) => a.score - b.score);
}

/** Ce qui suit le verbe, guillemets et articles retirés. */
function apresLeVerbe(question: string, verbes: string[]): string | null {
  const brut = question.replace(/[«»"“”]/g, " ").trim();
  const mots = aplatir(brut).split(" ");
  const i = mots.findIndex((m) => verbes.includes(m));
  if (i < 0) return null;
  const reste = mots
    .slice(i + 1)
    .filter((m) => !["la", "le", "les", "ma", "mon", "mes", "cette", "ce", "tache", "taches", "de", "du"].includes(m));
  return reste.join(" ").trim() || null;
}

export function chercherGeste(question: string, etat: EtatDuJour | undefined): Geste | null {
  if (!etat) return null;
  const plat = aplatir(question);
  const mots = plat.split(" ").filter(Boolean);
  if (!mots.length) return null;
  const a = (m: string) => mots.includes(m);

  /* ── OUVRIR UNE PAGE ──
     LE MOT LE PLUS PRÉCIS GAGNE, PAS LE PREMIER TROUVÉ.
     `find` rendait la première page dont un mot-clé figurait dans la
     question : « ouvre la liste de souhaits » contient « liste », qui
     appartient au todo, et partait donc vers les tâches. On garde
     désormais la correspondance dont le mot-clé est le plus long —
     « souhaits » bat « liste », et « ouvre la liste » toute seule mène
     toujours au todo. */
  if (VERBES_OUVRIR.some(a)) {
    let page: (typeof PAGES)[number] | undefined;
    let precision = 0;
    for (const p of PAGES) {
      for (const m of p.mots) {
        if (mots.includes(m) && m.length > precision) {
          precision = m.length;
          page = p;
        }
      }
    }
    if (page) {
      return {
        intention: "ouvrir",
        texte: `J'ouvre ${page.nom}.`,
        expression: "contente",
        action: { type: "naviguer", vers: page.route },
      };
    }
  }

  /* ── LANCER UN FOCUS ── */
  if ((a("lance") || a("lancer") || a("demarre") || a("demarrer") || a("commence")) && (a("focus") || a("seance") || a("concentration"))) {
    return {
      intention: "focus",
      texte: "J'ouvre Focus. À toi de lancer la séance.",
      expression: "complice",
      action: { type: "focus" },
    };
  }

  /* ── COCHER UNE TÂCHE ── */
  if (VERBES_COCHER.some(a)) {
    const cible = apresLeVerbe(question, VERBES_COCHER);
    if (!cible) return null;
    const candidats = tachesProches(cible, etat);
    if (candidats.length === 0) {
      return {
        intention: "cocher-introuvable",
        texte: `Je ne trouve pas « ${cible} » dans tes tâches ouvertes.`,
        expression: "genee",
      };
    }
    if (candidats.length > 1 && candidats[0].score === candidats[1].score) {
      return {
        intention: "cocher-ambigu",
        texte: `Deux possibles : « ${candidats[0].t.nom} » ou « ${candidats[1].t.nom} ». Laquelle ?`,
        expression: "reflexion",
      };
    }
    const t = candidats[0].t;
    return {
      intention: "cocher",
      texte: `Cochée : ${t.nom}.`,
      expression: "contente",
      action: { type: "cocher", id: t.id, nom: t.nom },
    };
  }

  /* ── REPORTER UNE TÂCHE ── */
  if (VERBES_REPORTER.some(a)) {
    const quand = a("demain") ? 1 : a("apres") && a("demain") ? 2 : a("semaine") ? 7 : null;
    if (quand === null) return null;
    const cible = apresLeVerbe(question, VERBES_REPORTER)?.replace(/\b(a|demain|apres|la|semaine|prochaine)\b/g, "").trim();
    if (!cible) return null;
    const candidats = tachesProches(cible, etat);
    if (!candidats.length) {
      return {
        intention: "reporter-introuvable",
        texte: `Je ne trouve pas « ${cible} » dans tes tâches ouvertes.`,
        expression: "genee",
      };
    }
    const t = candidats[0].t;
    const date = new Date(Date.now() + quand * 86_400_000).toISOString().slice(0, 10);
    return {
      intention: "reporter",
      texte: `${t.nom} reportée au ${new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.`,
      expression: quand >= 7 ? "severe" : "contente",
      action: { type: "reporter", id: t.id, nom: t.nom, a: date },
    };
  }

  /* ── AJOUTER UNE TÂCHE ── */
  if (VERBES_AJOUTER.some(a) && (a("tache") || a("todo") || plat.includes(":"))) {
    const brut = question.includes(":") ? question.slice(question.indexOf(":") + 1) : apresLeVerbe(question, VERBES_AJOUTER);
    const nom = (brut ?? "").replace(/[«»"“”]/g, "").trim();
    if (!nom || nom.length < 2) return null;
    return {
      intention: "ajouter",
      texte: `Ajoutée : ${nom}.`,
      expression: "contente",
      action: { type: "ajouter", nom: nom.slice(0, 200) },
    };
  }

  return null;
}

/** Ce qu'elle sait faire sans le modèle, pour l'intention « aide ». */
export { gestesConnus } from "./miaPossibles";
