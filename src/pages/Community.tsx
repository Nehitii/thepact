import { useState } from "react";
import { Clapperboard, MessagesSquare, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/styles/community.css";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { ClassementLigne } from "@/components/community/ClassementLigne";
import { useCommunityStats } from "@/hooks/useCommunity";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";

/* COMMUNITY — la coque.
 *
 * CE QUI A ETE RETIRE, ET POURQUOI.
 *
 * — LE BANDEAU DEFILANT. Cinq indicateurs en boucle, vingt-deux
 *   secondes par tour, dont trois etaient des tirets ecrits en dur.
 *   Un bandeau qui defile en permanence occupe le regard sans jamais
 *   rien apprendre ; celui-ci mentait en plus.
 *
 * — LA RANGEE DE TROIS TUILES. « 0 Online now », « 0 Posts / week »
 *   et « 38 Goals completed » — le 38 etant un litteral, sans aucun
 *   lien avec la communaute. C etait aussi le patron « grand chiffre,
 *   petit libelle, accent », qui remplit une page sans la nourrir.
 *   Les chiffres vrais sont passes dans le rail, ou ils accompagnent
 *   le fil au lieu de le preceder.
 *
 * — LES TROIS TUILES D ONGLET. Chacune portait un emoji dans un carre
 *   colore, un titre, une description et un badge — dont un « 184 »
 *   au-dessus d un onglet dont la table etait vide. Trois mots
 *   soulignes suffisent, c est ce que font les trois references.
 *
 * — LE TITRE EN DEGRADE et son etiquette « Neural Network · Live ».
 *   Un sur-titre au-dessus d un titre ne dit rien que le titre ne
 *   dise ; le degrade sur le texte remplace la hierarchie par de la
 *   couleur.
 *
 * — TOUTES LES ANIMATIONS D ENTREE. Huit etats initiaux a opacite
 *   zero laissaient la page BLANCHE dans un onglet d arriere-plan :
 *   mesure sur place, le titre gele a 17 % et les deux grilles a
 *   zero. Pire, AnimatePresence en mode « wait » attendait une
 *   animation de sortie qui ne venait jamais — la bascule d onglets
 *   ne repondait plus du tout. Le changement d onglet est desormais
 *   immediat.
 *
 * Reste la structure d un vrai reseau : une colonne de lecture
 * bordee, une tete collante, un rail qui porte l etat de la
 * communaute. */

type Onglet = "fil" | "videos" | "classement";

function Mesure({ valeur, quoi }: { valeur: number | undefined; quoi: string }) {
  return (
    <div className="co-mesure">
      <span className="co-mesure-valeur">{(valeur ?? 0).toLocaleString()}</span>
      <span className="co-mesure-quoi">{quoi}</span>
    </div>
  );
}

function Rail() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats } = useCommunityStats();
  const { data: classement = [] } = useLeaderboard();

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
        <p className="co-rail-pied" style={{ borderTop: "none", borderBottom: "1px solid var(--co-filet)", color: "var(--co-texte-2)" }}>
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
  const { data: stats } = useCommunityStats();

  const onglets: { cle: Onglet; libelle: string; Icone: typeof MessagesSquare; compte?: number }[] = [
    { cle: "fil", libelle: t("community.tabs.feed", "Fil"), Icone: MessagesSquare, compte: stats?.postsTotal },
    { cle: "videos", libelle: t("community.tabs.reels", "Vidéos"), Icone: Clapperboard, compte: stats?.reelsTotal },
    { cle: "classement", libelle: t("leaderboard.title", "Classement"), Icone: Trophy },
  ];

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <div className="co-tete">
            <h1 className="co-titre">{t("community.heading", "Communauté")}</h1>
            <div className="co-onglets" role="tablist" aria-label={t("community.heading", "Communauté")}>
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
            </div>
          </div>

          <div role="tabpanel" id={`co-panneau-${onglet}`} aria-labelledby={`co-onglet-${onglet}`}>
            {onglet === "fil" && <CommunityFeed />}
            {onglet === "videos" && <VictoryReelsFeed />}
            {onglet === "classement" && <PanneauClassement />}
          </div>
        </main>

        <Rail />
      </div>
    </div>
  );
}
