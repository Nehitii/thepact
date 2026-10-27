/* RECOLLER UN FLUX D EVENEMENTS.
 *
 * Le modele repond en morceaux : du texte au fil de l eau, et des
 * appels d outils decoupes — un index, puis un nom, puis des
 * fragments de JSON qui arrivent quelques octets a la fois. Rien de
 * tout cela n est aligne sur les paquets du reseau.
 *
 * Un recollage rate ne plante pas : il produit un nom d outil
 * tronque, ou des arguments JSON invalides, et le tour suivant echoue
 * pour une raison qui n a plus rien a voir.
 */

/** Un appel d outil tel qu il ARRIVE : en morceaux, tout est optionnel. */
export interface FragmentAppelOutil {
  id?: string;
  index?: number;
  type?: string;
  function?: { name?: string; arguments?: string };
  /* Gemini 3 joint ici sa signature de pensee. */
  extra_content?: Record<string, unknown>;
}

/** Un appel d outil RECOLLE : tous ses morceaux sont arrives. */
export interface AppelOutil {
  id: string;
  type: string;
  function: { name: string; arguments: string };
  extra_content?: Record<string, unknown>;
}

/** Un fragment du flux SSE renvoye par le fournisseur. */
export interface FragmentFlux {
  choices?: Array<{ delta?: { content?: string; tool_calls?: FragmentAppelOutil[] } }>;
}

/* ── DECOUPER CE QUI ARRIVE ──────────────────────────────────── */

export const PREFIXE_DONNEE = "data: ";
export const FIN_DE_FLUX = "[DONE]";

/* LE DERNIER MORCEAU EST GARDE POUR LA SUITE.
 *
 * Un paquet reseau ne finit pas sur une fin de ligne : la derniere
 * ligne est presque toujours coupee en plein milieu. On la met de
 * cote et on la recolle au paquet suivant. Sans cela, une ligne sur
 * deux serait du JSON tronque — et « continue » l avalerait en
 * silence, faisant disparaitre du texte au hasard.
 *
 * Quand le paquet finit PILE sur une fin de ligne, le reste est la
 * chaine vide, ce qui est exactement ce qu on veut recoller devant le
 * suivant. */
export function decouperLesLignes(reste: string, morceau: string): { lignes: string[]; reste: string } {
  const lignes = (reste + morceau).split("\n");
  return { reste: lignes.pop() ?? "", lignes };
}

/* CE QU UNE LIGNE PORTE, OU RIEN.
 *
 * Le protocole SSE melange des lignes de donnees, des lignes vides
 * qui separent les evenements, des commentaires, et un « [DONE] »
 * final. Tout ce qui n est pas une donnee est ignore — y compris une
 * donnee vide, qu un JSON.parse ferait lever. */
export function chargeDeLaLigne(ligne: string): string | null {
  if (!ligne.startsWith(PREFIXE_DONNEE)) return null;
  const charge = ligne.slice(PREFIXE_DONNEE.length).trim();
  if (!charge || charge === FIN_DE_FLUX) return null;
  return charge;
}

/* UN FRAGMENT ILLISIBLE EST SAUTE, PAS PROPAGE. Le flux continue :
   une ligne mal formee ne doit pas interrompre une reponse a moitie
   arrivee. */
export function fragmentDeLaLigne(ligne: string): FragmentFlux | null {
  const charge = chargeDeLaLigne(ligne);
  if (charge === null) return null;
  try {
    return JSON.parse(charge) as FragmentFlux;
  } catch {
    return null;
  }
}

/* ── RECOLLER UN APPEL ───────────────────────────────────────── */

export function appelVide(): AppelOutil {
  return { id: "", type: "function", function: { name: "", arguments: "" } };
}

/* CHAQUE CHAMP SE POSE, SAUF LES ARGUMENTS QUI S ACCUMULENT.
 *
 * L identifiant et le nom arrivent une fois et ne changent plus : on
 * les POSE. Les arguments, eux, arrivent en tranches de JSON qu il
 * faut CONCATENER — les poser garderait la derniere tranche seule, et
 * le JSON.parse suivant echouerait sur un fragment.
 *
 * LE TEST SUR CHAQUE CHAMP N EST PAS DECORATIF : un fragment qui
 * n apporte que des arguments a un `id` absent. Sans le test, on
 * ecraserait l identifiant deja recu par une chaine vide, et le
 * message de reponse ne pourrait plus etre rattache a son appel.
 *
 * LA SIGNATURE DE PENSEE VOYAGE AVEC L APPEL, ET DOIT REVENIR AVEC
 * LUI. Gemini 3 joint a chaque appel un `extra_content.google.
 * thought_signature`, et REFUSE le tour suivant si on ne le lui rend
 * pas : 400 INVALID_ARGUMENT, « Function call is missing a
 * thought_signature in functionCall parts ». L ancienne boucle ne
 * diffusait pas et repassait l objet du modele tel quel, donc la
 * signature suivait sans qu on y pense. En recollant les morceaux, on
 * reconstruit l objet — et il faut donc la recopier a la main. Elle
 * est FUSIONNEE et non posee : elle peut arriver en plusieurs
 * fragments. */
export function recoller(outils: AppelOutil[], fragment: FragmentAppelOutil): AppelOutil[] {
  /* UN INDEX ABSENT VAUT ZERO : certains fournisseurs ne l envoient
     pas quand il n y a qu un seul appel. */
  const i = fragment.index ?? 0;
  if (!outils[i]) outils[i] = appelVide();
  if (fragment.id) outils[i].id = fragment.id;
  if (fragment.function?.name) outils[i].function.name = fragment.function.name;
  if (fragment.function?.arguments) outils[i].function.arguments += fragment.function.arguments;
  if (fragment.extra_content) {
    outils[i].extra_content = { ...(outils[i].extra_content ?? {}), ...fragment.extra_content };
  }
  return outils;
}

/* ── LE TOUR ENTIER, HORS ENTREES-SORTIES ────────────────────── */

export interface TourRecolle {
  texte: string;
  outils: AppelOutil[];
}

/* CE QU UNE LIGNE AJOUTE AU TOUR. Rendre le texte separement permet a
   l appelant de le diffuser au client au fil de l eau, sans attendre
   la fin. */
export function absorberLaLigne(
  ligne: string,
  tour: TourRecolle,
): { tour: TourRecolle; aDiffuser: string } {
  const json = fragmentDeLaLigne(ligne);
  const delta = json?.choices?.[0]?.delta;
  if (!delta) return { tour, aDiffuser: "" };

  const aDiffuser = delta.content ?? "";
  for (const fragment of delta.tool_calls ?? []) recoller(tour.outils, fragment);
  return { tour: { texte: tour.texte + aDiffuser, outils: tour.outils }, aDiffuser };
}

/** La trame SSE d un morceau de texte renvoye au client. */
export function trame(contenu: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: contenu } }] })}\n\n`;
}
