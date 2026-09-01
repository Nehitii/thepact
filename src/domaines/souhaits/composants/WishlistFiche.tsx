import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, ImagePlus, Link2, Pencil, Target, Trash2 } from "lucide-react";
import { ChampSurPlace } from "@/domaines/souhaits/composants/ChampSurPlace";
import { formatCurrency } from "@/socle/outils/currency";
import type { PactWishlistItem } from "@/domaines/souhaits/hooks/usePactWishlist";
import type { PieceDeLEtape } from "@/domaines/souhaits/hooks/useWishlistPieces";
import { prixEnregistre } from "@/domaines/souhaits/logique/prix";
import { RangerCetArticle } from "@/domaines/souhaits/composants/RangerCetArticle";

interface WishlistFicheProps {
  item: PactWishlistItem;
  /* L adresse reellement affichable. Une image deposee est rangee en
     base sous forme de CHEMIN — le depot est prive, il faut signer.
     La page resout tous les chemins d un coup et passe le resultat
     ici. */
  src?: string | null;
  currency: string;
  piece?: PieceDeLEtape;
  onEdit: (item: PactWishlistItem) => void;
  onDelete: (id: string) => void;
  onToggleAcquired: (id: string, acquired: boolean) => void;
  /** Corriger une valeur sans ouvrir de fenetre. */
  onCorriger?: (id: string, champ: "prix" | "lien", valeur: string) => void;
  /* Absent dans la vue du pacte, ou rien ne se range. */
  rangement?: {
    listes: ReadonlyArray<{ id: string; name: string }>;
    onRanger: (itemId: string, cible: string) => void;
  };
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
  item, src, currency, piece, onEdit, onDelete, onToggleAcquired, onCorriger, rangement,
}: WishlistFicheProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [imageMorte, setImageMorte] = useState(false);

  const duPacte = Boolean(item.source_goal_cost_id);
  const acquis = item.acquired;
  /* La MISE EN PAGE suit l intention — l article a-t-il une image —
     et l AFFICHAGE suit la source resolue. Sans cette distinction, la
     tuile changeait de taille quand les signatures arrivaient, et la
     grille entiere sautait. */
  const photo = Boolean(item.image_url) && !imageMorte;
  const adresse = src ?? null;

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
          adresse ? <img
            src={adresse}
            alt=""
            loading="lazy"
            decoding="async"
            /* Une image morte laisserait un cadre vide qu on prend
               pour un bug : la tuile repasse sur sa plaque gravee. */
            onError={() => setImageMorte(true)}
          /> : null
        ) : (
          <button
            type="button"
            className="wl-plaque"
            data-morte={imageMorte ? "oui" : "non"}
            onClick={() => onEdit(item)}
            title={imageMorte
              ? t("wishlist.fiche.imageMorte", "L’image n’est plus disponible — en poser une autre")
              : t("wishlist.fiche.poserImage", "Poser une image")}
          >
            <span>{initiales(item.name)}</span>
            {/* L article a une image en base, mais son adresse ne
                repond plus : le dire vaut mieux qu un monogramme
                muet qu on prend pour une absence. */}
            {imageMorte && (
              <span className="wl-plaque-morte">
                {t("wishlist.fiche.imageIndisponible", "Image indisponible")}
              </span>
            )}
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

        {/* L etiquette se corrige sur place : c est le seul chiffre
            dont dependent le cout de l objectif, le financement du
            pacte et les trois totaux de la page. */}
        <ChampSurPlace
          className="wl-prix"
          classeChamp="wl-prix wl-prix--champ"
          valeur={String(item.estimated_cost ?? 0)}
          inputMode="decimal"
          titre={t("wishlist.fiche.corrigerPrix", "Corriger le prix")}
          desactive={!onCorriger}
          onValider={(v) => onCorriger?.(item.id, "prix", v)}
        >
          {formatCurrency(prixEnregistre(item.estimated_cost), currency)}
        </ChampSurPlace>
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
            {rangement && (
              <RangerCetArticle
                article={item}
                listes={rangement.listes}
                onRanger={rangement.onRanger}
              />
            )}
            {item.url ? (
              <a
                className="wl-outil"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={t("wishlist.fiche.voirEnLigne", "Voir en ligne")}
              >
                <ExternalLink aria-hidden="true" />
              </a>
            ) : onCorriger ? (
              /* Deux articles sur soixante-et-onze portent une adresse
                 de boutique : les soixante-neuf pieces venues des
                 objectifs n en ont pas, et on ne sait donc pas ou les
                 acheter. Elle se colle ici, sans ouvrir de fenetre. */
              <ChampSurPlace
                className="wl-outil"
                classeChamp="wl-lien-champ"
                valeur=""
                inputMode="url"
                placeholder={t("wishlist.fiche.collerLien", "Coller l’adresse de la boutique")}
                titre={t("wishlist.fiche.collerLien", "Coller l’adresse de la boutique")}
                onValider={(v) => onCorriger(item.id, "lien", v)}
              >
                <Link2 aria-hidden="true" />
              </ChampSurPlace>
            ) : null}
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
            {/* MESURE : vingt-cinq cases sur vingt-cinq portaient un
                signe, cochees ou non. Gris, il se lit comme fait —
                « Voyage 0/2 » montrait deux cases qui avaient l air
                validees. Une case vide est un etat, pas un oubli :
                la fiche d objectif le fait deja ainsi. */}
            {acquis && <Check aria-hidden="true" />}
          </button>
        </div>
      </div>
    </article>
    </div>
  );
}
