/* LES TROIS BRIQUES DE L ANALYTIQUE : le panneau, le releve, le
 * compteur.
 *
 * Elles vivaient en tete de `pages/Analytics.tsx`, qui faisait 930
 * lignes. Elles en sortent telles quelles.
 *
 * `data-panneau` n est pas decoratif : c est lui que lit le sommaire de
 * la barre. Un panneau ajoute y apparait sans qu on touche a rien —
 * raison de plus pour que le panneau soit UN composant, a un endroit.
 */
import { type ReactNode } from "react";
import { ACCENT } from "@/domaines/analytique/logique/couleurs";

/* L'ancre d'un panneau se déduit de son titre : rien à tenir à jour, et
   deux panneaux ne peuvent pas se disputer la même. */
const ancre = (titre: string) =>
  "ana-" + titre.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Panneau, dans le langage exact du tableau de bord : fond opaque,
 *  bord cyan, coins a 4px, aucun backdrop-filter.
 *
 *  « data-panneau » n'est pas décoratif : c'est lui que lit le sommaire
 *  de la barre. Un panneau ajouté y apparaît sans qu'on touche à rien. */
export function Panneau({
  titre, droite, children, vide, messageVide,
}: {
  titre: string;
  droite?: string;
  children?: React.ReactNode;
  vide?: boolean;
  messageVide?: string;
}) {
  return (
    <div className="cp-cadre">
      <section className="cp-fond ana-panneau" id={ancre(titre)} data-panneau={titre}>
        <span className="cp-equerre cp-equerre-hg" />
        <span className="cp-equerre cp-equerre-bd" />
        <header className="ana-panneau-tete">
          <h2 className="ana-panneau-titre ds-t-label">{titre}</h2>
          <span className="ana-panneau-fil" />
          {droite && <span className="ana-panneau-droite ds-t-label">{droite}</span>}
        </header>
        {vide
          ? <p className="ana-vide ds-t-label">{messageVide || "Aucune donnée"}</p>
          : children}
      </section>
    </div>
  );
}

/** Releve segmente : etiquette, barre en cellules, valeur — sur une ligne.
 *  Remplace les BarChart horizontaux, ou il fallait suivre une barre
 *  jusqu'a un axe pour lire un nombre qu'on peut simplement ecrire. */
export function Releve({ lignes, teinte = ACCENT, suffixe = "" }: {
  lignes: { nom: string; valeur: number }[];
  teinte?: string;
  suffixe?: string;
}) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <div className="cp-releve">
      {lignes.map((l) => (
        <div key={l.nom} className="cp-releve-ligne">
          <span className="cp-releve-nom" title={l.nom}>{l.nom}</span>
          <span className="cp-segments cp-releve-barre" style={{ ["--c" as string]: teinte }}>
            <i style={{ width: `${(l.valeur / max) * 100}%` }} />
          </span>
          <span className="cp-releve-val">{l.valeur}{suffixe}</span>
        </div>
      ))}
    </div>
  );
}

export function Compteur({ valeur, unite, libelle, teinte, pct }: {
  valeur: string | number; unite?: string; libelle: string; teinte: string; pct?: number;
}) {
  return (
    <div className="ana-compteur">
      {pct !== undefined && (
        <span
          className="ana-jauge"
          style={{
            ["--c" as string]: teinte,
            ["--p" as string]: `${Math.min(100, Math.max(0, pct))}%`,
          }}
        />
      )}
      <span className="ana-compteur-txt">
        <span
          className="ana-compteur-val font-orbitron"
          /* Le halo prend la teinte a trente pour cent : concatener « 55 »
             a une couleur ne marche que sur un hexadecimal. */
          style={{ color: teinte, textShadow: `0 0 14px color-mix(in srgb, ${teinte} 33%, transparent)` }}
        >
          {valeur}{unite && <i className="ana-compteur-unite">{unite}</i>}
        </span>
        <span className="ana-compteur-lib ds-t-label">{libelle}</span>
      </span>
    </div>
  );
}
