import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminModeState {
  isAdmin: boolean;
  isAdminModeActive: boolean;
}

// Check if user is admin
export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      if (!userId) return false;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!userId,
  });
}

// Admin force purchase cosmetic (bypasses balance check)
export function useAdminForcePurchaseCosmetic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      cosmeticId, 
      cosmeticType,
    }: { 
      userId: string; 
      cosmeticId: string; 
      cosmeticType: "frame" | "banner" | "title"; 
    }) => {
      // Check if already owned
      const { data: existing } = await supabase
        .from("user_cosmetics")
        .select("id")
        .eq("user_id", userId)
        .eq("cosmetic_id", cosmeticId)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Already owned");
      }
      
      // Add cosmetic ownership (no balance deduction)
      const { error: cosmeticError } = await supabase
        .from("user_cosmetics")
        .insert({
          user_id: userId,
          cosmetic_id: cosmeticId,
          cosmetic_type: cosmeticType,
        });
      
      if (cosmeticError) throw cosmeticError;
      
      // Log admin transaction
      await supabase.from("bond_transactions").insert({
        user_id: userId,
        amount: 0,
        transaction_type: "admin_grant",
        description: `[ADMIN] Granted ${cosmeticType}`,
        reference_id: cosmeticId,
        reference_type: "cosmetic",
      });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      toast({ title: "Cosmetic granted (Admin)" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Grant failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Admin reset cosmetic ownership
export function useAdminResetCosmetic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      cosmeticId,
    }: { 
      userId: string; 
      cosmeticId: string; 
    }) => {
      const { error } = await supabase
        .from("user_cosmetics")
        .delete()
        .eq("user_id", userId)
        .eq("cosmetic_id", cosmeticId);
      
      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      toast({ title: "Cosmetic reset (Admin)" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Reset failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Admin force purchase module (bypasses balance check)
export function useAdminForcePurchaseModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId,
    }: { 
      userId: string; 
      moduleId: string; 
    }) => {
      // Check if already purchased
      const { data: existing } = await supabase
        .from("user_module_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Already purchased");
      }
      
      // Add module purchase (no balance deduction)
      const { error: moduleError } = await supabase
        .from("user_module_purchases")
        .insert({
          user_id: userId,
          module_id: moduleId,
        });
      
      if (moduleError) throw moduleError;
      
      // Log admin transaction
      await supabase.from("bond_transactions").insert({
        user_id: userId,
        amount: 0,
        transaction_type: "admin_grant",
        description: "[ADMIN] Granted module",
        reference_id: moduleId,
        reference_type: "module",
      });
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "Module granted (Admin)" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Grant failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Admin reset module purchase
export function useAdminResetModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      moduleId,
    }: { 
      userId: string; 
      moduleId: string; 
    }) => {
      const { error } = await supabase
        .from("user_module_purchases")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId);
      
      if (error) throw error;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "Module reset (Admin)" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Reset failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Admin reset all purchases
export function useAdminResetAll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // Reset all cosmetics
      await supabase
        .from("user_cosmetics")
        .delete()
        .eq("user_id", userId);
      
      // Reset all module purchases
      await supabase
        .from("user_module_purchases")
        .delete()
        .eq("user_id", userId);
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cosmetics"] });
      queryClient.invalidateQueries({ queryKey: ["user-module-purchases"] });
      toast({ title: "All purchases reset (Admin)" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Reset failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}
