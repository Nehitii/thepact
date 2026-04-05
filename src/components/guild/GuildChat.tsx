import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GuildMessage {
  id: string;
  guild_id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface Props {
  guildId: string;
  userId: string;
}

export function GuildChat({ guildId, userId }: Props) {
  const { t } = useTranslation();
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
      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
      const pm = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      return data.map((m: any) => ({
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
      } as any);
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
    <div className="flex flex-col h-[500px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-10">{t("guild.noChatMessages")}</p>
        )}
        {messages.map((m) => {
          const isOwn = m.user_id === userId;
          return (
            <div key={m.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={m.avatar_url || undefined} />
                <AvatarFallback className="text-[9px]">{(m.display_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                <div className={`text-[9px] text-muted-foreground mb-0.5 ${isOwn ? "text-right" : ""}`}>
                  {m.display_name} · {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </div>
                <div className={`group relative rounded-lg px-3 py-1.5 text-xs ${isOwn ? "bg-primary/20 text-foreground" : "bg-card/80 border border-border/50"}`}>
                  {m.content}
                  {isOwn && (
                    <button
                      onClick={() => deleteMutation.mutate(m.id)}
                      className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-0.5 transition-opacity"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border/50 p-3 flex gap-2">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={t("guild.typeMessage")}
          maxLength={500}
          className="h-9 text-xs"
        />
        <Button size="sm" onClick={handleSend} disabled={!msg.trim() || sendMutation.isPending}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
