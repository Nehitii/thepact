import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chargerProfilsPublics } from "@/domaines/profil";

/**
 * LA MESSAGERIE PRIVÉE.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI ÉTAIT CASSÉ ICI, ET QUI NE SE VOYAIT PAS
 *
 * 1. LES CONVERSATIONS N'AVAIENT PAS DE NOM. Le regroupement posait
 *    « other_user_name: null » avec, en commentaire, « would need to
 *    join with profiles ». Toute la liste s'affichait donc en
 *    « Utilisateur inconnu », avec un « ? » en guise d'avatar. Et la
 *    jointure demandée n'aurait rien donné : `profiles` n'a qu'une
 *    politique de lecture, `auth.uid() = id`. On ne lit que sa propre
 *    ligne. C'est `profils_publics` qu'il faut appeler — la projection
 *    publique, qui applique côté serveur la règle de visibilité.
 *
 * 2. LE COMPTE DES NON-LUS TIRAIT TOUS LES MESSAGES. La barre
 *    latérale et la barre du bas n'ont besoin que d'un nombre ; elles
 *    téléchargeaient l'intégralité de la correspondance pour le
 *    calculer en mémoire. `useMessagesNonLus` ne demande qu'un compte.
 *
 * 3. RIEN N'ARRIVAIT EN DIRECT. La table n'était pas publiée dans
 *    `supabase_realtime` — l'abonnement de l'écran du fil écoutait le
 *    vide. La migration l'y a ajoutée ; l'abonnement vit désormais
 *    dans `useMessagesEnDirect`, monté une seule fois par AppLayout,
 *    plutôt que recopié par écran.
 *
 * 4. `staleTime: 5 minutes` SUR UNE MESSAGERIE. Un message reçu
 *    n'apparaissait pas avant cinq minutes. Le direct rend ce délai
 *    inutile : on garde un cache court et l'abonnement invalide.
 *
 * 5. `useUserBlocks` VIVAIT ICI, et personne ne l'importait. Il
 *    parlait à `user_blocks`, table vide qu'aucune politique ne
 *    consulte — le blocage réel est dans `blocked_users`. Supprimé
 *    plutôt que branché : deux tables pour une idée, c'est un piège.
 * ═══════════════════════════════════════════════════════════════
 */

export interface MessagePrive {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  autreId: string;
  /** Nul quand le profil n'est pas visible : le serveur ne l'envoie pas. */
  nom: string | null;
  avatar: string | null;
  dernier: string;
  dernierLe: string;
  /** Vrai si le dernier message vient de nous : la liste le préfixe. */
  deMoi: boolean;
  nonLus: number;
}

/** La clé du fil complet. Une seule, pour que tout s'invalide ensemble. */
const CLE_MESSAGES = (userId: string | undefined) => ["messages", userId] as const;
const CLE_NON_LUS = (userId: string | undefined) => ["messages-non-lus", userId] as const;

/**
 * LE COMPTE DES NON-LUS, ET RIEN D'AUTRE.
 *
 * Pour les pastilles de navigation. `head: true` ne rapporte aucune
 * ligne — seulement le nombre, dans un en-tête.
 */
