import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useMfa } from "@/hooks/useMfa";
import { useCodesDeSecours, motifLisible } from "@/hooks/useCodesDeSecours";
import { Input } from "@/components/ui/input";
import { Smartphone, Loader2, KeyRound } from "lucide-react";
import { DSPageShell } from "@/components/ds";

type FromState = { from?: string };

/**
 * Verification du second facteur sur une session existante.
 *
 * Un code valide fait reemettre le JWT avec `aal2`. C'est cette
 * revendication que les politiques RLS exigent : sortir de cet ecran sans
 * l'obtenir ne donne acces a rien.
 */
export default function TwoFactor() {
  const navigate = useNavigate();
  const location = useLocation();
  const mfa = useMfa();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  /* DEUX CHEMINS POUR ENTRER.
     Le code de l application redonne `aal2`. Le code de secours ne le
     peut pas — seul `mfa.verify()` le delivre — il RETIRE le facteur :
     on revient a un compte sans second facteur, qu on rouvre puis qu on
     re-enrole. Cette page annonçait d ailleurs qu aucun code de secours
     n existait, et renvoyait au tableau de bord Supabase. */
  const [modeSecours, setModeSecours] = useState(false);
  const [codeSecours, setCodeSecours] = useState("");
  const { utiliser } = useCodesDeSecours(false);

  const from = useMemo(() => {
    const state = (location.state ?? {}) as FromState;
    const candidate = typeof state.from === "string" ? state.from : "";
    // N'accepter qu'un chemin interne. "//host" et "/\host" sont traites comme
    // des URL protocole-relatives par le routeur et sortiraient du site
    // (CVE-2025-68470 et son contournement par antislash).
    const isInternal = /^\/(?![/\\])/.test(candidate);
    return isInternal ? candidate : "/";
  }, [location.state]);

  // Si le second facteur n'est plus attendu, ne pas retenir l'utilisateur ici.
  useEffect(() => {
    if (!mfa.isLoading && !mfa.isRequired) navigate(from, { replace: true });
  }, [from, navigate, mfa.isLoading, mfa.isRequired]);

  const submit = useCallback(async () => {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      await mfa.verify(code);
      toast.success("Identite confirmee");
      navigate(from, { replace: true });
    } catch (e) {
      toast.error("Code refusé", { description: e instanceof Error ? e.message : String(e) });
      setCode("");
    } finally {
      setBusy(false);
    }
  }, [code, from, mfa, navigate]);

  const soumettreSecours = useCallback(async () => {
    if (!codeSecours.trim()) return;
    setBusy(true);
    try {
      await utiliser(codeSecours);
      toast.success("Second facteur retiré", {
        description: "Ton compte est de nouveau accessible. Pense à le réactiver.",
      });
      /* Le facteur n existe plus : `isRequired` retombe, et l effet
         ci-dessus renvoie l utilisateur d ou il venait. */
      await mfa.refresh();
      navigate(from, { replace: true });
    } catch (e) {
      toast.error("Code refusé", {
        description: motifLisible(e instanceof Error ? e.message : String(e)),
      });
      setCodeSecours("");
    } finally {
      setBusy(false);
    }
  }, [codeSecours, from, mfa, navigate, utiliser]);

  // Validation automatique des que les six chiffres sont saisis.
  useEffect(() => {
    if (!modeSecours && code.length === 6 && !busy) void submit();
  }, [code, busy, submit, modeSecours]);

  if (mfa.isLoading) {
    return (
      <DSPageShell>
        <div className="flex min-h-[100dvh] items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DSPageShell>
    );
  }

  return (
    <DSPageShell>
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-mono uppercase tracking-widest text-sm">
              Verification requise
            </CardTitle>
            <CardDescription className="font-mono ds-t-label">
              Saisis le code a six chiffres affiche par ton application d'authentification.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {modeSecours ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="code-de-secours"
                    className="ds-t-label font-mono uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Code de secours
                  </label>
                  <Input
                    id="code-de-secours"
                    value={codeSecours}
                    onChange={(e) => setCodeSecours(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void soumettreSecours(); }}
                    placeholder="ABCDE-FGHJK"
                    autoFocus
                    disabled={busy}
                    className="font-mono tracking-[0.2em] text-center uppercase"
                  />
                </div>

                <Button
                  onClick={soumettreSecours}
                  disabled={busy || !codeSecours.trim()}
                  className="w-full font-mono ds-t-label uppercase tracking-widest"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Utiliser ce code"}
                </Button>

                <p className="text-center font-mono ds-t-label leading-relaxed text-muted-foreground">
                  Ce code retire ton second facteur au lieu de le vérifier&nbsp;: il te rend
                  l’accès, il ne le contourne pas. Il ne servira qu’une fois.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy} autoFocus>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={submit}
                  disabled={busy || code.length !== 6}
                  className="w-full font-mono ds-t-label uppercase tracking-widest"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setModeSecours((v) => !v); setCode(""); setCodeSecours(""); }}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 font-mono ds-t-label uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <KeyRound className="h-3 w-3" />
              {modeSecours ? "Revenir au code de l’application" : "Utiliser un code de secours"}
            </button>
          </CardContent>
        </Card>
      </div>
    </DSPageShell>
  );
}
