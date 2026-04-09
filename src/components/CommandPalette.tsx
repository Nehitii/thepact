import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
  GripVertical,
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
  {
    label: "Achievements",
    icon: Trophy,
    route: "/achievements",
    group: "Navigation",
    keywords: "badges hall eternity",
  },
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
  {
    label: "Pact Settings",
    icon: Settings,
    route: "/profile/pact-settings",
    group: "Settings",
    keywords: "pact config",
  },
  {
    label: "Display & Sound",
    icon: Volume2,
    route: "/profile/display-sound",
    group: "Settings",
    keywords: "theme volume particles",
  },
  {
    label: "Notifications",
    icon: Bell,
    route: "/profile/notifications",
    group: "Settings",
    keywords: "alerts reminders",
  },
  { label: "Privacy & Control", icon: Shield, route: "/profile/privacy", group: "Settings", keywords: "security data" },
  { label: "Data & Portability", icon: Database, route: "/profile/data", group: "Settings", keywords: "export import" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Limites pour le drag
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Tracking du drag en cours pour annuler le clic intempestif
  const isDragging = useRef(false);

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
      <div ref={constraintsRef} className="fixed inset-4 md:inset-8 z-50 pointer-events-none" aria-hidden="true" />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.15}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        // Activation du flag pendant le drag
        onDragStart={() => {
          isDragging.current = true;
        }}
        // Désactivation du flag avec un léger délai pour ignorer le clic
        onDragEnd={() => {
          setTimeout(() => {
            isDragging.current = false;
          }, 150);
        }}
        whileHover={{ scale: 1.02 }}
        whileDrag={{ scale: 1.05, cursor: "grabbing" }}
        className="fixed bottom-6 right-6 z-[999] pointer-events-auto flex items-center shadow-[0_0_20px_rgba(0,242,255,0.15)] rounded-full bg-[#03060A]/85 backdrop-blur-md border border-[#00F2FF]/30 p-1 cursor-grab active:cursor-grabbing"
      >
        <div
          className="flex items-center justify-center p-2 text-white/30 hover:text-white/80 transition-colors"
          title="Drag to move"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <button
          onClick={(e) => {
            // Si on était en train de drag, on bloque purement et simplement l'action
            if (isDragging.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setOpen(true);
          }}
          className="flex items-center gap-2 pr-5 pl-1 py-2 text-[#00F2FF]/80 hover:text-[#00F2FF] transition-all outline-none"
          aria-label="Search or jump to…"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline-block text-xs font-mono font-bold tracking-[0.15em] uppercase mt-0.5">
            SEARCH
          </span>
          <kbd className="hidden sm:inline-flex ml-2 items-center gap-1 px-2 py-0.5 rounded bg-[#00F2FF]/10 border border-[#00F2FF]/20 text-[10px] font-bold text-[#00F2FF]">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </motion.div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search modules, settings, coordinates..." />
        <CommandList className="font-mono text-sm">
          <CommandEmpty>No signals found.</CommandEmpty>
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
                    <item.icon className="h-4 w-4 text-[#00F2FF]/70" />
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
