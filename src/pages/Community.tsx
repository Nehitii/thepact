import { useEffect, useRef, useState } from "react";
import { Clapperboard, MessagesSquare, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/community.css";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { ClassementLigne } from "@/components/community/ClassementLigne";
import { NATURES, libelleNature, type NaturePost } from "@/components/community/vocabulaire";
import { useCommunityStats, type PostFilterType, type PostSortOption } from "@/hooks/useCommunity";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";

/* COMMUNITY — la coque.
 *
 * CE QUI A ETE RETIRE, ET POURQUOI.
 *
 * — LE BANDEAU DEFILANT. Cinq indicateurs en boucle, vingt-deux
 *   secondes par tour, dont trois etaient des tirets ecrits en dur.
 *
 * — LA RANGEE DE TROIS TUILES. « 0 Online now », « 0 Posts / week »
 *   et « 38 Goals completed » — le 38 etant un litteral. C etait le
 *   patron « grand chiffre, petit libelle, accent », qui remplit une
 *   page sans la nourrir. Les chiffres vrais sont passes dans le
 *   rail, ou ils accompagnent le fil au lieu de le preceder.
 *
 * — LES TROIS TUILES D ONGLET, chacune avec son emoji dans un carre
 *   colore, un titre, une description et un badge — dont un « 184 »
 *   au-dessus d un onglet dont la table etait vide.
 *
 * — LE TITRE DE PAGE. « Communaute » en 19px au-dessus des onglets ne
 *   faisait rien : le menu de gauche dit deja ou l on est, et X
 *   n affiche aucun titre sur son fil. Les onglets SONT l en-tete.
 *   Un titre reste, invisible a l ecran, pour les lecteurs d ecran.
 *
 * — TOUTES LES ANIMATIONS D ENTREE. Dix-neuf etats a opacite zero
 *   laissaient la page blanche dans un onglet d arriere-plan, et
 *   AnimatePresence en mode « wait » bloquait la bascule d onglets.
 *
 * LE FILTRE VIT ICI, pas dans le fil : le bloc « Sujets » du rail
 * doit pouvoir le poser, et le rail n est pas dans le fil. */

type Onglet = "fil" | "videos" | "classement";
const ONGLETS: Onglet[] = ["fil", "videos", "classement"];

function Mesure({ valeur, quoi }: { valeur: number | undefined; quoi: string }) {
  return (
    <div className="co-mesure">
      <span className="co-mesure-valeur">{(valeur ?? 0).toLocaleString()}</span>
      <span className="co-mesure-quoi">{quoi}</span>
    </div>
  );
}

function Rail({ onFiltrer }: { onFiltrer: (n: NaturePost) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats } = useCommunityStats();
  const { data: classement = [] } = useLeaderboard();

  /* On ne montre que les natures qui existent vraiment dans le fil.
     Une liste de six lignes a zero serait du remplissage. */
  const sujets = NATURES
    .map((n) => ({ nature: n, combien: stats?.parNature?.[n] ?? 0 }))
    .filter((s) => s.combien > 0)
    .sort((a, b) => b.combien - a.combien);

  return (
    <aside className="co-rail">
      <section className="co-bloc">
        <h2 className="co-bloc-titre">{t("community.rail.week", "Cette semaine")}</h2>
        <div className="co-mesures">
          <Mesure valeur={stats?.postsSemaine} quoi={t("community.rail.posts", "publications")} />
          <Mesure valeur={stats?.auteursSemaine} quoi={t("community.rail.authors", "ont publié")} />
          <Mesure valeur={stats?.reactionsTotal} quoi={t("community.rail.reactions", "réactions")} />
          <Mesure valeur={stats?.reponsesTotal} quoi={t("community.rail.replies", "réponses")} />
        </div>
      </section>

      {sujets.length > 0 && (
        <section className="co-bloc">
          <h2 className="co-bloc-titre">{t("community.rail.topics", "Sujets")}</h2>
          {sujets.map(({ nature, combien }) => (
            <button key={nature} type="button" className="co-sujet" onClick={() => onFiltrer(nature)}>
              <span className="co-nature" data-nature={nature}>{libelleNature(nature, t)}</span>
              <span className="co-sujet-compte">{combien}</span>
            </button>
          ))}
        </section>
      )}

      <section className="co-bloc">
        <h2 className="co-bloc-titre">{t("leaderboard.title", "Classement")}</h2>
        {classement.slice(0, 5).map((entree, i) => (
          <ClassementLigne
            key={entree.user_id}
            entree={entree}
            place={i + 1}
            estMoi={entree.user_id === user?.id}
            forme="rail"
          />
        ))}
        {classement.length === 0 && (
          <p className="co-rail-pied" style={{ color: "var(--co-texte-2)" }}>
            {t("leaderboard.noAgents", "Aucun agent dans le classement pour le moment")}
          </p>
        )}
      </section>
    </aside>
  );
}

function PanneauClassement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: entrees = [], isLoading } = useLeaderboard();
  const maPlace = entrees.findIndex((e) => e.user_id === user?.id) + 1;

  if (isLoading) {
    return (
      <div aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="co-fantome" key={i}>
            <span className="co-os co-os--rond" />
            <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
          </div>
        ))}
      </div>
    );
  }

  if (entrees.length === 0) {
    return (
      <div className="co-vide">
        <Trophy aria-hidden="true" />
        <h3>{t("leaderboard.noAgents", "Aucun agent dans le classement pour le moment")}</h3>
      </div>
    );
  }

  return (
    <>
      {maPlace > 0 && (
        <p
          className="co-rail-pied"
          style={{ borderTop: "none", borderBottom: "1px solid var(--co-filet)", color: "var(--co-texte-2)" }}
        >
          {t("leaderboard.yourPosition", "Ta position :")}{" "}
          <b style={{ color: "var(--co-accent)" }}>#{maPlace}</b>{" "}
          {t("leaderboard.of", "sur")} {entrees.length}
        </p>
      )}
      {entrees.map((entree, i) => (
        <ClassementLigne
          key={entree.user_id}
          entree={entree}
          place={i + 1}
          estMoi={entree.user_id === user?.id}
        />
      ))}
    </>
  );
}

