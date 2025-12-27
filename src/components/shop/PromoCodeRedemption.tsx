import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Gift, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRedeemPromoCode } from "@/hooks/usePromoCodes";

export function PromoCodeRedemption() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReward, setLastReward] = useState<{
    amount: number;
    type: string;
  } | null>(null);

  const redeemCode = useRedeemPromoCode();

  const handleRedeem = async () => {
    if (!user || !code.trim()) return;

    const result = await redeemCode.mutateAsync({
      userId: user.id,
      code: code.trim(),
    });

    if (result) {
      setLastReward({
        amount: result.rewardAmount,
        type: result.rewardType,
      });
      setShowSuccess(true);
      setCode("");

      // Hide success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setLastReward(null);
      }, 3000);
    }
  };

  return (
    <div className="relative p-6 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/50 to-emerald-500/5 backdrop-blur-xl overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-orbitron text-foreground">Redeem Code</h3>
            <p className="text-xs text-emerald-400/60 font-rajdhani">
              Enter a promotional code to claim rewards
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4 py-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-orbitron text-emerald-400">
                  Code Redeemed!
                </p>
                {lastReward && (
                  <p className="text-sm text-emerald-400/80 font-rajdhani">
                    +{lastReward.amount} {lastReward.type}
                  </p>
                )}
              </div>
              <Gift className="w-8 h-8 text-emerald-400 ml-auto animate-bounce" />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="flex-1 bg-background/50 border-emerald-500/30 focus:border-emerald-500/50 font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRedeem();
                }}
              />
              <Button
                onClick={handleRedeem}
                disabled={!code.trim() || redeemCode.isPending}
                className="bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-400 min-w-[100px]"
              >
                {redeemCode.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
