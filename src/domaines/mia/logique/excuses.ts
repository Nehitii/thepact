import type { ExpressionMia } from "@/domaines/mia/logique/visages";

/**
 * Ce que M.I.A dit quand elle ne peut pas répondre.
 *
 * ═══════════════════════════════════════════════════════════════
 * UNE PANNE N'EST PAS UN OBJET JSON.
 *
 * Le client affichait `{"error":"Limite atteinte, réessaie dans un
 * instant."}` dans une notification, et n'écrivait rien dans le fil : la
 * conversation ne montrait plus que les messages de l'utilisateur, sans
 * une seule réponse. On voyait une application cassée là où il n'y avait
 * qu'un quota.
 *
 * ELLE RÉPOND DONC ELLE-MÊME. C'est une réponse de la couche réflexe :
 * gratuite, instantanée, et écrite d'avance.
 *
 * ET ELLE S'AGACE SI ON INSISTE. Le premier refus est gêné. Le deuxième
 * soupire. Au quatrième elle est franchement énervée — et ce n'est pas
 * contre l'utilisateur, c'est contre la limite. C'est la seule occasion
 * où sa colère répond à ce qu'on lui dit plutôt qu'à l'état du pacte, et
 * elle se justifie : à la cinquième question en trente secondes, une
 * machine polie serait une machine qui ment.
 * ═══════════════════════════════════════════════════════════════
 */

export type CauseExcuse = "cadence" | "quotidien" | "saturation" | "panne";

export interface Excuse {
  texte: string;
  expression: ExpressionMia;
}

/** Les paliers, du plus indulgent au plus sec. */
const PALIERS: Record<CauseExcuse, { texte: string[]; expression: ExpressionMia }[]> = {
  /* La limite par minute du fournisseur : ça repart tout seul. */
  cadence: [
    {
      expression: "genee",
      texte: [
        "Je ne peux pas répondre à celle-là tout de suite — la limite du modèle est atteinte. Garde ta question, elle tient une minute.",
        "Trop de questions d'un coup pour le modèle. Laisse-lui une minute et repose-la.",
        "Là je sèche, mais c'est la limite, pas la question. Une minute.",
      ],
    },
    {
      expression: "soupir",
      texte: [
        "Toujours pas. Une minute, vraiment.",
        "C'est la même limite qu'il y a dix secondes.",
        "Je n'ai pas menti la première fois.",
      ],
    },
    {
      expression: "severe",
      texte: [
        "Ça ne viendra pas plus vite en redemandant.",
        "Insister ne change rien à un compteur.",
        "Le compteur ne me regarde pas insister.",
      ],
    },
    {
      expression: "colere",
      texte: [
        "J'ai dit une minute. Ce n'est pas contre toi, c'est contre la limite — mais arrête.",
        "Non. Attends.",
        "Tu peux continuer, ça ne me fera pas répondre.",
      ],
    },
    {
      expression: "menacante",
      texte: [
        "Encore une et je compte les secondes à voix haute.",
        "Tu veux vraiment savoir combien de fois tu as demandé ?",
      ],
    },
  ],

  /* Le quota du jour de l'application : cent appels, et il ne repart
     qu'à minuit. Inutile de faire monter la pression, elle propose
     autre chose. */
  quotidien: [
    {
      expression: "genee",
      texte: [
        "Le quota du jour est épuisé — cent questions au modèle, c'est la limite. Ça repart demain. En attendant je réponds encore à l'état, aux tâches et au focus.",
        "Plus de modèle pour aujourd'hui. Demande-moi où tu en es, ça je sais toujours le faire.",
      ],
    },
    {
      expression: "soupir",
      texte: [
        "Toujours épuisé. Ça ne repartira pas avant demain.",
        "Le quota est journalier. Demain.",
      ],
    },
    {
      expression: "severe",
      texte: [
        "Demain. Demande-moi l'état du jour à la place.",
        "Ce n'est pas une minute cette fois, c'est une journée.",
      ],
    },
  ],

  /* LES MODÈLES SONT PRIS, PAS CASSÉS.
     Un 5xx tombait dans « panne », qui dit « quelque chose a échoué
     de mon côté » — donc quelque chose à réparer. C'est faux : rien
     n'est cassé, le fournisseur est saturé, et ça repart tout seul.
     Depuis que le serveur réessaie et relaie entre plusieurs modèles
     (supabase/functions/_shared/relais.ts), un 5xx qui arrive
     jusqu'ici veut dire que TOUTE la chaîne a échoué — rare, et
     encore moins réparable par l'utilisateur. Elle le dit tel quel. */
  saturation: [
    {
      expression: "genee",
      texte: [
        "Les modèles sont pris d'assaut là, j'ai réessayé et je n'ai rien eu. Ça repart tout seul — laisse-moi une minute.",
        "Saturé en amont. J'ai insisté, sans succès. Ce n'est pas cassé, c'est bondé.",
        "Rien ne me répond en ce moment. Ce n'est ni toi ni ta question — c'est l'affluence.",
      ],
    },
    {
      expression: "soupir",
      texte: [
        "Toujours saturé. J'ai réessayé, encore.",
        "Même chose : personne ne décroche en face.",
      ],
    },
    {
      expression: "severe",
      texte: [
        "Ça dure. Reviens dans dix minutes, ce sera passé.",
        "Insister n'ouvre pas une file d'attente pleine.",
      ],
    },
  ],

  /* Autre chose a cassé. Elle ne prétend pas savoir quoi. */
  panne: [
    {
      expression: "genee",
      texte: [
        "Quelque chose a échoué de mon côté. Réessaie — et si ça recommence, ce n'est pas toi.",
        "Je n'ai pas réussi à répondre. Je ne sais pas pourquoi, et je préfère le dire.",
      ],
    },
    {
      expression: "soupir",
      texte: ["Encore raté. Ce n'est pas passager, apparemment."],
    },
    {
      expression: "severe",
      texte: ["Toujours en panne. Il faudra regarder les journaux du serveur."],
    },
  ],
};

