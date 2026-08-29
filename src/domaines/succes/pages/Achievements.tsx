import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Clock, Lock, Moon, Sparkles, Trophy, Users, X } from "lucide-react";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/socle/i18n/useDateFnsLocale";
import { useTranslation } from "react-i18next";
import "@/domaines/succes/pantheon.css";
import "@/domaines/succes/succes.css";
import { useAuth } from "@/socle/contextes/AuthContext";
import { DSPageShell } from "@/socle/ds";
import { DynamicLucideIcon } from "@/domaines/succes/composants/DynamicLucideIcon";
import {
  RARETES, rangDeRarete, useCoffres, useMarquerVus, useNeufs,
  useReclamerTrophees, useSucces, useTrophees,
  type Succes,
} from "@/domaines/succes/hooks/useSucces";

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
  obtenus, total, complet, actif, onChoisir, libelle, bonds,
}: {
  obtenus: number; total: number; complet: boolean;
  actif: boolean; onChoisir: () => void; libelle: string;
  bonds?: number;
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
      {/* Une categorie franchie ne montre plus son compte — il est
          plein — mais ce qu elle a rapporte. */}
      <span className="su-trophee-compte">
        {complet && bonds ? `+${bonds}` : `${obtenus}/${total}`}
      </span>
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
function MomentDeGloire({
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

export default function Achievements() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: succes = [], isLoading } = useSucces(user?.id);
  const { data: neufs } = useNeufs(user?.id);
  const marquerVus = useMarquerVus(user?.id);
  const coffres = useCoffres(succes);
  const { data: trophees_gagnes = [] } = useTrophees(user?.id);
  const reclamer = useReclamerTrophees(user?.id);

  /* Une categorie finie se paie. La reclamation est idempotente : un
     second passage ne verse rien, on peut donc la lancer a chaque
     visite sans precaution. */
  const reclamerMaintenant = reclamer.mutate;
  useEffect(() => {
    if (!user?.id || !succes.length) return;
    reclamerMaintenant();
  }, [user?.id, succes.length, reclamerMaintenant]);

  const bondsParCategorie = useMemo(
    () => new Map(trophees_gagnes.map((t) => [t.categorie, t.bonds])),
    [trophees_gagnes],
  );

  const [categorie, setCategorie] = useState<string>(TOUT);
  const [cacherObtenus, setCacherObtenus] = useState(false);
  const [vue, setVue] = useState<"collection" | "chronique">("collection");
  const [aCongedier, setACongedier] = useState<string[]>([]);
  const locale = useDateFnsLocale();

  /* Les nouveaux ne sont annonces qu une fois. Sans ce marquage, les
     vingt succes rattrapes d un coup se re-annonceraient a chaque
     visite, indefiniment. */
  const cles = useMemo(() => [...(neufs ?? [])], [neufs]);
  const marquer = marquerVus.mutate;

  /* Les nouveaux passent par le moment, du plus rare au plus commun :
     on ouvre par le plus beau. Ils etaient jusqu ici marques vus au
     bout de cinq secondes, ce qui revenait a ne rien annoncer. */
  /* PLAFONNE A TROIS. Le rattrapage a accorde trente-six succes d un
     coup ; trente-six fenetres a congedier seraient une punition, pas
     une celebration. On montre les trois plus rares — ceux qu on
     aurait voulu voir — et les autres rejoignent la collection sans
     ceremonie. */
  const AU_PLUS = 3;
  /* CE QUI A DEJA ETE CELEBRE NE REVIENT PAS. Congedier le dernier
     marque les succes comme vus, ce qui invalide « succes-neufs » ; le
     refetch changeait « cles », et l effet refaisait la file — la
     fenetre reapparaissait en boucle. Ce registre ne survit pas au
     montage, et n a pas a le faire : le drapeau « seen » s en charge
     d une visite a l autre. */
  const dejaCelebres = useRef(new Set<string>());
  useEffect(() => {
    if (!cles.length || !succes.length) return;
    const frais = cles.filter((c) => !dejaCelebres.current.has(c));
    if (!frais.length) return;
    const rang = new Map(succes.map((x) => [x.cle, rangDeRarete(x.rarete)]));
    const file = frais
      .sort((a, b) => (rang.get(b) ?? 0) - (rang.get(a) ?? 0))
      .slice(0, AU_PLUS);
    for (const c of cles) dejaCelebres.current.add(c);
    setACongedier(file);
  }, [cles, succes]);

  /* L APPEL A « marquer » ETAIT DANS LE SETSTATE. Une fonction de
     mise a jour doit etre PURE : React la rejoue — deux fois en mode
     strict — et peut jeter son resultat. Un effet de bord place la
     part deux fois, ou pas du tout. Il est calcule ici, ou l etat
     courant est deja en portee. */
  const congedier = () => {
    const reste = aCongedier.slice(1);
    setACongedier(reste);
    if (!reste.length && cles.length) marquer(cles);
  };

  const enGloire = aCongedier.length
    ? succes.find((x) => x.cle === aCongedier[0]) ?? null
    : null;

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

  /* 5 · LES DATES EXISTENT, LA PAGE NE LES MONTRAIT NULLE PART.
     Rangees par mois, elles racontent l annee — et un pantheon est
     d abord un recit. */
  const chronique = useMemo(() => {
    const par = new Map<string, { titre: string; quand: Date; succes: Succes[] }>();
    for (const x of succes) {
      if (!x.obtenu || !x.obtenu_le) continue;
      const d = new Date(x.obtenu_le);
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const groupe = par.get(cle) ?? {
        titre: format(d, "LLLL yyyy", { locale }),
        quand: new Date(d.getFullYear(), d.getMonth(), 1),
        succes: [],
      };
      groupe.succes.push(x);
      par.set(cle, groupe);
    }
    return [...par.values()]
      .map((g) => ({
        ...g,
        succes: g.succes.sort((a, b) => rangDeRarete(b.rarete) - rangDeRarete(a.rarete)),
      }))
      .sort((a, b) => b.quand.getTime() - a.quand.getTime());
  }, [succes, locale]);

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
              bonds={bondsParCategorie.get(c.categorie)}
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
                  {/* LE NOM NE DIT PAS QUOI FAIRE. « Architecte
                      d intention 38/50 » ne se comprend qu une fois
                      qu on sait de quoi il compte trente-huit. La
                      consigne accompagne le chiffre. */}
                  <span className="su-proche-quoi">{s.description}</span>
                  <span className="su-jauge" aria-hidden="true">
                    <i style={{ width: `${Math.round(s.avancement * 100)}%` }} />
                  </span>
                  <span className="su-proche-reste">
                    {(s.valeur ?? 0).toLocaleString()} / {(s.seuil ?? 0).toLocaleString()}
                    {s.seuil !== null && s.valeur !== null && (
                      <b>
                        {" · "}
                        {t("achievements.remaining", "encore {{n}}", {
                          n: Math.max(0, Math.ceil(s.seuil - s.valeur)).toLocaleString(),
                        })}
                      </b>
                    )}
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
            aria-pressed={vue === "collection"}
            onClick={() => setVue("collection")}
          >
            {t("achievements.collection", "Collection")}
          </button>
          <button
            type="button"
            className="su-filtre"
            aria-pressed={vue === "chronique"}
            onClick={() => setVue("chronique")}
          >
            <Clock aria-hidden="true" style={{ width: 13, height: 13, marginRight: 6, verticalAlign: -2 }} />
            {t("achievements.chronicle", "Chronique")}
          </button>
          {vue === "collection" && (
            <button
              type="button"
              className="su-filtre"
              aria-pressed={cacherObtenus}
              onClick={() => setCacherObtenus((v) => !v)}
            >
              {t("achievements.hideDone", "Masquer les obtenus")}
            </button>
          )}
          <span className="su-compte">
            {vue === "collection"
              ? t("achievements.showing", "{{n}} affichés", { n: listee.length })
              : t("achievements.overMonths", "sur {{n}} mois", { n: chronique.length })}
          </span>
        </div>

        {isLoading ? (
          <div className="su-liste" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div className="su-os" key={i} />)}
          </div>
        ) : vue === "chronique" ? (
          chronique.length === 0 ? (
            <div className="su-vide">
              <Clock aria-hidden="true" />
              <h3>{t("achievements.noHistory", "Rien encore inscrit")}</h3>
              <p>{t("achievements.noHistoryWhat", "Le premier succès ouvrira la chronique.")}</p>
            </div>
          ) : (
            <div className="su-chronique">
              {chronique.map((mois) => (
                <section className="su-mois" key={mois.titre}>
                  <h3 className="su-mois-titre">
                    {mois.titre}
                    <span>{mois.succes.length}</span>
                  </h3>
                  <div className="su-mois-liste">
                    {mois.succes.map((x) => (
                      <div className="su-trace" key={x.cle} data-rarete={x.rarete}>
                        <span className="su-trace-point" aria-hidden="true" />
                        <span className="su-trace-icone" aria-hidden="true">
                          <DynamicLucideIcon name={x.icone || "Award"} />
                        </span>
                        <span className="su-trace-nom">{x.nom}</span>
                        <span className="su-trace-jour">
                          {x.obtenu_le ? format(new Date(x.obtenu_le), "d MMM", { locale }) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
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

      {enGloire && (
        <MomentDeGloire
          s={enGloire}
          reste={aCongedier.length}
          onSuivant={congedier}
        />
      )}
    </DSPageShell>
  );
}
