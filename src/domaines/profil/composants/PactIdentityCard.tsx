import { useCallback } from "react";
import { Bouton } from "@/socle/ds/console-ui";
import { Save, Loader2, Type, Wand2 } from "lucide-react";
import { DataPanel } from "@/socle/ds/settings-ui";
import { Input } from "@/socle/ui/input";
import { Textarea } from "@/socle/ui/textarea";
import { Label } from "@/socle/ui/label";
import { toast } from "sonner";
import {
  PactVisual, POLICES_DU_TITRE, EFFETS_DU_TITRE,
  familleDeLaPolice, styleDeLEffet,
} from "@/domaines/objectifs";
import { useThemeSombre } from "@/socle/hooks/useThemeSombre";
import { cn } from "@/socle/outils/utils";

const SYMBOL_OPTIONS = [
  { key: "flame", label: "Flamme" },
  { key: "heart", label: "Cœur" },
  { key: "target", label: "Cible" },
  { key: "sparkles", label: "Éclats" },
  { key: "phoenix", label: "Phénix" },
  { key: "compass", label: "Boussole" },
  { key: "citadel", label: "Citadelle" },
  { key: "vortex", label: "Vortex" },
  { key: "shield", label: "Bouclier" },
];

/* LES POLICES ET LES EFFETS SONT CEUX DU PACTE, PAS CEUX DE CETTE
   CARTE. Elle en tenait sa propre copie — cinq polices, six effets —
   recopiee a la main de « stylesBanniere ». Les deux avaient diverge :
   « Parasites » y valait « {} » alors que le bandeau l anime, et deux
   des cinq polices n existaient nulle part dans le depot. Un ecran de
   choix qui dessine lui-meme ce qu il propose peut mentir sur ce qu il
   donne ; celui-ci lit desormais la meme table que le bandeau. */

