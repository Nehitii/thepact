import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, Lock, Sparkles, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/pantheon.css";
import "@/styles/succes.css";
import { useAuth } from "@/contexts/AuthContext";
import { DSPageShell } from "@/components/ds";
import { DynamicLucideIcon } from "@/components/DynamicLucideIcon";
import {
  RARETES, rangDeRarete, useCoffres, useMarquerVus, useNeufs, useSucces,
  type Succes,
} from "@/hooks/useSucces";

/* LE HALL DE L ETERNITE.
 *
 * LE FOND A ETE REPARE, PAS L HABILLAGE. L audit avait trouve trois
 * defauts de fond — des compteurs derives qui privaient de vingt
 * succes merites, sept succes de sante qui ne pouvaient pas s ouvrir,
 * neuf inatteignables faute de filtre — et je les avais corriges en
 * emportant le decor avec.
 *
 * C etait une erreur de jugement. Ailleurs dans ce produit, retirer le
 * cyberpunk sert la lecture : un fil de discussion, une liste d amis
 * ou un classement se lisent mieux sobres. UN PANTHEON, NON. C est la
 * salle des trophees : le seul endroit ou le spectacle est le sujet,
 * et non un ornement pose dessus.
 *
 * Le decor d origine revient donc — lumiere celeste, champ d etoiles,
 * sol qui fuit vers l horizon — et la couche fonctionnelle reparee
 * vient vivre dedans. */

const TOUT = "__tout__";

function Trophee({
  obtenus, total, complet, actif, onChoisir, libelle,
}: {
  obtenus: number; total: number; complet: boolean;
  actif: boolean; onChoisir: () => void; libelle: string;
}) {
  const part = total > 0 ? obtenus / total : 0;
  const R = 25;
  const tour = 2 * Math.PI * R;

  return (
    <button
      type="button"
      className="su-trophee"
      data-complet={complet ? "" : undefined}
      aria-pressed={actif}
      onClick={onChoisir}
    >
      <span className="su-trophee-anneau">
        <svg viewBox="0 0 56 56" aria-hidden="true">
          <circle className="su-trophee-fond" cx="28" cy="28" r={R} />
          <circle
            className="su-trophee-part"
            cx="28" cy="28" r={R}
            strokeDasharray={tour}
            strokeDashoffset={tour * (1 - part)}
          />
        </svg>
        <span className="su-trophee-signe" aria-hidden="true">
          {complet ? <Trophy /> : <span className="su-trophee-chiffre">{obtenus}</span>}
        </span>
      </span>
      <span className="su-trophee-nom">{libelle}</span>
      <span className="su-trophee-compte">{obtenus}/{total}</span>
    </button>
  );
}

