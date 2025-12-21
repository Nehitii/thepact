import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BondBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface BondPack {
  id: string;
  name: string;
  bond_amount: number;
  price_eur: number;
  bonus_percentage: number;
  is_active: boolean;
  display_order: number;
}

export interface ShopModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_bonds: number;
  price_eur: number | null;
  rarity: string;
  icon_key: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  display_order: number;
}

export interface SpecialOffer {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_bonds: number | null;
  price_eur: number | null;
  original_price_bonds: number | null;
  original_price_eur: number | null;
  items: any[] | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
}

export interface CosmeticFrame {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  border_color: string;
  glow_color: string;
  is_active: boolean;
  is_default: boolean;
  price: number;
  frame_scale?: number;
  frame_offset_x?: number;
  frame_offset_y?: number;
}

export interface CosmeticBanner {
  id: string;
  name: string;
  rarity: string;
  preview_url: string | null;
  banner_url: string | null;
  gradient_start: string | null;
  gradient_end: string | null;
  is_active: boolean;
  is_default: boolean;
  price: number;
}

// Fetch user's bond balance
export function useBondBalance(userId: string | undefined) {
  return useQuery({
    queryKey: ["bond-balance", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("bond_balance")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Create initial balance if not exists
      if (!data) {
        const { data: newBalance, error: insertError } = await supabase
          .from("bond_balance")
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newBalance as BondBalance;
      }
      
      return data as BondBalance;
    },
    enabled: !!userId,
  });
}

// Fetch bond packs
export function useBondPacks() {
  return useQuery({
    queryKey: ["bond-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bond_packs")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as BondPack[];
    },
  });
}

// Fetch shop modules
export function useShopModules() {
  return useQuery({
    queryKey: ["shop-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_modules")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as ShopModule[];
    },
  });
}

// Fetch user's purchased modules
export function useUserModulePurchases(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-module-purchases", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_module_purchases")
        .select("module_id")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data.map(p => p.module_id);
    },
    enabled: !!userId,
  });
}

// Fetch special offers
export function useSpecialOffers() {
  return useQuery({
    queryKey: ["special-offers"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("special_offers")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("display_order");
      
      if (error) throw error;
      return data as SpecialOffer[];
    },
  });
}

// Fetch active cosmetic frames
export function useShopFrames() {
  return useQuery({
    queryKey: ["shop-frames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosmetic_frames")
        .select("*")
        .eq("is_active", true)
        .order("price");
      
      if (error) throw error;
      return data as CosmeticFrame[];
    },
  });
}

// Fetch active cosmetic banners
export function useShopBanners() {
  return useQuery({
    queryKey: ["shop-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosmetic_banners")
        .select("*")
        .eq("is_active", true)
        .order("price");
      
      if (error) throw error;
      return data as CosmeticBanner[];
    },
  });
}

// Fetch user's owned cosmetics
export function useUserCosmetics(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-cosmetics", userId],
    queryFn: async () => {
      if (!userId) return { frames: [], banners: [], titles: [] };
      
      const { data, error } = await supabase
        .from("user_cosmetics")
        .select("cosmetic_id, cosmetic_type")
        .eq("user_id", userId);
      
      if (error) throw error;
      
      return {
        frames: data.filter(c => c.cosmetic_type === "frame").map(c => c.cosmetic_id),
        banners: data.filter(c => c.cosmetic_type === "banner").map(c => c.cosmetic_id),
        titles: data.filter(c => c.cosmetic_type === "title").map(c => c.cosmetic_id),
      };
    },
    enabled: !!userId,
  });
}

