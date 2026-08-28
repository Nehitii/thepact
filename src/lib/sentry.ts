/* ═══════════════════════════════════════════════════════════════
   SENTRY, SANS LE FAIRE ENTRER DANS LE PREMIER CHARGEMENT

   `main.tsx` importe Sentry DYNAMIQUEMENT, avec un commentaire qui dit
   pourquoi : « pour garder @sentry/react hors du paquet principal ».
   L'intention était bonne et le résultat nul — deux fichiers
   l'importaient statiquement, ce qui suffit à le ramener dans le
   graphe de démarrage.

   MESURÉ AVANT CETTE CORRECTION : sentry-vendor pesait 158 845 octets
   compressés sur un chemin critique de 608 Ko, soit 26 %. Un quart du
   premier chargement pour du suivi d'erreurs qui ne sert qu'après.

   ═══ CE QUE CE MODULE FAIT ═══

   Il expose les deux seules choses dont l'application a besoin —
   `setUser` et `captureException` — sans importer Sentry. Tant que
   Sentry n'est pas chargé, les appels sont mis en file. `attacher`,
   appelée par main.tsx une fois l'import dynamique résolu, rejoue la
   file puis branche les appels suivants en direct.

   LA FILE A UNE BORNE. Sans elle, une erreur en boucle avant le
   chargement de Sentry ferait grossir un tableau que personne ne vide
   — on remplacerait une lenteur au démarrage par une fuite de mémoire.
   Vingt appels suffisent largement : au-delà, la panne n'est plus dans
   le détail des événements.
   ═══════════════════════════════════════════════════════════════ */

type Utilisateur = { id: string } | null;

type Cible = {
  setUser: (u: Utilisateur) => void;
  captureException: (e: unknown, contexte?: Record<string, unknown>) => void;
};

const FILE_MAX = 20;

let cible: Cible | null = null;
const file: (() => void)[] = [];

function differer(appel: () => void) {
  if (cible) {
    appel();
    return;
  }
  if (file.length < FILE_MAX) file.push(appel);
}

/** Branche l'instance réelle et rejoue ce qui a été mis de côté. */
export function attacher(instance: Cible): void {
  cible = instance;
  const enAttente = file.splice(0, file.length);
  for (const appel of enAttente) {
    try {
      appel();
    } catch {
      /* Un rapport d'erreur qui échoue ne doit pas casser l'application. */
    }
  }
}

export function setUser(u: Utilisateur): void {
  differer(() => cible?.setUser(u));
}

export function captureException(e: unknown, contexte?: Record<string, unknown>): void {
  differer(() => cible?.captureException(e, contexte));
}

/** Pour les tests : remet le module dans son état de départ. */
export function _reinitialiser(): void {
  cible = null;
  file.length = 0;
}

/** Pour les tests : combien d'appels attendent encore. */
export function _enAttente(): number {
  return file.length;
}
