import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

export function AuditLogPanel() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="text-primary/40 text-sm animate-pulse">Loading audit log...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-primary/40">
        <ScrollText className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No actions recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {logs.map((log: any) => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-primary/10 text-xs">
          <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-primary font-medium">{log.action}</span>
            <span className="text-primary/50"> on </span>
            <span className="text-primary/70">{log.target_type}</span>
            {log.target_id && (
              <span className="text-primary/40 ml-1 truncate">({log.target_id.slice(0, 8)}…)</span>
            )}
            <div className="text-primary/30 mt-0.5">
              {format(new Date(log.created_at), "MMM d, HH:mm")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
