import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/socle/ui/button";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { Textarea } from "@/socle/ui/textarea";
import { ChampEmblemeDePalier } from "@/domaines/succes/composants/ChampEmblemeDePalier";
import { fauteDuSeuil } from "@/domaines/succes/logique/echelleDesPaliers";
import { PREREGLAGES_DE_TEINTE, normaliserTeinte } from "@/domaines/succes/logique/teinte";
import type { Rank } from "@/domaines/succes/types";
import "@/domaines/succes/rang.css";

interface RankEditorProps {
  /** Le palier en cours d edition — tenu par le panneau, pas ici. */
  rank: Rank;
  onChange: (rank: Rank) => void;
  onClose: () => void;
  onSave: (rank: Rank) => Promise<void>;
  isNew?: boolean;
  /** Les autres paliers, pour savoir si un seuil est deja pris. */
  paliers: Rank[];
  /** Ce que les objectifs du pacte peuvent rapporter en tout. */
  globalMaxXP?: number;
}

/**
 * L EDITEUR D UN PALIER, SANS ONGLETS.
 *
 * ═══ CE QU IL ETAIT ═══
 *
 * Une fenetre modale a TROIS ONGLETS — « L essentiel », « Images »,
 * « Style » — pour SIX CHAMPS. Plus de navigation que de contenu, et
 * l apercu se trouvait toujours dans l onglet qu on ne regardait pas.
 *
 * ═══ CE QU IL EST ═══
 *
 * Une seule colonne : le nom, le seuil, l embleme, la teinte, la
 * devise. Dans l ordre ou l on y pense.
 *
 * IL S OUVRE SOUS LE BARREAU QU ON MODIFIE, et c est la deuxieme
 * correction. Ouvert en TETE du panneau, modifier un palier du bas
 * obligeait a remonter — et le palier lui-meme, son embleme compris,
 * sortait de l ecran. On modifiait a l aveugle.
 *
 * IL N A DONC PLUS D APERCU A LUI. Le barreau juste au-dessus EST
 * l apercu : c est le meme palier, le meme noyau, et il se met a jour
 * en direct puisque l echelle recoit le palier en cours d edition.
 * Deux apercus du meme objet a trois centimetres l un de l autre
 * etaient un de trop.
 *
 * LE SEUIL NE REFUSE PLUS APRES COUP. Un seuil deja pris ou au-dessus
 * du plafond se dit SOUS le champ, pendant la frappe. L ancienne
 * version validait, envoyait, puis annoncait la faute par une
 * notification : on apprenait son erreur apres l avoir commise.
 *
 * `background_url` et `background_opacity` ne sont plus proposes : ils
 * n existaient que pour `RankCard`, qui n existe plus. Les colonnes
 * restent, et sont ecrites telles quelles.
 */
