/* ═══════════════════════════════════════════════════════════════
   L'APPLICATION CHANGE DE NOM, PAS LES SOUVENIRS DU NAVIGATEUR

   Une vingtaine de réglages vivent dans `localStorage` sous le préfixe
   « vowpact. » ou « vowpact- » : quelle vue du calendrier, quel fond
   pour la concentration, quelle largeur pour M.I.A, la barre latérale
   repliée ou non — et, moins anodin, la SÉANCE DE CONCENTRATION EN
   COURS avec son minuteur, ainsi que le lien média collé à la main.

   Renommer les clés sans rien d'autre aurait tout remis à zéro : au
   premier lancement sous le nouveau nom, l'application aurait paru
   neuve — ce qui, pour quelqu'un qui l'utilise tous les jours depuis
   des mois, ressemble à une perte de données. C'en est une.

   CETTE FONCTION DÉPLACE, ELLE N'EFFACE PAS. Chaque clé « vowpact… »
   est recopiée sous « overwrite… », puis l'ancienne est retirée. Une
   clé déjà présente sous le nouveau nom gagne : on ne réécrit jamais
   par-dessus un réglage plus récent.

   ═══ POURQUOI UN PRÉFIXE ICI, ALORS QU'AILLEURS ON S'EN GARDE ═══

   `preferencesAffichage.ts` refuse explicitement de balayer par
   préfixe, et il a raison : effacer « tout ce qui commence par
   vowpact. » emporterait la séance en cours et les brouillons.

   Renommer n'est pas effacer. Ici le préfixe est le bon outil,
   justement parce qu'il n'oublie rien : la séance en cours et le lien
   collé DOIVENT suivre. Une liste explicite en manquerait un, et ce
   qu'elle manquerait serait perdu sans bruit.

   ═══ QUAND CECI POURRA PARTIR ═══

   Cette fonction ne sert qu'une fois par navigateur. Elle peut être
   retirée le jour où plus personne n'ouvrira l'application depuis un
   appareil qui l'a connue sous l'ancien nom — en pratique, quand vous
   jugerez que tout le monde est passé. Elle coûte une lecture de
   `localStorage` au démarrage, rien de plus.
   ═══════════════════════════════════════════════════════════════ */

const ANCIEN = "vowpact";
const NOUVEAU = "overwrite";

let dejaFait = false;

/**
 * Déplace les réglages locaux de l'ancien nom vers le nouveau.
 *
 * Renvoie le nombre de clés déplacées — zéro au deuxième lancement, et
 * pour toujours ensuite.
 */
export function renommerLesClesLocales(): number {
  /* Deux appelants — l'import en tête de `main.tsx` et celui de
     `preferencesAffichage.ts` — pour que l'ordre des imports ne puisse
     pas faire rater le déplacement. Le second appel ne fait rien. */
  if (dejaFait) return 0;
  dejaFait = true;

  let deplacees = 0;

  try {
    /* On relève les clés AVANT de toucher au stockage : `localStorage`
       se réindexe à chaque suppression, et parcourir en supprimant
       saute une entrée sur deux. */
    const aDeplacer: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (cle && (cle.startsWith(`${ANCIEN}.`) || cle.startsWith(`${ANCIEN}-`))) {
        aDeplacer.push(cle);
      }
    }

    for (const ancienne of aDeplacer) {
      const nouvelle = NOUVEAU + ancienne.slice(ANCIEN.length);
      try {
        const valeur = localStorage.getItem(ancienne);
        /* Un réglage déjà posé sous le nouveau nom est plus récent que
           celui d'avant le changement : il ne se fait pas écraser. */
        if (valeur !== null && localStorage.getItem(nouvelle) === null) {
          localStorage.setItem(nouvelle, valeur);
        }
        localStorage.removeItem(ancienne);
        deplacees++;
      } catch {
        /* Quota plein sur une clé : on laisse l'ancienne en place
           plutôt que de la perdre, et on passe à la suivante. */
      }
    }
  } catch {
    /* Navigation privée, stockage refusé : l'application démarre avec
       ses valeurs par défaut, ce qu'elle sait déjà faire. */
  }

  return deplacees;
}

/* L'IMPORT LUI-MÊME DÉPLACE. Voir la tête de `main.tsx` : un module ES
   est évalué avant la première ligne du fichier qui l'importe, et c'est
   exactement la garantie qu'il faut ici. */
renommerLesClesLocales();
