import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function logAdminAction(action: string, targetType: string, targetId?: string, metadata?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  await supabase.from("admin_audit_log").insert({
    admin_user_id: session.user.id,
    action,
    target_type: targetType,
    target_id: targetId || null,
    /* La colonne est jsonb. Record<string, unknown> est plus large que
       Json : la conversion est reelle, et elle a lieu ici, une fois. */
    metadata: (metadata || {}) as Json,
  });
}
