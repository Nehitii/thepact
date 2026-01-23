import { ReactNode } from "react";
import { CyberBackground } from "@/components/CyberBackground";
import { cn } from "@/lib/utils";

interface ProfileSettingsShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: ReactNode;
  children: ReactNode;
  /** Optional floating elements (e.g. fixed overlays) rendered above the background. */
  floating?: ReactNode;
  /** Defaults to Shop-like width. */
  containerClassName?: string;
}

export function ProfileSettingsShell({
  title,
  subtitle,
  icon,
  children,
  floating,
  containerClassName,
}: ProfileSettingsShellProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      <div
        className={cn(
          "relative z-10 px-4 pt-6 pb-6 max-w-5xl mx-auto",
          containerClassName
        )}
      >
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg" />
              <div className="relative w-14 h-14 rounded-xl border-2 border-primary/30 bg-card/70 backdrop-blur-xl flex items-center justify-center shop-card">
                {icon}
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-orbitron text-2xl md:text-3xl font-bold tracking-wider">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {subtitle ? (
                <p className="text-sm text-muted-foreground font-rajdhani mt-1">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </header>

        <main className="space-y-6">{children}</main>
      </div>

      {floating ? <div className="relative z-20">{floating}</div> : null}
    </div>
  );
}
