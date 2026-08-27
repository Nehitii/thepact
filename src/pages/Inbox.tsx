import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { Bell, MessageSquare, CheckCheck, Trash2, Settings, PenLine, Users } from "lucide-react";
import "@/styles/community.css";
import "@/styles/inbox.css";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useMessages } from "@/hooks/useMessages";
import { useFriends } from "@/hooks/useFriends";
import { useCadres } from "@/hooks/community/useCadres";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { Pastille } from "@/components/community/Pastille";
import { nomAffichable } from "@/components/community/vocabulaire";
import { AvisCarte } from "@/components/notifications/AvisCarte";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * LA BOÎTE DE RÉCEPTION.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUE L'AUDIT A TROUVÉ, ET CE QUI EN DÉCOULE ICI
 *
 * — LA MESSAGERIE N'AVAIT PAS D'ENTRÉE. Zéro message envoyé en base,
 *   jamais, par personne. On n'atteignait un fil que depuis la liste
 *   des conversations, et cette liste se construit à partir des
 *   messages existants : une boucle fermée. D'où « Écrire à un
 *   allié », sous les conversations — la porte manquante.
 *
 * — LES CONVERSATIONS N'AVAIENT PAS DE NOM. Le hook posait
 *   « other_user_name: null » ; tout s'affichait en « Utilisateur
 *   inconnu ». Corrigé dans useMessages, qui appelle la projection
 *   publique.
 *
 * — DEUX CLASSES TAILWIND COMPOSÉES NE SORTAIENT RIEN.
 *   « border-${color} » et « bg-${color} » n'existent qu'à
 *   l'exécution : le compilateur ne les voit pas, aucune règle n'est
 *   produite. Mesuré : l'onglet Messages actif portait
 *   « border-violet text-violet » et rendait un bord GRIS. Et
 *   l'illustration du vide, censée être un fond à 5 %, sortait en
 *   violet plein — un disque de 96 px, parce que la chirurgie de
 *   chaîne « replace("/40","/5") » ne trouvait pas « /40 ».
 *
 * — TROIS MENSONGES À L'ÉCRAN. « SECURE CONNECTION ESTABLISHED »
 *   au-dessus du titre, une pastille verte « online indicator
 *   simulation » sur chaque avatar, et « Encrypted Channel » dans le
 *   fil. Rien de tout cela n'était vrai. Supprimés.
 *
 * — UNE REQUÊTE RÉSEAU VERS UN TIERS. Un bruit décoratif à 3 %
 *   d'opacité chargé depuis grainy-gradients.vercel.app, à chaque
 *   ouverture de la page. Supprimé.
 *
 * — « TOUT EFFACER » SUPPRIMAIT 66 LIGNES EN UN CLIC, sans
 *   confirmation et sans retour possible. Il demande maintenant.
 *
 * — CINQ MOIS D'ACCUMULATION. 66 avis, tous non lus, du 31 mars au
 *   25 août. Une liste plate ne se trie pas : les avis sont groupés
 *   par jour, et ceux qui n'ont nulle part où mener ne prétendent
 *   plus être cliquables.
 * ═══════════════════════════════════════════════════════════════
 */

type Vue = "avis" | "fils";

