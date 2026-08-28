import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useThemeSombre } from "@/hooks/useThemeSombre";
import { selonTheme } from "@/lib/encrePapier";
import { Flame, Footprints, Gem, Globe, Mountain, Target, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/domaines/social/community.css";
import "@/domaines/social/classement.css";
import { useAuth } from "@/contexts/AuthContext";
import { Pastille } from "@/domaines/social/composants/Pastille";
import { nomAffichable } from "@/domaines/social/logique/vocabulaire";
import { SurvolProfil } from "@/domaines/profil";
import { useCadres, type Cadre } from "@/domaines/social/hooks/useCadres";
import { useCordee, type Grimpeur } from "@/hooks/useCordee";
import { useLeaderboard } from "@/domaines/social/hooks/useLeaderboard";
import { useRangs } from "@/hooks/useRangs";
import { avatarSimule } from "@/lib/avatarSimule";

/* LE CLASSEMENT.
 *
 * L ancienne page classait sur pacts.points — une colonne que rien
 * n ecrit et qui vaut zero pour tout le monde. Elle rendait donc un
 * ordre arbitraire entre des zeros, en Orbitron capitales, avec des
 * lignes qui naissaient a opacity: 0 sous framer-motion.
 *
 * DEUX CLASSEMENTS, parce qu ils ne repondent pas a la meme question.
 *
 *   LE MONDE  · les vraies personnes, avec leur vrai XP. Il est juste,
 *               et pour l instant il est presque vide : c est la
 *               verite, et on la dit.
 *
 *   LA CORDEE · des grimpeurs simules sur VOTRE voie. Leurs points
 *               sont une fraction du pacte que vous avez ecrit, leurs
 *               rangs sont les dix que vous avez nommes, et le premier
 *               est a 90 % de votre pacte complet — a portee.
 *
 * La cordee ne se cache pas d en etre une : elle le dit sous son
 * onglet. Faire passer des rivaux calcules pour des gens serait un
 * mensonge, et un mensonge dont on se lasse le jour ou on le comprend.
 * Dit franchement, c est un banc d essai — et un banc d essai motive
 * tant qu il reste honnete. */

type Onglet = "monde" | "cordee";

interface LigneClassement {
  cle: string;
  place: number;
  userId?: string;
  nom: string;
  devise?: string | null;
  avatar?: string | null;
  xp: number;
  objectifs: number;
  etapes?: number;
  serie?: number;
  rang: string | null;
  couleur: string | null;
  moi: boolean;
}

function Palier({ nom, couleur }: { nom: string | null; couleur: string | null }) {
  /* La teinte d un palier vient de la base : ce sont des couleurs
     choisies pour le theme sombre, et rien ne garantit qu elles
     portent sur du papier — mesure avant correction : 1,6:1 sur les
     trois paliers hauts. selonTheme conserve la teinte au degre pres
     et ne descend que sa clarte. */
  const sombre = useThemeSombre();
  if (!nom) return null;
  return (
    <span className="cl-palier" style={{ "--cl-teinte": couleur ? selonTheme(couleur, sombre) : undefined } as CSSProperties}>
      <Gem aria-hidden="true" />
      {nom}
    </span>
  );
}

function Ligne({ l, cadre }: { l: LigneClassement; cadre?: Cadre }) {
  const { t } = useTranslation();

  const corps = (
    <article
      className="cl-ligne"
      data-podium={l.place <= 3 ? l.place : undefined}
      data-moi={l.moi ? "" : undefined}
    >
      <span className="cl-place">{l.place}</span>

      <Pastille identifiant={l.userId || l.nom} nom={l.nom} image={l.avatar} cadre={cadre} />

      <div className="cl-qui">
        <p className="cl-nom">
          {l.nom}
          {l.moi && <span className="cl-moi">{t("leaderboard.you", "(TOI)")}</span>}
        </p>
        <div className="cl-sous">
          <Palier nom={l.rang} couleur={l.couleur} />
          {l.devise && <span className="cl-devise">{l.devise}</span>}
        </div>
      </div>

      <div className="cl-faits">
        <span className="cl-xp">{l.xp.toLocaleString()}</span>
        <span className="cl-detail">
          <span title={t("leaderboard.goals", "Objectifs")}>
            <Target aria-hidden="true" />
            {l.objectifs}
          </span>
          {l.etapes !== undefined && (
            <span title={t("leaderboard.steps", "Étapes")}>
              <Footprints aria-hidden="true" />
              {l.etapes}
            </span>
          )}
          {l.serie !== undefined && (
            <span title={t("leaderboard.streak", "Jours de série")}>
              <Flame aria-hidden="true" />
              {l.serie}
            </span>
          )}
        </span>
      </div>
    </article>
  );

  /* Seules les vraies personnes ont une carte de profil a montrer. */
  return l.userId ? <SurvolProfil userId={l.userId}>{corps}</SurvolProfil> : corps;
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("cordee");
  const [colle, setColle] = useState(false);

  const { data: monde = [], isLoading: chargeMonde } = useLeaderboard(50);
  const { data: cordee = [], isLoading: chargeCordee } = useCordee(user?.id);
  const { data: rangs } = useRangs(user ? [user.id] : []);
  const { data: cadres } = useCadres(monde.map((e) => e.user_id));

  const moi = monde.find((e) => e.user_id === user?.id);
  const monRang = rangs?.get(user?.id ?? "");
  const monXp = moi?.points ?? monRang?.xp ?? 0;

  /* Le monde compte-t-il quelqu un d autre ? Tant que non, la cordee
     est ce qu on ouvre en arrivant : un classement d une seule
     personne ne classe rien. */
  const dAutresGens = monde.filter((e) => e.user_id !== user?.id && e.points > 0).length;
  useEffect(() => {
    if (!chargeMonde && dAutresGens > 0) setOnglet("monde");
  }, [chargeMonde, dAutresGens]);

  useEffect(() => {
    const surDefilement = () => setColle(window.scrollY > 4);
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  const lignesMonde: LigneClassement[] = useMemo(
    () => monde.map((e, i) => ({
      cle: e.user_id,
      place: i + 1,
      userId: e.user_id,
      nom: nomAffichable(e.display_name, t("leaderboard.anonymousAgent", "Agent Anonyme")),
      avatar: e.avatar_url,
      xp: e.points,
      objectifs: e.goals_completed,
      rang: e.rank_name,
      couleur: null,
      moi: e.user_id === user?.id,
    })),
    [monde, user?.id, t],
  );

  /* LA CORDEE VOUS INCLUT. Un banc d essai ou l on ne figure pas ne
     mesure rien : votre ligne est inseree a sa vraie place, entre les
     deux grimpeurs qui vous encadrent. */
  const lignesCordee: LigneClassement[] = useMemo(() => {
    const mien: LigneClassement = {
      cle: "moi",
      place: 0,
      userId: user?.id,
      nom: nomAffichable(moi?.display_name, t("leaderboard.you", "Vous")),
      avatar: moi?.avatar_url,
      xp: monXp,
      objectifs: moi?.goals_completed ?? 0,
      rang: monRang?.nom ?? moi?.rank_name ?? null,
      couleur: monRang?.couleur ?? null,
      moi: true,
    };

    const eux: LigneClassement[] = (cordee as Grimpeur[]).map((g) => ({
      cle: `g${g.place}`,
      place: 0,
      nom: g.nom,
      /* Une figure abstraite tiree du nom, comme en posent Linear ou
         Vercel a qui n a pas depose de photo. Pas un visage : coller
         des visages sur des comptes qui n existent pas, ce serait
         fabriquer des gens. */
      avatar: avatarSimule(g.nom + g.place),
      devise: g.devise,
      xp: g.xp,
      objectifs: g.objectifs,
      etapes: g.etapes,
      serie: g.serie,
      rang: g.rang,
      couleur: g.couleur,
      moi: false,
    }));

    return [...eux, mien]
      .sort((a, b) => b.xp - a.xp)
      .map((l, i) => ({ ...l, place: i + 1 }));
  }, [cordee, moi, monXp, monRang, user?.id, t]);

  const lignes = onglet === "monde" ? lignesMonde : lignesCordee;
  const charge = onglet === "monde" ? chargeMonde : chargeCordee;

  /* L ECART AVEC CELUI DE DEVANT est le seul chiffre qui dit quoi
     faire : un classement sans ecart se regarde, un classement avec
     ecart se grimpe. */
  const maPlace = lignes.findIndex((l) => l.moi);
  const devant = maPlace > 0 ? lignes[maPlace - 1] : null;
  const monXpIci = maPlace >= 0 ? lignes[maPlace].xp : 0;
  const ecart = devant ? devant.xp - monXpIci : 0;

  const ONGLETS: Onglet[] = ["monde", "cordee"];

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <div className="co-tete" data-colle={colle ? "oui" : "non"}>
            <h1 className="sr-only">{t("leaderboard.heading", "Classement")}</h1>
            <div
              className="co-onglets"
              role="tablist"
              aria-label={t("leaderboard.heading", "Classement")}
              style={{
                ["--co-nb" as string]: ONGLETS.length,
                ["--co-actif" as string]: ONGLETS.indexOf(onglet),
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={onglet === "monde"}
                className="co-onglet"
                onClick={() => setOnglet("monde")}
              >
                <Globe aria-hidden="true" />
                {t("leaderboard.world", "Le monde")}
                {dAutresGens > 0 && <span className="co-onglet-compte">{dAutresGens + 1}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={onglet === "cordee"}
                className="co-onglet"
                onClick={() => setOnglet("cordee")}
              >
                <Mountain aria-hidden="true" />
                {t("leaderboard.rope", "La cordée")}
              </button>
              <span className="co-onglets-trait" aria-hidden="true" />
            </div>
          </div>

          {onglet === "cordee" && (
            <p className="cl-avis">
              {t(
                "leaderboard.ropeWhat",
                "Des grimpeurs simulés, calibrés sur votre pacte : le premier a franchi 90 % de ce que vous vous êtes fixé. Ils ne bougent pas — c’est vous qui montez.",
              )}
            </p>
          )}

          {onglet === "monde" && dAutresGens === 0 && !chargeMonde && (
            <p className="cl-avis">
              {t(
                "leaderboard.worldEmpty",
                "Personne d’autre n’a encore de points. En attendant, la cordée vous donne des repères.",
              )}
            </p>
          )}

          {charge ? (
            <div aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div className="co-fantome" key={i}>
                  <span className="co-os co-os--rond" />
                  <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
                </div>
              ))}
            </div>
          ) : (
            <div role="tabpanel">
              {lignes.map((l) => (
                <Ligne key={l.cle} l={l} cadre={l.userId ? cadres?.get(l.userId) : undefined} />
              ))}
            </div>
          )}
        </main>

        <aside className="co-rail">
          <section className="co-bloc">
            <h2 className="co-bloc-titre">{t("leaderboard.yourStanding", "Où vous en êtes")}</h2>
            <div className="cl-rail-corps">
              <div className="cl-rail-place">
                <span className="cl-rail-chiffre">{maPlace >= 0 ? maPlace + 1 : "—"}</span>
                <span className="cl-rail-sur">
                  {t("leaderboard.outOf", "sur {{n}}", { n: lignes.length })}
                </span>
              </div>
              <Palier nom={monRang?.nom ?? null} couleur={monRang?.couleur ?? null} />
            </div>

            <div className="co-mesures">
              <div className="co-mesure">
                <span className="co-mesure-valeur">{monXp.toLocaleString()}</span>
                <span className="co-mesure-quoi">{t("leaderboard.xp", "XP")}</span>
              </div>
              <div className="co-mesure">
                <span className="co-mesure-valeur">{moi?.goals_completed ?? 0}</span>
                <span className="co-mesure-quoi">{t("leaderboard.goals", "Objectifs")}</span>
              </div>
            </div>
          </section>

          {devant && (
            <section className="co-bloc">
              <h2 className="co-bloc-titre cl-rail-titre">
                <TrendingUp aria-hidden="true" />
                {t("leaderboard.nextUp", "Juste devant")}
              </h2>
              <div className="cl-rail-corps">
                <p className="cl-rail-cible">{devant.nom}</p>
                <p className="cl-rail-ecart">
                  {t("leaderboard.gap", "{{n}} XP à reprendre", { n: ecart.toLocaleString() })}
                </p>
                <span className="cl-rail-jauge" aria-hidden="true">
                  <i style={{ width: `${devant.xp > 0 ? Math.min(100, (monXpIci / devant.xp) * 100) : 0}%` }} />
                </span>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
