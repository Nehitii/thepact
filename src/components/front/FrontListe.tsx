/**
 * LE FRONT — la liste des etapes ouvertes.
 *
 * Le meme panneau sert deux moments. Sur l accueil il tient en sept
 * lignes : c est un coup d oeil, on veut savoir sur quoi partir sans
 * cliquer, et le pied renvoie a la liste entiere. Sur la page Goals
 * il prend toute la largeur et defile a l interieur : c est la qu on
 * choisit vraiment.
 *
 * Une ligne ouvre son etape. Elle ne la coche pas : cocher demande de
 * recalculer l avancement de l objectif, de synchroniser la liste
 * d envies et les groupes — cette logique vit dans la fiche, et la
 * dupliquer ici en ferait une seconde verite.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Crosshair, EyeOff } from "lucide-react";
import { classerLeFront, type EtapeOuverte } from "@/hooks/useEtapesOuvertes";
import "@/styles/front.css";

interface Props {
  etapes: EtapeOuverte[];
  /** Sept lignes et un pied vers la vue pleine, au lieu de tout montrer. */
  compact?: boolean;
  /** Appele par le pied du mode compact. */
  onToutVoir?: () => void;
  chargement?: boolean;
}

const LIGNES_COMPACT = 7;
const CELLULES = 8;

export function FrontListe({ etapes, compact = false, onToutVoir, chargement }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /* Deux tris de la meme question. « Engages » repond a « je reprends
     quoi ? », « Tout » a « j ouvre quoi ? ». Le premier est le defaut :
     c est celui qui n ajoute pas de chantier. */
  const [engagesSeuls, setEngagesSeuls] = useState(true);
  const [sansExclues, setSansExclues] = useState(true);

  const retenues = classerLeFront(etapes, { engagesSeuls, sansExclues });
  const montrees = compact ? retenues.slice(0, LIGNES_COMPACT) : retenues;
  const exclues = etapes.filter((e) => e.exclue).length;

  return (
    <section className={`fr-volet${compact ? " fr-volet--compact" : ""}`}>
      <header className="fr-tete">
        <Crosshair size={12} aria-hidden="true" />
        {t("front.title", "Le front")}
        <span className="fr-tete-fin">
          <button
            type="button"
            className="fr-filtre"
            aria-pressed={engagesSeuls}
            onClick={() => setEngagesSeuls((v) => !v)}
            title={t("front.scopeHint", "Étapes des objectifs engagés, ou de tous")}
          >
            {engagesSeuls ? t("front.engaged", "Engagés") : t("front.everything", "Tout")}
          </button>
          {exclues > 0 && (
            <button
              type="button"
              className="fr-filtre"
              aria-pressed={sansExclues}
              onClick={() => setSansExclues((v) => !v)}
              title={t("front.excludedHint", "Masquer les étapes exclues du tirage")}
              aria-label={t("front.excludedHint", "Masquer les étapes exclues du tirage")}
            >
              <EyeOff size={10} aria-hidden="true" />
            </button>
          )}
          <b>{retenues.length}</b>
        </span>
      </header>

      <div className="fr-liste">
        {montrees.map((e) => {
          const pleines = Math.round((e.avancement / 100) * CELLULES);
          return (
            <button
              key={e.id}
              type="button"
              className="fr-ligne"
              style={{ ["--t" as string]: e.teinte }}
              onClick={() => navigate(`/step/${e.id}`)}
            >
              <span className="fr-corps">
                <span className="fr-titre" title={e.titre}>{e.titre}</span>
                <span className="fr-source">
                  <u>{e.objectifNom}</u>
                  {e.exclue && <s>· {t("front.excluded", "hors tirage")}</s>}
                </span>
              </span>
              <span className="fr-jauge" aria-hidden="true">
                {Array.from({ length: CELLULES }, (_, k) => (
                  <u key={k} className={k < pleines ? "on" : ""} />
                ))}
              </span>
              <span className="fr-pct">{e.avancement}%</span>
              <ChevronRight size={13} className="fr-fleche" aria-hidden="true" />
            </button>
          );
        })}

        {montrees.length === 0 && (
          <p className="fr-vide">
            {chargement
              ? t("common.loading", "Chargement…")
              : engagesSeuls
                ? t("front.emptyEngaged", "Aucune étape sur un objectif engagé")
                : t("front.empty", "Aucune étape ouverte")}
          </p>
        )}
      </div>

      {compact && onToutVoir && retenues.length > montrees.length && (
        <button type="button" className="fr-pied" onClick={onToutVoir}>
          {t("front.seeAll", "Voir les {{n}} étapes", { n: retenues.length })}
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
