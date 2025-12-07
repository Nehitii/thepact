import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PactSettingsCard } from "./PactSettingsCard";
import { Trophy, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Rank {
  id: string;
  min_points: number;
  name: string;
}

interface RanksCardProps {
  userId: string;
}

export function RanksCard({ userId }: RanksCardProps) {
  const { toast } = useToast();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRank, setNewRank] = useState({ min_points: "", name: "" });
  const [editForm, setEditForm] = useState({ min_points: "", name: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadRanks();
  }, [userId]);

  const loadRanks = async () => {
    const { data, error } = await supabase
      .from("ranks")
      .select("*")
      .eq("user_id", userId)
      .order("min_points", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load ranks",
        variant: "destructive",
      });
    } else {
      setRanks(data || []);
    }
  };

  const handleAdd = async () => {
    if (!newRank.name.trim() || newRank.min_points === "") {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("ranks").insert({
      user_id: userId,
      min_points: parseInt(newRank.min_points),
      name: newRank.name.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rank Added",
        description: `${newRank.name} has been added`,
      });
      setNewRank({ min_points: "", name: "" });
      setShowAddForm(false);
      loadRanks();
    }
    setLoading(false);
  };

  const handleEdit = async (id: string) => {
    if (!editForm.name.trim() || editForm.min_points === "") {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("ranks")
      .update({
        min_points: parseInt(editForm.min_points),
        name: editForm.name.trim(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rank Updated",
        description: "Rank has been updated",
      });
      setEditingId(null);
      loadRanks();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" rank?`)) return;

    setLoading(true);
    const { error } = await supabase.from("ranks").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rank Deleted",
        description: `${name} has been removed`,
      });
      loadRanks();
    }
    setLoading(false);
  };

  const startEdit = (rank: Rank) => {
    setEditingId(rank.id);
    setEditForm({ min_points: rank.min_points.toString(), name: rank.name });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ min_points: "", name: "" });
  };

  return (
    <PactSettingsCard
      icon={<Trophy className="h-5 w-5 text-primary" />}
      title="Ranks"
      description="Define progression ranks and point thresholds"
    >
      {/* Ranks List */}
      <div className="space-y-3">
        {ranks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground font-rajdhani">
            No ranks defined yet. Add your first rank below.
          </div>
        ) : (
          ranks.map((rank) => (
            <div
              key={rank.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg",
                "bg-secondary/30 border-2 border-primary/20",
                "transition-all duration-200",
                editingId === rank.id && "border-primary/50 bg-secondary/50"
              )}
            >
              {editingId === rank.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min Points"
                      value={editForm.min_points}
                      onChange={(e) =>
                        setEditForm({ ...editForm, min_points: e.target.value })
                      }
                      min="0"
                      className="h-10"
                    />
                    <Input
                      placeholder="Rank Name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      maxLength={50}
                      className="h-10"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(rank.id)}
                    disabled={loading}
                    className="h-10 w-10 text-primary hover:bg-primary/20"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={loading}
                    className="h-10 w-10 text-muted-foreground hover:bg-secondary/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground font-orbitron uppercase tracking-wide truncate">
                      {rank.name}
                    </div>
                    <div className="text-sm text-muted-foreground font-rajdhani">
                      {rank.min_points.toLocaleString()} points
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEdit(rank)}
                    disabled={loading}
                    className="h-10 w-10 text-primary/70 hover:text-primary hover:bg-primary/20"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(rank.id, rank.name)}
                    disabled={loading}
                    className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Rank Form */}
      {showAddForm ? (
        <div className="p-4 rounded-lg bg-secondary/30 border-2 border-primary/30 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
                Min Points
              </label>
              <Input
                type="number"
                placeholder="0"
                value={newRank.min_points}
                onChange={(e) =>
                  setNewRank({ ...newRank, min_points: e.target.value })
                }
                min="0"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
                Rank Name
              </label>
              <Input
                placeholder="e.g. Warrior"
                value={newRank.name}
                onChange={(e) => setNewRank({ ...newRank, name: e.target.value })}
                maxLength={50}
                className="h-11"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleAdd} 
              disabled={loading} 
              className={cn(
                "flex-1 h-11 font-orbitron uppercase tracking-wider text-sm",
                "bg-primary/20 border-2 border-primary/40 rounded-lg",
                "text-primary hover:bg-primary/30 hover:border-primary/60"
              )}
            >
              <Check className="h-4 w-4 mr-2" />
              Add Rank
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setNewRank({ min_points: "", name: "" });
              }}
              disabled={loading}
              className="h-11 px-4 border-2 border-primary/30 text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          className={cn(
            "w-full h-11 font-orbitron uppercase tracking-wider text-sm",
            "border-2 border-dashed border-primary/40 rounded-lg",
            "text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/10"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Rank
        </Button>
      )}
    </PactSettingsCard>
  );
}