export default function Inbox() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const locale = useDateFnsLocale();
  const [vue, setVue] = useState<Vue>("avis");
  const [purgeDemandee, setPurgeDemandee] = useState(false);

  const {
    notifications, unreadCount, isLoading,
    markAsRead, markAllAsRead, deleteNotification, clearAll,
  } = useNotifications();

  const { conversations, nonLus: messagesNonLus, isLoading: filsEnCours } = useMessages();
  const { friends } = useFriends();

  /* Les alliés à qui l'on n'a pas encore écrit : c'est la porte. Ceux
     avec qui un fil existe sont déjà plus haut dans la liste. */
  const alliesSansFil = useMemo(() => {
    const dejaVus = new Set(conversations.map((c) => c.autreId));
    return friends.filter((f) => !dejaVus.has(f.friend_id));
  }, [friends, conversations]);

  const identifiants = useMemo(
    () => [...conversations.map((c) => c.autreId), ...alliesSansFil.map((f) => f.friend_id)],
    [conversations, alliesSansFil],
  );
  const { data: cadres } = useCadres(identifiants);

  /* LES AVIS, GROUPÉS PAR JOUR.
     Le libellé se calcule une fois par groupe et non par ligne : sur
     soixante-six avis, la différence se voit. */
  const groupes = useMemo(() => {
    const par = new Map<string, typeof notifications>();
    for (const n of notifications) {
      const d = new Date(n.created_at);
      const cle = isToday(d) ? "@aujourdhui"
        : isYesterday(d) ? "@hier"
        : isThisWeek(d, { weekStartsOn: 1 }) ? "@semaine"
        : format(d, "yyyy-MM");
      const liste = par.get(cle);
      if (liste) liste.push(n); else par.set(cle, [n]);
    }
    return [...par.entries()].map(([cle, liste]) => ({
      cle,
      titre:
        cle === "@aujourdhui" ? t("inbox.notifications.today", "Aujourd'hui")
        : cle === "@hier" ? t("inbox.notifications.yesterday", "Hier")
        : cle === "@semaine" ? t("inbox.groupWeek", "Cette semaine")
        : format(new Date(liste[0].created_at), "LLLL yyyy", { locale }),
      liste,
    }));
  }, [notifications, t, locale]);

  const quand = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return t("inbox.yesterdayShort", "Hier");
    if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, "EEEE", { locale });
    return format(d, "dd/MM/yy");
  };

  if (!user) return null;

  return (
    <div className="bx page-px">
      <header className="bx-tete">
        <div>
          <h1 className="bx-titre">{t("inbox.title", "Boîte de réception")}</h1>
          <p className="bx-sous">
            {t("inbox.notificationCount", { count: notifications.length })}
            {" · "}
            {t("inbox.conversationCount", { count: conversations.length })}
          </p>
        </div>
        <button type="button" className="bx-reglages" onClick={() => navigate("/profile/notifications")}>
          <Settings aria-hidden="true" />
          {t("common.settings", "Paramètres")}
        </button>
      </header>

      <div className="bx-onglets" role="tablist" aria-label={t("inbox.title", "Boîte de réception")}>
        <button
          type="button" role="tab" data-ton="signal"
          aria-selected={vue === "avis"}
          className="bx-onglet"
          onClick={() => setVue("avis")}
        >
          <Bell aria-hidden="true" />
          {t("inbox.tabs.notifications", "Notifications")}
          {unreadCount > 0 && <span className="bx-compte">{unreadCount}</span>}
        </button>
        <button
          type="button" role="tab" data-ton="humain"
          aria-selected={vue === "fils"}
          className="bx-onglet"
          onClick={() => setVue("fils")}
        >
          <MessageSquare aria-hidden="true" />
          {t("inbox.tabs.messages", "Messages")}
          {messagesNonLus > 0 && <span className="bx-compte">{messagesNonLus}</span>}
        </button>
      </div>

      {vue === "avis" ? (
        <>
          <div className="bx-actions">
            {unreadCount > 0 && (
              <button type="button" className="bx-action" onClick={() => markAllAsRead.mutate()}>
                <CheckCheck aria-hidden="true" />
                {t("inbox.markAllRead", "Tout marquer comme lu")}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button" className="bx-action" data-ton="danger"
                onClick={() => setPurgeDemandee(true)}
              >
                <Trash2 aria-hidden="true" />
                {t("inbox.clearAll", "Tout effacer")}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="bx-liste" aria-busy="true">
              {[0, 1, 2].map((i) => <span key={i} className="bx-os" style={{ height: 68 }} />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bx-vide">
              <Bell aria-hidden="true" />
              <h3>{t("inbox.emptyNotifications", "Aucune notification")}</h3>
              <p>{t("inbox.emptyNotificationsWhy", "Rien n'attend votre attention. Les rappels de vos modules arriveront ici.")}</p>
            </div>
          ) : (
            groupes.map((g) => (
              <section key={g.cle}>
                <h2 className="bx-jour">{g.titre}</h2>
                <div className="bx-liste">
                  {g.liste.map((n) => (
                    <AvisCarte
                      key={n.id}
                      avis={n}
                      quand={quand(n.created_at)}
                      onLu={() => markAsRead.mutate(n.id)}
                      onEcarter={() => deleteNotification.mutate(n.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      ) : (
        <>
          {filsEnCours ? (
            <div className="bx-liste" aria-busy="true">
              {[0, 1].map((i) => <span key={i} className="bx-os" style={{ height: 62 }} />)}
            </div>
          ) : conversations.length > 0 ? (
            <div className="bx-liste">
              {conversations.map((c) => {
                const nom = nomAffichable(c.nom, t("friends.unknownAgent", "Agent Inconnu"));
                return (
                  <button
                    key={c.autreId}
                    type="button"
                    className="bx-fil"
                    data-lu={c.nonLus > 0 ? "non" : "oui"}
                    onClick={() => navigate(`/inbox/thread/${c.autreId}`)}
                  >
                    <Pastille identifiant={c.autreId} nom={c.nom} image={c.avatar} cadre={cadres?.get(c.autreId)} />
                    <span className="bx-fil-corps">
                      <span className="bx-fil-haut">
                        <span className="bx-fil-nom">{nom}</span>
                        <span className="bx-fil-quand">{quand(c.dernierLe)}</span>
                      </span>
                      <span className="bx-fil-extrait">
                        {c.deMoi && <i>{t("inbox.you", "Vous")} : </i>}
                        {c.dernier}
                      </span>
                    </span>
                    {c.nonLus > 0 && <span className="bx-fil-pastille">{c.nonLus}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bx-vide">
              <MessageSquare aria-hidden="true" />
              <h3>{t("inbox.emptyMessages", "Aucune conversation")}</h3>
              <p>
                {friends.length > 0
                  ? t("inbox.emptyMessagesAllies", "Vous écrivez à vos alliés. Choisissez-en un ci-dessous.")
                  : t("inbox.emptyMessagesNoAlly", "On écrit à ses alliés. Ajoutez quelqu'un pour ouvrir une première conversation.")}
              </p>
              {friends.length === 0 && (
                <button type="button" onClick={() => navigate("/friends")}>
                  {t("inbox.goToFriends", "Trouver des alliés")}
                </button>
              )}
            </div>
          )}

          {alliesSansFil.length > 0 && (
            <div className="bx-porte">
              <h2 className="bx-porte-titre">{t("inbox.writeTo", "Écrire à un allié")}</h2>
              {alliesSansFil.map((f) => (
                <button
                  key={f.friend_id}
                  type="button"
                  className="bx-allie"
                  onClick={() => navigate(`/inbox/thread/${f.friend_id}`)}
                >
                  <Pastille
                    identifiant={f.friend_id} nom={f.display_name} image={f.avatar_url}
                    cadre={cadres?.get(f.friend_id)} petite
                  />
                  <b>{nomAffichable(f.display_name, t("friends.unknownAgent", "Agent Inconnu"))}</b>
                  <span><PenLine aria-hidden="true" />{t("inbox.write", "Écrire")}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* LA PURGE DEMANDE. Elle efface définitivement, y compris les avis
          que le filtre de catégories masque à l'écran : on le dit, parce
          que « tout » ne veut pas dire « ce que je vois ». */}
      <AlertDialog open={purgeDemandee} onOpenChange={setPurgeDemandee}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inbox.clearAllTitle", "Effacer toutes les notifications ?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("inbox.clearAllWhy", "Elles seront supprimées définitivement, y compris celles que vos réglages de catégories masquent ici. Cette action ne s'annule pas.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Annuler")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => clearAll.mutate()}>
              {t("inbox.clearAll", "Tout effacer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
