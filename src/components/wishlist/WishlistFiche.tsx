import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, ImagePlus, Pencil, Target, Trash2 } from "lucide-react";
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

/** Deux lettres tirees du nom, pour la plaque gravee. */
function initiales(nom: string) {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "??";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

/**
 * UNE TUILE DE VITRINE.
 *
 * Le produit flotte sur sa plaque blanche avec son ombre de
 * contact, comme pose sur une table eclairee. Les treize photos
 * detourees sur fond blanc du bordereau y sont chez elles — elles
 * viennent de catalogues, elles retrouvent un catalogue.
 *
 * UNE PHOTO ACHETE UNE CASE. La tuile porte data-photo, et la
 * feuille de style lui donne deux colonnes au lieu d une. Remplir
 * une image change la mise en page : ca se voit, donc ca donne
 * envie de le faire.
 *
 * L ETIQUETTE DE PRIX vient de la direction « kiosque » : jaune,
 * cernee de noir, collee de travers sur la photo, et elle se
 * redresse quand la main approche.
 *
 * SANS PHOTO, PAS DE TROU. Cinquante-cinq articles sur soixante-dix
 * n en ont pas — leur source, goal_cost_items, n a pas de colonne
 * image. Ils recoivent une plaque de metal aux initiales gravees,
 * qui propose au survol d en poser une.
 */
export function WishlistFiche({
  item, currency, piece, onEdit, onDelete, onToggleAcquired,
}: WishlistFicheProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [imageMorte, setImageMorte] = useState(false);

  const duPacte = Boolean(item.source_goal_cost_id);
  const acquis = item.acquired;
  const photo = Boolean(item.image_url) && !imageMorte;

  /* La synchronisation ecrivait « Source: <objectif> » dans les notes
     de chaque piece : la carte affichait le nom de l objectif deux
     fois de suite, dont une en anglais. */
  const noteUtile = item.notes && item.notes.trim() !== `Source: ${item.goal?.name ?? ""}`
    ? item.notes
    : null;

  /* La coche ecrit tout de suite : l ancienne carte attendait huit
     cents millisecondes d animation avant d appeler la base. */
  const basculer = useCallback(() => {
    onToggleAcquired(item.id, !acquis);
  }, [acquis, item.id, onToggleAcquired]);

  const etat = acquis
    ? (piece?.parLEtape ? "etape" : "paye")
    : "du";

  return (
    /* Le socle porte la plaque arriere et la place dans la grille :
       le chanfrein de la tuile est un clip-path, et un clip-path
       rogne aussi ce qu on dessine autour. */
    <div className="wl-socle" data-photo={photo ? "oui" : "non"} data-acquis={acquis ? "oui" : "non"}>
    <article className="wl-fiche" data-photo={photo ? "oui" : "non"} data-acquis={acquis ? "oui" : "non"}>
      <div className="wl-vignette">
        {photo ? (
          <img
            src={item.image_url ?? ""}
            alt=""
            loading="lazy"
            decoding="async"
            /* Une image morte laisserait un cadre vide qu on prend
               pour un bug : la tuile repasse sur sa plaque gravee. */
            onError={() => setImageMorte(true)}
          />
        ) : (
          <button
            type="button"
            className="wl-plaque"
            onClick={() => onEdit(item)}
            title={t("wishlist.fiche.poserImage", "Poser une image")}
          >
            <span>{initiales(item.name)}</span>
            <i><ImagePlus aria-hidden="true" /> {t("wishlist.fiche.poserImage", "Poser une image")}</i>
          </button>
        )}

        <span className="wl-etat" data-etat={etat}>
          {etat === "etape"
            ? t("wishlist.etat.parEtape", "Étape faite")
            : etat === "paye"
              ? t("wishlist.etat.paye", "Payé")
              : t("wishlist.etat.du", "À payer")}
        </span>

        {/* LE CACHET. La reference de l article, et le signe de ce
            qu il engage : 契 — le pacte — pour une piece d objectif,
            自 — soi — pour une envie libre. Le sceau porte donc une
            information au lieu d emprunter une marque de fiction. */}
        <span className="wl-code">
          <b aria-hidden="true">{duPacte ? "契" : "自"}</b>
          <span className="sr-only">
            {duPacte
              ? t("wishlist.fiche.sceauPacte", "Pièce du pacte")
              : t("wishlist.fiche.sceauLibre", "Article libre")}
          </span>
          {item.id.slice(0, 4).toUpperCase()}
        </span>

        <span className="wl-prix">{formatCurrency(Number(item.estimated_cost || 0), currency)}</span>
      </div>

      <div className="wl-fiche-corps">
        <div style={{ minWidth: 0 }}>
          <h3 className="wl-fiche-nom">{item.name}</h3>

          {duPacte && item.goal ? (
            <button
              type="button"
              className="wl-fiche-source"
              onClick={() => navigate(`/goals/${item.goal?.id}`)}
              title={t("wishlist.fiche.ouvrirObjectif", "Ouvrir l’objectif")}
            >
              <Target aria-hidden="true" />
              <span>
                {item.goal.name}
                {piece?.etapeRang != null && ` · ${t("wishlist.fiche.etape", "étape")} ${piece.etapeRang}`}
              </span>
            </button>
          ) : item.category ? (
            <span className="wl-fiche-source">{item.category}</span>
          ) : null}

          {noteUtile && <p className="wl-fiche-note">{noteUtile}</p>}
        </div>

        <div className="wl-fiche-gestes">
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
            <button type="button" className="wl-outil" onClick={() => onEdit(item)}
              title={t("common.edit", "Modifier")}>
              <Pencil aria-hidden="true" />
            </button>
            <button type="button" className="wl-outil wl-outil--danger" onClick={() => onDelete(item.id)}
              title={t("common.delete", "Supprimer")}>
              <Trash2 aria-hidden="true" />
            </button>
          </div>

          {/* Une etape validee a deja paye sa piece : la case le
              montre et se verrouille, ici comme sur la fiche de
              l objectif. Une seule regle, deux ecrans. */}
          <button
            type="button"
            className="wl-coche"
            aria-pressed={acquis}
            disabled={piece?.etapeFaite === true}
            onClick={basculer}
            title={piece?.etapeFaite
              ? t("goals.detail.paidByStep", "Payé par la validation de l’étape")
              : acquis
                ? t("wishlist.fiche.remettre", "Remettre dans la liste")
                : t("wishlist.fiche.marquerPaye", "Marquer payé")}
          >
            <Check aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
    </div>
  );
}
