import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  reward_type: string;
  reward_amount: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Admin: Fetch all promo codes
export function usePromoCodes() {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });
}

// Admin: Create a new promo code
export function useCreatePromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promoCode: {
      code: string;
      description?: string;
      reward_type: string;
      reward_amount: number;
      max_uses?: number | null;
      expires_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .insert({
          code: promoCode.code.toUpperCase(),
          description: promoCode.description || null,
          reward_type: promoCode.reward_type,
          reward_amount: promoCode.reward_amount,
          max_uses: promoCode.max_uses || null,
          expires_at: promoCode.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({
        title: "Promo code created",
        description: "The promotional code has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating promo code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Admin: Update a promo code
export function useUpdatePromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PromoCode>;
    }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({
        title: "Promo code updated",
        description: "The promotional code has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating promo code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Admin: Delete a promo code
export function useDeletePromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast({
        title: "Promo code deleted",
        description: "The promotional code has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting promo code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// User: Redeem a promo code
export function useRedeemPromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      // 1. Find the promo code
      const { data: promoCode, error: findError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (findError) throw findError;
      if (!promoCode) throw new Error("Invalid promo code");

      // 2. Check if expired
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        throw new Error("This promo code has expired");
      }

      // 3. Check max uses
      if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
        throw new Error("This promo code has reached its maximum uses");
      }

      // 4. Check if user already redeemed
      const { data: existingRedemption } = await supabase
        .from("promo_code_redemptions")
        .select("id")
        .eq("user_id", userId)
        .eq("promo_code_id", promoCode.id)
        .maybeSingle();

      if (existingRedemption) {
        throw new Error("You have already redeemed this code");
      }

      // 5. Create redemption record
      const { error: redeemError } = await supabase
        .from("promo_code_redemptions")
        .insert({
          user_id: userId,
          promo_code_id: promoCode.id,
        });

      if (redeemError) throw redeemError;

      // 6. Increment current_uses - this needs admin privileges, so we'll do it via RPC or update
      // For now, we update via the admin policy (if admin) or we skip if user
      // Since promo_codes has admin-only update policy, we need to handle this differently
      // The current_uses should ideally be updated by a trigger or edge function
      // For MVP, we'll let admins see redemptions count from the redemptions table
      
      // 7. Award the reward based on type
      if (promoCode.reward_type === "bonds") {
        // Check if user has a bond balance
        const { data: existingBalance } = await supabase
          .from("bond_balance")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingBalance) {
          // Update existing balance
          await supabase
            .from("bond_balance")
            .update({
              balance: existingBalance.balance + promoCode.reward_amount,
              total_earned: existingBalance.total_earned + promoCode.reward_amount,
            })
            .eq("user_id", userId);
        } else {
          // Create new balance
          await supabase.from("bond_balance").insert({
            user_id: userId,
            balance: promoCode.reward_amount,
            total_earned: promoCode.reward_amount,
          });
        }

        // Create transaction record
        await supabase.from("bond_transactions").insert({
          user_id: userId,
          amount: promoCode.reward_amount,
          transaction_type: "promo_code",
          description: `Promo code: ${promoCode.code}`,
          reference_id: promoCode.id,
          reference_type: "promo_code",
        });
      }

      return {
        promoCode,
        rewardType: promoCode.reward_type,
        rewardAmount: promoCode.reward_amount,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      toast({
        title: "Code redeemed!",
        description: `You received ${data.rewardAmount} ${data.rewardType}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
