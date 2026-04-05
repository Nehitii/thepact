import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGuilds, type Guild } from "@/hooks/useGuilds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Crown, Users, Loader2, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GuildInviteCodePanel } from "@/components/friends/GuildInviteCodePanel";

const iconOptions = [
  { key: "shield", icon: Shield },
  { key: "crown", icon: Crown },
  { key: "users", icon: Users },
];
const colorOptions = ["violet", "emerald", "amber", "rose", "cyan"];
const colorClasses: Record<string, string> = {
  violet: "bg-violet-500", emerald: "bg-emerald-500", amber: "bg-amber-500",
  rose: "bg-rose-500", cyan: "bg-cyan-500",
};

interface Props {
  guild: Guild;
  userId: string;
  isOwner: boolean;
}

export function GuildSettingsPage({ guild, userId, isOwner }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateGuild, deleteGuild, transferOwnership, useGuildMembers } = useGuilds();
  const { data: members = [] } = useGuildMembers(guild.id);

  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description || "");
  const [icon, setIcon] = useState(guild.icon || "shield");
  const [color, setColor] = useState(guild.color || "violet");
  const [isPublic, setIsPublic] = useState(guild.is_public);
  const [maxMembers, setMaxMembers] = useState(String(guild.max_members || 25));
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [transferTarget, setTransferTarget] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateGuild.mutateAsync({
        guildId: guild.id,
        updates: { name: name.trim(), description: description.trim() || null, icon, color, is_public: isPublic, max_members: parseInt(maxMembers) || 25 },
      });
      toast.success(t("common.updated"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== guild.name) return;
    try {
      await deleteGuild.mutateAsync(guild.id);
      toast.success(t("friends.guildDeleted"));
      navigate("/friends");
    } catch {
      toast.error(t("friends.guildDeleteFailed"));
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    try {
      await transferOwnership.mutateAsync({ guildId: guild.id, newOwnerId: transferTarget });
      toast.success(t("friends.ownershipTransferred"));
    } catch {
      toast.error(t("friends.roleFailed"));
    }
  };

  const otherMembers = members.filter((m) => m.user_id !== userId);

  return (
    <Tabs defaultValue="general">
      <TabsList className="mb-4">
        <TabsTrigger value="general" className="text-xs">{t("guild.general")}</TabsTrigger>
        <TabsTrigger value="codes" className="text-xs">{t("guild.inviteCodes")}</TabsTrigger>
        {isOwner && <TabsTrigger value="danger" className="text-xs">{t("guild.dangerZone")}</TabsTrigger>}
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Input placeholder={t("friends.guildName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="text-xs" />
        <Textarea placeholder={t("friends.guildDescription")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="resize-none h-16 text-xs" />

        <div>
          <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.icon")}</p>
          <div className="flex gap-2">
            {iconOptions.map((opt) => (
              <button key={opt.key} onClick={() => setIcon(opt.key)} className={cn("w-10 h-10 rounded-lg border flex items-center justify-center", icon === opt.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                <opt.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.color")}</p>
          <div className="flex gap-2">
            {colorOptions.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cn("w-8 h-8 rounded-full", colorClasses[c], color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-100")} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider">{t("friends.publicGuild")}</Label>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{t("friends.maxMembers")}</Label>
          <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className="h-8 w-20 text-xs" min={2} max={100} />
        </div>

        <Button onClick={handleSave} disabled={!name.trim() || updateGuild.isPending} className="w-full text-xs font-bold uppercase tracking-wider">
          {updateGuild.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t("common.saveChanges")}
        </Button>
      </TabsContent>

      <TabsContent value="codes">
        <GuildInviteCodePanel guildId={guild.id} />
      </TabsContent>

      {isOwner && (
        <TabsContent value="danger" className="space-y-6">
          <div className="border border-amber-500/30 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5" /> {t("friends.transferOwnership")}
            </h4>
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="w-full h-8 text-xs bg-background border border-border rounded-md px-2"
            >
              <option value="">Select a member…</option>
              {otherMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" className="text-xs text-amber-400 border-amber-500/30" onClick={handleTransfer} disabled={!transferTarget}>
              {t("friends.transferOwnership")}
            </Button>
          </div>

          <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-destructive flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" /> {t("friends.deleteGuild")}
            </h4>
            <p className="text-[10px] text-muted-foreground">{t("friends.deleteGuildConfirm")}</p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type "${guild.name}" to confirm`}
              className="h-8 text-xs"
            />
            <Button size="sm" variant="destructive" className="text-xs" onClick={handleDelete} disabled={deleteConfirm !== guild.name || deleteGuild.isPending}>
              {deleteGuild.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {t("friends.deleteGuild")}
            </Button>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
