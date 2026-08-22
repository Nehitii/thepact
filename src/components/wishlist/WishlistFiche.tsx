import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, Pencil, Target, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/hooks/useWishlistPieces";

interface WishlistFicheProps {
  item: PactWishlistItem;
  currency: string;
  piece?: PieceDeLEtape;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

/**
 * UNE FICHE.
 *
 * L ancienne carte reservait cent quatre-vingt-douze pixels a une
 * image, qu il y en ait une ou non. Cinquante-cinq articles sur
 * soixante-dix n en ont pas — leur source, goal_cost_items, n a
 * meme pas de colonne pour ca. La page etait donc surtout faite de
 * vide, et c est ce vide qu on lit comme « les images ont saute ».
 * Ici la vignette n existe que s il y a une image.
 *
 * Elle portait aussi un bandeau de priorite dont la couleur etait
 * calculee : colorClass.replace('text-','bg-').replace('400','500/60').
 * Tailwind ne genere que les classes qu il LIT dans le source ;
 * verifie dans la feuille produite, bg-cyan-500/60, bg-amber-500/60,
 * bg-orange-500/60 et bg-fuchsia-500/60 n existent pas. Ce bandeau
 * n a jamais rien affiche. Les couleurs passent ici par des jetons
 * CSS, que rien ne peut escamoter.
 */
export function WishlistFiche({
  item, currency, piece, onEdit, onDelete, onToggleAcquired,
}: WishlistFicheProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [enVol, setEnVol] = useState(false);

  const duPacte = Boolean(item.source_goal_cost_id);
  const acquis = item.acquired;

  /* La synchronisation ecrivait « Source: <objectif> » dans les notes
     de chaque piece : soixante-neuf articles sur soixante-dix n
     avaient que ca, et la carte affichait donc le nom de l objectif
     deux fois de suite, dont une en anglais. On ne montre la note que
     si elle dit autre chose que la ligne au-dessus. */
  const noteUtile = item.notes && item.notes.trim() !== `Source: ${item.goal?.name ?? ""}`
    ? item.notes
    : null;

  /* La coche est le geste le plus frequent de la page : elle ecrit
     tout de suite. L ancienne carte attendait huit cents
     millisecondes d animation avant d appeler la base — le temps de
     changer d avis, de recliquer, et d envoyer deux ecritures. */
  const basculer = useCallback(() => {
    if (enVol) return;
    setEnVol(true);
    onToggleAcquired(item.id, !acquis);
    window.setTimeout(() => setEnVol(false), 400);
  }, [enVol, acquis, item.id, onToggleAcquired]);

  return (
    <article
      className="wl-fiche"
      data-veine={duPacte ? "pacte" : "libre"}
      data-acquis={acquis ? "oui" : "non"}
    >
      {item.image_url && (
        <div className="wl-vignette">
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              /* Une image morte laisse un cadre gris qu on prend pour
                 un bug. On retire la vignette entiere. */
              (e.currentTarget.parentElement as HTMLElement | null)?.remove();
            }}
          />
        </div>
      )}

      <div className="wl-fiche-corps">
        <h3 className="wl-fiche-nom">{item.name}</h3>

        {duPacte && item.goal ? (
          <button
            type="button"
            className="wl-fiche-source"
            onClick={() => navigate(`/goals/${item.goal?.id}`)}
            title={t("wishlist.fiche.ouvrirObjectif", "Ouvrir l’objectif")}
          >
            <Target aria-hidden="true" />
            <span>{item.goal.name}</span>
            {piece?.etapeRang != null && <span>· {t("wishlist.fiche.etape", "étape")} {piece.etapeRang}</span>}
          </button>
        ) : item.category ? (
          <span className="wl-fiche-source">{item.category}</span>
        ) : null}

        {noteUtile && <p className="wl-fiche-note">{noteUtile}</p>}

        <div className="wl-fiche-pied">
          <span className="wl-fiche-prix">
            {formatCurrency(Number(item.estimated_cost || 0), currency)}
          </span>

          <div className="wl-fiche-gestes">
            {/* L etat dit d ou vient la coche : une piece marquee par
                la validation de son etape n a pas ete cochee a la main. */}
            {acquis && (
              <span className="wl-etat" data-etat={piece?.parLEtape ? "etape" : "paye"}>
                {piece?.parLEtape
                  ? t("wishlist.etat.parEtape", "Étape faite")
                  : t("wishlist.etat.paye", "Payé")}
              </span>
            )}

            <div className="wl-outils">
              {item.url && (
                <a
                  className="wl-outil"
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("wishlist.fiche.voirEnLigne", "Voir en ligne")}
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                className="wl-outil"
                onClick={() => onEdit(item)}
                title={t("common.edit", "Modifier")}
              >
                <Pencil aria-hidden="true" />
              </button>
              <button
                type="button"
                className="wl-outil wl-outil--danger"
                onClick={() => onDelete(item.id)}
                title={t("common.delete", "Supprimer")}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              className="wl-coche"
              aria-pressed={acquis}
              onClick={basculer}
              title={acquis
                ? t("wishlist.fiche.remettre", "Remettre dans la liste")
                : t("wishlist.fiche.marquerPaye", "Marquer payé")}
            >
              <Check aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
