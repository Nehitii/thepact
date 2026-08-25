import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr as dateFr } from "date-fns/locale";
import { Check, ExternalLink, Pencil, Trash2, Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/hooks/useWishlistPieces";

/* ═══════════════════════════════════════════════════════════════
   UNE LIGNE DE REGISTRE

   L archive en avait une, dessinée pour elle : tranche colorée sur
   le flanc, nom, provenance, prix, outils. Sa feuille de style
   disait déjà l essentiel — « cinquante-quatre lignes se lisent
   d un balayage, sans lire un seul mot ».

   La liste active, elle, n avait que la vitrine. Quatre-vingt-trois
   articles en tuiles à photo font VINGT-NEUF ÉCRANS, dont 86 % de
   surface d image : on ne voit plus la liste, on la traverse.

   La même ligne sert donc les deux. Ce n était pas un composant, ce
   sera un composant — sinon le mode registre aurait recopié la
   ligne de l archive, et les deux auraient divergé comme les
   catégories et les natures avant elles.
   ═══════════════════════════════════════════════════════════════ */

interface WishlistPosteProps {
  item: PactWishlistItem;
  currency: string;
  piece?: PieceDeLEtape;
  /**
   * `archive` : l article est acquis — jeton vert, date d acquisition,
   * et l on peut le remettre dans la liste.
   * `actif` : il reste dû — tranche rouge, et les gestes de la vitrine.
   */
  variante: "actif" | "archive";
  onEdit: (item: PactWishlistItem) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  onDelete?: (id: string) => void;
}

export function WishlistPoste({
  item, currency, piece, variante, onEdit, onToggleAcquired, onDelete,
}: WishlistPosteProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language?.startsWith("fr") ? dateFr : undefined;

  const archive = variante === "archive";
  const duPacte = Boolean(item.source_goal_cost_id);

  /* La provenance : l objectif s il y en a un, la catégorie sinon,
     et « hors pacte » quand l article ne pèse sur rien. */
  const provenance = item.goal?.name ?? item.category ?? t("wishlist.archive.libre", "hors pacte");

  return (
    <div className="wl-poste" data-acquis={archive ? "oui" : "non"}>
      <span className="wl-poste-jeton" aria-hidden="true" />

      <span className="wl-poste-nom">
        {item.name}
        <span className="wl-poste-source">
          {duPacte && item.goal ? (
            /* L objectif est cliquable ici aussi : c est la seule
               chose de la tuile qui menait ailleurs. */
            <button
              type="button"
              className="wl-poste-lien"
              onClick={() => navigate(`/goals/${item.goal?.id}`)}
              title={t("wishlist.fiche.ouvrirObjectif", "Ouvrir l’objectif")}
            >
              {provenance}
            </button>
          ) : (
            provenance
          )}
          {piece?.etapeRang != null && ` · ${t("wishlist.fiche.etape", "étape")} ${piece.etapeRang}`}
          {archive && item.acquired_at
            ? ` · ${format(new Date(item.acquired_at), "d MMM yyyy", { locale })}`
            : ""}
          {archive && piece?.parLEtape ? ` · ${t("wishlist.etat.parEtape", "Étape faite")}` : ""}
        </span>
      </span>

      <span className="wl-poste-prix">
        {formatCurrency(Number(item.estimated_cost || 0), currency)}
      </span>

      <span className="wl-outils">
        {!archive && item.url && (
          <a
            className="wl-outil"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={t("wishlist.fiche.ouvrirLien", "Ouvrir le lien")}
          >
            <ExternalLink aria-hidden="true" />
            <span className="sr-only">{t("wishlist.fiche.ouvrirLien", "Ouvrir le lien")}</span>
          </a>
        )}

        <button
          type="button"
          className="wl-outil"
          onClick={() => onEdit(item)}
          title={t("common.edit", "Modifier")}
        >
          <Pencil aria-hidden="true" />
          <span className="sr-only">{t("common.edit", "Modifier")}</span>
        </button>

        <button
          type="button"
          className="wl-outil"
          onClick={() => onToggleAcquired(item.id, !archive)}
          title={archive
            ? t("wishlist.archive.rendre", "Remettre dans la liste")
            : t("wishlist.fiche.marquerPaye", "Marquer comme payé")}
        >
          {archive ? <Undo2 aria-hidden="true" /> : <Check aria-hidden="true" />}
          <span className="sr-only">
            {archive
              ? t("wishlist.archive.rendre", "Remettre dans la liste")
              : t("wishlist.fiche.marquerPaye", "Marquer comme payé")}
          </span>
        </button>

        {/* Supprimer ne s offre que sur un article libre : une pièce
            du pacte appartient à son objectif, et la retirer d ici
            laisserait le coût sans ligne. */}
        {!archive && onDelete && !duPacte && (
          <button
            type="button"
            className="wl-outil wl-outil--danger"
            onClick={() => onDelete(item.id)}
            title={t("common.delete", "Supprimer")}
          >
            <Trash2 aria-hidden="true" />
            <span className="sr-only">{t("common.delete", "Supprimer")}</span>
          </button>
        )}
      </span>
    </div>
  );
}
