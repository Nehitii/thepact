/**
 * Supabase utility functions.
 * The supabase client should be imported directly from @/integrations/supabase/client.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a new pact record for a user.
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
