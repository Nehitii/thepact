import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, ExternalLink, Pencil, Target, Trash2 } from "lucide-react";
import { formatCurrency } from "@/socle/outils/currency";
import { WishlistRail } from "@/domaines/souhaits/composants/WishlistRail";
import type { PactWishlistItem } from "@/domaines/souhaits/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/domaines/souhaits/hooks/useWishlistPieces";
import { prixEnregistre } from "@/domaines/souhaits/logique/prix";

interface WishlistRegistreProps {
  items: PactWishlistItem[];
  currency: string;
  pieces?: Map<string, PieceDeLEtape>;
  /** Les listes personnelles, pour les nommer dans le registre. */
  listes?: { id: string; name: string }[];
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
}

interface Groupe {
  cle: string;
  goalId: string | null;
  /** Renseigné quand le groupe est une liste personnelle. */
  listId: string | null;
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
  items, currency, pieces, listes = [], onEdit, onDelete, onToggleAcquired,
}: WishlistRegistreProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const immobile = useReducedMotion();

  /* UN POSTE APPARTIENT À UNE LISTE OU À UN OBJECTIF, JAMAIS AUX DEUX —
     une contrainte de table le refuse. Le groupement peut donc se faire
     sur une seule clé, sans avoir à trancher les cas mixtes. */
  const nomDeListe = useMemo(
    () => new Map(listes.map((l) => [l.id, l.name])),
    [listes],
  );

  const groupes = useMemo<Groupe[]>(() => {
    const parObjectif = new Map<string, Groupe>();
    for (const item of items) {
      const listId = (item as { list_id?: string | null }).list_id ?? null;
      const cle = listId ? `liste:${listId}` : (item.goal_id ?? "—");
      let g = parObjectif.get(cle);
      if (!g) {
        g = {
          cle,
          goalId: item.goal_id ?? null,
          listId,
          nom: listId
            ? (nomDeListe.get(listId) ?? t("wishlist.registre.listeRetiree", "Liste retirée"))
            : (item.goal?.name ?? t("wishlist.registre.sansObjectif", "Sans objectif")),
          postes: [], total: 0, acquis: 0, nbAcquis: 0,
        };
        parObjectif.set(cle, g);
      }
      const prix = prixEnregistre(item.estimated_cost);
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
            /* SANS REPLI, ce comparateur rendait NaN sur un prix
               illisible, et l ordre passait a la discretion du moteur. */
            || prixEnregistre(b.estimated_cost) - prixEnregistre(a.estimated_cost),
        ),
      }))
      /* Les listes personnelles passent devant : elles sont le seul
         groupe qu'on a soi-même décidé de faire exister. */
      .sort((a, b) =>
        Number(!!b.listId) - Number(!!a.listId)
        || (b.total - b.acquis) - (a.total - a.acquis)
        || b.total - a.total);
  }, [items, t, nomDeListe]);

  /* Le premier etat, calcule une seule fois, quand les donnees
     arrivent. Un ref plutot qu un effet : pas de rendu intermediaire
     ou tout serait replie. */
  /* Deux facons de lire un registre, et la seconde manquait :
     « ou reste-t-il le plus a faire » (le defaut), et « qu est-ce que
     je peux solder tout de suite ». */
  const [ordre, setOrdre] = useState<"reste" | "proche">("reste");

  const premierEtat = useRef<Set<string> | null>(null);
  if (premierEtat.current === null && groupes.length > 0) {
    premierEtat.current = new Set(
      groupes.filter((g) => g.total - g.acquis > 0).map((g) => g.cle),
    );
  }
  const [ouverts, setOuverts] = useState<Set<string> | null>(null);
  const etat = ouverts ?? premierEtat.current ?? new Set<string>();

  /* CE QU UN ACHAT DEBLOQUE.
     La page annonce ce qui reste — quatorze mille euros, un mur. Elle
     ne disait jamais que deux cents euros soldent un objectif entier.
     Pire : le registre range par reste decroissant, donc les
     objectifs presque soldes tombaient tout en bas, hors de vue.
     Les trois plus proches du solde remontent en tete. Pas de seuil
     invente : ce sont simplement les trois plus proches. */
  const aPortee = useMemo(
    () => groupes
      .filter((g) => g.total - g.acquis > 0)
      .sort((a, b) => (a.total - a.acquis) - (b.total - b.acquis))
      .slice(0, 3),
    [groupes],
  );

  const ranges = useMemo(() => {
    if (ordre === "reste") return groupes;
    return [...groupes].sort((a, b) => {
      const ra = a.total - a.acquis, rb = b.total - b.acquis;
      /* Les objectifs soldes n ont plus rien a debloquer : ils
         ferment la marche au lieu d ouvrir la liste avec un zero. */
      if (ra === 0 && rb === 0) return b.total - a.total;
      if (ra === 0) return 1;
      if (rb === 0) return -1;
      return ra - rb;
    });
  }, [groupes, ordre]);

  const ouvrirEtRejoindre = (cle: string) => {
    setOuverts(() => new Set([...etat, cle]));
    /* On laisse le rendu poser la section avant d aller la chercher. */
    window.requestAnimationFrame(() => {
      document.getElementById(`wl-groupe-${cle}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

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
      {aPortee.length > 0 && (
        <section className="wl-portee">
          <p className="wl-portee-tete">
            {t("wishlist.portee.titre", "À portée")}
            <b>{t("wishlist.portee.combien", "{{n}} objectifs se soldent pour moins de {{montant}}", {
              n: aPortee.length,
              montant: formatCurrency(aPortee[aPortee.length - 1].total - aPortee[aPortee.length - 1].acquis, currency),
            })}</b>
          </p>
          <div className="wl-portee-liste">
            {aPortee.map((g) => {
              const restantes = g.postes.filter((p) => !p.acquired).length;
              return (
                <button type="button" key={g.cle} className="wl-portee-cible"
                  onClick={() => ouvrirEtRejoindre(g.cle)}>
                  <span className="wl-portee-nom">{g.nom}</span>
                  <span className="wl-portee-reste">
                    {t("wishlist.portee.pieces", "{{count}} pièce", { count: restantes })}
                    {" · "}
                    <b>{formatCurrency(g.total - g.acquis, currency)}</b>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="wl-registre-ordre">
        <button type="button" className="wl-tri" aria-pressed={ordre === "reste"}
          onClick={() => setOrdre("reste")}>
          {t("wishlist.registre.ordreReste", "Reste le plus gros")}
        </button>
        <button type="button" className="wl-tri" aria-pressed={ordre === "proche"}
          onClick={() => setOrdre("proche")}>
          {t("wishlist.registre.ordreProche", "Au plus proche du solde")}
        </button>
      </div>

      {ranges.map((g, rang) => {
        const reste = g.total - g.acquis;
        const ouvert = etat.has(g.cle);
        const part = g.total > 0 ? g.acquis / g.total : 0;

        return (
          <section className="wl-groupe" key={g.cle} id={`wl-groupe-${g.cle}`} data-ouvert={ouvert ? "oui" : "non"}>
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

            {/* LE GROUPE S OUVRE, MAINTENANT.

                Ses lignes apparaissaient d un bloc, sans transition :
                seul le chevron tournait, et le document sautait sous le
                curseur. Meme geste que le pli de l archive, meme
                traitement. */}
            <AnimatePresence initial={false}>
              {ouvert && (
                <motion.div
                  className="wl-postes"
                  initial={immobile ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={immobile ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={immobile
                    ? { duration: 0 }
                    : { height: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.16 } }}
                  style={{ overflow: "hidden" }}
                >
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
                          {/* Une case vide est un etat, pas un oubli. */}
                          {item.acquired && <Check aria-hidden="true" />}
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
                          {formatCurrency(prixEnregistre(item.estimated_cost), currency)}
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
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}
