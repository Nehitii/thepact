import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useServerAdminCheck } from "@/hooks/useServerAdminCheck";
import { 
  Coins,
  Gift,
  Plus, 
  Pencil, 
  ArrowLeft,
  Trash2,
  Zap
} from "lucide-react";

interface BondPack {
  id: string;
  name: string;
  bond_amount: number;
  price_eur: number;
  bonus_percentage: number;
  is_active: boolean;
  display_order: number;
}

interface SpecialOffer {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_bonds: number | null;
  price_eur: number | null;
  original_price_bonds: number | null;
  original_price_eur: number | null;
  items: unknown | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
}

export default function AdminMoneyManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [packs, setPacks] = useState<BondPack[]>([]);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [editingPack, setEditingPack] = useState<Partial<BondPack> | null>(null);
  const [editingOffer, setEditingOffer] = useState<Partial<SpecialOffer> | null>(null);

  // Server-side admin verification
  const { data: adminCheck, isLoading, error } = useServerAdminCheck(!!user);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isLoading && adminCheck && !adminCheck.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, adminCheck, isLoading, navigate, toast]);

  useEffect(() => {
    if (adminCheck?.isAdmin) {
      loadData();
    }
  }, [adminCheck]);

  const loadData = async () => {
    const [packsRes, offersRes] = await Promise.all([
      supabase.from("bond_packs").select("*").order("display_order"),
      supabase.from("special_offers").select("*").order("display_order"),
    ]);

    if (packsRes.data) setPacks(packsRes.data);
    if (offersRes.data) setOffers(offersRes.data);
  };

  // Pack CRUD
  const savePack = async () => {
    if (!editingPack?.name) return;

    const packData = {
      name: editingPack.name,
      bond_amount: editingPack.bond_amount || 500,
      price_eur: editingPack.price_eur || 4.99,
      bonus_percentage: editingPack.bonus_percentage || 0,
      is_active: editingPack.is_active ?? true,
      display_order: editingPack.display_order || 0,
    };

    if (editingPack.id) {
      await supabase.from("bond_packs").update(packData).eq("id", editingPack.id);
    } else {
      await supabase.from("bond_packs").insert(packData);
    }

    toast({ title: "Pack saved!" });
    setEditingPack(null);
    loadData();
  };

  const deletePack = async (id: string) => {
    await supabase.from("bond_packs").delete().eq("id", id);
    toast({ title: "Pack deleted" });
    loadData();
  };

  // Offer CRUD
  const saveOffer = async () => {
    if (!editingOffer?.name) return;

    const offerData = {
      name: editingOffer.name,
      description: editingOffer.description || null,
      image_url: editingOffer.image_url || null,
      price_bonds: editingOffer.price_bonds || null,
      price_eur: editingOffer.price_eur || null,
      original_price_bonds: editingOffer.original_price_bonds || null,
      original_price_eur: editingOffer.original_price_eur || null,
      starts_at: editingOffer.starts_at || null,
      ends_at: editingOffer.ends_at || null,
      is_active: editingOffer.is_active ?? true,
      display_order: editingOffer.display_order || 0,
    };

    if (editingOffer.id) {
      await supabase.from("special_offers").update(offerData).eq("id", editingOffer.id);
    } else {
      await supabase.from("special_offers").insert(offerData);
    }

    toast({ title: "Offer saved!" });
    setEditingOffer(null);
    loadData();
  };

  const deleteOffer = async (id: string) => {
    await supabase.from("special_offers").delete().eq("id", id);
    toast({ title: "Offer deleted" });
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#00050B] flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying access...</div>
      </div>
    );
  }

  if (error || !adminCheck?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#00050B] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-orbitron text-primary flex items-center gap-2">
              <Coins className="h-6 w-6" />
              Money Manager
            </h1>
            <p className="text-sm text-primary/60 font-rajdhani">Manage bond packs and special offers</p>
          </div>
        </div>

        <Tabs defaultValue="packs" className="space-y-6">
          <TabsList className="bg-card/50 border border-primary/30">
            <TabsTrigger value="packs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Zap className="h-4 w-4 mr-2" />
              Bond Packs
            </TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Gift className="h-4 w-4 mr-2" />
              Special Offers
            </TabsTrigger>
          </TabsList>

          {/* Packs Tab */}
          <TabsContent value="packs" className="space-y-4">
            <Dialog open={!!editingPack} onOpenChange={(open) => !open && setEditingPack(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingPack({})}
                  className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pack
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">
                    {editingPack?.id ? "Edit Pack" : "Add Pack"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-primary/80">Name</Label>
                    <Input
                      value={editingPack?.name || ""}
                      onChange={(e) => setEditingPack({ ...editingPack, name: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-primary/80">Bond Amount</Label>
                      <Input
                        type="number"
                        value={editingPack?.bond_amount || 500}
                        onChange={(e) => setEditingPack({ ...editingPack, bond_amount: parseInt(e.target.value) })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-primary/80">Price (EUR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingPack?.price_eur || 4.99}
                        onChange={(e) => setEditingPack({ ...editingPack, price_eur: parseFloat(e.target.value) })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-primary/80">Bonus %</Label>
                      <Input
                        type="number"
                        value={editingPack?.bonus_percentage || 0}
                        onChange={(e) => setEditingPack({ ...editingPack, bonus_percentage: parseInt(e.target.value) })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-primary/80">Display Order</Label>
                      <Input
                        type="number"
                        value={editingPack?.display_order || 0}
                        onChange={(e) => setEditingPack({ ...editingPack, display_order: parseInt(e.target.value) })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-primary/80">Active</Label>
                    <Switch
                      checked={editingPack?.is_active ?? true}
                      onCheckedChange={(c) => setEditingPack({ ...editingPack, is_active: c })}
                    />
                  </div>
                  <Button onClick={savePack} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                    Save Pack
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-3">
              {packs.map((pack) => (
                <div key={pack.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-primary font-rajdhani font-medium">{pack.name}</div>
                      <div className="text-xs text-primary/50">
                        {pack.bond_amount.toLocaleString()} Bonds · €{pack.price_eur}
                        {pack.bonus_percentage > 0 && ` · +${pack.bonus_percentage}%`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${pack.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {pack.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingPack(pack)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deletePack(pack.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-4">
            <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingOffer({})}
                  className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/30 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-primary font-orbitron">
                    {editingOffer?.id ? "Edit Offer" : "Add Offer"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <Label className="text-primary/80">Name</Label>
                    <Input
                      value={editingOffer?.name || ""}
                      onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Description</Label>
                    <Textarea
                      value={editingOffer?.description || ""}
                      onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Image URL</Label>
                    <Input
                      placeholder="https://example.com/offer.png"
                      value={editingOffer?.image_url || ""}
                      onChange={(e) => setEditingOffer({ ...editingOffer, image_url: e.target.value })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-primary/80">Price (Bonds)</Label>
                      <Input
                        type="number"
                        value={editingOffer?.price_bonds || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, price_bonds: parseInt(e.target.value) || null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-primary/80">Price (EUR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingOffer?.price_eur || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, price_eur: parseFloat(e.target.value) || null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-primary/80">Original Price (Bonds)</Label>
                      <Input
                        type="number"
                        value={editingOffer?.original_price_bonds || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, original_price_bonds: parseInt(e.target.value) || null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-primary/80">Original Price (EUR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingOffer?.original_price_eur || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, original_price_eur: parseFloat(e.target.value) || null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-primary/80">Starts At</Label>
                      <Input
                        type="datetime-local"
                        value={editingOffer?.starts_at?.slice(0, 16) || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-primary/80">Ends At</Label>
                      <Input
                        type="datetime-local"
                        value={editingOffer?.ends_at?.slice(0, 16) || ""}
                        onChange={(e) => setEditingOffer({ ...editingOffer, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="bg-card/50 border-primary/30 text-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-primary/80">Display Order</Label>
                    <Input
                      type="number"
                      value={editingOffer?.display_order || 0}
                      onChange={(e) => setEditingOffer({ ...editingOffer, display_order: parseInt(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-primary/80">Active</Label>
                    <Switch
                      checked={editingOffer?.is_active ?? true}
                      onCheckedChange={(c) => setEditingOffer({ ...editingOffer, is_active: c })}
                    />
                  </div>
                  <Button onClick={saveOffer} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                    Save Offer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-3">
              {offers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    {offer.image_url ? (
                      <img src={offer.image_url} alt={offer.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Gift className="h-6 w-6 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-primary font-rajdhani font-medium">{offer.name}</div>
                      <div className="text-xs text-primary/50">
                        {offer.price_bonds && `${offer.price_bonds} Bonds`}
                        {offer.price_bonds && offer.price_eur && " · "}
                        {offer.price_eur && `€${offer.price_eur}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${offer.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingOffer(offer)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteOffer(offer.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-rajdhani">
                  No special offers yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
