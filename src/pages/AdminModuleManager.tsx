import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDeleteConfirm } from "@/components/admin/AdminDeleteConfirm";
import { logAdminAction } from "@/hooks/useAdminAudit";
import { 
  Puzzle, Plus, Pencil, TrendingUp, Phone, BookOpen, ListTodo, Heart, Search, Copy
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
  const { toast } = useToast();
  const [modules, setModules] = useState<ShopModule[]>([]);
  const [editingModule, setEditingModule] = useState<Partial<ShopModule> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadModules(); }, []);

  const loadModules = async () => {
    const { data } = await supabase.from("shop_modules").select("*").order("display_order");
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
      await logAdminAction("update", "module", editingModule.id, { name: editingModule.name });
    } else {
      await supabase.from("shop_modules").insert(moduleData);
      await logAdminAction("create", "module", undefined, { name: editingModule.name });
    }
    toast({ title: "Module saved!" });
    setEditingModule(null);
    loadModules();
  };

  const deleteModule = async (id: string, name: string) => {
    await supabase.from("shop_modules").delete().eq("id", id);
    await logAdminAction("delete", "module", id, { name });
    toast({ title: "Module deleted" });
    loadModules();
  };

  const duplicateModule = async (mod: ShopModule) => {
    const { id, ...rest } = mod;
    await supabase.from("shop_modules").insert({ ...rest, name: `${rest.name} (copy)`, key: `${rest.key}-copy` });
    await logAdminAction("duplicate", "module", id, { name: mod.name });
    toast({ title: "Module duplicated!" });
    loadModules();
  };

  const filtered = modules.filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminPageShell title="Module Manager" subtitle="Manage purchasable modules" icon={<Puzzle className="h-6 w-6" />}>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
        <Input placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card/50 border-primary/30 text-primary" />
      </div>

      <div className="space-y-4">
        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingModule({})} className="bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">
              <Plus className="h-4 w-4 mr-2" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/30">
            <DialogHeader>
              <DialogTitle className="text-primary font-orbitron">{editingModule?.id ? "Edit Module" : "Add Module"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <Label className="text-primary/80">Key (unique identifier)</Label>
                <Input placeholder="e.g., journal" value={editingModule?.key || ""} onChange={(e) => setEditingModule({ ...editingModule, key: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
              </div>
              <div>
                <Label className="text-primary/80">Name</Label>
                <Input value={editingModule?.name || ""} onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
              </div>
              <div>
                <Label className="text-primary/80">Description</Label>
                <Textarea value={editingModule?.description || ""} onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })} className="bg-card/50 border-primary/30 text-primary" />
              </div>
              <div>
                <Label className="text-primary/80">Rarity</Label>
                <Select value={editingModule?.rarity || "epic"} onValueChange={(v) => setEditingModule({ ...editingModule, rarity: v })}>
                  <SelectTrigger className="bg-card/50 border-primary/30 text-primary"><SelectValue /></SelectTrigger>
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
                  <Input type="number" value={editingModule?.price_bonds || 2200} onChange={(e) => setEditingModule({ ...editingModule, price_bonds: parseInt(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
                <div>
                  <Label className="text-primary/80">Price (EUR)</Label>
                  <Input type="number" step="0.01" value={editingModule?.price_eur || 19.99} onChange={(e) => setEditingModule({ ...editingModule, price_eur: parseFloat(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
                </div>
              </div>
              <div>
                <Label className="text-primary/80">Display Order</Label>
                <Input type="number" value={editingModule?.display_order || 0} onChange={(e) => setEditingModule({ ...editingModule, display_order: parseInt(e.target.value) })} className="bg-card/50 border-primary/30 text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-primary/80">Active (visible in Shop)</Label>
                <Switch checked={editingModule?.is_active ?? true} onCheckedChange={(c) => setEditingModule({ ...editingModule, is_active: c })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-primary/80">Coming Soon</Label>
                <Switch checked={editingModule?.is_coming_soon ?? false} onCheckedChange={(c) => setEditingModule({ ...editingModule, is_coming_soon: c })} />
              </div>
              <Button onClick={saveModule} className="w-full bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary">Save Module</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-3">
          {filtered.map((module) => {
            const Icon = moduleIcons[module.key] || Puzzle;
            return (
              <div key={module.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-primary font-rajdhani font-medium">{module.name}</div>
                    <div className="text-xs text-primary/50">{module.rarity} · {module.price_bonds} Bonds · €{module.price_eur}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {module.is_coming_soon && (
                    <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400">Soon</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${module.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {module.is_active ? "Active" : "Inactive"}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => duplicateModule(module)} className="text-primary/40 hover:text-primary" title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingModule(module)} className="text-primary/60 hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AdminDeleteConfirm onConfirm={() => deleteModule(module.id, module.name)} itemName={module.name} itemType="module" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminPageShell>
  );
}
