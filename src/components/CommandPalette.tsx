import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Target,
  ShoppingBag,
  Users,
  Trophy,
  ListTodo,
  BookOpen,
  Wallet,
  Zap,
  Heart,
  ShoppingCart,
  Inbox,
  User,
  Settings,
  Bell,
  Shield,
  Database,
  Volume2,
  Search,
} from "lucide-react";

interface PaletteItem {
  label: string;
  icon: React.ElementType;
  route: string;
  group: string;
  keywords?: string;
}

const allItems: PaletteItem[] = [
  // Main
  { label: "Home", icon: Home, route: "/", group: "Navigation", keywords: "dashboard overview" },
  { label: "Goals", icon: Target, route: "/goals", group: "Navigation", keywords: "objectives targets" },
  { label: "New Goal", icon: Target, route: "/goals/new", group: "Navigation", keywords: "create add goal" },
  { label: "Shop", icon: ShoppingBag, route: "/shop", group: "Navigation", keywords: "store buy bonds cosmetics" },
  { label: "Community", icon: Users, route: "/community", group: "Navigation", keywords: "social feed posts" },
  { label: "Achievements", icon: Trophy, route: "/achievements", group: "Navigation", keywords: "badges hall eternity" },
  { label: "Inbox", icon: Inbox, route: "/inbox", group: "Navigation", keywords: "notifications messages" },

  // Modules
  { label: "To-Do List", icon: ListTodo, route: "/todo", group: "Modules", keywords: "tasks checklist" },
  { label: "Journal", icon: BookOpen, route: "/journal", group: "Modules", keywords: "diary entries writing" },
  { label: "Finance", icon: Wallet, route: "/finance", group: "Modules", keywords: "budget money expenses income" },
  { label: "The Call", icon: Zap, route: "/the-call", group: "Modules", keywords: "checkin daily ritual" },
  { label: "Health", icon: Heart, route: "/health", group: "Modules", keywords: "wellness mood sleep" },
  { label: "Wishlist", icon: ShoppingCart, route: "/wishlist", group: "Modules", keywords: "wants needs items" },

  // Settings
  { label: "Account Info", icon: User, route: "/profile", group: "Settings", keywords: "profile account" },
  { label: "Pact Settings", icon: Settings, route: "/profile/pact-settings", group: "Settings", keywords: "pact config" },
  { label: "Display & Sound", icon: Volume2, route: "/profile/display-sound", group: "Settings", keywords: "theme volume particles" },
  { label: "Notifications", icon: Bell, route: "/profile/notifications", group: "Settings", keywords: "alerts reminders" },
  { label: "Privacy & Control", icon: Shield, route: "/profile/privacy", group: "Settings", keywords: "security data" },
  { label: "Data & Portability", icon: Database, route: "/profile/data", group: "Settings", keywords: "export import" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Ctrl+K / Cmd+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of allItems) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return map;
  }, []);

  const handleSelect = (route: string) => {
    setOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* Trigger button for mobile */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-muted-foreground text-xs font-mono hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, modules, settings..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Array.from(groups.entries()).map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.route}
                    value={`${item.label} ${item.keywords || ""}`}
                    onSelect={() => handleSelect(item.route)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4 opacity-60" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
