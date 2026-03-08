import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

const COMMANDS = [
  { cmd: "!high / !med / !low", desc: "Set priority" },
  { cmd: "#work / #perso / #admin", desc: "Set category" },
  { cmd: "@today / @tomorrow", desc: "Set deadline" },
  { cmd: "@nextweek", desc: "Deadline next Monday" },
  { cmd: "~waiting / ~rdv / ~deadline", desc: "Set task type" },
];

export function TodoCommandInfo() {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Info className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Quick Commands
        </p>
        <div className="space-y-1.5">
          {COMMANDS.map((c) => (
            <div key={c.cmd} className="flex items-start gap-2 text-xs">
              <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                {c.cmd}
              </code>
              <span className="text-muted-foreground pt-0.5">{c.desc}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
