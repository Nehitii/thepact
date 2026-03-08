import { supabase } from "@/integrations/supabase/client";

export async function logAdminAction(action: string, targetType: string, targetId?: string, metadata?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  await supabase.from("admin_audit_log" as any).insert({
    admin_user_id: session.user.id,
    action,
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
  } as any);
}