interface PactIdentityCardProps {
  pactId: string | null;
  pactName: string;
  pactMantra: string;
  pactSymbol: string;
  titleFont: string;
  titleEffect: string;
  onPactNameChange: (value: string) => void;
  onPactMantraChange: (value: string) => void;
  onPactSymbolChange: (value: string) => void;
  onTitleFontChange: (value: string) => void;
  onTitleEffectChange: (value: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

const CY_INPUT = [
  "bg-[var(--surface-input)] border border-primary/25 rounded-none",
  "focus:border-primary/70 focus:bg-[var(--surface-input-focus)]",
  "text-primary/80 placeholder:text-primary/15 font-mono text-sm tracking-wide h-11",
  "transition-all duration-200",
].join(" ");

export function PactIdentityCard({
  pactId,
  pactName,
  pactMantra,
  pactSymbol,
  titleFont,
  titleEffect,
  onPactNameChange,
  onPactMantraChange,
  onPactSymbolChange,
  onTitleFontChange,
  onTitleEffectChange,
  onSave,
  isSaving = false,
}: PactIdentityCardProps) {
  const handleSave = useCallback(async () => {
    if (!pactId) {
      toast.error("Aucun pacte", { description: "Termine d’abord la mise en route." });
      return;
    }
    if (!pactName.trim()) {
      toast.error("Il manque le nom", { description: "Un pacte sans nom ne se retrouve pas." });
      return;
    }
    /* `mutateAsync` rejette quand l ecriture echoue. La mutation
       affiche deja son propre message dans `onError` ; sans ce
       rattrapage, le rejet remontait jusqu au `onClick` et finissait
       en promesse non geree. */
    try {
      await onSave();
    } catch {
      /* Deja signale par la mutation. */
    }
  }, [pactId, pactName, onSave]);

  /* L EFFET DEPEND DU THEME. La carte supposait le sombre et montrait
     un halo a qui, en theme clair, allait recevoir une bavure d encre. */
  const sombre = useThemeSombre();
  const selectedFontFamily = familleDeLaPolice(titleFont);
  const selectedEffectStyle = styleDeLEffet(titleEffect, sombre);

  return (
    <>
    <DataPanel
      code="MODULE_02"
      title="Identité du pacte"
      statusText={pactId ? <span className="text-primary/50">relié</span> : <span className="text-destructive">aucun pacte</span>}
      footerLeft={<span>Nom : <b className="text-primary">{pactName || "—"}</b></span>}
      footerRight={<span className="text-primary/40">Symbole : {pactSymbol.toUpperCase()}</span>}
    >
      <div className="py-4 space-y-5">
        {/* L APERCU EST PARTI EN HAUT DE LA PAGE, ET IL EST ENTIER.
            Celui d ici montrait un logo de 44 px a cote du titre : ni
            le sceau, ni l echelle, ni le fond sur lequel le bandeau se
            pose. On y choisissait une police pour un ecran qu on ne
            voyait pas. Le nouveau est collant, donc encore visible
            quand on descend jusqu au choix de la police. */}

        {/* Project Name */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            {/* `htmlFor` + `id` : les deux champs de cette carte
                s annoncaient « zone d edition, vide ». */}
            <Label htmlFor="pacte-nom" className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Nom du projet</Label>
          </div>
          <Input id="pacte-nom" value={pactName} onChange={(e) => onPactNameChange(e.target.value)} placeholder="ex. Projet Phénix" maxLength={50} className={CY_INPUT} />
          <div className="flex justify-between">
            <p className="ds-t-label text-primary/20 font-mono tracking-wider">Le nom qui porte ta mission.</p>
            <span className="ds-t-label text-primary/20 font-mono">{pactName.length}/50</span>
          </div>
        </div>

        {/* Mantra */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label htmlFor="pacte-mantra" className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Le pourquoi</Label>
          </div>
          <Textarea id="pacte-mantra" value={pactMantra} onChange={(e) => onPactMantraChange(e.target.value)} placeholder="ex. Devenir la meilleure version de moi-même…" maxLength={200} rows={3} className={cn(CY_INPUT, "h-auto resize-none")} />
          <div className="flex justify-between">
            <p className="ds-t-label text-primary/20 font-mono tracking-wider">La phrase qui te remet en route.</p>
            <span className="ds-t-label text-primary/20 font-mono">{pactMantra.length}/200</span>
          </div>
        </div>

      </div>
    </DataPanel>

    {/* CE QUE LE PACTE EST, PUIS COMMENT IL SE MONTRE.
        Un seul panneau portait les deux — 1 599 px, 82 % de sa section,
        le plus gros de toute la console. Le nom et la raison d un cote,
        l embleme et sa typographie de l autre : deux natures, deux
        panneaux, sans onglet de plus dans le rail. */}
    <DataPanel
      code="MODULE_02b"
      title="Emblème du pacte"
      statusText={<span className="text-primary/40">{pactSymbol.toUpperCase()}</span>}
      footerRight={<span className="text-primary/40">Police : {POLICES_DU_TITRE.find((f) => f.cle === titleFont)?.nom ?? "—"}</span>}
    >
      <div className="py-4 space-y-5">
        {/* Pact Symbol */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Symbole</Label>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {SYMBOL_OPTIONS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => onPactSymbolChange(key)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 border transition-all duration-200 overflow-hidden",
                  pactSymbol === key
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}>
                <PactVisual symbol={key} size="sm" />
                <span className="ds-t-label font-mono text-primary/50 tracking-wider uppercase">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Font */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Type className="h-3 w-3 text-primary/40" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Police du titre</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POLICES_DU_TITRE.map(({ cle, nom, famille }) => (
              <button
                key={cle}
                type="button"
                onClick={() => onTitleFontChange(cle)}
                aria-pressed={titleFont === cle}
                className={cn(
                  "flex items-center gap-3 p-3 border transition-all duration-200 text-left",
                  titleFont === cle
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}
              >
                <span
                  className="text-base text-primary/80 truncate"
                  style={{ fontFamily: famille }}
                >
                  {pactName || "Projet"}
                </span>
                <span className="ds-t-label font-mono text-primary/30 tracking-wider uppercase ml-auto shrink-0">{nom}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title Effect */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-primary/40 rotate-45 inline-block shrink-0" />
            <Wand2 className="h-3 w-3 text-primary/40" />
            <Label className="ds-t-label uppercase tracking-[0.22em] text-primary/40 font-mono font-semibold">Effet du titre</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EFFETS_DU_TITRE.map(({ cle, nom }) => (
              <button
                key={cle}
                type="button"
                onClick={() => onTitleEffectChange(cle)}
                aria-pressed={titleEffect === cle}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 border transition-all duration-200",
                  titleEffect === cle
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                    : "border-primary/15 bg-primary/[0.02] hover:border-primary/40"
                )}
              >
                <span
                  className="text-sm text-primary/80 font-bold uppercase"
                  style={{ fontFamily: selectedFontFamily, ...styleDeLEffet(cle, sombre) }}
                >
                  Aa
                </span>
                <span className="ds-t-label font-mono text-primary/30 tracking-wider uppercase">{nom}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <Bouton role="primaire" onClick={handleSave} disabled={isSaving || !pactId}>
          {isSaving
            ? <><Loader2 className="animate-spin" />Enregistrement…</>
            : <><Save />Enregistrer</>}
        </Bouton>
      </div>
    </DataPanel>
    </>
  );
}
