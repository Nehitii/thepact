import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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

// User: Redeem a promo code securely via server-side RPC
export function useRedeemPromoCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      // Call secure server-side RPC function that handles all validation atomically
      const { data, error } = await supabase.rpc('redeem_promo_code', { 
        p_code: code 
      });

      if (error) throw error;
      
      // The RPC returns a jsonb object with success status
      const result = data as { 
        success: boolean; 
        error?: string; 
        reward_type?: string; 
        reward_amount?: number; 
        code?: string;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to redeem code');
      }

      return {
        rewardType: result.reward_type,
        rewardAmount: result.reward_amount,
        code: result.code,
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
