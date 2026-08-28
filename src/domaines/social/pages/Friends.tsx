import { useEffect, useRef, useState } from "react";
import { Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/domaines/social/community.css";
import "@/domaines/social/friends.css";
/* La modale de fondation montre un apercu de la guilde : elle utilise
   donc les classes .gu-, qui vivent dans guild.css. */
import "@/domaines/social/guild.css";
import { PanneauAllies } from "@/domaines/social/composants/PanneauAllies";
import { PanneauGuildes } from "@/domaines/social/composants/PanneauGuildes";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useFriends } from "@/domaines/social/hooks/useFriends";
import { useFriendsPresence } from "@/domaines/social/hooks/useFriendsPresence";
import { useGuilds } from "@/domaines/social/hooks/useGuilds";

/* FRIENDS — la coque.
 *
 * CE QUI A ETE RETIRE, ET POURQUOI.
 *
 * — QUATRE ONGLETS, DONT TROIS VIDES. Amis, Demandes, Guildes,
 *   Recherche — pour une table friendships qui contient zero ligne.
 *   Demandes et Amis sont le meme objet a deux etats ; Recherche n est
 *   pas une destination mais un champ. Il en reste deux.
 *
 * — LE SUR-TITRE « ALLIANCE_GRID // SYS.ACTIVE » et le titre
 *   « FRIENDS » decoupe en deux pour colorer ses dernieres lettres.
 *   Un sur-titre ne dit rien que le titre ne dise, et celui-ci etait
 *   en anglais au-dessus d onglets francais.
 *
 * — LE BANDEAU A HUIT ETIQUETTES. Quatre indicateurs, chacun nomme
 *   DEUX FOIS et dans DEUX LANGUES : ALLIES au-dessus de ACTIFS,
 *   ONLINE au-dessus de EN LIGNE, SIGNALS au-dessus de EN ATTENTE,
 *   GUILDS au-dessus de REJOINTS. Trois de leurs quatre valeurs
 *   etaient des tirets, faute d amis. Ce qui se mesure vraiment est
 *   passe dans le rail.
 *
 * — LE BOUTON DE DENSITE, qui proposait de resserrer une liste vide.
 *
 * UN SEUL VOCABULAIRE, ET IL VIENT DU FICHIER DE LANGUE. La page
 * s appelait Friends, ses composants Alliance, son onglet guildes
 * « Active Factions », et ses onglets Amis et Guildes : quatre mots
 * pour deux choses. Tout passe desormais par t() — changer de langue
 * renomme reellement, y compris les deux onglets. */

type Onglet = "allies" | "guildes";
const ONGLETS: Onglet[] = ["allies", "guildes"];

function Rail() {
  const { t } = useTranslation();
  const { friends } = useFriends();
  const { onlineCount } = useFriendsPresence(friends.map((f) => f.friend_id));
  const { guilds } = useGuilds();

  return (
    <aside className="co-rail">
      <section className="co-bloc">
        <h2 className="co-bloc-titre">{t("friends.yourNetwork", "Votre réseau")}</h2>
        <div className="co-mesures">
          <div className="co-mesure">
            <span className="co-mesure-valeur">{friends.length}</span>
            <span className="co-mesure-quoi">{t("friends.alliesLabel", "alliés")}</span>
          </div>
          <div className="co-mesure">
            <span className="co-mesure-valeur">{onlineCount}</span>
            <span className="co-mesure-quoi">{t("friends.onlineLabel", "en ligne")}</span>
          </div>
        </div>
      </section>

      {guilds.length > 0 && (
        <section className="co-bloc">
          <h2 className="co-bloc-titre">{t("friends.myGuilds", "Mes guildes")}</h2>
          {guilds.map((g) => (
            <div className="co-rang" key={g.id}>
              <span className="co-rang-place">
                <Shield aria-hidden="true" style={{ width: 13, height: 13 }} />
              </span>
              <span />
              <span className="co-rang-nom">{g.name}</span>
              <span className="co-rang-xp">{g.member_count ?? 0}</span>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}

export default function Friends() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("allies");
  const [colle, setColle] = useState(false);
  const sentinelle = useRef<HTMLDivElement>(null);

  const { pendingCount } = useFriends();
  const { guilds } = useGuilds();

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

  if (!user) return null;

  const onglets: { cle: Onglet; libelle: string; Icone: typeof Users; compte?: number }[] = [
    { cle: "allies", libelle: t("friends.tabFriends", "Alliés"), Icone: Users, compte: pendingCount },
    { cle: "guildes", libelle: t("friends.tabGuilds", "Guildes"), Icone: Shield, compte: guilds.length },
  ];

  return (
    <div className="co">
      <div className="co-grille">
        <main className="co-colonne">
          <div ref={sentinelle} aria-hidden="true" style={{ height: 1 }} />

          <div className="co-tete" data-colle={colle ? "oui" : "non"}>
            <h1 className="sr-only">{t("friends.heading", "Alliés")}</h1>
            <div
              className="co-onglets"
              role="tablist"
              aria-label={t("friends.heading", "Alliés")}
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
                  id={`fr-onglet-${cle}`}
                  aria-selected={onglet === cle}
                  aria-controls={`fr-panneau-${cle}`}
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

          <div role="tabpanel" id={`fr-panneau-${onglet}`} aria-labelledby={`fr-onglet-${onglet}`}>
            {onglet === "allies" && <PanneauAllies />}
            {onglet === "guildes" && <PanneauGuildes />}
          </div>
        </main>

        <Rail />
      </div>
    </div>
  );
}
