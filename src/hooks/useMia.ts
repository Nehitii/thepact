/**
 * M.I.A — fils, messages, flux.
 *
 * Les NOMS DE TABLE ne bougent pas. `coach_conversations` et
 * `coach_messages` gardent les leurs : les renommer ne servirait qu à
 * casser cent cinquante migrations pour une question de vocabulaire.
 * Seul le code qui les lit change de nom.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FilMia {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface MessageMia {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  created_at: string;
  metadata?: MetaMessageMia | null;
}

export interface SourceMia {
  source_type: string;
  source_id: string;
  snippet: string;
  similarity?: number;
}

export interface ActeMia {
  tool: string;
  status: "ok" | "error";
  label: string;
  ref_id?: string;
  ref_type?: string;
  error?: string;
}

export interface MetaMessageMia {
  citations?: SourceMia[];
  actions?: ActeMia[];
  /* Par quelle couche la réponse est venue. Absent = le modèle a répondu.
     C'est ce qui permet de retrouver le badge et le visage après un
     rechargement, au lieu de les perdre avec l'état du composant. */
  couche?: "reflexe" | "geste";
  expression?: string;
}

export function useFilsMia() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["coach_conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as FilMia[];
      const { data, error } = await supabase
        .from("coach_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as FilMia[];
    },
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: async (title?: string | undefined) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("coach_conversations")
        .insert({ user_id: user.id, title: title ?? "Nouvelle conversation" })
        .select()
        .single();
      if (error) throw error;
      return data as FilMia;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const renommer = useMutation({
    mutationFn: async ({ id, titre }: { id: string; titre: string }) => {
      const propre = titre.trim().slice(0, 120);
      if (!propre) throw new Error("Un fil a besoin d'un nom");
      const { error } = await supabase
        .from("coach_conversations")
        .update({ title: propre })
        .eq("id", id);
      if (error) throw error;
      return propre;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coach_conversations")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach_conversations", user?.id] }),
  });

  return {
    conversations: list.data ?? [],
    isLoading: list.isLoading,
    create: create.mutateAsync,
    archive: archive.mutateAsync,
    renommer: renommer.mutateAsync,
  };
}

/**
 * L'écriture des échanges gratuits.
 *
 * ═══════════════════════════════════════════════════════════════
 * UNE RÉPONSE QUI N'EST PAS ÉCRITE N'A JAMAIS EU LIEU.
 *
 * Les couches réflexe et geste répondent sans modèle, donc sans passer
 * par la fonction serveur — et rien ne les écrivait. Elles vivaient dans
 * un état de composant, hors de tout fil : elles disparaissaient au
 * changement de conversation, et s'affichaient même dans les fils où
 * elles n'avaient pas été dites.
 *
 * La base le disait franchement : huit questions pour une réponse sur un
 * fil, quatre pour une sur un autre. Ces trous sont de deux sortes — les
 * réponses gratuites jamais écrites, et les questions restées seules
 * quand le modèle a rendu un 429.
 *
 * « model » reste nul pour ces échanges, et c'est une information : une
 * réponse sans modèle est une réponse qui n'a rien coûté.
 * ═══════════════════════════════════════════════════════════════
 */
export function useEcrireEchange() {
  const { user } = useAuth();
  const qc = useQueryClient();

  /* LE FIL EST UN ARGUMENT, PAS UNE FERMETURE.
     Refermé sur le fil du rendu courant, ce crochet retombait dans le
     piège de `send` : une conversation créée juste avant l'appel reste
     invisible pour la fonction déjà construite, et l'écriture partait
     dans le vide. On passe donc l'identifiant. */
  return useCallback(
    async (conversationId: string | null, echange: {
      question: string;
      reponse: string;
      couche: "reflexe" | "geste";
      expression: string;
      /* Vraie quand la réponse suit un refus du modèle : la question a
         peut-être déjà été écrite par le serveur, peut-être pas — le
         quota applicatif refuse AVANT de l'enregistrer, le modèle
         lui-même refuse APRÈS. On ne devine pas, on regarde. */
      apresUnRefus?: boolean;
    }) => {
      if (!conversationId || !user?.id) return;
      const commun = { conversation_id: conversationId, user_id: user.id };

      /* LA QUESTION DOIT PORTER UNE DATE ANTÉRIEURE À LA RÉPONSE, ET
         C'EST LA BASE QUI DATE, JAMAIS LE NAVIGATEUR.

         Deux pièges successifs. Insérées d'un seul coup, les deux lignes
         prenaient le now() de la transaction — le MÊME horodatage à la
         microseconde près, et la lecture les trie par created_at : rien
         n'empêchait la réponse de s'afficher avant sa question.

         Dater depuis le client réglait l'ordre et en cassait un autre :
         mesuré, l'horloge de ce navigateur retarde de 683 ms sur celle du
         serveur. Une excuse écrite ici se rangeait AVANT la question que
         la fonction venait d'enregistrer là-bas.

         Deux écritures successives règlent les deux : chaque ligne reçoit
         son propre now() serveur, strictement croissant. L'affichage,
         lui, est déjà posé — l'utilisateur n'attend pas ce deuxième
         aller-retour. */
      const instant = Date.now();

      let questionDejaEcrite = false;
      if (echange.apresUnRefus) {
        const { data } = await supabase
          .from("coach_messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("role", "user")
          .eq("content", echange.question)
          .limit(1);
        questionDejaEcrite = !!data?.length;
      }

      const reponse = {
        ...commun,
        role: "assistant",
        content: echange.reponse,
        metadata: { couche: echange.couche, expression: echange.expression },
      };

      /* L'ÉCRITURE EST INSTANTANÉE À L'ÉCRAN, DIFFÉRÉE EN BASE.
         Une réponse réflexe est gratuite et immédiate ; lui faire attendre
         un aller-retour de base lui retirerait sa seule qualité. On pose
         donc les deux lignes dans le cache d'abord, et l'invalidation qui
         suit remplace les identifiants provisoires par les vrais. */
      qc.setQueryData<MessageMia[]>(["coach_messages", conversationId], (vieux) => [
        ...(vieux ?? []),
        ...(questionDejaEcrite
          ? []
          : [{
              id: `provisoire-q-${instant}`,
              conversation_id: conversationId,
              role: "user",
              content: echange.question,
              created_at: new Date(instant).toISOString(),
            } as MessageMia]),
        {
          id: `provisoire-r-${instant}`,
          conversation_id: conversationId,
          role: "assistant",
          content: echange.reponse,
          created_at: new Date(instant + 1).toISOString(),
          metadata: { couche: echange.couche, expression: echange.expression },
        } as MessageMia,
      ]);

      if (!questionDejaEcrite) {
        const { error: erreurQuestion } = await supabase
          .from("coach_messages")
          .insert({ ...commun, role: "user", content: echange.question });
        if (erreurQuestion) {
          toast.error("Je n'ai pas pu garder cette question.");
          void qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });
          return;
        }
      }
      const { error } = await supabase.from("coach_messages").insert(reponse);
      if (error) {
        toast.error("Je n'ai pas pu garder cette réponse.");
        void qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });
        return;
      }
      /* Le fil remonte dans la liste : sinon une conversation nourrie
         sans modèle resterait datée de son dernier appel payant. */
      await supabase
        .from("coach_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      await qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });
      void qc.invalidateQueries({ queryKey: ["coach_conversations", user.id] });
    },
    [user?.id, qc],
  );
}

