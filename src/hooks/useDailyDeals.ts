import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyDeal {
  id: string;
  item_id: string;
  item_type: "cosmetic_frame" | "cosmetic_banner" | "cosmetic_title" | "module" | "bundle";
  discount_percentage: number;
  deal_date: string;
  is_active: boolean;
}

export interface DailyDealWithItem extends DailyDeal {
  item?: {
    id: string;
    name: string;
    price: number;
    rarity: string;
    preview_url?: string | null;
    description?: string | null;
  };
  discounted_price: number;
}

export function useDailyDeals() {
  return useQuery({
    queryKey: ["daily-deals"],
    queryFn: async () => {
      const { data: deals, error } = await supabase
        .from("shop_daily_deals")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      if (!deals || deals.length === 0) return [];
      
      // Fetch related items for each deal
      const enrichedDeals: DailyDealWithItem[] = [];
      
      for (const deal of deals as DailyDeal[]) {
        let item = null;
        
        if (deal.item_type === "cosmetic_frame") {
          const { data } = await supabase
            .from("cosmetic_frames")
            .select("id, name, price, rarity, preview_url")
            .eq("id", deal.item_id)
            .single();
          item = data;
        } else if (deal.item_type === "cosmetic_banner") {
          const { data } = await supabase
            .from("cosmetic_banners")
            .select("id, name, price, rarity, preview_url")
            .eq("id", deal.item_id)
            .single();
          item = data;
        } else if (deal.item_type === "cosmetic_title") {
          const { data } = await supabase
            .from("cosmetic_titles")
            .select("id, title_text, price, rarity")
            .eq("id", deal.item_id)
            .single();
          if (data) {
            item = { ...data, name: data.title_text };
          }
        } else if (deal.item_type === "module") {
          const { data } = await supabase
            .from("shop_modules")
            .select("id, name, price_bonds, rarity, description")
            .eq("id", deal.item_id)
            .single();
          if (data) {
            item = { ...data, price: data.price_bonds };
          }
        }
        
        if (item) {
          const discounted_price = Math.floor(item.price * (1 - deal.discount_percentage / 100));
          enrichedDeals.push({
            ...deal,
            item: item as any,
            discounted_price,
          });
        }
      }
      
      return enrichedDeals;
    },
    refetchInterval: 60000, // Refetch every minute to check for new deals
  });
}
