import type { EtatDuJour } from "@/domaines/mia/types";
import type { ExpressionMia } from "@/domaines/mia/logique/visages";
import { REGLES, type Regle } from "@/domaines/mia/logique/reglesDeReflexe";

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

/* La liste vient de miaPossibles, qui n'importe rien : ce module est
   importé PAR miaGestes (pour `aplatir`), et un aller-retour direct
   ferait un cycle. Elle existait ici en double, à la main. */

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
