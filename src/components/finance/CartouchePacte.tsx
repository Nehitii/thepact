import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Landmark, PackageCheck, Hourglass } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { AnimatedNumber } from "./widgets";
import type { ComptePacte } from "./comptePacte";

/* LE CARTOUCHE
 *
 * Trois chiffres, et rien d autre : ce que coute le pacte, ce qui est
 * paye, ce qui reste. Le reste de la page en decoule.
 *
 * « Paye » ne se devine plus : c est la somme des pieces reellement
 * acquises, plus l apport declare. Un objectif termine compte pour son
 * cout entier — sinon un objectif boucle avant que les pieces existent
 * disparaitrait du compte.
 */

export function CartouchePacte({ compte }: { compte: ComptePacte }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const part = compte.total > 0 ? Math.min(100, (compte.finance / compte.total) * 100) : 0;

  const chiffres = useMemo(
    () => [
      { cle: "total", icone: Landmark, valeur: compte.total, ton: "neutre" },
      { cle: "finance", icone: PackageCheck, valeur: compte.finance, ton: "acquis" },
      { cle: "restant", icone: Hourglass, valeur: compte.restant, ton: "reste" },
    ] as const,
    [compte],
  );

  return (
    <div className="fin-cart">
      <div className="fin-cart-chiffres">
        {chiffres.map(({ cle, icone: Icone, valeur, ton }, i) => (
          <motion.div
            key={cle}
            className="fin-cart-bloc"
            data-ton={ton}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.32, ease: "easeOut" }}
          >
            <span className="fin-cart-etiquette">
              <Icone aria-hidden="true" />
              {t(`finance.cart.${cle}`)}
            </span>
            <strong className="fin-cart-valeur">
              <AnimatedNumber
                value={valeur}
                currency={currency}
                isPositive
                showSign={false}
                className="fin-cart-nombre"
              />
            </strong>
          </motion.div>
        ))}
      </div>

      {/* La barre de financement : une seule lecture, du regard. */}
      <div className="fin-cart-barre" role="img" aria-label={t("finance.cart.progression", { pct: Math.round(part) })}>
        <motion.i
          initial={{ width: 0 }}
          animate={{ width: `${part}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        <b>{Math.round(part)}%</b>
      </div>

      <p className="fin-cart-detail">
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