/* Le compteur d'insistance. Il ne vit que le temps de la page : une
   conversation reprise le lendemain repart de la patience. */
let insistance = 0;
let derniereCause: CauseExcuse | null = null;
let dernierTexte = "";

/** Reconnaît la cause à partir du code et du corps renvoyés. */
export function causeDeLEchec(statut: number, corps: string): CauseExcuse {
  if (statut === 429) return /quotidien|demain/i.test(corps) ? "quotidien" : "cadence";
  if (statut === 402 || statut === 403) return "quotidien";
  /* 5xx SEULEMENT, PAS LE 0. `useMia` rend `statut: 0` quand le fetch
     lui-même a échoué — le réseau de L'UTILISATEUR. Lui répondre
     « saturé en amont » serait une explication inventée ; « panne »,
     qui ne prétend pas savoir, reste la bonne réponse pour ce cas. */
  if (statut >= 500) return "saturation";
  return "panne";
}

/** Toute réponse servie remet la patience à zéro. */
export function apaiser(): void {
  insistance = 0;
  derniereCause = null;
}

export function excuseMia(cause: CauseExcuse): Excuse {
  if (cause !== derniereCause) {
    insistance = 0;
    derniereCause = cause;
  } else {
    insistance++;
  }

  const paliers = PALIERS[cause];
  const palier = paliers[Math.min(insistance, paliers.length - 1)];
  const possibles = palier.texte.filter((t) => t !== dernierTexte);
  const texte = possibles[Math.floor(Math.random() * possibles.length)] ?? palier.texte[0];
  dernierTexte = texte;

  return { texte, expression: palier.expression };
}

/** Pour les essais : remet le compteur à zéro sans passer par une réponse. */
export function reinitialiserInsistance(): void {
  insistance = 0;
  derniereCause = null;
  dernierTexte = "";
}
