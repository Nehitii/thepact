/* LA CARTE D UN SUCCES, ET LE MOMENT DE GLOIRE.
 *
 * Cent quarante lignes sorties de `pages/Achievements.tsx`, qui en
 * faisait 609. La carte rend un succes, le moment de gloire celebre
 * celui qu on vient de decrocher.
 */

import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Check, Lock, Moon, Users, X } from "lucide-react";
import { DynamicLucideIcon } from "@/domaines/succes/composants/DynamicLucideIcon";
import { rangDeRarete } from "@/domaines/succes/hooks/useSucces";
import type { Succes } from "@/domaines/succes/hooks/useSucces";

export function Carte({ s, neuf, libelleRarete }: { s: Succes; neuf: boolean; libelleRarete: string }) {
  const { t } = useTranslation();
  /* Un succes cache ne se raconte pas avant d etre gagne — c est tout
     son interet. Mais il occupe sa place, pour qu on sache qu il
     existe. */
  const masque = s.cache && !s.obtenu;
  const pourcent = Math.round(s.avancement * 100);

  return (
    /* 1 · UN LEGENDAIRE A MILLE POINTS OCCUPAIT LA MEME SURFACE
       qu un commun a vingt-cinq. La carte s elargit avec la rarete :
       la hierarchie se sent avant de se lire. */
    <article
      className="su-carte"
      data-rarete={s.rarete}
      data-large={rangDeRarete(s.rarete) >= 4 ? "" : undefined}
      data-obtenu={s.obtenu ? "" : undefined}
      data-dort={s.sommeil ? "" : undefined}
      data-neuf={neuf ? "" : undefined}
    >
      <span className="su-icone" aria-hidden="true">
        {masque ? <Lock /> : <DynamicLucideIcon name={s.icone || "Award"} />}
      </span>

      <div className="su-corps">
        <p className="su-nom">
          {masque ? t("achievements.secret", "Succès secret") : s.nom}
          {neuf && <span className="su-neuf">{t("achievements.new", "nouveau")}</span>}
        </p>
        {/* UN SECRET SANS PISTE N INTRIGUE PAS, IL ENNUIE. Cinq
            cadenas identiques ne donnaient aucune prise. La categorie
            et la rarete restent visibles — assez pour savoir ou
            chercher, pas assez pour gacher la trouvaille. */}
        <p className="su-quoi">
          {masque
            ? t("achievements.secretWhere", "Quelque part du côté de « {{ou}} ».", {
                ou: t(`achievements.category.${s.categorie}`, s.categorie),
              })
            : s.description}
        </p>

        {/* 6 · CE QUI DORT, ET POURQUOI. Un mur qu on sait etre un mur
            cesse d etre frustrant. */}
        {!s.obtenu && s.sommeil && (
          <span className="su-sommeil" data-raison={s.sommeil}>
            {s.sommeil === "module" ? <Lock aria-hidden="true" />
              : s.sommeil === "personne" ? <Users aria-hidden="true" />
              : <Moon aria-hidden="true" />}
            {s.sommeil === "module"
              ? t("achievements.asleepModule", "En sommeil · module non possédé")
              : s.sommeil === "personne"
                ? t("achievements.asleepAlone", "En sommeil · il faut du monde")
                : t("achievements.asleepIdle", "En sommeil · rien d’enregistré ici")}
          </span>
        )}

        {!s.obtenu && !masque && !s.sommeil && s.seuil !== null && s.seuil > 1 && (
          <div className="su-avance">
            <span className="su-jauge" aria-hidden="true">
              <i style={{ width: `${pourcent}%` }} />
            </span>
            <span className="su-chiffres">
              {(s.valeur ?? 0).toLocaleString()} / {s.seuil.toLocaleString()}
            </span>
          </div>
        )}

        {s.obtenu && s.saveur && <p className="su-saveur">« {s.saveur} »</p>}
      </div>

      <div className="su-marge">
        <span className="su-rarete">{libelleRarete}</span>
        {s.obtenu ? (
          <span className="su-acquis" title={t("achievements.unlocked", "Obtenu")}>
            <Check aria-hidden="true" />
          </span>
        ) : (
          <span className="su-points">+{s.points}</span>
        )}
      </div>
    </article>
  );
}

/* 2 · GAGNER UN LEGENDAIRE PRODUISAIT LE MEME BANDEAU QU UN COMMUN.
 *
 * Un pantheon sans moment n est qu un inventaire. La carte se pose au
 * milieu de l ecran, a la couleur de sa rarete, et attend qu on la
 * congedie — c est ce qui distingue un fait acquis d une nouvelle.
 *
 * Elle se ferme au clic, a Echap, ou par le bouton. Rien ne se ferme
 * tout seul : on ne rate pas la seule chose qu on est venu voir. */
export function MomentDeGloire({
  s, reste, onSuivant,
}: {
  s: Succes; reste: number; onSuivant: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSuivant();
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onSuivant]);

  return (
    <div className="su-gloire" role="dialog" aria-modal="true" onClick={onSuivant}>
      <article
        className="su-gloire-carte"
        data-rarete={s.rarete}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="su-gloire-fermer"
          onClick={onSuivant}
          aria-label={t("common.close", "Fermer")}
        >
          <X aria-hidden="true" />
        </button>

        <span className="su-gloire-halo" aria-hidden="true" />

        <span className="su-gloire-icone" aria-hidden="true">
          <DynamicLucideIcon name={s.icone || "Award"} />
        </span>

        <p className="su-gloire-quoi">{t("achievements.justUnlocked", "Succès débloqué")}</p>
        <h2 className="su-gloire-nom">{s.nom}</h2>
        <p className="su-gloire-rarete">{t(`achievements.rarity.${s.rarete}`, s.rarete)}</p>

        {s.saveur && <p className="su-gloire-saveur">« {s.saveur} »</p>}

        <div className="su-gloire-gains">
          <span>+{s.points.toLocaleString()} {t("achievements.points", "points")}</span>
          {s.bonds > 0 && <span>+{s.bonds.toLocaleString()} bonds</span>}
        </div>

        <button type="button" className="su-gloire-suite" onClick={onSuivant}>
          {reste > 1
            ? t("achievements.nextOne", "Suivant · encore {{n}}", { n: reste - 1 })
            : t("achievements.gotIt", "Bien reçu")}
        </button>
      </article>
    </div>
  );
}
