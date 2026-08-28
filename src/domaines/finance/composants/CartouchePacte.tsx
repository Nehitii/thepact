import { useMemo, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Landmark, PackageCheck, Hourglass } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { AnimatedNumber } from "@/domaines/finance/composants/widgets";
import type { ComptePacte } from "@/domaines/finance/logique/comptePacte";

/* LE CARTOUCHE
 *
 * Trois lectures, et rien d autre : ce que coute le pacte, ce qui est
 * paye, ce qui reste. Chacune a son encre — cyan, vert, rouge — et un
 * filet de tranche qui dit son role avant qu on lise le chiffre.
 *
 * Quand un chiffre change, il accroche une fois : c est le seul
 * endroit de la page ou l on veut que l oeil revienne.
 */

const CHIFFRES = [
  { cle: "total", icone: Landmark, ton: "cout" },
  { cle: "finance", icone: PackageCheck, ton: "acquis" },
  { cle: "restant", icone: Hourglass, ton: "reste" },
] as const;

/** Une secousse breve quand la valeur bouge, pas a chaque rendu. */
function useAccroche(valeur: number) {
  const [accroche, setAccroche] = useState(false);
  const precedente = useRef(valeur);
  useEffect(() => {
    if (precedente.current === valeur) return;
    precedente.current = valeur;
    setAccroche(true);
    const id = window.setTimeout(() => setAccroche(false), 340);
    return () => window.clearTimeout(id);
  }, [valeur]);
  return accroche;
}

function Lecture({
  cle, icone: Icone, ton, valeur, index,
}: {
  cle: string;
  icone: typeof Landmark;
  ton: string;
  valeur: number;
  index: number;
}) {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const accroche = useAccroche(valeur);

  return (
    <motion.div
      className="cy-lect"
      data-ton={ton}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.07, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="cy-lect-cran" aria-hidden="true">
        <u /><u /><u />
      </span>
      <span className="cy-lect-nom">
        <Icone aria-hidden="true" />
        {t(`finance.cart.${cle}`)}
      </span>
      <strong className={`cy-lect-val${accroche ? " cy-accroche" : ""}`}>
        <AnimatedNumber value={valeur} currency={currency} isPositive showSign={false} />
      </strong>
    </motion.div>
  );
}

export function CartouchePacte({ compte }: { compte: ComptePacte }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const part = compte.total > 0 ? Math.min(100, (compte.finance / compte.total) * 100) : 0;
  const valeurs = useMemo(
    () => ({ total: compte.total, finance: compte.finance, restant: compte.restant }),
    [compte.total, compte.finance, compte.restant],
  );

  return (
    <div className="cy-cart">
      <div className="cy-cart-grille">
        {CHIFFRES.map((c, i) => (
          <Lecture
            key={c.cle}
            cle={c.cle}
            icone={c.icone}
            ton={c.ton}
            valeur={valeurs[c.cle as keyof typeof valeurs]}
            index={i}
          />
        ))}
      </div>

      {/* La barre de financement : dix logements, comme la mesure. */}
      <div
        className="cy-barre"
        role="img"
        aria-label={t("finance.cart.progression", { pct: Math.round(part) })}
      >
        <motion.i
          initial={{ width: 0 }}
          animate={{ width: `${part}%` }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
        <b>{Math.round(part)}%</b>
      </div>

      <p className="cy-cart-detail">
        {compte.partObjectifs > 0 && (
          <span>
            {t("finance.cart.parObjectifs")} <b>{formatCurrency(compte.partObjectifs, currency)}</b>
          </span>
        )}
        {compte.partPieces > 0 && (
          <span>
            {t("finance.cart.parPieces")} <b>{formatCurrency(compte.partPieces, currency)}</b>
          </span>
        )}
        {compte.partApport > 0 && (
          <span>
            {t("finance.cart.parApport")} <b>{formatCurrency(compte.partApport, currency)}</b>
          </span>
        )}
        <span>
          {t("finance.cart.pieces", { acquises: compte.piecesAcquises, total: compte.piecesTotal })}
        </span>
      </p>
    </div>
  );
}
