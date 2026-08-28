import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { WishlistPoste } from "@/domaines/souhaits/composants/WishlistPoste";
import type { PactWishlistItem } from "@/domaines/souhaits/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/domaines/souhaits/hooks/useWishlistPieces";

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
 *
 * IL S OUVRE, MAINTENANT. Quarante-six lignes apparaissaient d un
 * seul coup, sans transition : rien ne disait d ou elles venaient, et
 * le document sautait de plusieurs ecrans sous le curseur. Seul le
 * chevron tournait — le geste etait annonce, jamais joue.
 *
 * Et la ligne elle-meme est partie dans `WishlistPoste` : le mode
 * registre de la liste active en avait besoin, et la recopier aurait
 * fait diverger les deux, comme les categories et les natures de
 * tache avant elles.
 */
export function WishlistArchive({
  items, currency, pieces, onToggleAcquired, onEdit,
}: WishlistArchiveProps) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const immobile = useReducedMotion();

  const { total, liste } = useMemo(() => {
    const liste = [...items].sort((a, b) => {
      const da = a.acquired_at ? new Date(a.acquired_at).getTime() : 0;
      const db = b.acquired_at ? new Date(b.acquired_at).getTime() : 0;
      return db - da;
    });
    return { total: items.reduce((s, i) => s + Number(i.estimated_cost || 0), 0), liste };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="wl-pli" id="wl-archive" data-ouvert={ouvert ? "oui" : "non"}>
      <button
        type="button"
        className="wl-pli-poignee"
        aria-expanded={ouvert}
        aria-controls="wl-archive-corps"
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

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            id="wl-archive-corps"
            className="wl-pli-corps"
            /* La hauteur automatique se mesure toute seule : rien n est
               fige, et le pli suit le nombre reel de lignes. */
            initial={immobile ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={immobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={immobile
              ? { duration: 0 }
              : { height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.18 } }}
            style={{ overflow: "hidden" }}
          >
            <div className="wl-postes">
              {liste.map((item) => (
                <WishlistPoste
                  key={item.id}
                  item={item}
                  currency={currency}
                  piece={item.source_goal_cost_id ? pieces?.get(item.source_goal_cost_id) : undefined}
                  variante="archive"
                  onEdit={onEdit}
                  onToggleAcquired={onToggleAcquired}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
