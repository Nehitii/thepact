import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useGuilds, type Guild } from "@/hooks/useGuilds";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Shield, Crown, Users } from "lucide-react";

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
  onClose: () => void;
}

export function GuildSettingsPanel({ guild, onClose }: Props) {
  const { t } = useTranslation();
  const { updateGuild } = useGuilds();
  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description || "");
  const [icon, setIcon] = useState(guild.icon || "shield");
  const [color, setColor] = useState(guild.color || "violet");
  const [isPublic, setIsPublic] = useState(guild.is_public);
  const [maxMembers, setMaxMembers] = useState(String(guild.max_members || 25));

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateGuild.mutateAsync({
        guildId: guild.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          icon, color,
          is_public: isPublic,
          max_members: parseInt(maxMembers) || 25,
        },
      });
      toast.success(t("common.updated"));
      onClose();
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <div className="space-y-4">
      <Input placeholder={t("friends.guildName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="font-rajdhani" />
      <Textarea placeholder={t("friends.guildDescription")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className="font-rajdhani resize-none h-16" />

      <div>
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.icon")}</p>
        <div className="flex gap-2">
          {iconOptions.map((opt) => (
            <button key={opt.key} onClick={() => setIcon(opt.key)} className={cn("w-10 h-10 rounded-lg border flex items-center justify-center transition-all", icon === opt.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              <opt.icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.color")}</p>
        <div className="flex gap-2">
          {colorOptions.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={cn("w-8 h-8 rounded-full transition-all", colorClasses[c], color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-100")} />
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

      <Button onClick={handleSave} disabled={!name.trim() || updateGuild.isPending} className="w-full font-bold uppercase tracking-wider">
        {updateGuild.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {t("common.saveChanges")}
      </Button>
    </div>
  );
}
