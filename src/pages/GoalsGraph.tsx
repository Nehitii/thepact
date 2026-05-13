import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DSPanel, DSLoadingState, DSEmptyState } from "@/components/ds";
import { ArrowLeft, Network } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  in_progress: "#06b6d4",
  pending: "#eab308",
  abandoned: "#71717a",
};

// Simple layered topological layout
function layout(nodes: Node[], edges: Edge[]): Node[] {
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const inDeg = new Map<string, number>();
  nodes.forEach((n) => inDeg.set(n.id, 0));
  edges.forEach((e) => inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1));

  const layers: string[][] = [];
  const visited = new Set<string>();
  let frontier = nodes.filter((n) => (inDeg.get(n.id) || 0) === 0).map((n) => n.id);

  while (frontier.length) {
    layers.push(frontier);
    frontier.forEach((id) => visited.add(id));
    const next = new Set<string>();
    for (const e of edges) {
      if (frontier.includes(e.source) && !visited.has(e.target)) next.add(e.target);
    }
    frontier = Array.from(next);
    if (layers.length > 30) break; // safety
  }
  // Orphans
  const orphans = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
  if (orphans.length) layers.push(orphans);

  const COL_W = 220;
  const ROW_H = 110;
  return nodes.map((n) => {
    const layerIdx = layers.findIndex((l) => l.includes(n.id));
    const rowIdx = layers[layerIdx]?.indexOf(n.id) ?? 0;
    return { ...n, position: { x: layerIdx * COL_W, y: rowIdx * ROW_H } };
  });
}

export default function GoalsGraph() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: pact } = usePact(user?.id);
  const { data: goals = [], isLoading: goalsLoading } = useGoals(pact?.id);

  const { data: deps = [], isLoading: depsLoading } = useQuery({
    queryKey: ["all-goal-deps", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("goal_dependencies")
        .select("id, goal_id, depends_on_goal_id, kind")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { nodes, edges } = useMemo(() => {
    const allowedIds = new Set(goals.map((g) => g.id));
    const baseNodes: Node[] = goals.map((g) => ({
      id: g.id,
      data: {
        label: (
          <div className="px-2 py-1.5">
            <div className="text-[11px] font-display tracking-wide line-clamp-2">{g.name}</div>
            <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: STATUS_COLORS[g.status] || "#888" }}>
              {g.status} · {g.difficulty}
            </div>
          </div>
        ),
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "hsl(var(--background))",
        border: `1.5px solid ${STATUS_COLORS[g.status] || "#444"}`,
        borderRadius: 8,
        width: 200,
        color: "hsl(var(--foreground))",
      },
    }));

    const baseEdges: Edge[] = (deps as any[])
      .filter((d) => allowedIds.has(d.goal_id) && allowedIds.has(d.depends_on_goal_id))
      .map((d) => ({
        id: d.id,
        source: d.depends_on_goal_id,
        target: d.goal_id,
        animated: d.kind === "blocks",
        style: { stroke: d.kind === "blocks" ? "#ef4444" : "#64748b", strokeWidth: 1.5 },
        label: d.kind === "blocks" ? "blocks" : undefined,
        labelStyle: { fontSize: 9, fill: "#94a3b8" },
      }));

    return { nodes: layout(baseNodes, baseEdges), edges: baseEdges };
  }, [goals, deps]);

  if (goalsLoading || depsLoading) {
    return <div className="p-6"><DSLoadingState message="LOADING TOPOLOGY" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </button>
          <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-display flex items-center gap-2 mt-2">
            <Network className="w-3.5 h-3.5" /> Topologie globale
          </div>
          <h1 className="text-2xl font-display tracking-wide">{nodes.length} objectifs · {edges.length} dépendances</h1>
        </div>
      </div>

      <DSPanel className="flex-1 p-0 overflow-hidden min-h-[480px]">
        {nodes.length === 0 ? (
          <DSEmptyState
            message="NO GOALS"
            description="Crée des objectifs pour visualiser leur topologie."
            ctaLabel="Créer un objectif"
            to="/goals/new"
          />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, n) => navigate(`/goals/${n.id}`)}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="hsl(var(--border))" gap={24} />
            <Controls />
            <MiniMap pannable zoomable nodeColor={(n) => {
              const g = goals.find(x => x.id === n.id);
              return STATUS_COLORS[g?.status || ""] || "#444";
            }} />
          </ReactFlow>
        )}
      </DSPanel>
    </div>
  );
}