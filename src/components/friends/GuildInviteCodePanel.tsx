import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link, Copy, Plus, Loader2, XCircle } from "lucide-react";
import { CyberEmpty } from "@/components/ui/cyber-states";
import { useGuilds, type GuildInviteCode } from "@/hooks/useGuilds";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";

interface Props {
  guildId: string;
  canManage: boolean;
}

export function GuildInviteCodePanel({ guildId, canManage }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { useInviteCodes, createInviteCode, deactivateInviteCode } = useGuilds();
  const { data: codes = [], isLoading } = useInviteCodes(guildId);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const code = await createInviteCode.mutateAsync({ guildId, expiresInHours: 72 });
      toast.success(t("friends.codeGenerated", { code }));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t("friends.codeCopied"));
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateInviteCode.mutateAsync({ id, guildId });
      toast.success(t("friends.codeDeactivated"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const activeCodes = codes.filter((c: GuildInviteCode) => c.is_active);

  return (
    <div className="space-y-3">
      {canManage && (
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="w-full text-xs">
          {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          {t("friends.generateCode")}
        </Button>
      )}

      <ScrollArea className="max-h-48">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : activeCodes.length === 0 ? (
          <CyberEmpty icon={Link} title={t("friends.noCodes")} subtitle={t("friends.noCodesDesc")} />
        ) : (
          <div className="space-y-2">
            {activeCodes.map((c: GuildInviteCode) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50">
                <code className="text-sm font-mono font-bold text-primary flex-1 tracking-wider">{c.code}</code>
                <span className="text-[10px] text-muted-foreground">{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ""}</span>
                {c.expires_at && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.expires_at), { addSuffix: true, locale })}
                  </span>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(c.code)} aria-label={t("friends.codeCopied")}>
                  <Copy className="h-3 w-3" />
                </Button>
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeactivate(c.id)}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
