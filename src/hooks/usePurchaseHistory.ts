import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PurchaseHistoryItem {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export function usePurchaseHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["purchase-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("bond_transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("transaction_type", "spend")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as PurchaseHistoryItem[];
    },
    enabled: !!userId,
  });
}

export function useAllTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: ["all-transactions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("bond_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as PurchaseHistoryItem[];
    },
    enabled: !!userId,
  });
}
