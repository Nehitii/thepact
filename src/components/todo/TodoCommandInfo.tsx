import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

/* LA GRAMMAIRE DE L INVITE
 *
 * Trois indices — !high, #work, @today — occupaient une ligne pleine
 * au-dessus du champ, en permanence, pour une syntaxe qu on apprend
 * une fois. Ils passent derriere ce bouton, avec le reste. Le panneau
 * etait par ailleurs ecrit en dur, en anglais, declencheur sans nom
 * compris — alors qu il n affiche qu une icone. */
const COMMANDES = [
  { cmd: "!high / !med / !low", cle: "todo.commands.priority", teinte: "tsk-jeton-prio" },
  { cmd: "#work / #perso / #admin", cle: "todo.commands.category", teinte: "tsk-jeton-cat" },
  { cmd: "@today / @tomorrow", cle: "todo.commands.deadline", teinte: "tsk-jeton-ech" },
  { cmd: "@nextweek", cle: "todo.commands.nextWeek", teinte: "tsk-jeton-ech" },
];

export function TodoCommandInfo() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("todo.commands.title")}
          className="tsk-outil est-icone"
        >
          <Info className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="tsk w-72 p-0 rounded-none border-[hsl(var(--ds-border-default)/0.22)] bg-[hsl(var(--ds-surface-1))]"
        aria-label={t("todo.commands.title")}
      >
        <div className="tsk-dlg-rail">
          <b>SYN.</b>
          <i />
          <span>{t("todo.commands.title")}</span>
        </div>
        <div className="tsk-indices p-3">
          {COMMANDES.map((c) => (
            <span key={c.cmd} className="flex items-start gap-2">
              <b className={c.teinte}>{c.cmd}</b>
              <span className="opacity-80">{t(c.cle)}</span>
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
