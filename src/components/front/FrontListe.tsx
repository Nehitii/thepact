/**
 * LE FRONT — la liste des etapes.
 *
 * Quatrieme vue de la page Goals : la meme page, lue par ses etapes
 * plutot que par les objectifs qui les portent. Elle lit l ensemble
 * deja filtre par la page — la recherche et les onglets la reduisent
 * comme ils reduisent les cartes — mais avant la pagination : une
 * etape n a pas de page.
 *
 * Deux axes, qui sont deux questions. La portee repond a « lesquelles
 * me regardent ? » : la brigade, les objectifs engages, ou tous. La
 * premiere est le defaut des qu une brigade existe — c est elle qu on
 * s est donnee. L etat repond a « lesquelles restent ? » : ce qui est
 * a faire, ce qui est fait, ou tout.
 *
 * L etat suit l onglet de la page tant qu on n en a pas choisi un.
 * Sous « Termines » il n y a que des etapes faites : y proposer « a
 * faire » par defaut, c etait afficher une vue vide et laisser croire
 * qu il n y avait rien. Le compte, lui, est toujours celui de ce qui
 * est montre.
 *
 * Une ligne ouvre son etape. Elle ne la coche pas : cocher demande de
 * recalculer l avancement de l objectif, de synchroniser la liste
 * d envies et les groupes — cette logique vit dans la fiche, et la
 * dupliquer ici en ferait une seconde verite.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Crosshair, EyeOff, Star } from "lucide-react";
import { classerLeFront, type Etape, type EtatFront, type PorteeFront } from "@/hooks/useEtapes";
import type { GoalTab } from "@/hooks/useGoalFilters";
import "@/styles/front.css";

interface Props {
  etapes: Etape[];
  onglet: GoalTab;
  chargement?: boolean;
}

const CELLULES = 8;

export function FrontListe({ etapes, onglet, chargement }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const aUneBrigade = etapes.some((e) => e.brigade);
  const [porteeChoisie, setPorteeChoisie] = useState<PorteeFront | null>(null);
  /* Tant que rien n a ete choisi, la portee suit l etat du pacte : la
     brigade si elle existe, les objectifs engages sinon.
     Sous « Termines », les deux sont vides par construction — un
     objectif franchi n est ni engage ni dans la brigade. Y garder le
     defaut ordinaire, c'etait remplacer une vue vide par une autre. */
  const portee: PorteeFront =
    porteeChoisie ?? (onglet === "completed" ? "tout" : aUneBrigade ? "brigade" : "engages");

  const [etatChoisi, setEtatChoisi] = useState<EtatFront | null>(null);
  const etat: EtatFront = etatChoisi ?? (onglet === "completed" ? "faites" : "afaire");

  const [sansExclues, setSansExclues] = useState(true);

  const retenues = useMemo(
    () => classerLeFront(etapes, { portee, etat, sansExclues }),
    [etapes, portee, etat, sansExclues],
  );
  const exclues = etapes.filter((e) => e.exclue && !e.faite).length;

  const porteeSuivante: Record<PorteeFront, PorteeFront> = {
    brigade: "engages",
    engages: "tout",
    tout: aUneBrigade ? "brigade" : "engages",
  };
  const nomPortee: Record<PorteeFront, string> = {
    brigade: t("brigade.label", "Brigade"),
    engages: t("front.engaged", "Engagés"),
    tout: t("front.everything", "Tout"),
  };

  const etatSuivant: Record<EtatFront, EtatFront> = {
    afaire: "faites",
    faites: "toutes",
    toutes: "afaire",
  };
  const nomEtat: Record<EtatFront, string> = {
    afaire: t("front.todo", "À faire"),
    faites: t("front.done", "Faites"),
    toutes: t("front.allSteps", "Toutes"),
  };

  return (
    <section className="fr-volet">
      <header className="fr-tete">
        <Crosshair size={12} aria-hidden="true" />
        {t("front.title", "Le front")}
        <span className="fr-tete-fin">
          <button
            type="button"
            className="fr-filtre fr-portee"
            onClick={() => setPorteeChoisie(porteeSuivante[portee])}
            title={t("front.scopeHint", "Étapes de la brigade, des objectifs engagés, ou de tous")}
          >
            {portee === "brigade" && <Star size={9} aria-hidden="true" />}
            {nomPortee[portee]}
          </button>
          <button
            type="button"
            className="fr-filtre fr-etat"
            data-etat={etat}
            onClick={() => setEtatChoisi(etatSuivant[etat])}
            title={t("front.stateHint", "Étapes à faire, faites, ou toutes")}
          >
            {etat === "faites" && <Check size={9} aria-hidden="true" />}
            {nomEtat[etat]}
          </button>
          {exclues > 0 && etat !== "faites" && (
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
        {retenues.map((e) => {
          const pleines = Math.round((e.avancement / 100) * CELLULES);
          return (
            <button
              key={e.id}
              type="button"
              className="fr-ligne"
              data-brigade={e.brigade ? "1" : "0"}
              data-faite={e.faite ? "1" : "0"}
              style={{ ["--t" as string]: e.teinte }}
              onClick={() => navigate(`/step/${e.id}`)}
            >
              <span className="fr-corps">
                <span className="fr-titre" title={e.titre}>
                  {e.faite
                    ? <Check size={10} className="fr-marque" aria-hidden="true" />
                    : e.brigade && <Star size={10} className="fr-marque" aria-hidden="true" />}
                  {e.titre}
                </span>
                <span className="fr-source">
                  <u>{e.objectifNom}</u>
                  {e.exclue && !e.faite && <s>· {t("front.excluded", "hors tirage")}</s>}
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

        {retenues.length === 0 && (
          <p className="fr-vide">
            {chargement
              ? t("common.loading", "Chargement…")
              : etat === "faites"
                ? t("front.emptyDone", "Aucune étape franchie ici")
                : portee === "brigade"
                  ? t("front.emptyBrigade", "Aucune étape dans la brigade")
                  : portee === "engages"
                    ? t("front.emptyEngaged", "Aucune étape sur un objectif engagé")
                    : t("front.empty", "Aucune étape ouverte")}
          </p>
        )}
      </div>
    </section>
  );
}
