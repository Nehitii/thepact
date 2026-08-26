import { useState } from "react";
import { ReseauMia, type EtatMia } from "./ReseauMia";

/**
 * Le visage de M.I.A.
 *
 * ═══════════════════════════════════════════════════════════════
 * DIX-HUIT EXPRESSIONS, ET CHACUNE SA CHARGE.
 *
 * Une expression qu'on ne sait pas déclencher est une expression
 * morte : les dix-huit ont donc chacune leur condition, écrite dans
 * `humeurMia`. Aucune n'est là pour faire nombre.
 *
 * LE REPLI EST LE POINT IMPORTANT. Tant qu'un fichier manque, le
 * composant rend le sigle du réseau — la même marque, en abstrait. Rien
 * ne casse, rien ne clignote en cadre vide, et l'application entière
 * fonctionne avant que la première image n'existe. Le jour où les PNG
 * arrivent dans `public/mia/`, ils prennent la place sans qu'on touche
 * à une ligne.
 * ═══════════════════════════════════════════════════════════════
 */
export type ExpressionMia =
  /* ── l'anneau reste d'or ── */
  | "calme"
  | "neutre"
  | "joie"
  | "reflexion"
  | "surprise"
  | "contente"
  | "complice"
  | "lasse"
  | "genee"
  | "contrariee"
  | "severe"
  | "peine"
  | "soupir"
  /* ── l'anneau vire au rouge : c'est la phase du pacte, pas l'humeur ── */
  | "colere"
  | "triste-sourire"
  | "menacante"
  /* ── l'anneau s'éteint ── */
  | "abattue"
  | "eteinte";

/** Ce que le sigle montre quand l'image n'est pas là. */
const REPLI: Record<ExpressionMia, EtatMia> = {
  calme: "repos",
  neutre: "repos",
  joie: "reponse",
  reflexion: "travail",
  surprise: "reponse",
  contente: "reponse",
  complice: "reponse",
  lasse: "repos",
  genee: "repos",
  contrariee: "repos",
  severe: "repos",
  peine: "repos",
  soupir: "repos",
  colere: "travail",
  "triste-sourire": "repos",
  menacante: "travail",
  abattue: "repos",
  eteinte: "repos",
};

/* Les fichiers absents sont retenus au niveau du module : sans ça,
   chaque bulle d'une conversation retenterait le même 404. */
const manquants = new Set<string>();

interface VisageMiaProps {
  expression: ExpressionMia;
  /** Côté du carré, en pixels. */
  taille?: number;
  className?: string;
  /** Décrit l'expression aux lecteurs d'écran. Vide par défaut : dans une
   *  conversation, le visage double ce que le texte dit déjà. */
  alt?: string;
}

export function VisageMia({ expression, taille = 34, className, alt = "" }: VisageMiaProps) {
  const fichier = `/mia/mia-${expression}.png`;
  const [absent, setAbsent] = useState(() => manquants.has(fichier));

  if (absent) {
    return <ReseauMia etat={REPLI[expression]} taille={Math.round(taille * 0.62)} className={className} />;
  }

  return (
    <img
      src={fichier}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={taille}
      height={taille}
      className={`mia-visage${className ? ` ${className}` : ""}`}
      style={{ width: taille, height: taille }}
      onError={() => {
        manquants.add(fichier);
        setAbsent(true);
      }}
      draggable={false}
    />
  );
}