export function useMessagesMia(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach_messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [] as MessageMia[];
      const { data, error } = await supabase
        .from("coach_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MessageMia[];
    },
    enabled: !!conversationId && !!user?.id,
  });
}

/**
 * Streaming send — yields incremental assistant text via setStreamingText.
 */
export function useFluxMia(conversationId: string | null) {
  const qc = useQueryClient();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");

  // Le modèle n'est volontairement pas envoyé : il est choisi côté serveur
  // (DEFAULT_CHAT_MODEL, surchargeable via le secret AI_CHAT_MODEL). Le figer
  // ici obligerait à reconstruire le front à chaque changement de modèle.
  const send = useCallback(
    async (message: string) => {
      if (!conversationId || !message.trim()) return { ok: false as const, statut: 0, corps: "pas de fil" };
      setStreaming(true);
      setStreamText("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Session expirée");

        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/ai-coach`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          /* LE FUSEAU VIENT DU NAVIGATEUR, PAS DE LA BASE.
             La colonne « profiles.timezone » existe et vaut « UTC » pour
             tout le monde : personne ne l'a jamais renseignée. La
             fonction serveur, elle, tourne en UTC — elle datait donc
             chaque échéance dans le mauvais jour. Le navigateur sait, et
             c'est la seule source qui ne ment pas. */
          body: JSON.stringify({
            conversation_id: conversationId,
            message,
            fuseau: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        if (!res.ok || !res.body) {
          /* UNE PANNE N'EST PAS UN OBJET JSON.
             On rendait le corps brut à l'appelant, qui l'affichait tel
             quel dans une notification : l'utilisateur lisait
             {"error":"Limite atteinte…"} et le fil restait sans réponse.
             On remonte le code et le corps ; c'est la console qui décide
             quoi en dire, et elle le dit avec la voix de M.I.A. */
          const corps = await res.text();
          return { ok: false as const, statut: res.status, corps };
        }

        // Refresh user message immediately
        qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                text += delta;
                setStreamText(text);
              }
            } catch (_) { /* ignore */ }
          }
        }
        // Final refresh to load persisted assistant message
        await qc.invalidateQueries({ queryKey: ["coach_messages", conversationId] });
        await qc.invalidateQueries({ queryKey: ["coach_conversations"] });
        return { ok: true as const };
      } catch (e: unknown) {
        return {
          ok: false as const,
          statut: 0,
          corps: e instanceof Error ? e.message : "échec réseau",
        };
      } finally {
        setStreaming(false);
        setStreamText("");
      }
    },
    [conversationId, qc],
  );

  return { send, streaming, streamText };
}
/**
 * Les aperçus des fils : le dernier message de chacun.
 *
 * Le tiroir montre, sous chaque titre, la dernière chose qui s'est dite.
 * Une requête pour tous les fils plutôt qu'une par fil — quarante-neuf
 * messages en tout, on peut se permettre de les trier ici.
 */
export function useApercusMia(ids: string[]) {
  const { user } = useAuth();
  const cle = ids.slice().sort().join(",");
  return useQuery({
    queryKey: ["mia_apercus", user?.id, cle],
    queryFn: async () => {
      if (!ids.length) return {} as Record<string, string>;
      const { data, error } = await supabase
        .from("coach_messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      const apercus: Record<string, string> = {};
      for (const m of data ?? []) {
        const id = (m as { conversation_id: string }).conversation_id;
        if (apercus[id]) continue;
        apercus[id] = ((m as { content: string }).content ?? "").replace(/\s+/g, " ").trim();
      }
      return apercus;
    },
    enabled: !!user?.id && ids.length > 0,
    staleTime: 30_000,
  });
}