export default function Community() {
  const { t } = useTranslation();
  const [onglet, setOnglet] = useState<Onglet>("fil");
  const [filtre, setFiltre] = useState<PostFilterType>("all");
  const [tri, setTri] = useState<PostSortOption>("recent");
  const [colle, setColle] = useState(false);
  const sentinelle = useRef<HTMLDivElement>(null);
  const { data: stats } = useCommunityStats();

  /* L ombre de la tete n apparait que lorsque du contenu passe
     dessous. Un temoin d un pixel place au-dessus de la tete dit
     quand elle a quitte le haut du document — plus fiable qu un
     ecouteur de defilement, qui suppose de savoir QUI defile. */
  useEffect(() => {
    const cible = sentinelle.current;
    if (!cible) return;
    const observateur = new IntersectionObserver(
      ([entree]) => setColle(!entree.isIntersecting),
      { threshold: 1 },
    );
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  const onglets: { cle: Onglet; libelle: string; Icone: typeof MessagesSquare; compte?: number }[] = [
    { cle: "fil", libelle: t("community.tabs.feed", "Fil"), Icone: MessagesSquare, compte: stats?.postsTotal },
    { cle: "videos", libelle: t("community.tabs.reels", "Vidéos"), Icone: Clapperboard, compte: stats?.reelsTotal },
    { cle: "classement", libelle: t("leaderboard.title", "Classement"), Icone: Trophy },
  ];

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <div ref={sentinelle} aria-hidden="true" style={{ height: 1 }} />

          <div className="co-tete" data-colle={colle ? "oui" : "non"}>
            <h1 className="sr-only">{t("community.heading", "Communauté")}</h1>
            <div
              className="co-onglets"
              role="tablist"
              aria-label={t("community.heading", "Communauté")}
              style={{
                ["--co-nb" as string]: onglets.length,
                ["--co-actif" as string]: ONGLETS.indexOf(onglet),
              }}
            >
              {onglets.map(({ cle, libelle, Icone, compte }) => (
                <button
                  key={cle}
                  type="button"
                  role="tab"
                  id={`co-onglet-${cle}`}
                  aria-selected={onglet === cle}
                  aria-controls={`co-panneau-${cle}`}
                  className="co-onglet"
                  onClick={() => setOnglet(cle)}
                >
                  <Icone aria-hidden="true" />
                  {libelle}
                  {compte !== undefined && compte > 0 && (
                    <span className="co-onglet-compte">{compte}</span>
                  )}
                </button>
              ))}
              <span className="co-onglets-trait" aria-hidden="true" />
            </div>
          </div>

          <div role="tabpanel" id={`co-panneau-${onglet}`} aria-labelledby={`co-onglet-${onglet}`}>
            {onglet === "fil" && (
              <CommunityFeed
                filtre={filtre}
                onFiltre={setFiltre}
                tri={tri}
                onTri={setTri}
              />
            )}
            {onglet === "videos" && <VictoryReelsFeed />}
            {onglet === "classement" && <PanneauClassement />}
          </div>
        </main>

        <Rail
          onFiltrer={(nature) => {
            setFiltre(nature);
            setOnglet("fil");
          }}
        />
      </div>
    </div>
  );
}
