import { supabase } from "@/integrations/supabase/client";

export { supabase };

// Helper to check if user has a pact
export async function getUserPact(userId: string) {
  const { data, error } = await supabase
    .from("pacts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return { data, error };
}

// Helper to create a new pact
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

// Helper to update pact progress
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
