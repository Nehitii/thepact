import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  Sparkles,
  Calendar,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from "@/hooks/usePromoCodes";
import { format } from "date-fns";

export default function AdminPromoManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [description, setDescription] = useState("");
  const [rewardType, setRewardType] = useState("bonds");
  const [rewardAmount, setRewardAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: promoCodes = [], isLoading: codesLoading } = usePromoCodes();
  const createPromoCode = useCreatePromoCode();
  const updatePromoCode = useUpdatePromoCode();
  const deletePromoCode = useDeletePromoCode();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreate = async () => {
    if (!newCode || !rewardAmount) {
      toast({
        title: "Missing fields",
        description: "Please fill in the code and reward amount",
        variant: "destructive",
      });
      return;
    }

    await createPromoCode.mutateAsync({
      code: newCode,
      description: description || undefined,
      reward_type: rewardType,
      reward_amount: parseInt(rewardAmount),
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires_at: expiresAt || null,
    });

    // Reset form
    setNewCode("");
    setDescription("");
    setRewardType("bonds");
    setRewardAmount("");
    setMaxUses("");
    setExpiresAt("");
    setIsCreateOpen(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updatePromoCode.mutateAsync({
      id,
      updates: { is_active: !currentActive },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this promo code?")) {
      await deletePromoCode.mutateAsync(id);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Code "${code}" copied to clipboard`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00050B] flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">
          Verifying access...
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#00050B] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-primary/60 hover:text-primary"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-orbitron text-amber-400 tracking-wider">
              Promo Code Manager
            </h1>
            <p className="text-amber-400/60 font-rajdhani">
              Create and manage promotional codes
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-400">
                <Plus className="h-4 w-4 mr-2" />
                New Code
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-amber-500/30">
              <DialogHeader>
                <DialogTitle className="font-orbitron text-amber-400">
                  Create Promo Code
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Code */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="SUMMER2024"
                      className="flex-1 bg-background/50 border-amber-500/30 focus:border-amber-500/50"
                    />
                    <Button
                      variant="outline"
                      onClick={generateRandomCode}
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">
                    Description (optional)
                  </Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summer promotion 2024"
                    className="bg-background/50 border-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                {/* Reward Type */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">Reward Type</Label>
                  <Select value={rewardType} onValueChange={setRewardType}>
                    <SelectTrigger className="bg-background/50 border-amber-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonds">Bonds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reward Amount */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">Reward Amount</Label>
                  <Input
                    type="number"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="100"
                    className="bg-background/50 border-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                {/* Max Uses */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">
                    Max Uses (leave empty for unlimited)
                  </Label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                    className="bg-background/50 border-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label className="text-amber-400/80">
                    Expiration Date (optional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="bg-background/50 border-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={createPromoCode.isPending}
                  className="w-full bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-400"
                >
                  {createPromoCode.isPending ? "Creating..." : "Create Code"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promo Codes Table */}
        <div className="rounded-2xl border-2 border-amber-500/30 bg-card/30 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-amber-500/20 hover:bg-transparent">
                <TableHead className="text-amber-400/80 font-orbitron">
                  Code
                </TableHead>
                <TableHead className="text-amber-400/80 font-orbitron">
                  Reward
                </TableHead>
                <TableHead className="text-amber-400/80 font-orbitron">
                  Uses
                </TableHead>
                <TableHead className="text-amber-400/80 font-orbitron">
                  Expires
                </TableHead>
                <TableHead className="text-amber-400/80 font-orbitron">
                  Active
                </TableHead>
                <TableHead className="text-amber-400/80 font-orbitron text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-amber-400/60 animate-pulse">
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : promoCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-amber-400/60">
                      <Ticket className="h-8 w-8" />
                      <p>No promo codes yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                promoCodes.map((code) => (
                  <TableRow
                    key={code.id}
                    className="border-amber-500/10 hover:bg-amber-500/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {code.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-amber-400/60 hover:text-amber-400"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {code.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-400 font-orbitron">
                        {code.reward_amount} {code.reward_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {code.current_uses}
                          {code.max_uses ? ` / ${code.max_uses}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {code.expires_at ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(code.expires_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={code.is_active}
                        onCheckedChange={() =>
                          handleToggleActive(code.id, code.is_active)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="text-amber-400/60 hover:text-amber-400"
          >
            ← Back to Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
