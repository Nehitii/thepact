import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ExternalLink, Pencil, Target, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { WishlistRail } from "@/components/wishlist/WishlistRail";
import type { PactWishlistItem } from "@/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/hooks/useWishlistPieces";

interface WishlistRegistreProps {
  items: PactWishlistItem[];
  currency: string;
  pieces?: Map<string, PieceDeLEtape>;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

interface Groupe {
  cle: string;
  goalId: string | null;
  nom: string;
  postes: PactWishlistItem[];
  total: number;
  acquis: number;
  nbAcquis: number;
}

/**
 * LE REGISTRE — la vue du pacte.
 *
 * Soixante-neuf pieces a plat, en cartes de la taille d une main,
 * font une page qu on ne finit pas. Or elles ne sont pas soixante-
 * neuf choses independantes : ce sont les listes de courses de seize
 * objectifs. Rangees sous l objectif qui les reclame, avec son
 * compte, elles redeviennent lisibles.
 *
 * OUVERT OU FERME. Un objectif dont tout est paye n a plus rien a
 * demander : il arrive replie, sur une ligne. Ceux qui attendent
 * encore quelque chose s ouvrent d eux-memes. Le registre montre
 * donc le travail restant, pas l archive.
 *
 * L etat d ouverture est fige au premier chargement et n obeit plus
 * qu a l utilisateur ensuite : cocher la derniere piece d un
 * objectif ne doit pas refermer la section sous le doigt qui vient
 * de cliquer.
 */
export function WishlistRegistre({
  items, currency, pieces, onEdit, onDelete, onToggleAcquired,
}: WishlistRegistreProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const groupes = useMemo<Groupe[]>(() => {
    const parObjectif = new Map<string, Groupe>();
    for (const item of items) {
      const cle = item.goal_id ?? "—";
      let g = parObjectif.get(cle);
      if (!g) {
        g = {
          cle,
          goalId: item.goal_id ?? null,
          nom: item.goal?.name ?? t("wishlist.registre.sansObjectif", "Sans objectif"),
          postes: [], total: 0, acquis: 0, nbAcquis: 0,
        };
        parObjectif.set(cle, g);
      }
      const prix = Number(item.estimated_cost || 0);
      g.postes.push(item);
      g.total += prix;
      if (item.acquired) { g.acquis += prix; g.nbAcquis += 1; }
    }

    /* Dans chaque objectif : ce qui reste a payer d abord, du plus
       cher au moins cher. Entre objectifs : le plus gros reste
       d abord. Le registre ouvre sur le travail. */
    return [...parObjectif.values()]
      .map((g) => ({
        ...g,
        postes: [...g.postes].sort(
          (a, b) => Number(a.acquired) - Number(b.acquired)
            || Number(b.estimated_cost) - Number(a.estimated_cost),
        ),
      }))
      .sort((a, b) => (b.total - b.acquis) - (a.total - a.acquis) || b.total - a.total);
  }, [items, t]);

  /* Le premier etat, calcule une seule fois, quand les donnees
     arrivent. Un ref plutot qu un effet : pas de rendu intermediaire
     ou tout serait replie. */
  const premierEtat = useRef<Set<string> | null>(null);
  if (premierEtat.current === null && groupes.length > 0) {
    premierEtat.current = new Set(
      groupes.filter((g) => g.total - g.acquis > 0).map((g) => g.cle),
    );
  }
  const [ouverts, setOuverts] = useState<Set<string> | null>(null);
  const etat = ouverts ?? premierEtat.current ?? new Set<string>();

  const basculer = (cle: string) => {
    setOuverts(() => {
      const suivant = new Set(etat);
      if (suivant.has(cle)) suivant.delete(cle); else suivant.add(cle);
      return suivant;
    });
  };

  if (groupes.length === 0) return null;

  return (
    <div className="wl-registre">
      {groupes.map((g, rang) => {
        const reste = g.total - g.acquis;
        const ouvert = etat.has(g.cle);
        const part = g.total > 0 ? g.acquis / g.total : 0;

        return (
          <section className="wl-groupe" key={g.cle} data-ouvert={ouvert ? "oui" : "non"}>
            <div className="wl-groupe-entete">
              <button
                type="button"
                className="wl-groupe-tete"
                aria-expanded={ouvert}
                onClick={() => basculer(g.cle)}
              >
                <span className="wl-groupe-num">{String(rang + 1).padStart(2, "0")}</span>
                <span className="wl-groupe-nom">{g.nom}</span>
                <span className="wl-groupe-chiffres">
                  <span><em>{g.nbAcquis}</em>/{g.postes.length}</span>
                  {reste > 0
                    ? <b>{formatCurrency(reste, currency)}</b>
                    : <b>{t("wishlist.registre.complet", "complet")}</b>}
                  <ChevronDown className="wl-groupe-fleche" aria-hidden="true" />
                </span>
              </button>

              {g.goalId && (
                <button
                  type="button"
                  className="wl-outil wl-groupe-lien"
                  onClick={() => navigate(`/goals/${g.goalId}`)}
                  title={t("wishlist.registre.ouvrir", "Ouvrir l’objectif")}
                >
                  <Target aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Vingt-quatre cellules : assez pour lire la part sans
                que la ligne devienne un peigne. */}
            <WishlistRail className="wl-groupe-rail" part={part} cellules={24} />

            {ouvert && (
              <div className="wl-postes">
                {g.postes.map((item) => {
                  const piece = item.source_goal_cost_id ? pieces?.get(item.source_goal_cost_id) : undefined;
                  return (
                    <div className="wl-poste" key={item.id} data-acquis={item.acquired ? "oui" : "non"}>
                      {/* Meme regle que la fiche d objectif : une etape
                          validee a deja paye sa piece. */}
                      <button
                        type="button"
                        className="wl-coche"
                        aria-pressed={item.acquired}
                        disabled={piece?.etapeFaite === true}
                        onClick={() => onToggleAcquired(item.id, !item.acquired)}
                        title={piece?.etapeFaite
                          ? t("goals.detail.paidByStep", "Payé par la validation de l’étape")
                          : item.acquired
                            ? t("wishlist.fiche.remettre", "Remettre dans la liste")
                            : t("wishlist.fiche.marquerPaye", "Marquer payé")}
                      >
                        <Check aria-hidden="true" />
                      </button>

                      <span className="wl-poste-nom">
                        {item.name}
                        {/* D ou vient la coche : l etape, ou la main. */}
                        {piece?.etapeTitre && (
                          <span className="wl-poste-source">
                            {piece.etapeRang != null
                              ? `${t("wishlist.fiche.etape", "étape")} ${piece.etapeRang} · `
                              : ""}
                            {piece.etapeTitre}
                            {piece.parLEtape ? ` · ${t("wishlist.etat.parEtape", "Étape faite")}` : ""}
                          </span>
                        )}
                      </span>

                      <span className="wl-poste-prix">
                        {formatCurrency(Number(item.estimated_cost || 0), currency)}
                      </span>

                      <span className="wl-outils">
                        {item.url && (
                          <a className="wl-outil" href={item.url} target="_blank" rel="noopener noreferrer"
                            title={t("wishlist.fiche.voirEnLigne", "Voir en ligne")}>
                            <ExternalLink aria-hidden="true" />
                          </a>
                        )}
                        <button type="button" className="wl-outil" onClick={() => onEdit(item)}
                          title={t("common.edit", "Modifier")}>
                          <Pencil aria-hidden="true" />
                        </button>
                        <button type="button" className="wl-outil wl-outil--danger" onClick={() => onDelete(item.id)}
                          title={t("common.delete", "Supprimer")}>
                          <Trash2 aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
