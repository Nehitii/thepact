/**
 * Ce que M.I.A fait sans modèle.
 *
 * ═══════════════════════════════════════════════════════════════
 * UNE CAPACITÉ QU'ON NE SAIT PAS INVOQUER N'EXISTE PAS.
 *
 * Deux couches répondent gratuitement — le réflexe, qui sait des choses,
 * et le geste, qui en fait. Elles sont instantanées et ne consomment
 * aucun quota. Mais elles ne se déclenchent que sur des tournures
 * précises : sans catalogue, il faut les deviner, et personne ne devine.
 *
 * CE FICHIER EST LA SOURCE UNIQUE. La liste des gestes existait en deux
 * exemplaires — `GESTES_CONNUS` dans miaReflexes et `gestesConnus()` dans
 * miaGestes — parce qu'un import entre les deux ferait un cycle. Ce
 * module n'importe rien, donc les deux peuvent y puiser.
 *
 * Les exemples sont TAPABLES TELS QUELS : le panneau les pose dans le
 * champ, et la couche correspondante doit les reconnaître. Un exemple qui
 * ne déclenche rien est un mensonge — c'est ce qui a fait découvrir que
 * « ouvre la liste de souhaits » partait vers les tâches.
 * ═══════════════════════════════════════════════════════════════
 */

export type CouchePossible = "reflexe" | "navigation" | "geste";

export interface Possible {
  couche: CouchePossible;
  /** Ce qu'on tape, mot pour mot. */
  exemple: string;
  /** Ce qu'elle en fait. */
  quoi: string;
  /** Vrai quand l'exemple doit être complété avant d'être envoyé. */
  aCompleter?: boolean;
}

export const POSSIBLES: Possible[] = [
  /* ── CE QU'ELLE SAIT DIRE ── */
  { couche: "reflexe", exemple: "où j'en suis", quoi: "Ton jour, ton pourcentage, tes étapes restantes." },
  { couche: "reflexe", exemple: "combien de jours il reste", quoi: "Les jours restants du pacte, et la phase." },
  { couche: "reflexe", exemple: "combien d'étapes", quoi: "Ce qui reste sur les objectifs en cours." },
  { couche: "reflexe", exemple: "mes tâches", quoi: "Les tâches ouvertes et les plus proches." },
  { couche: "reflexe", exemple: "mon focus", quoi: "Les minutes de focus d'aujourd'hui." },
  { couche: "reflexe", exemple: "mes ordres du jour", quoi: "Les trois ordres, et lesquels sont réclamés." },
  { couche: "reflexe", exemple: "mon solde", quoi: "Les bonds dont tu disposes." },
  { couche: "reflexe", exemple: "que sais-tu faire", quoi: "Cette liste, en une phrase." },

  /* ── LÀ OÙ ELLE T'EMMÈNE ──
     Dix destinations, cinq verbes interchangeables : « ouvre »,
     « montre », « va », « affiche », « emmène ». Focus manque à cette
     liste parce quil est plus bas, du côté des gestes : on ne va pas
     dans Focus, on en lance un. */
  { couche: "navigation", exemple: "ouvre le tableau de bord", quoi: "L'accueil." },
  { couche: "navigation", exemple: "ouvre le journal", quoi: "La chronologie." },
  { couche: "navigation", exemple: "montre mes objectifs", quoi: "Les objectifs et leurs étapes." },
  { couche: "navigation", exemple: "ouvre la liste de tâches", quoi: "Le todo." },
  { couche: "navigation", exemple: "ouvre le calendrier", quoi: "L'agenda." },
  { couche: "navigation", exemple: "ouvre les statistiques", quoi: "Les relevés." },
  { couche: "navigation", exemple: "ouvre la santé", quoi: "Le suivi santé." },
  { couche: "navigation", exemple: "ouvre la finance", quoi: "Le budget." },
  { couche: "navigation", exemple: "ouvre la liste de souhaits", quoi: "Les envies." },
  { couche: "navigation", exemple: "ouvre la boutique", quoi: "La boutique." },

  /* ── CE QU'ELLE FAIT ── */
  { couche: "geste", exemple: "lance un focus", quoi: "Ouvre une session de concentration." },
  { couche: "geste", exemple: "coche « ", quoi: "Coche une tâche par son nom, même approché.", aCompleter: true },
  { couche: "geste", exemple: "ajoute une tâche : ", quoi: "Crée une tâche dans le todo.", aCompleter: true },
  { couche: "geste", exemple: "reporte « ", quoi: "Repousse l'échéance d'une tâche à demain.", aCompleter: true },
];

/** Les tournures que la couche réflexe reconnaît. */
export function reflexesConnus(): string[] {
  return POSSIBLES.filter((p) => p.couche === "reflexe").map((p) => p.exemple);
}

/** Les tournures que la couche geste reconnaît, navigation comprise. */
export function gestesConnus(): string[] {
  return [
    "ouvre le journal",
    "montre mes objectifs",
    "coche « une tâche »",
    "ajoute une tâche : …",
    "reporte « … » à demain",
    "lance un focus",
  ];
}

/** Les trois groupes, dans l'ordre où ils se lisent. */
export const GROUPES: { couche: CouchePossible; titre: string; note: string }[] = [
  { couche: "reflexe", titre: "Ce qu'elle sait dire", note: "Instantané, sans requête." },
  { couche: "navigation", titre: "Là où elle t'emmène", note: "ouvre · montre · va · affiche" },
  { couche: "geste", titre: "Ce qu'elle fait", note: "Elle agit, puis elle le dit." },
];
