import { useState, type CSSProperties } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { nombreDeMembresMax } from "@/domaines/social/logique/guilde";
import { Switch } from "@/socle/ui/switch";
import {
  CLES_EMBLEMES, EMBLEMES, TEINTES, TEINTE_PAR_DEFAUT, emblemeDe, estUneTeinte,
} from "@/domaines/social/logique/blason";

/* FONDER UNE GUILDE.
 *
 * Le formulaire etait reste dans l ancien monde — Dialog de la
 * bibliotheque, Orbitron en capitales, etiquettes « UPPERCASE TRACKING
 * WIDER » — au milieu d un module entierement refait. Il recopiait
 * aussi, mot pour mot, la liste d emblemes et de couleurs des
 * reglages : deux exemplaires d une liste de trois.
 *
 * ET IL ECRIVAIT UNE COULEUR QUI N EN ETAIT PAS UNE. « violet »,
 * « emerald », « rose » : des noms de palette que le CSS rejette, et
 * que la page de guilde injectait tels quels. La base impose desormais
 * un hexadecimal ; ce formulaire en envoie un.
 *
 * On voit ce qu on fonde pendant qu on le fonde : l apercu porte le
 * nom, l embleme et la teinte au fur et a mesure. */

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    is_public?: boolean;
    max_members?: number;
  }) => Promise<void>;
  loading: boolean;
}

export function GuildCreateModal({ open, onClose, onCreate, loading }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("shield");
  const [color, setColor] = useState<string>(TEINTE_PAR_DEFAUT);
  const [isPublic, setIsPublic] = useState(false);
  const [maxMembers, setMaxMembers] = useState("25");

  if (!open) return null;

  const Apercu = emblemeDe(icon);

  const fonder = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      is_public: isPublic,
      max_members: nombreDeMembresMax(maxMembers),
    });
    setName("");
    setDescription("");
    setIcon("shield");
    setColor(TEINTE_PAR_DEFAUT);
    setIsPublic(false);
    setMaxMembers("25");
    onClose();
  };

  return (
    <div className="co co-portail">
      <div className="co-modale-voile" role="presentation" onClick={onClose} />
      <div
        className="co-modale"
        role="dialog"
        aria-modal="true"
        aria-label={t("friends.createGuildTitle", "Fonder une guilde")}
        style={{ "--gu-teinte": color } as CSSProperties}
      >
        <div className="co-modale-tete">
          <h2 className="co-modale-titre">{t("friends.createGuildTitle", "Fonder une guilde")}</h2>
          <button
            type="button"
            className="co-puce"
            onClick={onClose}
            aria-label={t("common.close", "Fermer")}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="co-modale-corps" style={{ display: "grid", gap: 16 }}>
          {/* Ce que l on est en train de fonder. */}
          <div
            className="gu-identite"
            style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--co-filet)" }}
          >
            <div className="gu-banniere" style={{ height: 74 }} />
            <header className="gu-tete" style={{ marginTop: -26, paddingBottom: 12 }}>
              <span className="gu-blason">
                <Apercu aria-hidden="true" />
              </span>
              <div style={{ minWidth: 0 }}>
                <h3 className="gu-nom" style={{ fontSize: 18 }}>
                  {name || t("friends.guildName", "Nom de la guilde")}
                </h3>
                {description && <p className="gu-mot">{description}</p>}
              </div>
            </header>
          </div>

          <input
            className="gu-champ"
            value={name}
            maxLength={40}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder={t("friends.guildName", "Nom de la guilde")}
            aria-label={t("friends.guildName", "Nom de la guilde")}
          />

          <textarea
            className="gu-champ"
            style={{ minHeight: 58, resize: "vertical" }}
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("friends.guildDescription", "Sa devise, ce qu’elle poursuit")}
            aria-label={t("friends.guildDescription", "Sa devise, ce qu’elle poursuit")}
          />

          <div>
            <p className="gu-etiquette">{t("guild.emblem", "Emblème")}</p>
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
        </div>

        <div className="co-modale-pied">
          <button type="button" className="co-bouton co-bouton--discret" onClick={onClose}>
            {t("common.cancel", "Annuler")}
          </button>
          <button
            type="button"
            className="co-bouton"
            onClick={fonder}
            disabled={!name.trim() || loading}
          >
            {loading && <Loader2 className="co-tourne" aria-hidden="true" />}
            {t("friends.foundGuild", "Fonder")}
          </button>
        </div>
      </div>
    </div>
  );
}
