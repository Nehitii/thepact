import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, Plus, Copy, Sparkles, Calendar, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDeleteConfirm } from "@/components/admin/AdminDeleteConfirm";
import { logAdminAction } from "@/hooks/useAdminAudit";
import { usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode } from "@/hooks/usePromoCodes";
import { format } from "date-fns";

export default function AdminPromoManager() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewCode(code);
  };

  const handleCreate = async () => {
    if (!newCode || !rewardAmount) {
      toast({ title: "Missing fields", description: "Please fill in the code and reward amount", variant: "destructive" });
      return;
    }
    await createPromoCode.mutateAsync({ code: newCode, description: description || undefined, reward_type: rewardType, reward_amount: parseInt(rewardAmount), max_uses: maxUses ? parseInt(maxUses) : null, expires_at: expiresAt || null });
    await logAdminAction("create", "promo_code", undefined, { code: newCode });
    setNewCode(""); setDescription(""); setRewardType("bonds"); setRewardAmount(""); setMaxUses(""); setExpiresAt(""); setIsCreateOpen(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updatePromoCode.mutateAsync({ id, updates: { is_active: !currentActive } });
  };

  const handleDelete = async (id: string, code: string) => {
    await deletePromoCode.mutateAsync(id);
    await logAdminAction("delete", "promo_code", id, { code });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Code "${code}" copied to clipboard` });
  };

  const filtered = promoCodes.filter(c => !searchQuery || c.code.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminPageShell title="Promo Code Manager" subtitle="Create and manage promotional codes" icon={<Ticket className="h-6 w-6" />}>
      {/* Search + Create */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <Input placeholder="Search codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card/50 border-primary/30 text-primary" />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"><Plus className="h-4 w-4 mr-2" /> New Code</Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/30">
            <DialogHeader><DialogTitle className="font-orbitron text-primary">Create Promo Code</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-primary/80">Code</Label>
                <div className="flex gap-2">
                  <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="SUMMER2024" className="flex-1 bg-background/50 border-primary/30" />
                  <Button variant="outline" onClick={generateRandomCode} className="border-primary/30 text-primary hover:bg-primary/10"><Sparkles className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2"><Label className="text-primary/80">Description (optional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summer promotion 2024" className="bg-background/50 border-primary/30" /></div>
              <div className="space-y-2">
                <Label className="text-primary/80">Reward Type</Label>
                <Select value={rewardType} onValueChange={setRewardType}>
                  <SelectTrigger className="bg-background/50 border-primary/30"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="bonds">Bonds</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-primary/80">Reward Amount</Label><Input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="100" className="bg-background/50 border-primary/30" /></div>
              <div className="space-y-2"><Label className="text-primary/80">Max Uses (empty = unlimited)</Label><Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="100" className="bg-background/50 border-primary/30" /></div>
              <div className="space-y-2"><Label className="text-primary/80">Expiration Date (optional)</Label><Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="bg-background/50 border-primary/30" /></div>
              <Button onClick={handleCreate} disabled={createPromoCode.isPending} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">{createPromoCode.isPending ? "Creating..." : "Create Code"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-2xl border-2 border-primary/30 bg-card/30 backdrop-blur-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-transparent">
              <TableHead className="text-primary/80 font-orbitron">Code</TableHead>
              <TableHead className="text-primary/80 font-orbitron">Reward</TableHead>
              <TableHead className="text-primary/80 font-orbitron">Uses</TableHead>
              <TableHead className="text-primary/80 font-orbitron">Expires</TableHead>
              <TableHead className="text-primary/80 font-orbitron">Active</TableHead>
              <TableHead className="text-primary/80 font-orbitron text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codesLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="text-primary/60 animate-pulse">Loading...</div></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="flex flex-col items-center gap-2 text-primary/60"><Ticket className="h-8 w-8" /><p>No promo codes found</p></div></TableCell></TableRow>
            ) : (
              filtered.map((code) => (
                <TableRow key={code.id} className="border-primary/10 hover:bg-primary/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{code.code}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary/60 hover:text-primary" onClick={() => copyToClipboard(code.code)}><Copy className="h-3 w-3" /></Button>
                    </div>
                    {code.description && <p className="text-xs text-muted-foreground mt-1">{code.description}</p>}
                  </TableCell>
                  <TableCell><span className="text-primary font-orbitron">{code.reward_amount} {code.reward_type}</span></TableCell>
                  <TableCell><div className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /><span>{code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : ""}</span></div></TableCell>
                  <TableCell>{code.expires_at ? <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" /><span>{format(new Date(code.expires_at), "MMM d, yyyy")}</span></div> : <span className="text-muted-foreground">Never</span>}</TableCell>
                  <TableCell><Switch checked={code.is_active} onCheckedChange={() => handleToggleActive(code.id, code.is_active)} /></TableCell>
                  <TableCell className="text-right">
                    <AdminDeleteConfirm onConfirm={() => handleDelete(code.id, code.code)} itemName={code.code} itemType="promo code" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminPageShell>
  );
}
