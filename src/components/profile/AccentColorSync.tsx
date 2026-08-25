import { useEffect, useState } from "react";
import { useProfileSettings } from "@/hooks/useProfileSettings";

/**
 * Porte l'accent choisi et la taille de police sur :root.
 * À monter une fois, dans AppProviders.
 *
 * ═══════════════════════════════════════════════════════════════
 * L'ACCENT DOIT S'ADAPTER AU THÈME, PAS SEULEMENT ÊTRE POSÉ.
 *
 * Il était injecté tel quel, en style INLINE — ce qui bat `:root`
 * comme `.dark`. La couleur choisie portait donc sa luminosité
 * d'origine dans les deux thèmes.
 *
 * Un accent à 60 % de luminosité se lit sur du quasi-noir et disparaît
 * sur du blanc : le cyan par défaut (200 100% 67%) tombe à 1,8:1 en
 * thème clair. Comme l'injection est inline, aucune feuille de style
 * ne pouvait corriger ça — c'est pour cette raison que le thème clair
 * restait cassé même après avoir donné au bloc `:root` sa propre
 * palette.
 *
 * Ici la TEINTE et la SATURATION ne bougent pas : la couleur reste
 * reconnaissable. Seule la luminosité est bornée — vers le haut en
 * sombre, vers le bas en clair.
 * ═══════════════════════════════════════════════════════════════
 */

/** Sous ce seuil, l'encre posée SUR l'accent doit être blanche. */
const SEUIL_ENCRE_BLANCHE = 52;

/** En sombre, l'accent ne descend pas sous ce plancher. */
const PLANCHER_SOMBRE = 52;
/** En clair, il ne monte pas au-dessus de ce plafond. */
const PLAFOND_CLAIR = 34;

export function AccentColorSync() {
  const { profile } = useProfileSettings();
  const [sombre, setSombre] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  /* Le theme peut changer sans que le profil bouge : il faut le suivre,
     sinon l accent garde la luminosite de l ancien theme jusqu au
     prochain rechargement. */
  useEffect(() => {
    const cible = document.documentElement;
    const suivre = () => setSombre(cible.classList.contains("dark"));
    suivre();
    const observateur = new MutationObserver(suivre);
    observateur.observe(cible, { attributes: true, attributeFilter: ["class"] });
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const racine = document.documentElement;

    /* Le repli precedent passait la chaine "hsl(var(--ds-accent-primary))"
       a hexEnTSL, dont la regex n accepte qu un hexadecimal a six
       chiffres : il renvoyait toujours null. Sans accent choisi on ne
       pose rien, et les feuilles gardent leur valeur. */
    const tsl = profile.accent_color ? hexEnTSL(profile.accent_color) : null;
    if (tsl) {
      const l = sombre
        ? Math.max(tsl.l, PLANCHER_SOMBRE)
        : Math.min(tsl.l, PLAFOND_CLAIR);
      const accent = `${tsl.h} ${tsl.s}% ${l}%`;

      racine.style.setProperty("--primary", accent);
      /* L encre posee SUR l accent suit sa clarte : blanche sur un
         accent profond, presque noire sur un accent lumineux. Sans
         quoi un bouton « Enregistrer » devient illisible des que la
         couleur choisie change de camp. */
      racine.style.setProperty(
        "--primary-foreground",
        l < SEUIL_ENCRE_BLANCHE ? "0 0% 100%" : "210 100% 5%",
      );

      /* design-tokens.css ligne 56 : les lueurs, separateurs et
         degrades lisent --ds-current-accent et retombent sur
         --ds-accent-primary. Cette variable n etait jamais posee, donc
         ces elements restaient cyan pendant que les boutons prenaient
         la couleur du profil — deux accents a l ecran. */
      racine.style.setProperty("--ds-current-accent", accent);
      /* La Singularite compose ses couches en hsl() et a besoin de la
         teinte seule, pas du triplet. */
      racine.style.setProperty("--ds-accent-hue", String(tsl.h));
    }

    const taille = profile.font_size || 16;
    racine.style.fontSize = `${taille}px`;

    return () => {
      racine.style.removeProperty("--primary");
      racine.style.removeProperty("--primary-foreground");
      racine.style.removeProperty("--ds-current-accent");
      racine.style.fontSize = "";
    };
  }, [profile, sombre]);

  return null;
}

/** « #ef4343 » → { h: 0, s: 84, l: 60 }. Null si ce n'est pas un hexa à six chiffres. */
function hexEnTSL(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;

  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
