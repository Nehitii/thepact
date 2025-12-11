import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PactSettingsCard } from "./PactSettingsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Plus, Trash2, Edit2, X, Check, Crown, Star, Zap } from "lucide-react";
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

// Get tier icon based on position
const getTierIcon = (index: number, total: number) => {
  const percentage = total > 1 ? index / (total - 1) : 0;
  if (percentage >= 0.8) return Crown;
  if (percentage >= 0.5) return Star;
  return Zap;
};

// Get tier color based on position
const getTierColor = (index: number, total: number) => {
  const percentage = total > 1 ? index / (total - 1) : 0;
  if (percentage >= 0.8) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
  if (percentage >= 0.5) return "text-purple-400 border-purple-400/30 bg-purple-400/10";
  return "text-primary border-primary/30 bg-primary/10";
};

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
      {/* Ranks List with ScrollArea */}
      <div className="relative">
        {ranks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-rajdhani border border-dashed border-primary/20 rounded-lg bg-primary/5">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary/40" />
            <p>No ranks defined yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Add your first rank below.</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {ranks.map((rank, index) => {
                const TierIcon = getTierIcon(index, ranks.length);
                const tierColorClass = getTierColor(index, ranks.length);
                
                return (
                  <div
                    key={rank.id}
                    className={cn(
                      "relative group/item flex items-center gap-3 p-3 rounded-lg",
                      "bg-gradient-to-r from-[#0a1525]/80 to-[#0d1a2d]/80",
                      "border border-primary/20 hover:border-primary/40",
                      "transition-all duration-200",
                      editingId === rank.id && "border-primary/50 bg-primary/5"
                    )}
                  >
                    {/* Tier indicator */}
                    <div className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border",
                      tierColorClass
                    )}>
                      <TierIcon className="h-4 w-4" />
                    </div>

                    {editingId === rank.id ? (
                      <>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Points"
                            value={editForm.min_points}
                            onChange={(e) =>
                              setEditForm({ ...editForm, min_points: e.target.value })
                            }
                            min="0"
                            className="h-9 text-sm bg-[#0a1525] border-primary/30 focus:border-primary/60"
                          />
                          <Input
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            maxLength={50}
                            className="h-9 text-sm bg-[#0a1525] border-primary/30 focus:border-primary/60"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(rank.id)}
                          disabled={loading}
                          className="h-9 w-9 text-primary hover:bg-primary/20 flex-shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={loading}
                          className="h-9 w-9 text-muted-foreground hover:bg-secondary/50 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground font-orbitron uppercase tracking-wide text-sm truncate">
                            {rank.name}
                          </div>
                          <div className="text-xs text-muted-foreground/80 font-rajdhani">
                            {rank.min_points.toLocaleString()} pts
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(rank)}
                            disabled={loading}
                            className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/20"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(rank.id, rank.name)}
                            disabled={loading}
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {/* Fade indicator at bottom when scrollable */}
        {ranks.length > 4 && (
          <div className="absolute bottom-0 left-0 right-3 h-8 bg-gradient-to-t from-[#050d18] to-transparent pointer-events-none rounded-b-lg" />
        )}
      </div>

      {/* Add New Rank Form */}
      {showAddForm ? (
        <div className="p-4 rounded-lg bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/30 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
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
                className="h-10 bg-[#0a1525] border-primary/30 focus:border-primary/60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground font-orbitron uppercase tracking-widest">
                Rank Name
              </label>
              <Input
                placeholder="e.g. Warrior"
                value={newRank.name}
                onChange={(e) => setNewRank({ ...newRank, name: e.target.value })}
                maxLength={50}
                className="h-10 bg-[#0a1525] border-primary/30 focus:border-primary/60"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleAdd} 
              disabled={loading} 
              className={cn(
                "flex-1 h-10 font-orbitron uppercase tracking-wider text-xs",
                "bg-primary/20 border border-primary/40 rounded-lg",
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
              className="h-10 px-4 border border-primary/30 text-muted-foreground hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          variant="outline"
          className={cn(
            "w-full h-10 font-orbitron uppercase tracking-wider text-xs",
            "border border-dashed border-primary/40 rounded-lg",
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