function Carte({ s, neuf, libelleRarete }: { s: Succes; neuf: boolean; libelleRarete: string }) {
  const { t } = useTranslation();
  /* Un succes cache ne se raconte pas avant d etre gagne — c est tout
     son interet. Mais il occupe sa place, pour qu on sache qu il
     existe. */
  const masque = s.cache && !s.obtenu;
  const pourcent = Math.round(s.avancement * 100);

  return (
    <article
      className="su-carte"
      data-rarete={s.rarete}
      data-obtenu={s.obtenu ? "" : undefined}
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
        <p className="su-quoi">
          {masque
            ? t("achievements.secretWhat", "Il se révélera au moment où vous le gagnerez.")
            : s.description}
        </p>

        {!s.obtenu && !masque && s.seuil !== null && s.seuil > 1 && (
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

export default function Achievements() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: succes = [], isLoading } = useSucces(user?.id);
  const { data: neufs } = useNeufs(user?.id);
  const marquerVus = useMarquerVus(user?.id);
  const coffres = useCoffres(succes);

  const [categorie, setCategorie] = useState<string>(TOUT);
  const [cacherObtenus, setCacherObtenus] = useState(false);

  /* Les nouveaux ne sont annonces qu une fois. Sans ce marquage, les
     vingt succes rattrapes d un coup se re-annonceraient a chaque
     visite, indefiniment. */
  const cles = useMemo(() => [...(neufs ?? [])], [neufs]);
  const marquer = marquerVus.mutate;
  useEffect(() => {
    if (!cles.length) return;
    const minuterie = window.setTimeout(() => marquer(cles), 5000);
    return () => window.clearTimeout(minuterie);
  }, [cles, marquer]);

  const libelleCategorie = (c: string) => t(`achievements.category.${c}`, c);
  const libelleRarete = (r: string) => t(`achievements.rarity.${r}`, r);

  const listee = useMemo(() => {
    return succes
      .filter((s) => categorie === TOUT || s.categorie === categorie)
      .filter((s) => !cacherObtenus || !s.obtenu)
      .sort((a, b) =>
        Number(neufs?.has(b.cle) ?? false) - Number(neufs?.has(a.cle) ?? false)
        || Number(a.obtenu) - Number(b.obtenu)
        || b.avancement - a.avancement
        || rangDeRarete(b.rarete) - rangDeRarete(a.rarete));
  }, [succes, categorie, cacherObtenus, neufs]);

  const obtenus = succes.filter((s) => s.obtenu).length;
  const points = succes.filter((s) => s.obtenu).reduce((n, s) => n + s.points, 0);
  const trophees = coffres.filter((c) => c.complet).length;
  const part = succes.length ? Math.round((obtenus / succes.length) * 100) : 0;

  /* Le rang affichait « Élite » en dur, quel que soit l avancement :
     une statistique fictive posee entre deux vraies. On montre la
     rarete la plus haute effectivement obtenue — un fait verifiable a
     l ecran. */
  const plusHauteRarete = useMemo(() => {
    for (let i = RARETES.length - 1; i >= 0; i--) {
      if (succes.some((s) => s.obtenu && s.rarete === RARETES[i])) return RARETES[i];
    }
    return null;
  }, [succes]);

  const proches = useMemo(
    () => succes
      .filter((s) => !s.obtenu && !s.cache && s.avancement > 0)
      .sort((a, b) => b.avancement - a.avancement)
      .slice(0, 3),
    [succes],
  );

  return (
    <DSPageShell
      width="xl"
      className="pantheon-wrapper !px-0 !pt-0 !pb-0"
      background={
        <>
          {/* Le decor occupe la fenetre entiere, pas la colonne de
              contenu : DSPageShell rend cette couche en dehors du
              <main>, qui est centre et borne en largeur. */}
          <div className="pantheon-backdrop" />
          <div className="pantheon-stars" />
          <div className="celestial-light" />
          {/* La scene porte la perspective, la grille porte la
              rotation : une transform 3D ne cree pas sa profondeur. */}
          <div className="ground-stage">
            <div className="ground-grid" />
            <div className="ground-horizon" />
          </div>
          <div className="pantheon-vignette" />
        </>
      }
    >
      <div className="su-hall">
        <header className="su-hero">
          <span className="su-hero-coupe" aria-hidden="true">
            <Trophy />
          </span>

          <h1 className="su-hero-titre">
            {t("achievements.hallTitle", "Hall de")}{" "}
            <span>{t("achievements.eternity", "l’Éternité")}</span>
          </h1>
          <p className="su-hero-devise">
            « {t("achievements.tagline", "Ton héritage est gravé dans les étoiles")} »
          </p>

          <div className="su-monuments">
            <div className="stat-monument su-monument">
              <span className="su-monument-quoi">{t("achievements.completion", "Progression")}</span>
              <span className="su-monument-valeur">{part}%</span>
              <span className="su-monument-sous">{obtenus} / {succes.length}</span>
            </div>

            <div className="stat-monument su-monument" data-rarete={plusHauteRarete ?? undefined}>
              <span className="su-monument-quoi">{t("achievements.legacyRank", "Rang Héritage")}</span>
              <span className="su-monument-valeur su-monument-rarete">
                {plusHauteRarete ? libelleRarete(plusHauteRarete) : "—"}
              </span>
              <span className="su-monument-sous">
                {plusHauteRarete
                  ? t("achievements.highestUnlocked", "Plus haute rareté débloquée")
                  : t("achievements.noneYet", "Aucun succès débloqué")}
              </span>
            </div>

            <div className="stat-monument su-monument">
              <span className="su-monument-quoi">{t("achievements.expedition", "Expédition")}</span>
              <span className="su-monument-valeur">{points.toLocaleString()}</span>
              <span className="su-monument-sous">
                {t("achievements.trophiesWon", { count: trophees, defaultValue: "{{count}} trophée" })}
              </span>
            </div>
          </div>
        </header>

        {/* LES TROPHEES DE CATEGORIE.
            Cent cases a cocher ne font pas une collection : une
            categorie entierement franchie vaut un trophee, et c est
            lui qu on vient chercher. */}
        <section className="su-coffres" aria-label={t("achievements.byCategory", "Par catégorie")}>
          <button
            type="button"
            className="su-trophee su-trophee--tout"
            aria-pressed={categorie === TOUT}
            onClick={() => setCategorie(TOUT)}
          >
            <span className="su-trophee-nom">{t("achievements.all", "Tout")}</span>
            <span className="su-trophee-compte">{obtenus}/{succes.length}</span>
          </button>

          {coffres.map((c) => (
            <Trophee
              key={c.categorie}
              libelle={libelleCategorie(c.categorie)}
              obtenus={c.obtenus}
              total={c.total}
              complet={c.complet}
              actif={categorie === c.categorie}
              onChoisir={() => setCategorie(categorie === c.categorie ? TOUT : c.categorie)}
            />
          ))}
        </section>

        {/* A PORTEE. Un succes verrouille sans jauge ne dit pas s il est
            a portee ou hors d atteinte, et c est pourtant la seule
            chose qui donne envie de continuer. */}
        {proches.length > 0 && (
          <section className="su-portee">
            <h2 className="su-portee-titre">
              <Sparkles aria-hidden="true" />
              {t("achievements.closest", "À portée")}
            </h2>
            <div className="su-portee-liste">
              {proches.map((s) => (
                <div className="su-proche" key={s.cle} data-rarete={s.rarete}>
                  <span className="su-proche-nom">{s.nom}</span>
                  <span className="su-jauge" aria-hidden="true">
                    <i style={{ width: `${Math.round(s.avancement * 100)}%` }} />
                  </span>
                  <span className="su-proche-reste">
                    {(s.valeur ?? 0).toLocaleString()} / {(s.seuil ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="su-barre">
          <button
            type="button"
            className="su-filtre"
            aria-pressed={cacherObtenus}
            onClick={() => setCacherObtenus((v) => !v)}
          >
            {t("achievements.hideDone", "Masquer les obtenus")}
          </button>
          <span className="su-compte">
            {t("achievements.showing", "{{n}} affichés", { n: listee.length })}
          </span>
        </div>

        {isLoading ? (
          <div className="su-liste" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div className="su-os" key={i} />)}
          </div>
        ) : listee.length === 0 ? (
          <div className="su-vide">
            <Trophy aria-hidden="true" />
            <h3>{t("achievements.noneHere", "Rien à montrer ici")}</h3>
            <p>{t("achievements.noneHereWhat", "Changez de catégorie, ou réaffichez les succès obtenus.")}</p>
          </div>
        ) : (
          <div className="su-liste">
            {listee.map((s) => (
              <Carte
                key={s.cle}
                s={s}
                neuf={neufs?.has(s.cle) ?? false}
                libelleRarete={libelleRarete(s.rarete)}
              />
            ))}
          </div>
        )}
      </div>
    </DSPageShell>
  );
}
