// Delete account — relies on Postgres ON DELETE CASCADE from auth.users(id).
// All user-scoped public.* tables have a FK with CASCADE, so deleting the
// auth user wipes every related row in a single transaction.
// Exception: `guilds.owner_id` is NOT cascaded (a guild may outlive its
// creator). We delete owned guilds explicitly here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { messageDErreur } from "../_shared/erreurs.ts";
import { exigerLeSecondFacteur } from "../_shared/secondFacteur.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // A live session alone used to be enough to wipe the account: no current
    // password, no second factor, no recency check. When the user has enrolled
    // a verified TOTP factor, demand that this session actually carries it —
    // the same bar the `mfa_aal2_requis` RLS policy sets on their own data.
    // Users without a factor are unaffected: there is nothing to demand.
    //
    // The guard lives in `_shared/secondFacteur.ts` since 23/09: this block
    // was written here and nowhere else, and `delete-all-data` wiped the
    // same data without it for a month.
    const refus = await exigerLeSecondFacteur(
      () => userClient.rpc("a_un_second_facteur"),
      claimsData.claims.aal,
      corsHeaders,
    );
    if (refus) return refus;

    // Guilds are intentionally not FK-cascaded — drop the ones this user owns.
    await adminClient.from("guilds").delete().eq("owner_id", userId);

    // CASCADE wipes everything else.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: messageDErreur(err) }), { status: 500, headers: corsHeaders });
  }
});
