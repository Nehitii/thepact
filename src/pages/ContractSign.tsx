import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGoalContractById,
  useContractSignatures,
  useSignGoalContract,
} from "@/hooks/useGoalContracts";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DSPanel, DSBadge, DSLoadingState, DSEmptyState } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BondIcon } from "@/components/ui/bond-icon";
import { ArrowLeft, Handshake, ShieldCheck, Users, Check, Clock } from "lucide-react";

const HOLD_DURATION = 1500;

export default function ContractSign() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);

  const { data: contract, isLoading } = useGoalContractById(contractId);
  const { data: signatures = [] } = useContractSignatures(contractId);
  const sign = useSignGoalContract();

  const [name, setName] = useState("");
  const [progress, setProgress] = useState(0);
  const holdTimer = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const rafId = useRef<number | null>(null);

  // Pre-fill name when profile loads
  if (!name && profile?.display_name) setName(profile.display_name);

  // Resolve goal name
  const { data: goal } = useQuery({
    queryKey: ["contract-goal", contract?.goal_id],
    queryFn: async () => {
      if (!contract?.goal_id) return null;
      const { data } = await supabase.from("goals").select("name").eq("id", contract.goal_id).maybeSingle();
      return data;
    },
    enabled: !!contract?.goal_id,
  });

  // Resolve owner display name
  const { data: owner } = useQuery({
    queryKey: ["contract-owner", contract?.owner_id],
    queryFn: async () => {
      if (!contract?.owner_id) return null;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", contract.owner_id).maybeSingle();
      return data;
    },
    enabled: !!contract?.owner_id,
  });

  const isWitness = !!user?.id && contract?.witnesses?.includes(user.id);
  const alreadySigned = signatures.some((s) => s.witness_id === user?.id);
  const required = contract?.witnesses?.length ?? 0;
  const signedCount = signatures.length;

  const tick = () => {
    const elapsed = Date.now() - startTime.current;
    const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
    setProgress(pct);
    if (pct < 100) rafId.current = requestAnimationFrame(tick);
  };

  const startHold = () => {
    if (!isWitness || alreadySigned || sign.isPending) return;
    if (!name || name.trim().length < 2) return;
    startTime.current = Date.now();
    rafId.current = requestAnimationFrame(tick);
    holdTimer.current = window.setTimeout(() => {
      sign.mutate({ contractId: contractId!, signatureName: name.trim() });
      setProgress(0);
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    holdTimer.current = null;
    rafId.current = null;
    setProgress(0);
  };

  if (isLoading) return <div className="p-6"><DSLoadingState label="Chargement du pacte" /></div>;

  if (!contract) {
    return (
      <div className="p-6">
        <DSEmptyState
          title="Contrat introuvable"
          description="Ce pacte a peut-être été annulé ou ne t'est pas accessible."
          action={<Link to="/" className="text-primary text-sm underline">Retour</Link>}
        />
      </div>
    );
  }

  const statusVariant: Record<string, any> = {
    pending: "warning",
    active: "success",
    succeeded: "success",
    failed: "critical",
    canceled: "muted",
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </button>

      <DSPanel tier="primary" className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary/80 font-display">
              <Handshake className="w-4 h-4" />
              Pacte d'engagement
            </div>
            <h1 className="text-2xl font-display tracking-wide">{goal?.name || "Objectif"}</h1>
            <p className="text-sm text-muted-foreground">
              Engagé par <span className="text-foreground font-medium">{owner?.display_name || "—"}</span>
            </p>
          </div>
          <DSBadge variant={statusVariant[contract.status] || "muted"}>{contract.status}</DSBadge>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mise</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <BondIcon size={16} />
              <span className="text-lg font-mono">{contract.stake_bonds}</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Signatures</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-lg font-mono tabular-nums">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              {signedCount}/{required}
            </div>
          </div>
          <div className="rounded-lg border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Échéance</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm font-mono">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {contract.deadline ? new Date(contract.deadline).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>

        {contract.notes && (
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 text-sm text-muted-foreground italic">
            « {contract.notes} »
          </div>
        )}

        {/* Signatures list */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Témoins ayant signé</Label>
          {signatures.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic">Personne n'a encore signé.</p>
          ) : (
            <ul className="space-y-1">
              {signatures.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-white/[0.02]">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">{s.signature_name}</span>
                  </span>
                  <span className="text-muted-foreground/60 tabular-nums">
                    {new Date(s.signed_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DSPanel>

      {/* Sign panel */}
      {!isWitness ? (
        <DSPanel className="p-4 text-sm text-muted-foreground">
          Tu n'es pas un témoin désigné de ce pacte.
        </DSPanel>
      ) : alreadySigned ? (
        <DSPanel className="p-6 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-medium">Tu as déjà signé ce pacte.</p>
          {contract.status === "active" && (
            <p className="text-xs text-muted-foreground">Tous les témoins requis ont signé. Le pacte est actif.</p>
          )}
        </DSPanel>
      ) : contract.status !== "pending" ? (
        <DSPanel className="p-4 text-sm text-muted-foreground">
          Ce pacte n'est plus en attente de signatures.
        </DSPanel>
      ) : (
        <DSPanel className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg">Apposer ta signature</h2>
            <p className="text-xs text-muted-foreground">
              En signant, tu acceptes d'être témoin moral. Si l'engagement échoue, les Bonds en jeu seront redistribués.
            </p>
          </div>

          <div>
            <Label className="text-xs">Nom complet</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prénom Nom"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              disabled={!name || name.trim().length < 2 || sign.isPending}
              className="relative w-full overflow-hidden rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed transition py-4 text-sm font-display uppercase tracking-[0.2em] text-primary"
              aria-label="Maintenir pour signer"
            >
              <AnimatePresence>
                {progress > 0 && (
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.05, ease: "linear" }}
                  />
                )}
              </AnimatePresence>
              <span className="relative flex items-center justify-center gap-2">
                {progress >= 100 ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                Maintenir pour signer
              </span>
            </button>
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Maintiens enfoncé pendant 1,5 seconde pour confirmer.
            </p>
          </div>
        </DSPanel>
      )}
    </div>
  );
}