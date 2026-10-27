import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/socle/ui/button";
import { Input } from "@/socle/ui/input";
import { Label } from "@/socle/ui/label";
import { useEmblemeDePalier } from "@/domaines/succes/hooks/useEmblemeDePalier";

interface Props {
  url: string | null | undefined;
  onUrl: (url: string | null) => void;
  /** L apercu vit ailleurs — dans le noyau — quand on lui en donne un. */
  sansApercu?: boolean;
}

/**
 * LE CHAMP D EMBLEME : UN TELEVERSEMENT, PUIS UNE ADRESSE.
 *
 * L image d un palier etait un champ texte ou l on collait une adresse.
 * Coller une adresse suppose que l image existe deja quelque part et
 * qu elle y restera ; ce n est pas un televersement, c est un pari sur
 * l hebergement de quelqu un d autre.
 *
 * LE COLLAGE RESTE, MAIS EN SECOND. Il rend encore service — reprendre
 * un embleme deja en ligne, essayer vite fait —, et le retirer serait
 * une perte seche. Il passe donc SOUS le bouton, a la place qui dit ce
 * qu il est : un second recours.
 *
 * Le glisser-deposer porte sur la zone d apercu, qui est ce qu on vise
 * naturellement en lachant un fichier.
 */
export function ChampEmblemeDePalier({ url, onUrl, sansApercu }: Props) {
  const { t } = useTranslation();
  const champ = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const { envoi, televerser } = useEmblemeDePalier(onUrl);

  const surDepot = (e: React.DragEvent) => {
    e.preventDefault();
    setSurvol(false);
    const fichier = e.dataTransfer.files?.[0];
    if (fichier) void televerser(fichier);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-orbitron text-primary/70 uppercase tracking-wider">
        {t("ranks.embleme.titre")}
      </Label>

      {!sansApercu && (
        <div
          onDragOver={(e) => { e.preventDefault(); setSurvol(true); }}
          onDragLeave={() => setSurvol(false)}
          onDrop={surDepot}
          onClick={() => champ.current?.click()}
          role="button"
          tabIndex={-1}
          aria-hidden="true"
          className={`flex h-24 cursor-pointer items-center justify-center border border-dashed transition-colors ${
            survol ? "border-primary bg-primary/10" : "border-primary/25 bg-primary/[0.02]"
          }`}
        >
          {url
            ? <img src={url} alt="" className="max-h-20 max-w-[80%] object-contain" />
            : <span className="ds-t-label text-muted-foreground">{t("ranks.embleme.deposer")}</span>}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => champ.current?.click()}
          disabled={envoi}
          className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
        >
          {envoi
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("ranks.embleme.envoi")}</>
            : <><ImagePlus className="mr-2 h-4 w-4" />{t("ranks.embleme.televerser")}</>}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("ranks.embleme.retirer")}
            onClick={() => onUrl(null)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={champ}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void televerser(f);
          e.target.value = "";
        }}
      />

      {/* Le second recours, a la place qui dit ce qu il est. */}
      <details className="pt-1">
        <summary className="ds-t-label cursor-pointer text-muted-foreground hover:text-primary/70">
          {t("ranks.embleme.ouColler")}
        </summary>
        <Input
          aria-label={t("ranks.embleme.adresse")}
          value={url || ""}
          onChange={(e) => onUrl(e.target.value || null)}
          placeholder="https://…"
          className="mt-2 bg-card/50 border-primary/30 text-primary text-sm"
        />
      </details>
    </div>
  );
}
