import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Pastille } from "@/components/community/Pastille";
import { nomAffichable } from "@/components/community/vocabulaire";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

interface GuildMessage {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  display_name?: string;
  /* Nullable en base : l annotation « any » sur la requete masquait
     l ecart, comme partout ailleurs dans ce module. */
  avatar_url?: string | null;
}

interface Props {
  guildId: string;
  userId: string;
}

export function GuildChat({ guildId, userId }: Props) {
  const { t } = useTranslation();
  /* Les dates etaient rendues sans locale : « 5 months ago » a un
     lecteur francais, comme partout ailleurs dans ce module. */
  const locale = useDateFnsLocale();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["guild-chat", guildId],
    queryFn: async (): Promise<GuildMessage[]> => {
      const { data, error } = await supabase
        .from("guild_messages")
        .select("*")
        .eq("guild_id", guildId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!data?.length) return [];
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
      const pm = new Map(profiles?.map((p) => [p.id, p]) || []);
      return data.map((m) => ({
        ...m,
        display_name: pm.get(m.user_id)?.display_name || "?",
        avatar_url: pm.get(m.user_id)?.avatar_url,
      }));
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`guild-chat-${guildId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guild_messages", filter: `guild_id=eq.${guildId}` }, () => {
        qc.invalidateQueries({ queryKey: ["guild-chat", guildId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [guildId, qc]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("guild_messages").insert({
        guild_id: guildId,
        user_id: userId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-chat", guildId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guild_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-chat", guildId] }),
  });

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMutation.mutate(msg.trim());
    setMsg("");
  };

  return (
    <div className="gu-discussion">
      <div className="gu-fil" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="co-choix-message">{t("guild.noChatMessages", "Aucun message pour le moment")}</p>
        )}
        {messages.map((m) => {
          const demoi = m.user_id === userId;
          const nom = nomAffichable(m.display_name, "?");
          return (
            <div className={demoi ? "gu-mess gu-mess--moi" : "gu-mess"} key={m.id}>
              <Pastille identifiant={m.user_id} nom={nom} image={m.avatar_url} petite />
              <div className="gu-mess-corps">
                <div className="gu-mess-tete">
                  <span className="co-nom" style={{ fontSize: 13 }}>{nom}</span>
                  <span className="co-sep" aria-hidden="true">·</span>
                  <time className="co-quand" style={{ fontSize: 12 }} dateTime={m.created_at}>
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale })}
                  </time>
                </div>
                <div className="gu-bulle">
                  {m.content}
                  {demoi && (
                    <button
                      type="button"
                      className="gu-bulle-retirer"
                      aria-label={t("common.delete", "Supprimer")}
                      onClick={() => deleteMutation.mutate(m.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gu-saisie">
        <input
          value={msg}
          maxLength={500}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t("guild.typeMessage", "Écrire un message…")}
          aria-label={t("guild.typeMessage", "Écrire un message…")}
        />
        <button type="button" className="co-bouton" onClick={handleSend} disabled={!msg.trim() || sendMutation.isPending}>
          <Send aria-hidden="true" />
          {t("guild.send", "Envoyer")}
        </button>
      </div>
    </div>
  );
}
