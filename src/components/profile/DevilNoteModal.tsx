import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DevilNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DevilNoteModal({ open, onOpenChange }: DevilNoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-destructive/50 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="text-center space-y-6 animate-in fade-in-50 duration-1000">
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-light tracking-wide">
              Once the pact is sealed, the path behind you dissolves.
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90 font-light tracking-wide">
              What you chose in fire can never be undone.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}