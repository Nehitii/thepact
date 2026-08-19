import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

/* Ce panneau explique la grammaire de la barre de saisie. Il etait
   entierement ecrit en dur, en anglais — declencheur sans nom compris,
   alors qu il n affiche qu une icone. */
const COMMANDES = [
  { cmd: "!high / !med / !low", cle: "todo.commands.priority" },
  { cmd: "#work / #perso / #admin", cle: "todo.commands.category" },
  { cmd: "@today / @tomorrow", cle: "todo.commands.deadline" },
  { cmd: "@nextweek", cle: "todo.commands.nextWeek" },
];

export function TodoCommandInfo() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("todo.commands.title")}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3" aria-label={t("todo.commands.title")}>
        <p className="ds-t-label font-mono uppercase tracking-widest text-muted-foreground mb-2">
          {t("todo.commands.title")}
        </p>
        <div className="space-y-1.5">
          {COMMANDES.map((c) => (
            <div key={c.cmd} className="flex items-start gap-2 text-xs">
              <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                {c.cmd}
              </code>
              <span className="text-muted-foreground pt-0.5">{t(c.cle)}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
