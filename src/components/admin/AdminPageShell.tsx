import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SECTIONS_ADMIN } from "@/components/admin/sections";
import "@/styles/admin.css";

/**
 * LA COQUE DE L'ADMINISTRATION.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CHANGE
 *
 * — LE FIL D'ARIANE ÉTAIT UNE RANGÉE DE SEPT LIENS de onze pixels,
 *   séparés par des points médians, à quarante pour cent d'opacité.
 *   On ne savait pas où l'on était, et on visait mal ce qu'on
 *   voulait. C'est devenu un rail d'onglets, dans le langage que la
 *   boîte de réception et les statistiques emploient déjà.
 *
 * — CHAQUE ÉCRAN POSAIT SON PROPRE FOND : un halo de 800 px en
 *   « position: fixed » derrière chacun des sept, plus « min-h-screen »
 *   à l'intérieur d'une mise en page qui a déjà sa hauteur.
 *
 * — LE TITRE ET LE SOUS-TITRE ÉTAIENT EN ANGLAIS, dans une
 *   application française.
 *
 * — LA FLÈCHE « RETOUR » MENAIT AU CENTRE, que le rail atteint déjà
 *   en un clic. Elle disparaît : deux chemins pour le même endroit,
 *   dont l'un occupait le coin le plus précieux de la page.
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  titre: string;
  sous: string;
  icone: React.ReactNode;
  /** Compteurs par section, affichés dans le rail quand ils existent. */
  compteurs?: Partial<Record<string, number>>;
  /** Placé à droite du titre : le geste principal de l'écran. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageShell({ titre, sous, icone, compteurs, action, children }: Props) {
  const chemin = useLocation().pathname;

  return (
    <div className="ad page-px">
      <nav className="ad-rail" aria-label="Sections de l'administration">
        {SECTIONS_ADMIN.map((s) => {
          const Icone = s.icone;
          const actif = chemin === s.href;
          const n = compteurs?.[s.cle];
          return (
            <Link
              key={s.cle}
              to={s.href}
              className="ad-onglet"
              data-actif={actif}
              aria-current={actif ? "page" : undefined}
            >
              <Icone aria-hidden="true" />
              {s.libelle}
              {typeof n === "number" && n > 0 && <i>{n}</i>}
            </Link>
          );
        })}
      </nav>

      <header className="ad-tete">
        <div className="ad-tete-gauche">
          <span className="ad-tete-icone">{icone}</span>
          <div style={{ minWidth: 0 }}>
            <h1 className="ad-titre">{titre}</h1>
            <p className="ad-sous">{sous}</p>
          </div>
        </div>
        {action}
      </header>

      {children}
    </div>
  );
}