export function useMessagesNonLus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: nonLus = 0 } = useQuery({
    queryKey: CLE_NON_LUS(user?.id),
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("private_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  return { nonLus };
}

/**
 * LE DIRECT, MONTÉ UNE SEULE FOIS.
 *
 * IL VIVAIT DANS useMessagesNonLus, ET C'ÉTAIT UNE ERREUR : la barre
 * latérale ET la barre du bas appellent ce hook, donc deux effets
 * ouvraient un canal du MÊME nom. Le client Supabase réutilise le
 * canal existant pour un nom donné ; le second .on() tombait donc sur
 * un canal déjà souscrit et levait « cannot add postgres_changes
 * callbacks after subscribe() » — écran d'erreur sur toute
 * l'application. Mesuré en direct avant correction.
 *
 * Il s'appelle donc depuis AppLayout, une fois, au-dessus des deux
 * barres. Un seul canal, une seule invalidation par message.
 */
export function useMessagesEnDirect() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const canal = supabase
      .channel(`messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "private_messages" },
        (charge) => {
          /* Le flux ne connaît pas RLS : on écarte ce qui ne nous
             concerne pas plutôt que de recharger pour autrui. */
          const l = (charge.new ?? charge.old) as Partial<MessagePrive> | null;
          if (!l || (l.sender_id !== user.id && l.receiver_id !== user.id)) return;
          queryClient.invalidateQueries({ queryKey: CLE_NON_LUS(user.id) });
          queryClient.invalidateQueries({ queryKey: CLE_MESSAGES(user.id) });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [user?.id, queryClient]);
}

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: CLE_MESSAGES(user?.id),
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("private_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MessagePrive[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  /* Les identifiants d'en face, dédupliqués, dans l'ordre de récence. */
  const autresIds = useMemo(() => {
    const vus = new Set<string>();
    const ordre: string[] = [];
    for (const m of messages) {
      const autre = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
      if (!vus.has(autre)) { vus.add(autre); ordre.push(autre); }
    }
    return ordre;
  }, [messages, user?.id]);

  /* Une requête pour tous les noms, pas une par conversation. La clé
     porte les identifiants : elle ne se recharge que s'ils changent. */
  const { data: profils } = useQuery({
    queryKey: ["profils-publics", autresIds.join(",")],
    queryFn: () => chargerProfilsPublics(autresIds),
    enabled: autresIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const conversations: Conversation[] = useMemo(() => {
    const par = new Map<string, Conversation>();
    /* `messages` est déjà trié du plus récent au plus ancien : la
       première ligne rencontrée EST le dernier message. */
    for (const m of messages) {
      const autreId = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
      const nonLu = m.receiver_id === user?.id && !m.is_read;
      const existe = par.get(autreId);
      if (!existe) {
        const p = profils?.get(autreId);
        par.set(autreId, {
          autreId,
          nom: p?.display_name ?? null,
          avatar: p?.avatar_url ?? null,
          dernier: m.content,
          dernierLe: m.created_at,
          deMoi: m.sender_id === user?.id,
          nonLus: nonLu ? 1 : 0,
        });
      } else if (nonLu) {
        existe.nonLus++;
      }
    }
    return [...par.values()];
  }, [messages, profils, user?.id]);

  const nonLus = useMemo(
    () => messages.filter((m) => m.receiver_id === user?.id && !m.is_read).length,
    [messages, user?.id],
  );

  /**
   * L'ENVOI EST OPTIMISTE.
   *
   * Une messagerie où la bulle apparaît après l'aller-retour donne
   * l'impression d'avoir raté son geste. On pose la bulle tout de
   * suite, avec un identifiant provisoire, et le rechargement la
   * remplace par la vraie. En cas d'échec on remet l'état d'avant.
   *
   * Le refus le plus probable n'est pas le réseau : c'est la politique
   * d'insertion, qui n'autorise que les alliés non bloqués. L'appelant
   * reçoit l'erreur et la dit avec des mots.
   */
  const envoyer = useMutation({
    mutationFn: async ({ destinataire, contenu }: { destinataire: string; contenu: string }) => {
      if (!user?.id) throw new Error("non-authentifie");
      const { error } = await supabase.from("private_messages").insert({
        sender_id: user.id,
        receiver_id: destinataire,
        content: contenu,
      });
      if (error) throw error;
    },
    onMutate: async ({ destinataire, contenu }) => {
      const cle = CLE_MESSAGES(user?.id);
      await queryClient.cancelQueries({ queryKey: cle });
      const precedent = queryClient.getQueryData<MessagePrive[]>(cle);
      const provisoire: MessagePrive = {
        id: `provisoire-${precedent?.length ?? 0}-${contenu.length}`,
        sender_id: user!.id,
        receiver_id: destinataire,
        content: contenu,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<MessagePrive[]>(cle, (anciens = []) => [provisoire, ...anciens]);
      return { precedent };
    },
    onError: (_e, _v, contexte) => {
      const c = contexte as { precedent?: MessagePrive[] } | undefined;
      if (c && "precedent" in c) queryClient.setQueryData(CLE_MESSAGES(user?.id), c.precedent);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLE_MESSAGES(user?.id) });
    },
  });

  const marquerLuLaConversation = useMutation({
    mutationFn: async (autreId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("sender_id", autreId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLE_MESSAGES(user?.id) });
      queryClient.invalidateQueries({ queryKey: CLE_NON_LUS(user?.id) });
    },
  });

  return {
    messages,
    conversations,
    nonLus,
    isLoading,
    envoyer,
    marquerLuLaConversation,
  };
}
