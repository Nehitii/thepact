import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Rank {
  id: string;
  min_points: number;
  name: string;
}

interface RanksManagerProps {
  userId: string;
}

export function RanksManager({ userId }: RanksManagerProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranks
        </CardTitle>
        <CardDescription>Define your progression ranks and point thresholds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Ranks List */}
        <div className="space-y-2">
          {ranks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ranks defined yet. Add your first rank below.
            </p>
          ) : (
            ranks.map((rank) => (
              <div
                key={rank.id}
                className="flex items-center gap-2 p-3 border rounded-lg"
              >
                {editingId === rank.id ? (
                  <>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min Points"
                        value={editForm.min_points}
                        onChange={(e) =>
                          setEditForm({ ...editForm, min_points: e.target.value })
                        }
                        min="0"
                      />
                      <Input
                        placeholder="Rank Name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        maxLength={50}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(rank.id)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-medium">{rank.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rank.min_points} points
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(rank)}
                      disabled={loading}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rank.id, rank.name)}
                      disabled={loading}
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
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-min-points">Minimum Points</Label>
                <Input
                  id="new-min-points"
                  type="number"
                  placeholder="0"
                  value={newRank.min_points}
                  onChange={(e) =>
                    setNewRank({ ...newRank, min_points: e.target.value })
                  }
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Rank Name</Label>
                <Input
                  id="new-name"
                  placeholder="e.g. Warrior"
                  value={newRank.name}
                  onChange={(e) => setNewRank({ ...newRank, name: e.target.value })}
                  maxLength={50}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={loading} className="flex-1">
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
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Rank
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
