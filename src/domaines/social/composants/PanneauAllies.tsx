import { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LigneMembre } from "@/domaines/social/composants/LigneMembre";
import { useCadres } from "@/domaines/social/hooks/useCadres";
import { useFriends } from "@/domaines/social/hooks/useFriends";
import { useFriendsPresence } from "@/domaines/social/hooks/useFriendsPresence";
import { useLeaderboard } from "@/domaines/social/hooks/useLeaderboard";

/* LE PANNEAU DES ALLIES.
 *
 * IL S OUVRE SUR LA RECHERCHE, ET C EST TOUT LE CHANGEMENT.
 *
 * L ancienne page ouvrait sur la liste des amis — vide, elle l a
 * toujours ete — et rangeait la recherche en QUATRIEME onglet. Le seul
 * geste capable de sortir de cet etat etait donc le plus loin de la
 * main. Ici le champ est en tete, toujours la : on arrive sur cette
 * page pour rencontrer quelqu un, pas pour administrer un carnet
 * d adresses qu on n a pas.
 *
 * LES DEMANDES SONT DANS LA MEME LISTE. Elles avaient leur onglet ;
 * il fallait donc y aller pour savoir s il s y passait quelque chose.
 * Une demande est un allie en devenir : elle est en tete de la meme
 * liste, avec ses deux boutons.
 *
 * CE QUE MONTRE UNE LIGNE. Un avatar et un nom ne disent rien de ce
 * que fait quelqu un. Dans une application de discipline, ce qui
 * interesse c est la progression : les objectifs menes a terme, le
 * grade, et le dernier signe de vie — que useFriendsPresence tient
 * deja et que l ancienne page reduisait a un chiffre dans un bandeau
 * qui affichait un tiret. */

const DELAI_RECHERCHE = 280;

interface Trouve { id: string; display_name: string | null; avatar_url: string | null }

