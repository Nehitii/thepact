/**
 * LE FRONT — la liste des etapes ouvertes.
 *
 * Quatrieme vue de la page Goals : la meme page, lue par ce qui reste
 * a faire plutot que par ce qu on s est promis. Elle lit l ensemble
 * deja filtre par la page — la recherche et les onglets la reduisent
 * comme ils reduisent les cartes — mais avant la pagination : une
 * etape n a pas de page.
 *
 * Trois portees, qui sont trois questions. La brigade repond a « sur
 * quoi je me suis engage ? », les objectifs engages a « qu est-ce que
 * je reprends ? », tout a « qu est-ce que j ouvre ? ». La premiere
 * est le defaut des qu une brigade existe : c est elle qu on s est
 * donnee.
 *
 * Une ligne ouvre son etape. Elle ne la coche pas : cocher demande de
 * recalculer l avancement de l objectif, de synchroniser la liste
 * d envies et les groupes — cette logique vit dans la fiche, et la
 * dupliquer ici en ferait une seconde verite.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Crosshair, EyeOff, Star } from "lucide-react";
import { classerLeFront, type EtapeOuverte, type PorteeFront } from "@/hooks/useEtapesOuvertes";
import "@/styles/front.css";

interface Props {
  etapes: EtapeOuverte[];
  chargement?: boolean;
}

const CELLULES = 8;

export function FrontListe({ etapes, chargement }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const aUneBrigade = etapes.some((e) => e.brigade);
  const [porteeChoisie, setPorteeChoisie] = useState<PorteeFront | null>(null);
  /* Tant que rien n a ete choisi, la portee suit l etat du pacte : la
     brigade si elle existe, les objectifs engages sinon. */
  const portee: PorteeFront = porteeChoisie ?? (aUneBrigade ? "brigade" : "engages");

  const [sansExclues, setSansExclues] = useState(true);

  const retenues = useMemo(
    () => classerLeFront(etapes, { portee, sansExclues }),
    [etapes, portee, sansExclues],
  );
  const exclues = etapes.filter((e) => e.exclue).length;

  const suivante: Record<PorteeFront, PorteeFront> = {
    brigade: "engages",
    engages: "tout",
    tout: aUneBrigade ? "brigade" : "engages",
  };
  const nomPortee: Record<PorteeFront, string> = {
    brigade: t("brigade.label", "Brigade"),
    engages: t("front.engaged", "Engagés"),
    tout: t("front.everything", "Tout"),
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
            onClick={() => setPorteeChoisie(suivante[portee])}
            title={t("front.scopeHint", "Étapes de la brigade, des objectifs engagés, ou de tous")}
          >
            {portee === "brigade" && <Star size={9} aria-hidden="true" />}
            {nomPortee[portee]}
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
        {retenues.map((e) => {
          const pleines = Math.round((e.avancement / 100) * CELLULES);
          return (
            <button
              key={e.id}
              type="button"
              className="fr-ligne"
              data-brigade={e.brigade ? "1" : "0"}
              style={{ ["--t" as string]: e.teinte }}
              onClick={() => navigate(`/step/${e.id}`)}
            >
              <span className="fr-corps">
                <span className="fr-titre" title={e.titre}>
                  {e.brigade && <Star size={10} className="fr-marque" aria-hidden="true" />}
                  {e.titre}
                </span>
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

        {retenues.length === 0 && (
          <p className="fr-vide">
            {chargement
              ? t("common.loading", "Chargement…")
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
