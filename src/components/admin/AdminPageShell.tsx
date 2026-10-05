import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Palette, Coins, Puzzle, Sparkles, Bell } from "lucide-react";

interface AdminPageShellProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

const adminSections = [
  { label: "Hub", href: "/admin", icon: Shield },
  { label: "Mode", href: "/admin/mode", icon: Shield },
  { label: "Cosmetics", href: "/admin/cosmetics", icon: Palette },
  { label: "Money", href: "/admin/money", icon: Coins },
  { label: "Modules", href: "/admin/modules", icon: Puzzle },
  { label: "Promos", href: "/admin/promo-codes", icon: Sparkles },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

export function AdminPageShell({ title, subtitle, icon, children, maxWidth = "max-w-4xl" }: AdminPageShellProps) {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className={`${maxWidth} mx-auto p-6 relative z-10`}>
        {/* Breadcrumb Nav */}
        <nav className="flex items-center gap-1 mb-4 flex-wrap">
          {adminSections.map((section, i) => {
            const isActive = currentPath === section.href;
            const SIcon = section.icon;
            return (
              <React.Fragment key={section.href}>
                {i > 0 && <span className="text-primary/30 text-xs mx-0.5">·</span>}
                <Link
                  to={section.href}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-rajdhani transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-primary/40 hover:text-primary/70 hover:bg-primary/5"
                  }`}
                >
                  <SIcon className="h-3 w-3" />
                  {section.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

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
              {icon}
              {title}
            </h1>
            <p className="text-sm text-primary/60 font-rajdhani">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