export function PanneauAllies() {
  const { t } = useTranslation();
  const [requete, setRequete] = useState("");
  const [trouves, setTrouves] = useState<Trouve[]>([]);
  const [cherche, setCherche] = useState(false);

  const {
    friends, pendingRequests, sentRequests, friendsLoading,
    sendRequest, acceptRequest, declineRequest, removeFriend, cancelSentRequest,
    getFriendshipStatus, searchProfiles,
  } = useFriends();

  const { lastSeenMap } = useFriendsPresence(friends.map((f) => f.friend_id));
  const { data: classement = [] } = useLeaderboard();

  /* Une seule requete de cadres pour tout ce que la page affiche. */
  const identifiants = useMemo(() => [
    ...friends.map((f) => f.friend_id),
    ...pendingRequests.map((r) => r.sender_id),
    ...sentRequests.map((r) => r.receiver_id),
    ...trouves.map((p) => p.id),
  ], [friends, pendingRequests, sentRequests, trouves]);
  const { data: cadres } = useCadres(identifiants);

  /* Le classement porte deja les objectifs accomplis et le grade de
     chacun : on s en sert plutot que d interroger la base une
     deuxieme fois par allie. */
  const progression = useMemo(() => {
    const m = new Map<string, { objectifs: number; grade: string | null }>();
    classement.forEach((e) => m.set(e.user_id, { objectifs: e.goals_completed, grade: e.rank_name }));
    return m;
  }, [classement]);

  /* La recherche attend qu on ait fini de taper : sans cela, chaque
     touche envoyait une requete. */
  useEffect(() => {
    const q = requete.trim();
    if (q.length < 2) { setTrouves([]); setCherche(false); return; }
    setCherche(true);
    const minuteur = setTimeout(async () => {
      try {
        setTrouves(await searchProfiles(q));
      } catch {
        setTrouves([]);
      } finally {
        setCherche(false);
      }
    }, DELAI_RECHERCHE);
    return () => clearTimeout(minuteur);
    // searchProfiles est recree a chaque rendu ; le suivre relancerait la recherche sans fin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requete]);

  const enRecherche = requete.trim().length >= 2;

  return (
    <>
      <div className="fr-chercher">
        <Search aria-hidden="true" />
        <input
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder={t("friends.searchPlaceholder2", "Chercher quelqu'un par son nom…")}
          aria-label={t("friends.searchPlaceholder2", "Chercher quelqu'un par son nom…")}
        />
        {requete && (
          <button
            type="button"
            className="co-puce"
            onClick={() => setRequete("")}
            aria-label={t("friends.clearSearch", "Effacer la recherche")}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      {enRecherche ? (
        cherche && trouves.length === 0 ? (
          <p className="co-choix-message">{t("friends.searching", "Recherche…")}</p>
        ) : trouves.length === 0 ? (
          <div className="co-vide">
            <Search aria-hidden="true" />
            <h3>{t("friends.noResults", "Personne de ce nom")}</h3>
            <p>{t("friends.noResultsWhy", "La recherche porte sur le nom affiché. Vérifiez l'orthographe, ou demandez-lui le sien.")}</p>
          </div>
        ) : (
          trouves.map((p) => {
            const etat = getFriendshipStatus(p.id);
            const prog = progression.get(p.id);
            return (
              <LigneMembre
                key={p.id}
                identifiant={p.id}
                nom={p.display_name}
                avatar={p.avatar_url}
                cadre={cadres?.get(p.id)}
                objectifs={prog?.objectifs}
                grade={prog?.grade}
                etat={
                  etat === "accepted" ? "allie"
                  : etat === "pending_sent" ? "demande-envoyee"
                  : etat === "pending_received" ? "demande-recue"
                  : "inconnu"
                }
                occupe={sendRequest.isPending}
                onAjouter={async () => {
                  await sendRequest.mutateAsync(p.id);
                  toast.success(t("friends.requestSent", "Demande envoyée"));
                }}
              />
            );
          })
        )
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <>
              <h2 className="fr-section">{t("friends.receivedRequests", "Demandes reçues")}</h2>
              {pendingRequests.map((r) => (
                <LigneMembre
                  key={r.id}
                  identifiant={r.sender_id}
                  nom={r.sender_profile?.display_name ?? null}
                  avatar={r.sender_profile?.avatar_url}
                  cadre={cadres?.get(r.sender_id)}
                  objectifs={progression.get(r.sender_id)?.objectifs}
                  grade={progression.get(r.sender_id)?.grade}
                  etat="demande-recue"
                  occupe={acceptRequest.isPending || declineRequest.isPending}
                  onAccepter={() => acceptRequest.mutate(r.id)}
                  onRefuser={() => declineRequest.mutate(r.id)}
                />
              ))}
            </>
          )}

          {sentRequests.length > 0 && (
            <>
              <h2 className="fr-section">{t("friends.sentRequests", "Demandes envoyées")}</h2>
              {sentRequests.map((r) => (
                <LigneMembre
                  key={r.id}
                  identifiant={r.receiver_id}
                  nom={r.receiver_profile?.display_name ?? null}
                  avatar={r.receiver_profile?.avatar_url}
                  cadre={cadres?.get(r.receiver_id)}
                  etat="demande-envoyee"
                  occupe={cancelSentRequest.isPending}
                  onAnnuler={() => cancelSentRequest.mutate(r.id)}
                />
              ))}
            </>
          )}

          {friendsLoading ? (
            <div aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div className="co-fantome" key={i}>
                  <span className="co-os co-os--rond" />
                  <span className="co-os" style={{ height: 14, alignSelf: "center" }} />
                </div>
              ))}
            </div>
          ) : friends.length > 0 ? (
            <>
              <h2 className="fr-section">
                {t("friends.tabFriends", "Alliés")}
                <span className="fr-section-compte">{friends.length}</span>
              </h2>
              {friends.map((f) => (
                <LigneMembre
                  key={f.friendship_id}
                  identifiant={f.friend_id}
                  nom={f.display_name}
                  avatar={f.avatar_url}
                  cadre={cadres?.get(f.friend_id)}
                  vuLe={lastSeenMap?.[f.friend_id] ?? null}
                  objectifs={progression.get(f.friend_id)?.objectifs}
                  grade={progression.get(f.friend_id)?.grade}
                  etat="allie"
                  onRetirer={() => removeFriend.mutate(f.friendship_id)}
                />
              ))}
            </>
          ) : (
            pendingRequests.length === 0 && sentRequests.length === 0 && (
              <div className="co-vide">
                <Users aria-hidden="true" />
                <h3>{t("friends.noFriendsTitle", "Pas encore d'alliés")}</h3>
                <p>{t("friends.noAlliesWhy", "Cherchez quelqu'un par son nom dans le champ ci-dessus. Une demande part, et il n'a plus qu'à l'accepter.")}</p>
              </div>
            )
          )}
        </>
      )}
    </>
  );
}
