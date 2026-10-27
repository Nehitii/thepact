/**
 * Le nom de la touche de commande, selon la machine.
 *
 * ═══════════════════════════════════════════════════════════════
 * LA BARRE AFFICHAIT « ⌘ K » A TOUT LE MONDE.
 *
 * Le raccourci lui-meme etait juste — il ecoute `metaKey || ctrlKey`
 * depuis toujours. C est son ETIQUETTE qui mentait : sur Windows et
 * sous Linux, la touche pomme n existe pas, et le symbole ⌘ n est
 * meme pas garanti dans la police. Un raccourci qu on ne peut pas
 * lire est un raccourci qu on n utilise pas.
 *
 * `navigator.platform` est deprecie ; `userAgentData` n existe pas
 * partout. On lit le premier qui repond, et a defaut on suppose une
 * machine non-Apple : c est le cas le plus frequent, et « Ctrl » sur
 * un Mac se comprend mieux que « ⌘ » sur un PC.
 * ═══════════════════════════════════════════════════════════════
 */
export function estApple(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator as Navigator & { userAgentData?: { platform?: string } };
  const plateforme = ua.userAgentData?.platform ?? navigator.platform ?? "";
  if (plateforme) return /mac|iphone|ipad|ipod/i.test(plateforme);
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent ?? "");
}

/** « ⌘ » sur un Mac, « Ctrl » ailleurs. */
export function toucheCommande(): string {
  return estApple() ? "⌘" : "Ctrl";
}

/** L etiquette complete : « ⌘K » ou « Ctrl K ». */
export function raccourciPalette(): string {
  return estApple() ? "⌘K" : "Ctrl K";
}
