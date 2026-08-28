import { describe, it, expect } from "vitest";
import { chercherReflexe } from "./miaReflexes";
import type { EtatDuJour } from "@/hooks/useEtatDuJour";

/* ═══════════════════════════════════════════════════════════════
   CE QUE CE FICHIER PROTÈGE

   La couche réflexe répond SANS le modèle : c'est gratuit et instantané,
   et c'est aussi pourquoi une erreur y est silencieuse. Quand elle se
   trompe d'intention, personne ne voit d'erreur — on voit M.I.A
   répondre à côté, et on croit que c'est elle qui a mal compris.

   Sondage du 28/08 : 26 formulations correctement classées sur 37. La
   cause n'était pas une règle isolée mais la forme du filtre — il teste
   l'APPARTENANCE À UN ENSEMBLE, pas une séquence. ["a", "faire"], deux
   des mots les plus courants du français, attrapait « ça a l'air de
   faire du bien ».

   Les cas ci-dessous sont ceux du sondage. Ils tiennent en deux
   colonnes : la phrase, et l'intention attendue — `null` voulant dire
   « laisse passer au modèle ». Au moindre doute, laisser passer est la
   bonne réponse : le modèle coûte un appel, une réponse à côté coûte
   la confiance.
   ═══════════════════════════════════════════════════════════════ */

/* Un état complet et neutre. Chaque `repondre` doit pouvoir aboutir :
   sinon le repli — une règle qui colle mais ne peut pas répondre laisse
   sa place à la suivante — masquerait ce qu'on veut mesurer. */
const ETAT = {
  pacte: { jour: 10, total: 100, pctEcoule: 10, reste: 90, nom: "Ananta" },
  objectifs: {
    etapes: 20, faites: 5, restantEnCours: 5, restantAVenir: 10,
    enCours: 2, plusGros: [{ reste: 3, nom: "X" }],
  },
  taches: { ouvertes: 2, prochaines: [{ enRetard: false, titre: "t", echeance: null }] },
  focus: { minutes: 30, sessions: 2 },
  ordres: [{ titre: "o", fait: false }],
  solde: 100,
} as unknown as EtatDuJour;

const intention = (phrase: string) => chercherReflexe(phrase, ETAT)?.intention ?? null;

describe("ce qui DOIT être un réflexe", () => {
  it.each([
    ["Resume", "etat"],
    ["Resume-moi", "etat"],
    ["Fais-moi un resume", "etat"],
    ["Ou j'en suis ?", "etat"],
    ["Fais le point", "etat"],
    ["Ca donne quoi ?", "etat"],
    ["Il reste combien de jours ?", "reste"],
    ["Combien d'etapes il me reste ?", "etapes"],
    ["Mes objectifs ?", "etapes"],
    ["Mes taches ?", "taches"],
    ["Ma todo", "taches"],
    ["Mes ordres du jour", "ordres"],
    ["Mon solde", "solde"],
    ["Aide", "aide"],
    ["Aide-moi", "aide"],
    ["Tu sais faire quoi ?", "aide"],
    ["Bonjour", "salut"],
    ["Bonjour, comment vas-tu aujourd'hui ?", "salut"],
    ["Merci", "merci"],
    ["Parfait", "merci"],
    ["A plus", "adieu"],
    ["Bonne nuit", "adieu"],
    ["Tu es stupide", "provocation"],
    ["Tu sers a rien", "provocation"],
    ["Tais-toi", "provocation"],
  ])("« %s » → %s", (phrase, attendu) => {
    expect(intention(phrase)).toBe(attendu);
  });
});

describe("ce qui doit passer au modèle", () => {
  it.each([
    /* Le mot porte l'intention, mais la phrase ne la porte pas. */
    ["Resume-moi ce qu'est la patience."],
    ["Peux-tu resumer cet article pour moi ?"],
    ["Aide-moi a ecrire un mail de relance"],
    ["Quelles sont les commandes bash utiles ?"],
    ["C'est super ce que tu viens de dire"],
    /* Une insulte se définit par son destinataire, pas par sa
       longueur : ces deux-là font le même nombre de mots que
       « tu es stupide ». */
    ["Cette approche est stupide"],
    ["Cette idee est idiote a mon avis"],
    /* Deux règles collaient à la fois sur celle-ci. */
    ["Peux-tu m'aider a faire un resume de ma semaine ?"],
    /* ["a", "faire"] attrapait les deux suivantes. */
    ["Je ne sais pas quoi faire de ma soiree"],
    ["Ca a l'air de faire du bien"],
    ["Explique-moi ce qu'est un pacte"],
  ])("« %s » → le modèle", (phrase) => {
    expect(intention(phrase)).toBeNull();
  });
});

describe("les garde-fous de forme", () => {
  it("sans état du jour, aucun réflexe", () => {
    expect(chercherReflexe("Resume", undefined)).toBeNull();
  });

  it("une phrase vide ne déclenche rien", () => {
    expect(intention("   ")).toBeNull();
  });

  it("au-delà de douze mots, on laisse passer", () => {
    /* Le plafond global : une question longue mérite le modèle, même
       si elle contient les mots d'une intention. */
    expect(intention("ou j en suis exactement et pourquoi mon pacte Ananta stagne depuis trois semaines")).toBeNull();
  });

  it("le groupe le plus long l'emporte sur l'ordre de déclaration", () => {
    /* « taches » est déclarée avant « aide » et colle par
       ["quoi", "faire"] ; « aide » colle par quatre mots. */
    expect(intention("Tu sais faire quoi ?")).toBe("aide");
  });
});
