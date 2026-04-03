import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Megaphone, Pin, Trash2, Loader2, Send } from "lucide-react";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { useGuilds, type GuildAnnouncement } from "@/hooks/useGuilds";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

interface Props {
  guildId: string;
  canWrite: boolean;
}

export function GuildAnnouncementsPanel({ guildId, canWrite }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { useAnnouncements, createAnnouncement, deleteAnnouncement } = useGuilds();
  const { data: announcements = [], isLoading } = useAnnouncements(guildId);
  const [content, setContent] = useState("");

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      await createAnnouncement.mutateAsync({ guildId, content: content.trim() });
      setContent("");
      toast.success(t("friends.announcementPosted"));
    } catch {
      toast.error(t("friends.announcementFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement.mutateAsync({ id, guildId });
      toast.success(t("common.delete"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("friends.writeAnnouncement")}
            className="resize-none h-16 text-sm font-rajdhani"
            maxLength={500}
          />
          <Button
            size="icon"
            onClick={handlePost}
            disabled={!content.trim() || createAnnouncement.isPending}
            className="shrink-0 h-16 w-10"
          >
            {createAnnouncement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <ScrollArea className="max-h-64">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : announcements.length === 0 ? (
          <CyberEmpty icon={Megaphone} title={t("friends.noAnnouncements")} subtitle={t("friends.noAnnouncementsDesc")} />
        ) : (
          <div className="space-y-2">
            {announcements.map((a: GuildAnnouncement) => (
              <div key={a.id} className="p-3 rounded-lg border border-border bg-card/50 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={a.author_avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">{(a.author_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-bold truncate flex-1">{a.author_name}</span>
                  {a.pinned && <Pin className="h-3 w-3 text-amber-400" />}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale })}
                  </span>
                  {canWrite && (
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
