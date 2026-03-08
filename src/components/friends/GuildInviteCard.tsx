import { Button } from "@/components/ui/button";
import { Shield, Check, X } from "lucide-react";
import type { GuildInvite } from "@/hooks/useGuilds";

interface GuildInviteCardProps {
  invite: GuildInvite;
  onAccept: () => void;
  onDecline: () => void;
}

export function GuildInviteCard({ invite, onAccept, onDecline }: GuildInviteCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-500/30 bg-violet-500/5">
      <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
        <Shield className="h-5 w-5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold font-orbitron tracking-wide truncate text-foreground">
          {invite.guild_name || "Guild"}
        </h3>
        <p className="text-[10px] text-muted-foreground font-mono">
          Invited by {invite.inviter_name || "someone"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAccept} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider h-8">
          <Check className="h-3.5 w-3.5 mr-1" /> Join
        </Button>
        <Button size="sm" variant="ghost" onClick={onDecline} className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-8">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
