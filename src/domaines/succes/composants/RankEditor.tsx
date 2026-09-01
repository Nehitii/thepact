import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/socle/ui/button";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { Textarea } from "@/socle/ui/textarea";
import { RankCore } from "@/domaines/succes/composants/RankCore";
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
 * Une seule colonne. L apercu du noyau EN HAUT, toujours visible, et
 * les reglages dessous dans l ordre ou l on y pense : le nom, le seuil,
 * l embleme, la teinte, la devise.
 *
 * L APERCU N EST PAS DECORATIF, IL EST LE CONTROLE. Cliquer le centre
 * du noyau ouvre le choix d embleme ; cliquer son halo ouvre le choix
 * de teinte. Les memes reglages restent atteignables au clavier par les
 * champs en dessous — la manipulation directe S AJOUTE, elle ne
 * remplace pas, et les deux cibles sont donc hors du parcours de
 * tabulation.
 *
 * IL S OUVRE DANS LE PANNEAU, PAS PAR-DESSUS. C est ce qui laisse
 * l echelle visible : un seuil qu on tape y fait glisser le palier a sa
 * nouvelle place, en direct. Une fenetre modale l aurait couverte, et
 * la demande d une echelle qui bouge pendant la frappe n aurait pas eu
 * de sens.
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

  /* Les deux cibles de la manipulation directe pointent sur les vrais
     champs, plus bas : c est le meme reglage, atteint autrement. */
  const champEmbleme = useRef<HTMLDivElement>(null);
  const champTeinte = useRef<HTMLInputElement>(null);
  const viserLEmbleme = () => {
    champEmbleme.current?.scrollIntoView({ block: "nearest" });
    champEmbleme.current?.querySelector("button")?.click();
  };
  const viserLaTeinte = () => {
    champTeinte.current?.scrollIntoView({ block: "nearest" });
    champTeinte.current?.click();
  };

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
      {/* L APERCU, EN TETE ET TOUJOURS VISIBLE. */}
      <div className="rg-apercu">
        <RankCore
          taille="carte"
          level={1}
          rankName={rank.name}
          logoUrl={rank.logo_url}
          teinte={rank.frame_color}
          progress={45}
          currentXP={rank.min_points}
          targetXP={rank.min_points + 500}
          pied={false}
        />
        <button
          type="button" tabIndex={-1} aria-hidden="true"
          className="rg-cible" data-quoi="teinte"
          title={t("ranks.editeur.apercuTeinte")}
          onClick={viserLaTeinte}
        />
        <button
          type="button" tabIndex={-1} aria-hidden="true"
          className="rg-cible" data-quoi="embleme"
          title={t("ranks.editeur.apercuImage")}
          onClick={viserLEmbleme}
        />
      </div>

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
      <div ref={champEmbleme}>
        <ChampEmblemeDePalier url={rank.logo_url} onUrl={(logo_url) => modifier({ logo_url })} sansApercu />
      </div>

      {/* LA TEINTE — un seul controle, deux colonnes ecrites. */}
      <div className="space-y-2">
        <Label htmlFor="rg-teinte" className="text-xs font-orbitron uppercase tracking-wider text-primary/70">
          {t("ranks.editeur.teinte")}
        </Label>
        <div className="flex items-center gap-2">
          <input
            id="rg-teinte" ref={champTeinte} type="color"
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
              aria-label={p.cle}
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