export function RankEditor({
  rank, onChange, onClose, onSave, isNew, paliers, globalMaxXP = 0,
}: RankEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const teinte = normaliserTeinte(rank.frame_color);
  const faute = fauteDuSeuil(rank.min_points, rank.id, paliers, globalMaxXP);

  const modifier = (bout: Partial<Rank>) => onChange({ ...rank, ...bout });

  const enregistrer = async () => {
    setSaving(true);
    try {
      await onSave(rank);
      onClose();
    } catch {
      /* `onSave` dit lui-meme ce qui n a pas marche ; on reste ouvert. */
    } finally {
      setSaving(false);
    }
  };

  const message = faute?.quoi === "occupe"
    ? t("ranks.faute.occupe", { nom: faute.parQui })
    : faute?.quoi === "au-dessus-du-plafond"
      ? t("ranks.faute.plafond", { plafond: faute.plafond.toLocaleString("fr-FR") })
      : null;

  return (
    <section className="rg-editeur" aria-label={t(isNew ? "ranks.editeur.nouveau" : "ranks.editeur.modifier")}>
      {/* LE NOM */}
      <div className="space-y-2">
        <Label htmlFor="rg-nom" className="text-xs font-orbitron uppercase tracking-wider text-primary/70">
          {t("ranks.editeur.nom")}
        </Label>
        <Input
          id="rg-nom" value={rank.name} maxLength={40}
          onChange={(e) => modifier({ name: e.target.value })}
          placeholder={t("ranks.editeur.nomExemple")}
          className="border-primary/30 bg-card/50 font-orbitron text-primary"
        />
      </div>

      {/* LE SEUIL — la seule chose ou l on peut se tromper vraiment. */}
      <div className="space-y-2">
        <Label htmlFor="rg-seuil" className="text-xs font-orbitron uppercase tracking-wider text-primary/70">
          {t("ranks.editeur.seuil")}
        </Label>
        <Input
          id="rg-seuil" type="number" min={0} value={rank.min_points}
          onChange={(e) => modifier({ min_points: parseInt(e.target.value) || 0 })}
          aria-invalid={!!message}
          aria-describedby={message ? "rg-seuil-faute" : undefined}
          className={`border-primary/30 bg-card/50 tabular-nums text-primary ${message ? "border-destructive" : ""}`}
        />
        {message && (
          <p id="rg-seuil-faute" role="status" className="text-xs text-destructive">{message}</p>
        )}
      </div>

      {/* L EMBLEME */}
      <div id="rg-embleme">
        <ChampEmblemeDePalier url={rank.logo_url} onUrl={(logo_url) => modifier({ logo_url })} sansApercu />
      </div>

      {/* LA TEINTE — un seul controle, deux colonnes ecrites. */}
      <div className="space-y-2">
        <Label htmlFor="rg-teinte" className="text-xs font-orbitron uppercase tracking-wider text-primary/70">
          {t("ranks.editeur.teinte")}
        </Label>
        <div className="flex items-center gap-2">
          <input
            id="rg-teinte" type="color"
            aria-label={t("ranks.editeur.teinteNuancier")}
            value={teinte ?? "#5bb4ff"}
            onChange={(e) => modifier({ frame_color: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded border border-primary/30"
          />
          <Input
            aria-label={t("ranks.editeur.teinteCode")}
            value={rank.frame_color ?? ""}
            onChange={(e) => modifier({ frame_color: e.target.value || null })}
            className="flex-1 border-primary/30 bg-card/50 font-mono text-sm text-primary"
          />
        </div>
        <div className="rg-prereglages">
          {PREREGLAGES_DE_TEINTE.map((p) => (
            <button
              key={p.cle} type="button" className="rg-prereglage"
              style={{ backgroundColor: p.teinte }}
              /* Le nom de la teinte, pas sa clef : « cyan » etait une
                 chaine en dur, et la meme dans les deux langues. */
              aria-label={t("ranks.teinte." + p.cle)}
              title={t("ranks.teinte." + p.cle)}
              aria-pressed={teinte === p.teinte}
              onClick={() => modifier({ frame_color: p.teinte })}
            />
          ))}
        </div>
      </div>

      {/* LA DEVISE */}
      <div className="space-y-2">
        <Label htmlFor="rg-devise" className="text-xs font-orbitron uppercase tracking-wider text-primary/70">
          {t("ranks.editeur.devise")}
        </Label>
        <Textarea
          id="rg-devise" value={rank.quote || ""} maxLength={120}
          onChange={(e) => modifier({ quote: e.target.value })}
          placeholder={t("ranks.editeur.deviseExemple")}
          className="h-20 resize-none border-primary/30 bg-card/50 text-primary"
        />
      </div>

      <div className="flex gap-2 border-t border-primary/20 pt-3">
        <Button
          variant="outline" onClick={onClose}
          className="flex-1 border-primary/30 text-muted-foreground hover:bg-primary/10"
        >
          <X className="mr-2 h-4 w-4" />{t("ranks.annuler")}
        </Button>
        <Button
          onClick={enregistrer}
          disabled={saving || !rank.name.trim() || !!faute}
          className="flex-1 border border-primary/30 bg-primary/20 font-orbitron text-primary hover:bg-primary/30"
        >
          <Check className="mr-2 h-4 w-4" />
          {saving
            ? t("ranks.editeur.enregistrement")
            : isNew ? t("ranks.editeur.creer") : t("ranks.editeur.enregistrer")}
        </Button>
      </div>
    </section>
  );
}
