/* LES TROIS BRIQUES DE LA VITRINE : le declencheur, le choix, la case.
 *
 * Elles etaient au bas de `ProfileBoundedProfile.tsx`, sous un
 * commentaire qui disait « Helper Components (unchanged) » — une
 * etiquette qui ne dit ni ce qu elles font ni pourquoi elles sont la.
 * Elles en sortent telles quelles, et gagnent un nom de fichier qui les
 * annonce.
 *
 * Elles vont ensemble : on ouvre un choix depuis un declencheur, et le
 * choix est fait de cases. Rien d autre ne les rend.
 */
import { type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/socle/ui/dialog";


export function CustomizationTrigger({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-primary/20 bg-card/30 hover:bg-primary/5 hover:border-primary/50 transition-all group relative overflow-hidden"
    >
      <div className="mb-2 p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-1">{label}</span>
      <span className="text-sm font-bold text-foreground font-rajdhani truncate w-full text-center">
        {value || "Par défaut"}
      </span>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function SelectionDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--surface-overlay)] backdrop-blur-xl border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-primary tracking-widest uppercase flex items-center gap-2">
            <div className="w-1 h-4 bg-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 mt-4 custom-scrollbar">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function InventorySlot({
  active,
  owned,
  rarityColor,
  onClick,
  children,
}: {
  active: boolean;
  owned: boolean;
  rarityColor: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!owned}
      className={`
        relative group overflow-hidden rounded-lg border-2 transition-all duration-200 p-2 flex flex-col items-center justify-center min-h-[100px]
        ${
          active
            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(91,180,255,0.2)]"
            : owned
              ? `border-white/10 bg-card/30 hover:border-white/30 hover:bg-card/50`
              : "border-white/5 bg-black/40 opacity-40 grayscale cursor-not-allowed"
        }
      `}
    >
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20" />

      {children}

      {active && (
        <div className="absolute top-0 right-0 bg-primary text-black ds-t-label font-bold px-1.5 py-0.5 rounded-bl font-mono">
          ÉQUIPÉ
        </div>
      )}
      {!owned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-4 h-4 text-white/50" aria-hidden="true" />
          {/* Le cadenas etait muet : un lecteur d ecran annoncait un
              bouton desactive sans dire pourquoi. */}
          <span className="sr-only">Non possédé</span>
        </div>
      )}
    </button>
  );
}
