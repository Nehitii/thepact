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
  const [vue, setVue] = useState<"general" | "codes" | "danger">("general");
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

  const autresMembres = members.filter((m) => m.user_id !== userId);
  const VUES = isOwner
    ? (["general", "codes", "danger"] as const)
    : (["general", "codes"] as const);

  return (
    <>
      <div className="gu-barre">
        {VUES.map((v) => (
          <button
            key={v}
            type="button"
            className="co-puce"
            aria-pressed={vue === v}
            onClick={() => setVue(v)}
          >
            {v === "general"
              ? t("guild.general", "Général")
              : v === "codes"
                ? t("guild.inviteCodes", "Codes d’invitation")
                : t("guild.dangerZone", "Irréversible")}
          </button>
        ))}
      </div>

      {vue === "general" && (
        <section className="gu-bloc">
          <div className="gu-corps" style={{ paddingTop: 14, display: "grid", gap: 14 }}>
            <input
              className="gu-champ"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("friends.guildName", "Nom de la guilde")}
              aria-label={t("friends.guildName", "Nom de la guilde")}
            />
            <textarea
              className="gu-champ"
              style={{ minHeight: 62, resize: "vertical" }}
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("friends.guildDescription", "Sa devise, ce qu’elle poursuit")}
              aria-label={t("friends.guildDescription", "Sa devise, ce qu’elle poursuit")}
            />

            <div>
              <p className="gu-etiquette">{t("friends.icon", "Blason")}</p>
              <div className="gu-barre" style={{ padding: 0, border: "none" }}>
                {iconOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="co-puce"
                    aria-pressed={icon === opt.key}
                    aria-label={opt.key}
                    onClick={() => setIcon(opt.key)}
                  >
                    <opt.icon aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="gu-etiquette">{t("friends.color", "Couleur")}</p>
              <div className="gu-couleurs">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn("gu-couleur", colorClasses[c])}
                    aria-pressed={color === c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <label className="gu-reglage">
              <span>{t("friends.publicGuild", "Guilde publique")}</span>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </label>

            <label className="gu-reglage">
              <span>{t("friends.maxMembers", "Places")}</span>
              <input
                className="gu-champ"
                style={{ width: 92, fontFamily: "var(--co-fonte-chiffre)" }}
                type="number"
                min={2}
                max={100}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </label>

            <div>
              <button
                type="button"
                className="co-bouton"
                onClick={handleSave}
                disabled={!name.trim() || updateGuild.isPending}
              >
                {t("common.saveChanges", "Enregistrer")}
              </button>
            </div>
          </div>
        </section>
      )}

      {vue === "codes" && <GuildInviteCodePanel guildId={guild.id} canManage={isOwner} />}

      {vue === "danger" && isOwner && (
        <>
          <section className="gu-bloc">
            <div className="gu-bloc-tete">
              <UserCheck aria-hidden="true" style={{ width: 15, height: 15, color: "var(--co-respect)" }} />
              <h2 className="gu-bloc-titre">{t("friends.transferOwnership", "Transmettre la guilde")}</h2>
            </div>
            <div className="gu-corps" style={{ display: "grid", gap: 10 }}>
              <p className="gu-mot" style={{ margin: 0 }}>
                {t("guild.transferWhy", "Le nouveau fondateur pourra tout modifier, y compris vous exclure. Vous deviendrez membre.")}
              </p>
              {autresMembres.length === 0 ? (
                <p className="co-choix-message" style={{ textAlign: "left", padding: 0 }}>
                  {t("guild.transferNobody", "Il faut au moins un autre membre pour transmettre la guilde.")}
                </p>
              ) : (
                <>
                  <select
                    className="gu-champ"
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    aria-label={t("guild.pickMember", "Choisir un membre")}
                  >
                    <option value="">{t("guild.pickMember", "Choisir un membre")}</option>
                    {autresMembres.map((m) => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))}
                  </select>
                  <div>
                    <button
                      type="button"
                      className="co-bouton co-bouton--discret"
                      onClick={handleTransfer}
                      disabled={!transferTarget}
                    >
                      {t("friends.transferOwnership", "Transmettre la guilde")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="gu-bloc">
            <div className="gu-bloc-tete">
              <Trash2 aria-hidden="true" style={{ width: 15, height: 15, color: "var(--co-obstacle)" }} />
              <h2 className="gu-bloc-titre">{t("friends.deleteGuild", "Dissoudre la guilde")}</h2>
            </div>
            <div className="gu-corps" style={{ display: "grid", gap: 10 }}>
              <p className="gu-mot" style={{ margin: 0 }}>
                {t("friends.deleteGuildConfirm", "Cette action est définitive : membres, messages, objectifs et annonces partent avec elle.")}
              </p>
              <input
                className="gu-champ"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={t("guild.typeNameToConfirm", "Écrivez « {{nom}} » pour confirmer", { nom: guild.name })}
                aria-label={t("guild.typeNameToConfirm", "Écrivez « {{nom}} » pour confirmer", { nom: guild.name })}
              />
              <div>
                <button
                  type="button"
                  className="co-bouton gu-danger"
                  onClick={handleDelete}
                  disabled={deleteConfirm !== guild.name || deleteGuild.isPending}
                >
                  {t("friends.deleteGuild", "Dissoudre la guilde")}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
