import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DSPanel } from "@/components/ds";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation globale",
    items: [
      { keys: ["Ctrl/Cmd", "K"], label: "Ouvrir la palette de commandes" },
      { keys: ["Ctrl/Cmd", "J"], label: "Ouvrir le Coach IA" },
      { keys: ["?"], label: "Afficher cette aide" },
      { keys: ["Ctrl", "/"], label: "Afficher cette aide (alt)" },
    ],
  },
  {
    title: "Reviews (rituels)",
    items: [
      { keys: ["F7"], label: "Daily Review" },
      { keys: ["F8"], label: "Monthly Review" },
      { keys: ["F9"], label: "Quarterly Review" },
    ],
  },
  {
    title: "Focus session (timer actif)",
    items: [
      { keys: ["Espace"], label: "Pause / Reprise" },
      { keys: ["Shift", "S"], label: "Skip phase courante" },
      { keys: ["Escape"], label: "Terminer la session (confirmation)" },
    ],
  },
  {
    title: "Analytics",
    items: [{ keys: ["←", "→"], label: "Naviguer entre les périodes" }],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] px-1.5 h-6 rounded border border-primary/30 bg-primary/10 text-[10px] font-mono font-bold text-primary tracking-wider uppercase">
      {children}
    </kbd>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutHelpOverlay({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-orbitron tracking-wider">
            <Keyboard className="h-5 w-5 text-primary" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription className="font-rajdhani">
            Toutes les combinaisons disponibles dans Vowpact.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {GROUPS.map((group) => (
            <DSPanel key={group.title} title={group.title} tier="secondary">
              <ul className="divide-y divide-border/40">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm text-foreground/90">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </DSPanel>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const SHORTCUT_HELP_EVENT = "vowpact:open-shortcut-help";