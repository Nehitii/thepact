/* CE QUE DEVIENT UN ECHANGE : COMBIEN DE TOURS, QUOI DIRE QUAND IL
 * CASSE, ET CE QU ON GARDE DE CE QU IL A RAPPORTE.
 *
 * Quatre decisions vivaient au milieu du `ReadableStream`, a l endroit
 * exact ou l on ne peut plus rien executer pour les verifier : le
 * corps du flux est ouvert, l en-tete est parti, et un test qui
 * voudrait les atteindre devrait monter un faux fournisseur d IA.
 * Elles sont pures — elles ne lisent ni l heure, ni la base, ni le
 * reseau — et elles decident ce que l utilisateur lit.
 */

/** Une citation rapportee par un outil. */
export interface Citation {
  source_type: string;
  source_id: string;
  snippet: string;
  similarity?: number;
}

/** Une action tentee par un outil, reussie ou non. */
export interface Action {
  tool: string;
  status: "ok" | "error";
  label: string;
  ref_id?: string;
  ref_type?: string;
  error?: string;
}

/* ═══════════════════════════════════════════════════════════════
   QUATRE TOURS D OUTILS, CINQ APPELS AU MODELE.

   Le compte n est pas celui qu on lit. Le premier appel se fait hors
   de la boucle ; la boucle en ajoute un par tour ou des outils ont ete
   demandes. Avec TOURS_MAX a 4 : les tours 0, 1 et 2 rappellent AVEC
   les outils, le tour 3 rappelle SANS. Soit cinq appels au plus, et
   quatre occasions d appeler un outil.

   LE DERNIER TOUR RETIRE LES OUTILS, ET C EST VOULU : le modele n a
   plus le choix, il repond. Sans cela, une boucle d outils pourrait se
   terminer sur un silence — le modele demanderait un outil de plus, la
   boucle s arreterait au plafond, et l utilisateur verrait une bulle
   vide.
   ═══════════════════════════════════════════════════════════════ */
export const TOURS_MAX = 4;

export function estLeDernierTour(tour: number, toursMax: number = TOURS_MAX): boolean {
  return tour >= toursMax - 1;
}

/* ═══════════════════════════════════════════════════════════════
   POURQUOI L ECHANGE S EST INTERROMPU — ET LA SECONDE ECHELLE.

   Le premier appel, lui, echoue AVANT le flux : on peut encore rendre
   un vrai code d erreur, et `upstreamErrorMessage` (_shared/ai.ts)
   choisit la phrase. Ici on est deja dans le flux : il ne reste qu a
   ecrire une clause dans la reponse en cours. D ou une seconde
   echelle, en minuscules, faite pour s enchasser dans une phrase.

   LES DEUX NE RECONNAISSENT PAS LES MEMES STATUTS. Constate, non
   corrige — l ecrire changerait ce que lit l utilisateur :

     401 et 403 : la premiere echelle sait dire « la cle est revoquee »
     et « verifie la cle API du serveur ». Celle-ci les range dans son
     fourre-tout, « le modele a refuse la suite (401) » — un diagnostic
     faux : le modele n a rien refuse, c est la cle qui ne passe plus.

     429 : « dans un instant » la-bas, « dans une minute » ici.

   La difference de TON est legitime — l une ouvre une reponse, l autre
   s enchasse dedans. La difference de CLASSIFICATION ne l est pas.
   ═══════════════════════════════════════════════════════════════ */
export function raisonDeLInterruption(statut: number): string {
  if (statut === 429) return "j'ai atteint le quota du modèle. Réessaie dans une minute.";
  if (statut === 402) return "le crédit du modèle est épuisé.";
  if (statut >= 500) return "les modèles sont saturés — j'ai réessayé sans succès. Retente dans un instant.";
  return `le modèle a refusé la suite (${statut}).`;
}

/* UNE INTERRUPTION NE S ANNONCE PAS PAREIL SELON QU ON A DEJA PARLE.
   Si du texte est deja parti au client, on ne peut plus le reprendre :
   on ajoute un aveu en italique a la suite. Si rien n est parti, la
   reponse EST l aveu, et elle commence donc par une majuscule. */
export function aveuDInterruption(dejaEcrit: string, raison: string): string {
  return dejaEcrit ? `\n\n_(interrompue : ${raison})_` : `Je n'ai pas pu terminer : ${raison}`;
}

/* AUCUN TEXTE DU TOUT : plutot qu une bulle vide, on le dit. C etait le
   symptome visible de trois defauts successifs — la signature de
   pensee perdue, le nom d outil manquant, le quota atteint. */
export const AVEU_SANS_TEXTE = "Je n'ai rien pu produire sur ce tour. Reformule ou réessaie.";

/* ═══════════════════════════════════════════════════════════════
   LA MEME SOURCE CITEE DEUX FOIS N EN FAIT QU UNE.

   Quatre outils d un meme tour peuvent rapporter la meme entree de
   journal. LA PREMIERE GAGNE : c est celle de l outil dont la reponse
   est arrivee la premiere, et son `snippet` — donc sa `similarity` —
   est celui qu on garde. Ce n est pas « la meilleure », c est « la
   premiere » ; la distinction compte le jour ou l on voudra classer
   les citations par pertinence.

   L IDENTITE EST LE COUPLE `source_type:source_id`. Deux extraits
   differents de la MEME entree comptent donc pour un seul.
   ═══════════════════════════════════════════════════════════════ */
export function citationsUniques(citations: readonly Citation[]): Citation[] {
  const vus = new Set<string>();
  return citations.filter((c) => {
    const cle = `${c.source_type}:${c.source_id}`;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  });
}

/* RIEN A DIRE VAUT NULL, PAS UN OBJET VIDE. La colonne `metadata` de
   `mia_messages` porte alors NULL plutot que deux tableaux vides : le
   client teste la presence de l objet, pas la longueur de ses
   tableaux. */
export function metadonneesDuMessage(
  citations: readonly Citation[],
  actions: readonly Action[],
): { citations: Citation[]; actions: Action[] } | null {
  const uniques = citationsUniques(citations);
  if (!uniques.length && !actions.length) return null;
  return { citations: uniques, actions: [...actions] };
}
