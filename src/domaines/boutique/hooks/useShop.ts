import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/socle/supabase/client";
import { toast } from "sonner";
import type {
  BondBalance, BondPack, ShopModule, SpecialOffer, CosmeticFrame, CosmeticBanner, CosmeticTitle,
} from "@/domaines/boutique/types";
/* Reexportes : les appelants importaient ces formes depuis ce fichier. */
export type {
  BondBalance, BondPack, ShopModule, SpecialOffer, CosmeticFrame, CosmeticBanner, CosmeticTitle,
};







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

// Fetch active cosmetic titles
export function useShopTitles() {
  return useQuery({
    queryKey: ["shop-titles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cosmetic_titles")
        .select("*")
        .eq("is_active", true)
        .order("price");
      
      if (error) throw error;
      return data as CosmeticTitle[];
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

/**
 * Purchase cosmetic via secure atomic DB function.
 * Prevents race conditions and client-side price tampering.
 */
export function usePurchaseCosmetic() {
  const queryClient = useQueryClient();
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
      /* Le prix n est plus transmis : `purchase_shop_item` le relit
         dans le catalogue. L envoyer laissait croire qu il comptait. */
      const { data, error } = await supabase.rpc("purchase_shop_item", {
        p_item_id: cosmeticId,
        p_item_type: cosmeticType,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) throw new Error(result.error || "Purchase failed");
      
      return { userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      toast.success("Purchase successful!");
    },
    onError: (error: Error) => {
      toast.error("Purchase failed", { description: error.message });
    },
  });
}

/**
 * Purchase module via secure atomic DB function.
 * Prevents race conditions and client-side price tampering.
 */
export function usePurchaseModule() {
  const queryClient = useQueryClient();
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
      const { data, error } = await supabase.rpc("purchase_shop_item", {
        p_item_id: moduleId,
        p_item_type: "module",
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) throw new Error(result.error || "Purchase failed");
      
      return { userId, moduleId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bond-balance", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["bond-balance"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast.success("Module unlocked!", { description: "Your new module is now available" });
    },
    onError: (error: Error) => {
      toast.error("Purchase failed", { description: error.message });
    },
  });
}

// Combined hook for easy access to user's purchased modules with module details
export function useShop() {
  const { data: modules = [], isLoading: modulesLoading } = useShopModules();
  const { data: purchasedModuleIds = [], isLoading: purchasesLoading } = useUserModulePurchases(undefined);
  
  const userModules = modules
    .filter(m => purchasedModuleIds.includes(m.id))
    .map(m => ({ module: m }));
  
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
  
  const purchasedModuleKeysSet = new Set(
    modules
      .filter(m => purchasedModuleIds.includes(m.id))
      .map(m => m.key)
  );
  
  const userModules = modules
    .filter(m => purchasedModuleIds.includes(m.id))
    .map(m => ({ module: m }));
  
  const isModulePurchased = (moduleKey: string): boolean => {
    return purchasedModuleKeysSet.has(moduleKey);
  };
  
  return {
    userModules,
    isModulePurchased,
    purchasedModuleIds,
    isLoading: modulesLoading || purchasesLoading,
  };
}
