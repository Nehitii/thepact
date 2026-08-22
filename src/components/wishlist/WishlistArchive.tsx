import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Pencil, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { fr as dateFr } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/hooks/useWishlistPieces";

interface WishlistArchiveProps {
  items: PactWishlistItem[];
  currency: string;
  pieces?: Map<string, PieceDeLEtape>;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  onEdit: (item: PactWishlistItem) => void;
}

/**
 * LE PLI — l archive des acquisitions.
 *
 * Quarante-cinq articles sur soixante-dix sont acquis. Deployes en
 * grille de quatre colonnes, ils occupaient les deux tiers de la
 * page — et ce sont pourtant les seuls dont il n y a plus rien a
 * faire.
 *
 * Le pli annonce son compte et son montant sur une ligne. Il ne
 * s ouvre que si on le demande, et il s ouvre alors en LISTE : on ne
 * revient dans une archive que pour retrouver une chose ou defaire
 * une erreur, jamais pour la contempler.
 */
export function WishlistArchive({
  items, currency, pieces, onToggleAcquired, onEdit,
}: WishlistArchiveProps) {
  const { t, i18n } = useTranslation();
  const [ouvert, setOuvert] = useState(false);

  const { total, liste } = useMemo(() => {
    const liste = [...items].sort((a, b) => {
      const da = a.acquired_at ? new Date(a.acquired_at).getTime() : 0;
      const db = b.acquired_at ? new Date(b.acquired_at).getTime() : 0;
      return db - da;
    });
    return { total: items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0), liste };
  }, [items]);

  if (items.length === 0) return null;

  const locale = i18n.language?.startsWith("fr") ? dateFr : undefined;

  return (
    <section className="wl-pli" data-ouvert={ouvert ? "oui" : "non"}>
      <button
        type="button"
        className="wl-pli-poignee"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <span>{t("wishlist.archive.titre", "Archive des acquisitions")}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <b>{t("wishlist.archive.compte", "{{n}} articles · {{montant}}", {
            n: items.length,
            montant: formatCurrency(total, currency),
          })}</b>
          <ChevronDown aria-hidden="true" />
        </span>
      </button>

      {ouvert && (
        <div className="wl-pli-corps">
          <div className="wl-postes">
            {liste.map((item) => {
              const piece = item.source_goal_cost_id ? pieces?.get(item.source_goal_cost_id) : undefined;
              return (
                <div className="wl-poste" key={item.id} data-acquis="oui">
                  <span className="wl-poste-jeton" aria-hidden="true" />
                  <span className="wl-poste-nom">
                    {item.name}
                    <span className="wl-poste-source">
                      {item.goal?.name ?? item.category ?? t("wishlist.archive.libre", "hors pacte")}
                      {item.acquired_at
                        ? ` · ${format(new Date(item.acquired_at), "d MMM yyyy", { locale })}`
                        : ""}
                      {piece?.parLEtape ? ` · ${t("wishlist.etat.parEtape", "Étape faite")}` : ""}
                    </span>
                  </span>

                  <span className="wl-poste-prix">
                    {formatCurrency(Number(item.estimated_cost || 0), currency)}
                  </span>

                  <span className="wl-outils">
                    <button type="button" className="wl-outil" onClick={() => onEdit(item)}
                      title={t("common.edit", "Modifier")}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button type="button" className="wl-outil" onClick={() => onToggleAcquired(item.id, false)}
                      title={t("wishlist.archive.rendre", "Remettre dans la liste")}>
                      <Undo2 aria-hidden="true" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
