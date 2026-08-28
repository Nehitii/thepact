import type { ExpressionMia } from "@/domaines/mia/logique/visages";
export type { ExpressionMia };
import { useState } from "react";
import { ReseauMia, type EtatMia } from "./ReseauMia";
import { cadrerLeVisage } from "@/domaines/mia/logique/cadrage";

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
  /**
   * `buste` montre la vignette entière : le manteau, les mains, l'anneau.
   * `visage` recadre sur la tête — indispensable dès qu'on descend sous
   * la cinquantaine de pixels, où un buste entier ne montre plus rien.
   */
  cadre?: "buste" | "visage";
}

export function VisageMia({
  expression,
  taille = 34,
  className,
  alt = "",
  cadre = "buste",
}: VisageMiaProps) {
  const fichier = `/mia/mia-${expression}.png`;
  const [absent, setAbsent] = useState(() => manquants.has(fichier));

  if (absent) {
    return <ReseauMia etat={REPLI[expression]} taille={Math.round(taille * 0.62)} className={className} />;
  }

  const echec = () => {
    manquants.add(fichier);
    setAbsent(true);
  };

  /* Le recadrage a besoin d'une fenêtre : l'image déborde, et c'est le
     parent qui la coupe. Un simple object-position ne suffirait pas —
     l'agrandissement varie d'une expression à l'autre. */
  if (cadre === "visage") {
    return (
      <span
        className={`mia-portrait${className ? ` ${className}` : ""}`}
        style={{ width: taille, height: taille }}
      >
        <img
          src={fichier}
          alt={alt}
          aria-hidden={alt ? undefined : true}
          className="mia-visage"
          style={cadrerLeVisage(expression)}
          onError={echec}
          draggable={false}
        />
      </span>
    );
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
      onError={echec}
      draggable={false}
    />
  );
}
