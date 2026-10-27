/**
 * LE FRONT — la liste des etapes.
 *
 * Quatrieme vue de la page Goals : la meme page, lue par ses etapes
 * plutot que par les objectifs qui les portent. Elle lit l ensemble
 * deja filtre par la page — la recherche la reduit comme elle reduit
 * les cartes — mais avant la pagination : une etape n a pas de page.
 *
 * Les trois onglets de la page changent de sens ici : ils ne
 * repartissent plus des objectifs mais des etapes. Et une etape n a que
 * deux etats — faite, ou pas — donc ils forment un total et ses deux
 * moities. Ce sont eux qui portent l etat ; la classification vit
 * au-dessus, dans GoalsList, pour qu un onglet ne puisse jamais
 * annoncer un nombre que cette liste ne montrerait pas.
 *
 * Il ne reste ici qu un bouton, parce qu il repond a une autre
 * question : « seulement mes trois objectifs ? ». La brigade est une
 * notion d objectif, pas d etape — une etape n est pas « focus », c est
 * son objectif qui l est. Le libelle dit donc « de la brigade », et le
 * bouton ne parait que si une brigade existe.
 *
 * Une ligne ouvre son etape. Elle ne la coche pas : cocher demande de
 * recalculer l avancement de l objectif, de synchroniser la liste
 * d envies et les groupes — cette logique vit dans la fiche, et la
 * dupliquer ici en ferait une seconde verite.
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Crosshair, Star } from "lucide-react";
import type { Etape } from "@/domaines/objectifs/hooks/useEtapes";
import type { GoalTab } from "@/domaines/objectifs/hooks/useGoalFilters";
import "@/domaines/objectifs/front.css";

interface Props {
  /** Deja classees : filtrees par l onglet et la brigade, et triees. */
  etapes: Etape[];
  onglet: GoalTab;
  aUneBrigade: boolean;
  brigadeSeule: boolean;
  onBrigadeSeule: (v: boolean) => void;
  chargement?: boolean;
}

const CELLULES = 8;

export function FrontListe({
  etapes, onglet, aUneBrigade, brigadeSeule, onBrigadeSeule, chargement,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="fr-volet">
      <header className="fr-tete">
        <Crosshair size={12} aria-hidden="true" />
        {t("front.title", "Le front")}
        {aUneBrigade && (
          <span className="fr-tete-fin">
            <button
              type="button"
              className="fr-filtre fr-brigade"
              aria-pressed={brigadeSeule}
              onClick={() => onBrigadeSeule(!brigadeSeule)}
              title={t("front.fromBrigadeHint", "N'afficher que les étapes venant des objectifs de la brigade")}
            >
              <Star size={9} aria-hidden="true" />
              {t("front.fromBrigade", "De la brigade")}
            </button>
          </span>
        )}
      </header>

      <div className="fr-liste">
        {etapes.map((e) => {
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

        {etapes.length === 0 && (
          <p className="fr-vide">
            {chargement
              ? t("common.loading", "Chargement…")
              : brigadeSeule
                ? t("front.emptyBrigade", "Aucune étape dans la brigade")
                : onglet === "completed"
                  ? t("front.emptyDone", "Aucune étape franchie ici")
                  : t("front.empty", "Aucune étape ouverte")}
          </p>
        )}
      </div>
    </section>
  );
}
