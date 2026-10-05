import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnlockGoalModalProps {
  open: boolean;
  onClose: () => void;
  onUnlock: () => void;
  correctCode: string;
}

export function UnlockGoalModal({ open, onClose, onUnlock, correctCode }: UnlockGoalModalProps) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setCode(["", "", "", ""]);
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (value && index === 3) {
      const entered = newCode.join("");
      if (entered === correctCode) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setCode(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm border-primary/20 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-orbitron text-primary uppercase tracking-wider text-sm">
            Goal Locked
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter your 4-digit unlock code to access this goal
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex justify-center gap-3 my-6 transition-transform",
            shake && "animate-[shake_0.5s_ease-in-out]"
          )}
        >
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "w-14 h-14 text-center text-2xl font-orbitron rounded-xl border-2 bg-background/50 outline-none transition-all",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                error ? "border-destructive text-destructive" : "border-primary/30 text-foreground"
              )}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-destructive text-xs font-medium">
            <ShieldAlert className="h-3.5 w-3.5" />
            Incorrect code. Try again.
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={onClose} className="w-full mt-2 text-muted-foreground">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
