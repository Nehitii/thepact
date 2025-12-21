import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Puzzle,
  Plus, 
  Pencil, 
  ArrowLeft,
  Trash2,
  TrendingUp,
  Phone,
  BookOpen,
  ListTodo,
  Heart
} from "lucide-react";

interface ShopModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_bonds: number;
  price_eur: number | null;
  rarity: string;
  icon_key: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  display_order: number;
}

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

export default function AdminModuleManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [modules, setModules] = useState<ShopModule[]>([]);
  const [editingModule, setEditingModule] = useState<Partial<ShopModule> | null>(null);

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
      loadModules();
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const loadModules = async () => {
    const { data, error } = await supabase
      .from("shop_modules")
      .select("*")
      .order("display_order");

    if (data) setModules(data);
  };

  const saveModule = async () => {
    if (!editingModule?.name || !editingModule?.key) return;

    const moduleData = {
      key: editingModule.key,
      name: editingModule.name,
      description: editingModule.description || null,
      price_bonds: editingModule.price_bonds || 2200,
      price_eur: editingModule.price_eur || 19.99,
      rarity: editingModule.rarity || "epic",
      icon_key: editingModule.icon_key || null,
      is_active: editingModule.is_active ?? true,
      is_coming_soon: editingModule.is_coming_soon ?? false,
      display_order: editingModule.display_order || 0,
    };

    if (editingModule.id) {
      await supabase.from("shop_modules").update(moduleData).eq("id", editingModule.id);
    } else {
      await supabase.from("shop_modules").insert(moduleData);
    }

    toast({ title: "Module saved!" });
    setEditingModule(null);
    loadModules();
  };

  const deleteModule = async (id: string) => {
    await supabase.from("shop_modules").delete().eq("id", id);
    toast({ title: "Module deleted" });
    loadModules();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#00050B] flex items-center justify-center">
        <div className="text-primary animate-pulse font-orbitron">Verifying access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

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
              <Puzzle className="h-6 w-6" />
              Module Manager
            </h1>
            <p className="text-sm text-primary/60 font-rajdhani">Manage purchasable modules</p>
          </div>
        </div>

        <div className="space-y-4">
          <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingModule({})}
                className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary/30">
              <DialogHeader>
                <DialogTitle className="text-primary font-orbitron">
                  {editingModule?.id ? "Edit Module" : "Add Module"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label className="text-primary/80">Key (unique identifier)</Label>
                  <Input
                    placeholder="e.g., journal"
                    value={editingModule?.key || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, key: e.target.value })}
                    className="bg-card/50 border-primary/30 text-primary"
                  />
                </div>
                <div>
                  <Label className="text-primary/80">Name</Label>
                  <Input
                    value={editingModule?.name || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })}
                    className="bg-card/50 border-primary/30 text-primary"
                  />
                </div>
                <div>
                  <Label className="text-primary/80">Description</Label>
                  <Textarea
                    value={editingModule?.description || ""}
                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                    className="bg-card/50 border-primary/30 text-primary"
                  />
                </div>
                <div>
                  <Label className="text-primary/80">Rarity</Label>
                  <Select
                    value={editingModule?.rarity || "epic"}
                    onValueChange={(v) => setEditingModule({ ...editingModule, rarity: v })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/30 text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-primary/80">Price (Bonds)</Label>
                    <Input
                      type="number"
                      value={editingModule?.price_bonds || 2200}
                      onChange={(e) => setEditingModule({ ...editingModule, price_bonds: parseInt(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-primary/80">Price (EUR)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingModule?.price_eur || 19.99}
                      onChange={(e) => setEditingModule({ ...editingModule, price_eur: parseFloat(e.target.value) })}
                      className="bg-card/50 border-primary/30 text-primary"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-primary/80">Display Order</Label>
                  <Input
                    type="number"
                    value={editingModule?.display_order || 0}
                    onChange={(e) => setEditingModule({ ...editingModule, display_order: parseInt(e.target.value) })}
                    className="bg-card/50 border-primary/30 text-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">Active (visible in Shop)</Label>
                  <Switch
                    checked={editingModule?.is_active ?? true}
                    onCheckedChange={(c) => setEditingModule({ ...editingModule, is_active: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-primary/80">Coming Soon</Label>
                  <Switch
                    checked={editingModule?.is_coming_soon ?? false}
                    onCheckedChange={(c) => setEditingModule({ ...editingModule, is_coming_soon: c })}
                  />
                </div>
                <Button onClick={saveModule} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
                  Save Module
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-3">
            {modules.map((module) => {
              const Icon = moduleIcons[module.key] || Puzzle;
              return (
                <div key={module.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-primary font-rajdhani font-medium">{module.name}</div>
                      <div className="text-xs text-primary/50">
                        {module.rarity} · {module.price_bonds} Bonds · €{module.price_eur}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.is_coming_soon && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                        Soon
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${module.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {module.is_active ? "Active" : "Inactive"}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => setEditingModule(module)} className="text-primary/60 hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteModule(module.id)} className="text-red-400/60 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
