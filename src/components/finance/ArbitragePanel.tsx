import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Coins, PackageCheck, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { usePactCostItems, useAcquerirPieces, type CostItem } from "@/hooks/useCostItems";
import type { Goal } from "@/hooks/useGoals";

/* L ARBITRAGE
 *
 * La question que pose cet onglet n est pas « combien ai-je en
 * banque » mais « avec ce que j ai, qu est-ce que j avance ».
 *
 * On saisit une somme. L outil regarde toutes les pieces chiffrees
 * accrochees aux objectifs du pacte et propose la combinaison qui
 * BOUCLE le plus d objectifs — pas celle qui depense le plus. C est
 * la synergie : trois petites pieces qui terminent un objectif valent
 * mieux qu une grosse piece qui n en termine aucun.
 */

interface ArbitragePanelProps {
  goals: Goal[];
  /** Ce qui reste chaque mois, propose comme premiere mise. */
  netMensuel: number;
  /** Ce qui est deja mis de cote. */
  dejaFinance: number;
}

type Lot = {
  goal: Goal;
  pieces: CostItem[];
  reste: number;
};

export function ArbitragePanel({ goals, netMensuel, dejaFinance }: ArbitragePanelProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const objectifsActifs = useMemo(
    () => goals.filter((g) => g.status !== "fully_completed"),
    [goals],
  );
  const idsObjectifs = useMemo(() => objectifsActifs.map((g) => g.id), [objectifsActifs]);
  const { data: pieces = [], isLoading } = usePactCostItems(idsObjectifs);
  const acquerir = useAcquerirPieces();

  const [montant, setMontant] = useState(0);
  const [saisie, setSaisie] = useState("");
  /* Ce que l utilisateur a retire ou ajoute a la main : la proposition
     reste une proposition. */
  const [retirees, setRetirees] = useState<Set<string>>(new Set());
  const [ajoutees, setAjoutees] = useState<Set<string>>(new Set());

  const premiereMise = Math.max(0, Math.round(netMensuel > 0 ? netMensuel : dejaFinance));
  useEffect(() => {
    if (montant === 0 && premiereMise > 0) {
      setMontant(premiereMise);
      setSaisie(String(premiereMise));
    }
  }, [premiereMise, montant]);

  /* ── Les lots : un objectif, ce qu il lui reste a payer ──── */
  const lots = useMemo<Lot[]>(() => {
    const parObjectif = new Map<string, CostItem[]>();
    for (const p of pieces) {
      if (p.acquired_at) continue;
      const liste = parObjectif.get(p.goal_id) ?? [];
      liste.push(p);
      parObjectif.set(p.goal_id, liste);
    }
    return objectifsActifs
      .map((goal) => {
        const liste = (parObjectif.get(goal.id) ?? []).slice().sort((a, b) => a.price - b.price);
        return { goal, pieces: liste, reste: liste.reduce((s, p) => s + p.price, 0) };
      })
      .filter((l) => l.pieces.length > 0)
      .sort((a, b) => a.reste - b.reste);
  }, [pieces, objectifsActifs]);

  /* ── La proposition ───────────────────────────────────────
     D abord les objectifs qu on peut boucler entierement, du moins
     cher au plus cher : c est ce qui fait avancer le pacte. Avec le
     reliquat, on entame le suivant par ses pieces les plus modestes. */
  const proposition = useMemo(() => {
    let reste = montant;
    const panier = new Set<string>();
    const boucles = new Set<string>();

    for (const lot of lots) {
      if (lot.reste > 0 && lot.reste <= reste) {
        lot.pieces.forEach((p) => panier.add(p.id));
        boucles.add(lot.goal.id);
        reste -= lot.reste;
      }
    }
    for (const lot of lots) {
      if (boucles.has(lot.goal.id)) continue;
      for (const p of lot.pieces) {
        if (p.price <= reste) {
          panier.add(p.id);
          reste -= p.price;
        }
      }
    }
    return { panier, boucles };
  }, [lots, montant]);

  /* Le panier retenu : la proposition, moins ce qu on a retire, plus
     ce qu on a ajoute. */
  const panier = useMemo(() => {
    const s = new Set(proposition.panier);
    retirees.forEach((id) => s.delete(id));
    ajoutees.forEach((id) => s.add(id));
    return s;
  }, [proposition.panier, retirees, ajoutees]);

  const totalPanier = useMemo(
    () => pieces.filter((p) => panier.has(p.id)).reduce((s, p) => s + p.price, 0),
    [pieces, panier],
  );

  const boucles = useMemo(() => {
    return lots.filter((l) => l.pieces.length > 0 && l.pieces.every((p) => panier.has(p.id)));
  }, [lots, panier]);

  /* Ce que la somme touche passe devant ; le reste se replie. Neuf
     objectifs deplies en permanence faisaient deux ecrans et demi
     pour une decision qui n en concerne que deux ou trois. */
  const [toutVoir, setToutVoir] = useState(false);
  const { touches, intacts } = useMemo(() => {
    const t: Lot[] = [], i: Lot[] = [];
    for (const lot of lots) {
      (lot.pieces.some((p) => panier.has(p.id)) ? t : i).push(lot);
    }
    return { touches: t, intacts: i };
  }, [lots, panier]);
  const resteIntact = intacts.reduce((s, l) => s + l.reste, 0);

  const reliquat = Math.max(0, montant - totalPanier);
  const depassement = Math.max(0, totalPanier - montant);

  const basculer = (id: string) => {
    const dansProposition = proposition.panier.has(id);
    const dansPanier = panier.has(id);
    setRetirees((prev) => {
      const s = new Set(prev);
      if (dansPanier && dansProposition) s.add(id); else s.delete(id);
      return s;
    });
    setAjoutees((prev) => {
      const s = new Set(prev);
      if (!dansPanier && !dansProposition) s.add(id); else s.delete(id);
      return s;
    });
  };

  const changerMontant = (v: string) => {
    setSaisie(v);
    const n = Number(v.replace(",", "."));
    setMontant(Number.isFinite(n) && n >= 0 ? n : 0);
    setRetirees(new Set());
    setAjoutees(new Set());
  };

  const valider = async () => {
    const ids = [...panier];
    if (ids.length === 0) return;
    try {
      await acquerir.mutateAsync({ ids, acquis: true });
      toast.success(t("finance.arb.acquis", { count: ids.length }));
      setRetirees(new Set());
      setAjoutees(new Set());
    } catch (e) {
      toast.error(t("finance.arb.acquisEchec"), { description: (e as Error).message });
    }
  };

  const symbole = getCurrencySymbol(currency);
  const totalRestant = lots.reduce((s, l) => s + l.reste, 0);

  if (isLoading) {
    return <p className="cy-arb-etat">{t("finance.arb.chargement")}</p>;
  }

  if (lots.length === 0) {
    return (
      <p className="cy-arb-etat">
        <b>{t("finance.arb.videTitre")}</b>
        {t("finance.arb.videAide")}
      </p>
    );
  }

  return (
    <div className="cy-arb">
      {/* ── La mise ──────────────────────────────────────── */}
      <div className="cy-mise">
        <label className="cy-champ">
          <Coins aria-hidden="true" />
          <input
            type="text"
            className="cy-saisie"
            inputMode="decimal"
            value={saisie}
            onChange={(e) => changerMontant(e.target.value)}
            aria-label={t("finance.arb.montantLabel")}
            placeholder="0"
          />
          <b>{symbole}</b>
        </label>

        <div className="cy-raccourcis">
          {netMensuel > 0 && (
            <button type="button" onClick={() => changerMontant(String(Math.round(netMensuel)))}>
              {t("finance.arb.netMensuel")} · {formatCurrency(netMensuel, currency)}
            </button>
          )}
          {dejaFinance > 0 && (
            <button type="button" onClick={() => changerMontant(String(Math.round(dejaFinance)))}>
              {t("finance.arb.dejaMisDeCote")} · {formatCurrency(dejaFinance, currency)}
            </button>
          )}
          <button type="button" onClick={() => changerMontant(String(Math.round(totalRestant)))}>
            {t("finance.arb.toutBoucler")} · {formatCurrency(totalRestant, currency)}
          </button>
        </div>
      </div>

      {/* ── Le verdict ───────────────────────────────────── */}
      <motion.p
        key={`${boucles.length}-${panier.size}`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="cy-verdict"
        role="status"
      >
        <Sparkles aria-hidden="true" />
        {panier.size === 0
          ? t("finance.arb.rienNeRentre")
          : boucles.length > 0
            ? t("finance.arb.verdictBoucle", { count: boucles.length, pieces: panier.size })
            : t("finance.arb.verdictEntame", { count: panier.size })}
        {reliquat > 0 && panier.size > 0 && (
          <em>{t("finance.arb.reliquat", { montant: formatCurrency(reliquat, currency) })}</em>
        )}
      </motion.p>

      {/* ── Les lots ─────────────────────────────────────── */}
      <ul className="cy-lots">
        {(toutVoir ? lots : touches).map((lot) => {
          const prisDuLot = lot.pieces.filter((p) => panier.has(p.id));
          const totalPris = prisDuLot.reduce((s, p) => s + p.price, 0);
          const estBoucle = prisDuLot.length === lot.pieces.length;
          const part = lot.reste > 0 ? Math.round((totalPris / lot.reste) * 100) : 0;

          return (
            <li key={lot.goal.id} className="cy-lot" data-boucle={estBoucle ? "1" : "0"}>
              <div className="cy-lot-tete">
                <Target aria-hidden="true" />
                <b>{lot.goal.name}</b>
                <span>{formatCurrency(lot.reste, currency)}</span>
                {estBoucle && (
                  <em className="cy-sceau">
                    <PackageCheck aria-hidden="true" />
                    {t("finance.arb.boucle")}
                  </em>
                )}
              </div>

              <div className="cy-jauge" aria-hidden="true">
                <i style={{ width: `${part}%` }} />
              </div>

              <div className="cy-pieces">
                {lot.pieces.map((p) => {
                  const pris = panier.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="cy-piece"
                      aria-pressed={pris}
                      onClick={() => basculer(p.id)}
                    >
                      <i aria-hidden="true">{pris && <Check />}</i>
                      <span>{p.name}</span>
                      <b>{formatCurrency(p.price, currency)}</b>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ce que la somme n atteint pas : range, mais pas cache. */}
      {intacts.length > 0 && (
        <button
          type="button"
          className="cy-replies"
          aria-expanded={toutVoir}
          onClick={() => setToutVoir((v) => !v)}
        >
          <ChevronDown aria-hidden="true" />
          <b>{t("finance.arb.horsPortee", { count: intacts.length })}</b>
          <span>{formatCurrency(resteIntact, currency)}</span>
          <em>{toutVoir ? t("finance.arb.masquer") : t("finance.arb.afficher")}</em>
        </button>
      )}

      {/* ── Le pied ──────────────────────────────────────── */}
      <AnimatePresence>
        {panier.size > 0 && (
          <motion.div
            className="cy-pied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <span>
              {t("finance.arb.panier", { count: panier.size })}
              <b data-depasse={depassement > 0 ? "1" : "0"}>{formatCurrency(totalPanier, currency)}</b>
            </span>
            {depassement > 0 && (
              <em className="cy-alerte">
                {t("finance.arb.depassement", { montant: formatCurrency(depassement, currency) })}
              </em>
            )}
            <button
              type="button"
              className="cy-valider"
              onClick={valider}
              disabled={acquerir.isPending}
            >
              <PackageCheck aria-hidden="true" />
              {acquerir.isPending ? "…" : t("finance.arb.valider")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
