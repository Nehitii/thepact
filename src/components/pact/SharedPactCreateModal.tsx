import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Loader2 } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useSharedPacts } from "@/hooks/useSharedPacts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SharedPactCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export function SharedPactCreateModal({ open, onClose }: SharedPactCreateModalProps) {
  const { user } = useAuth();
  const { friends } = useFriends();
  const { createSharedPact } = useSharedPacts();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [mantra, setMantra] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || selectedFriends.length === 0) return;
    setCreating(true);
    try {
      // Create the pact first
      const { data: pact, error: pErr } = await supabase
        .from("pacts")
        .insert({ name: name.trim(), mantra: mantra.trim() || "Together we rise", user_id: user.id })
        .select()
        .single();
      if (pErr) throw pErr;

      // Create shared pact memberships
      await createSharedPact.mutateAsync({ pactId: pact.id, memberIds: selectedFriends });
      qc.invalidateQueries({ queryKey: ["shared-pacts"] });

      toast.success("Shared pact created!");
      setName(""); setMantra(""); setSelectedFriends([]);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create shared pact");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md font-rajdhani">
        <DialogHeader>
          <DialogTitle className="font-orbitron tracking-wider text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            Create Shared Pact
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Pact name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          <Input placeholder="Mantra (optional)" value={mantra} onChange={(e) => setMantra(e.target.value)} maxLength={100} />
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Invite Friends ({selectedFriends.length} selected)
            </p>
            <ScrollArea className="max-h-48 border border-border rounded-lg">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No friends available</p>
              ) : (
                <div className="p-2 space-y-1">
                  {friends.map((f) => (
                    <label key={f.friend_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                      <Checkbox checked={selectedFriends.includes(f.friend_id)} onCheckedChange={() => toggleFriend(f.friend_id)} />
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={f.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] font-bold bg-muted">{(f.display_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold truncate">{f.display_name || "Unknown"}</span>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <Button onClick={handleCreate} disabled={!name.trim() || selectedFriends.length === 0 || creating} className="w-full font-bold uppercase tracking-wider">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Shared Pact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
