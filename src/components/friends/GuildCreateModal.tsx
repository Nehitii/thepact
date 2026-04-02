import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Crown, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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

interface GuildCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description?: string; icon?: string; color?: string }) => Promise<void>;
  loading: boolean;
}

export function GuildCreateModal({ open, onClose, onCreate, loading }: GuildCreateModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("shield");
  const [color, setColor] = useState("violet");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), description: description.trim() || undefined, icon, color });
    setName(""); setDescription(""); setIcon("shield"); setColor("violet");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md font-rajdhani">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-lg">{t("friends.createGuildTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={t("friends.guildName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-rajdhani"
            maxLength={40}
          />
          <Textarea
            placeholder={t("friends.guildDescription")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-rajdhani resize-none h-20"
            maxLength={200}
          />
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.icon")}</p>
            <div className="flex gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setIcon(opt.key)}
                  className={cn(
                    "w-10 h-10 rounded-lg border flex items-center justify-center transition-all",
                    icon === opt.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">{t("friends.color")}</p>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    colorClasses[c],
                    color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : "opacity-60 hover:opacity-100",
                  )}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="w-full font-bold uppercase tracking-wider">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
