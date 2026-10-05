import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, ShieldOff, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMfa, type MfaEnrollment as Enrollment } from "@/hooks/useMfa";

/**
 * Enrôlement d'un facteur TOTP via Supabase Auth.
 *
 * Le QR code et le secret sont fournis par Supabase : rien n'est genere ni
 * stocke par l'application. Tant que le code de confirmation n'est pas
 * valide, le facteur reste au statut "unverified" et ne protege rien.
 */
export function MfaEnrollment() {
  const mfa = useMfa();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      setEnrollment(await mfa.enroll("Vowpact"));
      setCode("");
    } catch (e: any) {
      toast.error("Enrôlement impossible", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!enrollment || code.length !== 6) return;
    setBusy(true);
    try {
      await mfa.confirmEnrollment(enrollment.factorId, code);
      setEnrollment(null);
      setCode("");
      toast.success("Second facteur activé", {
        description: "Ta session porte désormais le niveau aal2.",
      });
    } catch (e: any) {
      toast.error("Code refusé", { description: e?.message });
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await mfa.disable();
      toast.success("Second facteur retiré");
    } catch (e: any) {
      toast.error("Retrait impossible", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (mfa.isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 font-mono ds-t-label text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> CHARGEMENT...
      </div>
    );
  }

  // ── Facteur actif ──
  if (mfa.enabled && !enrollment) {
    return (
      <div className="p-4 bg-card/40 border border-primary/30 space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-mono text-xs text-foreground/80">Application d'authentification</p>
            <p className="font-mono ds-t-label text-muted-foreground mt-1">
              Niveau de session : <span className="text-primary">{mfa.currentLevel ?? "?"}</span>
            </p>
          </div>
          <span className="px-2 py-1 ds-t-label font-mono tracking-widest uppercase border bg-primary/10 border-primary/40 text-primary">
            ACTIVE
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={revoke} disabled={busy}
          className="ds-t-label font-mono uppercase tracking-widest text-destructive hover:text-destructive">
          <ShieldOff className="w-3 h-3 mr-2" /> Retirer le second facteur
        </Button>
      </div>
    );
  }

  // ── Enrôlement en cours ──
  if (enrollment) {
    return (
      <div className="p-4 bg-card/40 border border-foreground/10 space-y-4">
        <p className="font-mono ds-t-label text-muted-foreground uppercase tracking-widest">
          1. Scanne ce code dans ton application
        </p>
        <div className="flex justify-center">
          <img src={enrollment.qrCode} alt="QR code d'enrôlement" className="w-44 h-44 bg-white p-2 rounded" />
        </div>
        <div className="space-y-1">
          <p className="font-mono ds-t-label text-muted-foreground">Ou saisis la clé manuellement :</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(enrollment.secret);
              toast.success("Clé copiée");
            }}
            className="flex items-center gap-2 w-full p-2 bg-background/60 border border-foreground/10 font-mono ds-t-label break-all text-left hover:border-primary/40"
          >
            <Copy className="w-3 h-3 flex-none text-muted-foreground" />
            {enrollment.secret}
          </button>
        </div>
        <p className="font-mono ds-t-label text-muted-foreground uppercase tracking-widest">
          2. Saisis le code affiché
        </p>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="flex gap-2">
          <Button onClick={confirm} disabled={busy || code.length !== 6} className="flex-1 font-mono ds-t-label uppercase tracking-widest">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmer"}
          </Button>
          <Button variant="ghost" onClick={() => { setEnrollment(null); setCode(""); }} disabled={busy}
            className="font-mono ds-t-label uppercase tracking-widest">
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // ── Aucun facteur ──
  return (
    <div className={cn("p-4 bg-card/40 border border-foreground/10 space-y-3")}>
      <div className="flex items-center gap-3">
        <ShieldOff className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-mono text-xs text-foreground/80">Application d'authentification</p>
          <p className="font-mono ds-t-label text-muted-foreground mt-1">Aucun second facteur</p>
        </div>
        <span className="px-2 py-1 ds-t-label font-mono tracking-widest uppercase border bg-foreground/5 border-foreground/10 text-muted-foreground">
          OFFLINE
        </span>
      </div>
      <Button onClick={start} disabled={busy} size="sm"
        className="font-mono ds-t-label uppercase tracking-widest">
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Activer"}
      </Button>
    </div>
  );
}
