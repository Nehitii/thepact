/**
 * Supabase client wrapper module.
 * 
 * This module re-exports the Supabase client from the auto-generated integration
 * and provides helper functions for common database operations.
 * 
 * All project files should import from this module rather than directly from
 * @/integrations/supabase/client to maintain a single point of import.
 */
import { supabase } from "@/integrations/supabase/client";

export { supabase };

/**
 * Fetches the user's pact record from the database.
 * @param userId - The user's UUID
 * @returns The pact data or null if not found
 */
export async function getUserPact(userId: string) {
  const { data, error } = await supabase
    .from("pacts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
}

/**
 * Creates a new pact record for a user.
 * @param pact - The pact details including user_id, name, mantra, and optional symbol/color
 * @returns The created pact record
 */
export async function createPact(pact: {
  user_id: string;
  name: string;
  mantra: string;
  symbol?: string;
  color?: string;
}) {
  const { data, error } = await supabase
    .from("pacts")
    .insert(pact)
    .select()
    .single();

  return { data, error };
}

/**
 * Updates pact progress metrics.
 * @param pactId - The pact's UUID
 * @param updates - Object containing points, tier, or global_progress updates
 * @returns The updated pact record
 */
export async function updatePactProgress(pactId: string, updates: {
  points?: number;
  tier?: number;
  global_progress?: number;
}) {
  const { data, error } = await supabase
    .from("pacts")
    .update(updates)
    .eq("id", pactId)
    .select()
    .single();

  return { data, error };
}
