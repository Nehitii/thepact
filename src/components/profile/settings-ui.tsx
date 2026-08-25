import React from "react";
import { Panneau } from "@/components/profile/console-ui";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════
   Primitives partagees de la console de reglages
   ══════════════════════════════════════════════ */

/* ── CyberPanel ── */
/* CYBERPANEL DEVIENT UN ADAPTATEUR.
 *
 * Une seconde couche de composants — les six cartes du pacte via
 * `DataPanel`, les reglages du compte, la difficulte sur mesure —
 * dessinait encore ses propres panneaux : angles coupes, degrade,
 * pastille clignotante. Les reecrire un a un aurait touche a leur
 * logique sans necessite ; les faire passer par `Panneau` uniformise
 * tout d un geste, et `DataPanel` suit puisqu il delegue ici.
 *
 * Le titre humain devient l intitule code du panneau : la console le
 * met en majuscules entre crochets, comme les autres. */
export function CyberPanel({
  title,
  children,
  accent = "cyan",
  statusText,
  taille = "pleine",
  rang,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "cyan" | "red";
  statusText?: React.ReactNode;
  /* Les cartes heritees prennent la pleine largeur par defaut : elles
     n ont pas ete dessinees pour une demi-colonne. Celles qui s y
     pretent le declarent. */
  taille?: "demi" | "pleine";
  rang?: "primaire" | "normal" | "discret";
}) {
  return (
    <Panneau
      code={title}
      etat={statusText}
      ton={accent === "red" ? "danger" : "neutre"}
      taille={taille}
      rang={rang}
    >
      <div className="space-y-5 py-2">{children}</div>
    </Panneau>
  );
}







/* ── DataPanel (kept for backward compat, now wraps CyberPanel) ── */
export function DataPanel({
  code,
  title,
  statusText,
  footerLeft,
  footerRight,
  children,
  taille,
  rang,
}: {
  code: string;
  title: string;
  statusText?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  children: React.ReactNode;
  /* Transmis a `CyberPanel`, donc a `Panneau` : sans ce relais, une
     carte ne pouvait pas demander une demi-colonne. */
  taille?: "demi" | "pleine";
  rang?: "primaire" | "normal" | "discret";
}) {
  return (
    <CyberPanel title={title} statusText={statusText} taille={taille} rang={rang}>
      <div>{children}</div>
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-primary/10">
          <div className="font-mono ds-t-label text-muted-foreground tracking-[0.1em] flex gap-4">{footerLeft}</div>
          <div className="font-mono ds-t-label text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">{footerRight}</div>
        </div>
      )}
    </CyberPanel>
  );
}

/* ── Setting Row (toggle) ── */
export type SettingRowVariant = "primary" | "cyan" | "amber";

const variantMap = {
  primary: {
    iconBorder: "border-primary/20 bg-primary/10",
    iconBorderHover: "group-hover:border-primary group-hover:bg-primary/25 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
    label: "text-foreground",
    statusOn: "text-primary",
    bar: "bg-primary",
  },
  cyan: {
    iconBorder: "border-[hsl(195,100%,50%)]/40 bg-[hsl(195,100%,50%)]/10",
    iconBorderHover: "group-hover:border-[hsl(195,100%,50%)] group-hover:bg-[hsl(195,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(195,100%,50%,0.4)]",
    label: "text-[hsl(195,100%,50%)]",
    statusOn: "text-[hsl(195,100%,50%)]",
    bar: "bg-[hsl(195,100%,50%)]",
  },
  amber: {
    iconBorder: "border-[hsl(40,100%,50%)]/40 bg-[hsl(40,100%,50%)]/10",
    iconBorderHover: "group-hover:border-[hsl(40,100%,50%)] group-hover:bg-[hsl(40,100%,50%)]/25 group-hover:shadow-[0_0_12px_hsl(40,100%,50%,0.4)]",
    label: "text-[hsl(40,100%,50%)]",
    statusOn: "text-[hsl(40,100%,50%)]",
    bar: "bg-[hsl(40,100%,50%)]",
  },
};

export function SettingRow({
  icon,
  label,
  description,
  checked,
  disabled,
  variant = "primary",
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  variant?: SettingRowVariant;
  onToggle: (v: boolean) => void;
}) {
  const v = variantMap[variant];
  return (
    <div
      className="group relative flex items-center justify-between gap-4 py-4 px-5 -mx-5 cursor-pointer overflow-hidden border-b border-primary/[0.06] last:border-b-0 transition-colors hover:bg-primary/[0.03]"
      onClick={() => !disabled && onToggle(!checked)}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] origin-center scale-y-0 transition-transform group-hover:scale-y-100", v.bar)} />
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={cn(
          "w-9 h-9 border flex items-center justify-center flex-shrink-0 transition-all duration-300",
          v.iconBorder, v.iconBorderHover,
          "[clip-path:polygon(8px_0%,100%_0%,100%_calc(100%-8px),calc(100%-8px)_100%,0%_100%,0%_8px)]"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-rajdhani text-sm font-bold tracking-wider uppercase leading-none mb-1", v.label)}>
            {label}
          </div>
          <div className="ds-t-label text-muted-foreground tracking-wide leading-snug hidden sm:block">
            {description}
          </div>
        </div>
      </div>
      <span className={cn("font-mono ds-t-label tracking-widest min-w-[50px] text-right hidden sm:block transition-colors", checked ? v.statusOn : "text-muted-foreground")}>
        {checked ? "ACTIF" : "INACTIF"}
      </span>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch aria-label={label} checked={checked} onCheckedChange={onToggle} disabled={disabled} />
      </div>
    </div>
  );
}
