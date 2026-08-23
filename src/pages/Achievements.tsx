import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, Lock, Sparkles, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/community.css";
import "@/styles/succes.css";
import { useAuth } from "@/contexts/AuthContext";
import { DynamicLucideIcon } from "@/components/DynamicLucideIcon";
import {
  rangDeRarete, useCoffres, useMarquerVus, useNeufs, useSucces,
  type Succes,
} from "@/hooks/useSucces";

/* LE PANTHEON.
 *
 * L AUDIT A TROUVE TROIS CHOSES, dans l ordre de gravite.
 *
 * 1. LES SUCCES ETAIENT JUGES SUR DES COMPTEURS QUI AVAIENT DERIVE.
 *    todos_created a zero pour soixante-sept taches, guilds_joined a
 *    zero pour une guilde fondee, pomodoro_sessions a vingt-neuf pour
 *    une table vide. Vingt succes merites n avaient jamais ete
 *    accordes. La base les juge desormais sur les tables sources.
 *
 * 2. LES SEPT SUCCES DE SANTE NE POUVAIENT PAS S OUVRIR. Leurs
 *    conditions portent « count » et « days » la ou les
 *    quatre-vingt-treize autres portent « value » : du code qui lit
 *    conditions.value n y voyait rien. Aucun ne s etait jamais
 *    declenche.
 *
 * 3. NEUF SUCCES ETAIENT INATTEIGNABLES DANS L INTERFACE. La liste des
 *    filtres oubliait « health » (sept) et « Series » (deux) : aucun
 *    onglet ne menait a eux. Ici la liste vient des donnees, pas d un
 *    tableau ecrit a la main — elle ne peut plus en oublier.
 *
 * ET LES TROPHEES. Cent cases a cocher ne font pas une collection :
 * une categorie entierement franchie vaut un trophee, et c est lui
 * qu on vient chercher. */

const TOUT = "__tout__";

function Trophee({
  obtenus, total, complet, actif, onChoisir, libelle,
}: {
  obtenus: number; total: number; complet: boolean;
  actif: boolean; onChoisir: () => void; libelle: string;
}) {
  const part = total > 0 ? obtenus / total : 0;
  const R = 21;
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
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle className="su-trophee-fond" cx="24" cy="24" r={R} />
          <circle
            className="su-trophee-part"
            cx="24" cy="24" r={R}
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
      style={{ "--su-rang": rangDeRarete(s.rarete) } as CSSProperties}
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
    const minuterie = window.setTimeout(() => marquer(cles), 4000);
    return () => window.clearTimeout(minuterie);
  }, [cles, marquer]);

  const libelleCategorie = (c: string) => t(`achievements.category.${c}`, c);
  const libelleRarete = (r: string) => t(`achievements.rarity.${r}`, r);

  const listee = useMemo(() => {
    return succes
      .filter((s) => categorie === TOUT || s.categorie === categorie)
      .filter((s) => !cacherObtenus || !s.obtenu)
      .sort((a, b) =>
        /* Les neufs en tete, puis ce qui est le plus proche d etre
           gagne : c est ce qui donne envie de continuer. */
        Number(neufs?.has(b.cle) ?? false) - Number(neufs?.has(a.cle) ?? false)
        || Number(a.obtenu) - Number(b.obtenu)
        || b.avancement - a.avancement
        || rangDeRarete(b.rarete) - rangDeRarete(a.rarete));
  }, [succes, categorie, cacherObtenus, neufs]);

  const obtenus = succes.filter((s) => s.obtenu).length;
  const points = succes.filter((s) => s.obtenu).reduce((n, s) => n + s.points, 0);
  const trophees = coffres.filter((c) => c.complet).length;

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <header className="su-tete">
            <h1 className="su-titre">{t("achievements.heading", "Panthéon")}</h1>
            <p className="su-sous">
              {t("achievements.summary", "{{n}} succès sur {{total}}", {
                n: obtenus, total: succes.length,
              })}
            </p>
          </header>

          {/* LES TROPHEES DE CATEGORIE. */}
          <section className="su-coffres">
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

          <div className="su-barre">
            <button
              type="button"
              className="co-puce"
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
            <div aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div className="co-fantome" key={i}>
                  <span className="co-os co-os--rond" />
                  <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
                </div>
              ))}
            </div>
          ) : listee.length === 0 ? (
            <div className="co-vide">
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
        </main>

        <aside className="co-rail">
          <section className="co-bloc">
            <h2 className="co-bloc-titre">{t("achievements.yourHoard", "Votre butin")}</h2>
            <div className="su-rail-corps">
              <div className="su-rail-grand">
                <span className="su-rail-chiffre">{points.toLocaleString()}</span>
                <span className="su-rail-mot">{t("achievements.points", "points")}</span>
              </div>
              <span className="su-jauge" aria-hidden="true">
                <i style={{ width: `${succes.length ? (obtenus / succes.length) * 100 : 0}%` }} />
              </span>
            </div>
            <div className="co-mesures">
              <div className="co-mesure">
                <span className="co-mesure-valeur">{obtenus}</span>
                <span className="co-mesure-quoi">{t("achievements.unlockedWord", "obtenus")}</span>
              </div>
              <div className="co-mesure">
                <span className="co-mesure-valeur">{trophees}</span>
                <span className="co-mesure-quoi">{t("achievements.trophies", "trophées")}</span>
              </div>
            </div>
          </section>

          {/* Ce qui est le plus proche d etre gagne. Un succes verrouille
              sans jauge ne dit pas s il est a portee ; celui-la le dit. */}
          <section className="co-bloc">
            <h2 className="co-bloc-titre su-rail-titre">
              <Sparkles aria-hidden="true" />
              {t("achievements.closest", "À portée")}
            </h2>
            <div className="su-rail-corps">
              {succes
                .filter((s) => !s.obtenu && !s.cache && s.avancement > 0)
                .sort((a, b) => b.avancement - a.avancement)
                .slice(0, 4)
                .map((s) => (
                  <div className="su-proche" key={s.cle}>
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
        </aside>
      </div>
    </div>
  );
}
