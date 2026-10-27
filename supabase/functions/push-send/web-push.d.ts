/**
 * CE QU'ON UTILISE DE `web-push`, ET RIEN DE PLUS.
 *
 * Le paquet servi par esm.sh expose bien un export par défaut à
 * l'exécution, mais ses types publiés (`@types/web-push`) sont écrits en
 * `export =` : Deno refuse alors l'import par défaut, et `deno check`
 * échouait sur ce fichier — donc plus personne ne le vérifiait du tout.
 *
 * Deux fonctions sont appelées ici. Les déclarer, c'est retrouver le
 * contrôle sur le reste du fichier sans toucher à ce qui tourne.
 */

interface AbonnementPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

declare const webpush: {
  setVapidDetails(sujet: string, clePublique: string, clePrivee: string): void;
  sendNotification(abonnement: AbonnementPush, charge: string): Promise<unknown>;
};

export default webpush;
