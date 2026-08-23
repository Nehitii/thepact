import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGuilds, type Guild } from "@/hooks/useGuilds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { GuildInviteCodePanel } from "@/components/friends/GuildInviteCodePanel";
import { DepotImage } from "@/components/guild/DepotImage";
import {
  CLES_EMBLEMES, EMBLEMES, TEINTES, emblemeDe, estUneTeinte, teinteDe,
} from "@/components/guild/blason";

/* LES DEUX LISTES QUI VIVAIENT ICI — trois emblemes et cinq noms de
   couleur — existaient a l identique dans GuildCreateModal. Elles sont
   parties dans blason.ts, en un seul exemplaire et avec de quoi
   choisir. Les noms de couleur, eux, ne fonctionnaient pas : voir le
   commentaire de ce fichier. */

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
  const [color, setColor] = useState(teinteDe(guild.color));
  const [banniere, setBanniere] = useState(guild.banner_url);
  const [embleme, setEmbleme] = useState(guild.emblem_url);
  const [motd, setMotd] = useState(guild.motd || "");
  const [isPublic, setIsPublic] = useState(guild.is_public);
  const [maxMembers, setMaxMembers] = useState(String(guild.max_members || 25));
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [vue, setVue] = useState<"identite" | "general" | "codes" | "danger">("identite");
  const [transferTarget, setTransferTarget] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateGuild.mutateAsync({
        guildId: guild.id,
        updates: {
          name: name.trim(),
          description: description.trim() || null,
          icon, color,
          banner_url: banniere,
          emblem_url: embleme,
          motd: motd.trim() || null,
          is_public: isPublic,
          max_members: parseInt(maxMembers) || 25,
        },
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
    ? (["identite", "general", "codes", "danger"] as const)
    : (["identite", "general", "codes"] as const);

  const LIBELLES: Record<(typeof VUES)[number], string> = {
    identite: t("guild.identity", "Identité"),
    general: t("guild.general", "Général"),
    codes: t("guild.inviteCodes", "Codes d’invitation"),
    danger: t("guild.dangerZone", "Irréversible"),
  };

  const Apercu = emblemeDe(icon);

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
            {LIBELLES[v]}
          </button>
        ))}
      </div>

      {/* L IDENTITE.
          Elle n existait pas : on choisissait un embleme parmi trois et
          une « couleur » parmi cinq noms, dont trois que le navigateur
          rejetait. Ni l un ni l autre n etait jamais affiche par la
          page de guilde, qui montrait votre role a la place du blason.
          Ici la guilde a un visage, et ce visage se voit. */}
      {vue === "identite" && (
        <section className="gu-bloc" style={{ "--gu-teinte": color } as CSSProperties}>
          <div className="gu-corps" style={{ paddingTop: 14, display: "grid", gap: 16 }}>
            <div>
              <p className="gu-etiquette">{t("guild.banner", "Bannière")}</p>
              <DepotImage
                guildId={guild.id}
                usage="banniere"
                url={banniere}
                onChange={setBanniere}
                label={t("guild.bannerAdd", "Déposer une bannière")}
              />
            </div>

            <div>
              <p className="gu-etiquette">{t("guild.emblem", "Emblème")}</p>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <DepotImage
                  guildId={guild.id}
                  usage="embleme"
                  url={embleme}
                  onChange={setEmbleme}
                  label={t("guild.emblemAdd", "Déposer un emblème")}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="co-choix-message" style={{ textAlign: "left", padding: "0 0 8px" }}>
                    {embleme
                      ? t("guild.emblemUploaded", "Votre emblème remplace le pictogramme ci-dessous.")
                      : t("guild.emblemPick", "Sans image déposée, la guilde porte l’un de ces vingt-cinq signes.")}
                  </p>
                  <div className="gu-emblemes">
                    {CLES_EMBLEMES.map((cle) => {
                      const Signe = EMBLEMES[cle];
                      return (
                        <button
                          key={cle}
                          type="button"
                          className="gu-embleme"
                          aria-pressed={icon === cle}
                          aria-label={cle}
                          onClick={() => setIcon(cle)}
                        >
                          <Signe aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="gu-etiquette">{t("friends.color", "Couleur")}</p>
              <div className="gu-teintes">
                {TEINTES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="gu-teinte-choix"
                    style={{ background: c, color: c }}
                    aria-pressed={color.toUpperCase() === c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                  />
                ))}
                {/* Huit propositions, et tout le reste du spectre. */}
                <input
                  type="color"
                  className="gu-teinte-libre"
                  value={color}
                  aria-label={t("guild.colorFree", "Une autre couleur")}
                  onChange={(e) => estUneTeinte(e.target.value) && setColor(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="gu-etiquette">{t("guild.motd", "Mot du jour")}</p>
              <textarea
                className="gu-champ"
                style={{ minHeight: 54, resize: "vertical" }}
                value={motd}
                maxLength={240}
                onChange={(e) => setMotd(e.target.value)}
                placeholder={t("guild.motdWhat", "Ce que la guilde doit lire en arrivant")}
                aria-label={t("guild.motd", "Mot du jour")}
              />
            </div>

            {/* Ce que cela donnera. */}
            <div>
              <p className="gu-etiquette">{t("guild.preview", "Aperçu")}</p>
              <div className="gu-identite" style={{ "--gu-teinte": color, borderRadius: 12, overflow: "hidden", border: "1px solid var(--co-filet)" } as CSSProperties}>
                <div className="gu-banniere" style={{ height: 88 }}>
                  {banniere && <img src={banniere} alt="" aria-hidden="true" />}
                </div>
                <header className="gu-tete" style={{ marginTop: -26, paddingBottom: 12 }}>
                  <span className="gu-blason">
                    {embleme ? <img src={embleme} alt="" aria-hidden="true" /> : <Apercu aria-hidden="true" />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="gu-nom" style={{ fontSize: 18 }}>{name || guild.name}</h3>
                    {description && <p className="gu-mot">{description}</p>}
                  </div>
                </header>
                {motd.trim() && (
                  <p className="gu-motd" style={{ marginBottom: 12 }}>
                    <Megaphone aria-hidden="true" />
                    {motd}
                  </p>
                )}
              </div>
            </div>

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
