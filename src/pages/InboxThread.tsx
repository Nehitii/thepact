import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function InboxThread() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, markConversationAsRead } = useMessages();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch other user's profile
  const { data: otherProfile } = useQuery({
    queryKey: ["thread-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Filter messages for this thread
  const threadMessages = messages
    .filter(
      (m) =>
        (m.sender_id === userId && m.receiver_id === user?.id) ||
        (m.sender_id === user?.id && m.receiver_id === userId)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Mark as read on mount
  useEffect(() => {
    if (userId) {
      markConversationAsRead.mutate(userId);
    }
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id || !userId) return;
    const channel = supabase
      .channel(`thread-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          markConversationAsRead.mutate(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !userId) return;
    await sendMessage.mutateAsync({ receiverId: userId, content: newMessage.trim() });
    setNewMessage("");
  };

  const formatMsgTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
    return format(d, "dd/MM HH:mm");
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden font-rajdhani">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto relative z-10 h-full">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-background/80 backdrop-blur-xl shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/inbox")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-950 border-2 border-violet-500/50 flex items-center justify-center text-sm font-bold font-orbitron text-violet-200">
              {otherProfile?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-sm font-bold font-orbitron tracking-wide text-foreground">
                {otherProfile?.display_name || "Unknown User"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-mono">Encrypted Channel</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {threadMessages.length === 0 && (
              <div className="text-center py-20 text-muted-foreground text-sm">
                No messages yet. Start the conversation.
              </div>
            )}
            {threadMessages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", isMine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                      isMine
                        ? "bg-primary/20 border border-primary/30 text-foreground rounded-br-sm"
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm"
                    )}
                  >
                    <p className="break-words">{msg.content}</p>
                    <div className={cn("flex items-center gap-1.5 mt-1", isMine ? "justify-end" : "justify-start")}>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatMsgTime(msg.created_at)}
                      </span>
                      {isMine && msg.is_read && (
                        <CheckCheck className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-background/80 backdrop-blur-xl shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border-white/10 focus:border-primary/50 font-rajdhani"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sendMessage.isPending}
              className="bg-primary hover:bg-primary/80 text-primary-foreground shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
