import { useEffect, useState } from "react";
import { boiteOpaque, type BoiteOpaque } from "@/domaines/accueil/logique/cadrage";

/* OU EST LE DESSIN DANS L IMAGE.
 *
 * On lit l image dans un petit canevas — 192 px au plus sur son grand
 * cote, assez pour trouver ses bords au demi-pourcent pres — et on en
 * tire la boite opaque. Le resultat est retenu par adresse : un embleme
 * ne se relit pas a chaque rendu du tableau de bord.
 *
 * UNE IMAGE D UN AUTRE SITE PEUT REFUSER D ETRE LUE. Le depot des
 * emblemes est public et repond aux lectures croisees ; une adresse
 * collee a la main, peut-etre pas. Le canevas est alors « souille » et
 * la lecture leve une erreur : on rend `null`, et l image est posee
 * entiere, sans cadrage — plus petite, jamais cassee. */

export interface CadreDeLImage {
  boite: BoiteOpaque;
  largeur: number;
  hauteur: number;
}

const DEJA_LUES = new Map<string, CadreDeLImage | null>();
const COTE_DE_LECTURE = 192;

function lire(src: string): Promise<CadreDeLImage | null> {
  return new Promise((resoudre) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      /* Un SVG sans largeur ni hauteur declarees n a pas de taille
         naturelle fiable : on le lit carre. */
      const largeur = img.naturalWidth || COTE_DE_LECTURE;
      const hauteur = img.naturalHeight || COTE_DE_LECTURE;
      const k = Math.min(1, COTE_DE_LECTURE / Math.max(largeur, hauteur));
      const l = Math.max(1, Math.round(largeur * k));
      const h = Math.max(1, Math.round(hauteur * k));
      try {
        const toile = document.createElement("canvas");
        toile.width = l;
        toile.height = h;
        const ctx = toile.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resoudre(null);
        ctx.drawImage(img, 0, 0, l, h);
        const boite = boiteOpaque(ctx.getImageData(0, 0, l, h).data, l, h);
        resoudre(boite ? { boite, largeur, hauteur } : null);
      } catch {
        resoudre(null);
      }
    };
    img.onerror = () => resoudre(null);
    img.src = src;
  });
}

/** Le cadre du dessin d une image, ou `null` tant qu on ne le connait pas. */
export function useCadrageDeLImage(src: string | null | undefined): CadreDeLImage | null {
  const [cadre, setCadre] = useState<CadreDeLImage | null>(() => (src && DEJA_LUES.get(src)) || null);

  useEffect(() => {
    if (!src) {
      setCadre(null);
      return;
    }
    if (DEJA_LUES.has(src)) {
      setCadre(DEJA_LUES.get(src) ?? null);
      return;
    }
    let vivant = true;
    lire(src).then((resultat) => {
      DEJA_LUES.set(src, resultat);
      if (vivant) setCadre(resultat);
    });
    return () => {
      vivant = false;
    };
  }, [src]);

  return cadre;
}
