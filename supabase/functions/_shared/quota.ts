// Shared AI quota helper. Call AFTER auth, BEFORE the AI gateway request.
// Returns null when the call is allowed, or a ready-to-return 429 Response.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function checkAiQuota(
  userClient: SupabaseClient,
  functionName: string,
  dailyLimit: number,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  try {
    const { data, error } = await userClient.rpc("check_and_increment_ai_quota", {
      _function_name: functionName,
      _daily_limit: dailyLimit,
    });
    if (error) {
      console.error(`[quota:${functionName}] check failed`, error);
      return null; // fail-open: never block on infra error
    }
    const q = data as { allowed?: boolean; reason?: string; limit?: number; count?: number } | null;
    if (q && q.allowed === false) {
      return new Response(
        JSON.stringify({
          error: "Quota IA quotidien atteint. Réessaie demain.",
          quota: q,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    return null;
  } catch (e) {
    console.error(`[quota:${functionName}] threw`, e);
    return null;
  }
}