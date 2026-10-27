import { useEffect, useState, type CSSProperties } from "react";
import { familleDeLaPolice, styleDeLEffet } from "@/domaines/objectifs";
import { teinteDuPacte } from "@/socle/ds/fonds/catalogue";
import { selonTheme } from "@/socle/outils/encrePapier";
import { dateCivileDepuisTexte } from "@/socle/outils/jour";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import type { MesureProgression, ProprietesDuBandeau } from "@/domaines/accueil/types";

/* CE QUE LES SIX VARIANTES DU BANDEAU LISENT DE LA MEME FACON.
 *
 * Chacune recoit EXACTEMENT les proprietes du bandeau actuel — plus
 * trois colonnes du pacte qu il n affiche pas — et peut donc le
 * remplacer sans que la page change une ligne. Ce fichier lit ces
 * proprietes une fois, de la meme facon pour toutes : la meme police,
 * le meme effet, la meme teinte, la meme regle d elan. Sans lui,
 * chaque variante aurait sa propre idee de ce qu est « le nom du
 * pacte », et elles divergeraient comme les deux tables de polices
 * avaient diverge.
 *
 * Les deux composants partages vivent a cote, dans « communs.tsx » :
 * un fichier qui exporte des composants n exporte qu eux, sans quoi le
 * rechargement a chaud recharge toute la page. */

export interface Lecture {
  sombre: boolean;
  nom: string;
  mantra: string;
  famille: string;
  effet: string;
  /** L effet choisi, rendu pour le theme courant. */
  styleEffet: CSSProperties;
  /** La teinte du pacte, en neon. */
  teinte: string;
  /** La meme, ramenee a une encre lisible sur le theme courant. */
  encre: string;
  /** De 0 a 100, arrondie. */
  progression: number;
  /** La meme, de 0 a 1. */
  part: number;
  /** Le rythme des chantiers ouverts, de 0 a 1 : cinq font le plein. */
  elan: number;
  valeurs: readonly string[];
  jureLe?: Date;
  terme?: Date;
  mesure: MesureProgression;
  /** « objectifs atteints » ou « étapes franchies ». */
  mesureLue: string;
  /** Ce que fait la bascule, pour l info-bulle. */
  basculeLue: string;
}

export function useLectureDuBandeau(p: ProprietesDuBandeau): Lecture {
  const sombre = useThemeSombre();
  const teinte = teinteDuPacte(p.teinte);
  const progression = Math.round(Math.min(100, Math.max(0, p.progression)));
  const mesure = p.mesure ?? "goals";
  return {
    sombre,
    nom: p.pactName?.trim() || "Nexus OS",
    mantra: p.pactMantra?.trim() || "",
    famille: familleDeLaPolice(p.titleFont),
    effet: p.titleEffect ?? "none",
    styleEffet: styleDeLEffet(p.titleEffect, sombre),
    teinte,
    encre: selonTheme(teinte, sombre),
    progression,
    part: progression / 100,
    elan: Math.min(1, (p.enCours ?? 0) / 5),
    valeurs: (p.valeurs ?? []).filter(Boolean),
    jureLe: dateCivileDepuisTexte(p.jureLe),
    terme: dateCivileDepuisTexte(p.terme),
    mesure,
    mesureLue: mesure === "steps" ? "étapes franchies" : "objectifs atteints",
    basculeLue: mesure === "steps"
      ? "Compter les objectifs atteints à la place"
      : "Compter les étapes franchies à la place",
  };
}

/* LE GAZ DU TUBE DE L ENSEIGNE, selon l effet choisi : halo cyan, feu,
   violet ou dore donnent la couleur ; sans effet, c est la teinte du
   pacte. L enseigne et la planche des interrupteurs le lisent ici. */
const TUBES: Readonly<Record<string, string>> = {
  "cyan-glow": "#19d8ff",
  "fire-glow": "#ff5a1f",
  "purple-glow": "#b862ff",
  "gold-glow": "#ffc23a",
};
export const gazDuTube = (effet: string, teinte: string): string => TUBES[effet] ?? teinte;

/** 3200 → « 3 200 », avec l espace fine insecable du francais. */
export const nombre = (n: number): string => Math.round(n).toLocaleString("fr-FR");

/** « 24 juin 2026 », et « 1er juin » comme on l ecrit. */
export function datePleine(d: Date): string {
  const texte = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return d.getDate() === 1 ? texte.replace(/^1 /, "1er ") : texte;
}

/** « 24/06/2026 », la date d un document. */
export const dateNumerique = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Vrai une fraction de seconde apres le montage.
 *
 * Les entrees des variantes sont des TRANSITIONS, pas des animations :
 * elles partent d un etat initial et vont a la valeur. Il faut donc un
 * premier rendu dans l etat initial. Un minuteur et non une image
 * d animation : volet masque, « requestAnimationFrame » ne tourne plus
 * et la carte resterait vide.
 */
export function useApparition(): boolean {
  const [pret, setPret] = useState(false);
  useEffect(() => {
    const minuteur = window.setTimeout(() => setPret(true), 40);
    return () => window.clearTimeout(minuteur);
  }, []);
  return pret;
}
