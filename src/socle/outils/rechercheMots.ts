/**
 * Comparer un mot tapé à un libellé, sans accent et sans ponctuation.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE CODE VIVAIT DANS CommandPalette.tsx. La barre latérale a
 * désormais sa propre recherche, et deux comparateurs pour un même
 * geste finiraient par diverger — l'un accepterait « objectif », pas
 * l'autre. Un seul endroit, deux appelants.
 *
 * LE FILTRE PAR DÉFAUT DE cmdk EST UNE SOUS-SÉQUENCE : « mia »
 * répondait « Calendrier calendar agenda MoIs plAnning ». On aplatit
 * donc en supprimant la ponctuation SANS insérer d'espace — « M.I.A »
 * devient « mia », et non « m i a » — puis on exige que CHAQUE mot
 * tapé se retrouve. Une entrée à qui il manque un mot n'est pas une
 * entrée moins bonne : ce n'est pas une réponse.
 * ═══════════════════════════════════════════════════════════════
 */
export function plat(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’-]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Rend 0 si l'entrée ne répond pas, sinon un score dans ]0, 1].
 * Un mot trouvé en tête vaut mieux qu'un mot trouvé au fond des
 * synonymes : c'est ce qui fait remonter le nom avant les mots-clés.
 */
export function classer(valeur: string, recherche: string): number {
  const q = plat(recherche);
  if (!q) return 1;
  const v = plat(valeur);
  const mots = q.split(" ").filter(Boolean);
  let score = 0;
  for (const m of mots) {
    const i = v.indexOf(m);
    if (i < 0) return 0;
    const debutDeMot = i === 0 || v[i - 1] === " ";
    score += (debutDeMot ? 1 : 0.6) / mots.length;
  }
  return Math.max(0.01, score);
}