// Purchase cosmetic
export function usePurchaseCosmetic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      cosmeticId, 
      cosmeticType, 
      price 
    }: { 
      userId: string; 
      cosmeticId: string; 
      cosmeticType: "frame" | "banner" | "title"; 
      price: number;
    }) => {
      // Get current balance
      const { data: balance, error: balanceError } = await supabase
        .from("bond_balance")
        .select("balance")
        .eq("user_id", userId)
        .single();
      
      if (balanceError) throw balanceError;
      if (balance.balance < price) throw new Error("Insufficient bonds");
      
      // Deduct bonds
      const { error: updateError } = await supabase
        .from("bond_balance")
        .update({ 
          balance: balance.balance - price,
          total_spent: balance.balance + price
        })
        .eq("user_id", userId);
      
      if (updateError) throw updateError;
      
      // Add cosmetic ownership
      const { error: cosmeticError } = await supabase
        .from("user_cosmetics")
        .insert({
          user_id: userId,
          cosmetic_id: cosmeticId,
          cosmetic_type: cosmeticType,
        });
      
      if (cosmeticError) throw cosmeticError;
      
      // Log transaction
      await supabase.from("bond_transactions").insert({
        user_id: userId,
        amount: -price,
        transaction_type: "spend",
        description: `Purchased ${cosmeticType}`,
        reference_id: cosmeticId,
        reference_type: "cosmetic",
      });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      toast({ title: "Purchase successful!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Purchase failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Purchase module
export function usePurchaseModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId, 
      price 
    }: { 
      userId: string; 
      moduleId: string; 
      price: number;
    }) => {
      // Get current balance
      const { data: balance, error: balanceError } = await supabase
        .from("bond_balance")
        .select("balance, total_spent")
        .eq("user_id", userId)
        .single();
      
      if (balanceError) throw balanceError;
      if (balance.balance < price) throw new Error("Insufficient bonds");
      
      // Deduct bonds
      const { error: updateError } = await supabase
        .from("bond_balance")
        .update({ 
          balance: balance.balance - price,
          total_spent: balance.total_spent + price
        })
        .eq("user_id", userId);
      
      if (updateError) throw updateError;
      
      // Add module purchase
      const { error: moduleError } = await supabase
        .from("user_module_purchases")
        .insert({
          user_id: userId,
          module_id: moduleId,
        });
      
      if (moduleError) throw moduleError;
      
      // Log transaction
      await supabase.from("bond_transactions").insert({
        user_id: userId,
        amount: -price,
        transaction_type: "spend",
        description: "Purchased module",
        reference_id: moduleId,
        reference_type: "module",
      });
      
      return { userId, moduleId };
    },
    onSuccess: (data) => {
      // Immediately invalidate and refetch to ensure instant UI update
      queryClient.invalidateQueries({ queryKey: ["bond-balance", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases", data.userId] });
      // Also invalidate non-user-specific queries
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "Module unlocked!", description: "Your new module is now available" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Purchase failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Combined hook for easy access to user's purchased modules with module details
export function useShop() {
  const { data: modules = [], isLoading: modulesLoading } = useShopModules();
  const { data: purchasedModuleIds = [], isLoading: purchasesLoading } = useUserModulePurchases(undefined);
  
  // Get purchased modules with their full details
  const userModules = modules
    .filter(m => purchasedModuleIds.includes(m.id))
    .map(m => ({ module: m }));
  
  // Check if a specific module is purchased by key
  const isModulePurchased = (moduleKey: string) => {
    return userModules.some(um => um.module?.key === moduleKey);
  };
  
  return {
    userModules,
    isModulePurchased,
    isLoading: modulesLoading || purchasesLoading,
  };
}

// Hook for user-specific shop data with real-time module ownership check
export function useUserShop(userId: string | undefined) {
  const { data: modules = [], isLoading: modulesLoading } = useShopModules();
  const { data: purchasedModuleIds = [], isLoading: purchasesLoading } = useUserModulePurchases(userId);
  
  // Build a map of module key to purchased status for quick lookup
  const purchasedModuleKeysSet = new Set(
    modules
      .filter(m => purchasedModuleIds.includes(m.id))
      .map(m => m.key)
  );
  
  const userModules = modules
    .filter(m => purchasedModuleIds.includes(m.id))
    .map(m => ({ module: m }));
  
  // Check if a specific module is purchased by key - using memoized set for efficiency
  const isModulePurchased = (moduleKey: string): boolean => {
    return purchasedModuleKeysSet.has(moduleKey);
  };
  
  return {
    userModules,
    isModulePurchased,
    purchasedModuleIds, // Expose for debugging
    isLoading: modulesLoading || purchasesLoading,
  };
}
