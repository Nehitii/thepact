import { useTranslation } from "react-i18next";
import { FocusFond } from "./FocusFond";
import { VARIANTES_FOND, type VarianteFond } from "./variantesFond";

const cyberClip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

interface FocusConfigPanelProps {
  fond: VarianteFond;
  onFondChange: (v: VarianteFond) => void;
  breakMin: number;
  longBreakMin: number;
  onBreakChange: (v: number) => void;
  onLongBreakChange: (v: number) => void;
}

export function FocusConfigPanel({
  fond,
  onFondChange,
  breakMin,
  longBreakMin,
  onBreakChange,
  onLongBreakChange,
}: FocusConfigPanelProps) {
  const { t } = useTranslation();
  /* L apercu montre ce qui est CHOISI, pas ce que le pointeur effleure :
     un fond qui change au moindre passage de souris rend la rangee
     nerveuse et empeche de comparer. */
  const montre = fond;

  /* LE PANNEAU S OUVRE PLUS GRAND.

     Il tenait dans 512 px, dont un apercu de 132 px de haut : une
     meurtriere sur une scene qui occupe tout l ecran. On y choisit
     pourtant le fond de la seance — c est le seul endroit ou on le
     voit avant de le vivre.

     Une grille a deux colonnes a ete essayee, puis retiree : la
     colonne de Focus plafonne a 600 px, et couper cette largeur en
     deux ramenait l apercu a 288 px — plus etroit qu avant. Mesure
     avant de croire une intuition de mise en page. */
  return (
    <div className="w-full max-w-3xl space-y-3 p-4 sm:p-5 bg-card/40 backdrop-blur border border-border/50" style={{ clipPath: cyberClip }}>
      <p className="ds-t-label font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-3" aria-hidden="true">
        {t("focus.config.title")}
      </p>
      {/* Le fond se choisit ici, et le changement se voit tout de suite —
          le panneau est ouvert par-dessus la scene qui tourne. */}
      <div
        className="flex flex-col gap-2 p-3 bg-background/50 border border-border/30"
        style={{ clipPath: cyberClip }}
      >
        <span className="text-xs font-mono text-foreground">{t("focus.config.backdrop")}</span>
        <div className="sc-fonds">
          {VARIANTES_FOND.map((v) => (
            <button
              key={v}
              type="button"
              className="cyb cyb--petit"
              aria-pressed={fond === v}
              onClick={() => onFondChange(v)}
            >
              {t("focus.backdrop." + v)}
            </button>
          ))}
        </div>

        {/* Le fond ne tourne pas au repos : sans cet apercu, on choisit un
            nom sans avoir jamais vu ce qu il designe. */}
        <figure className="sc-apercu">
          {montre === "aucun"
            ? <span className="sc-apercu-vide">{t("focus.backdrop.none")}</span>
            : <FocusFond variante={montre} actif progress={0.55} apercu />}
          <figcaption>{t("focus.backdrop." + montre)}</figcaption>
        </figure>
      </div>

      <DurationRow
        label={t("focus.config.break")}
        options={[3, 5, 10, 15]}
        value={breakMin}
        onChange={onBreakChange}
      />
      <DurationRow
        label={t("focus.config.longBreak")}
        options={[10, 15, 20, 30]}
        value={longBreakMin}
        onChange={onLongBreakChange}
      />
    </div>
  );
}

function DurationRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 p-3 bg-background/50 border border-border/30"
      style={{ clipPath: cyberClip }}
    >
      <span className="text-xs font-mono text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {options.map((m) => (
          <button
            key={m}
            type="button"
            className="cyb cyb--petit"
            aria-pressed={value === m}
            onClick={() => onChange(m)}
          >
            {m}′
          </button>
        ))}
      </div>
    </div>
  );
}
