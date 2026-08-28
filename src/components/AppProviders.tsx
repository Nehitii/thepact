import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/socle/ui/tooltip";
import { Toaster as Sonner } from "@/socle/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/socle/contextes/AuthContext";
import { CurrencyProvider } from "@/socle/contextes/CurrencyContext";
import { I18nProvider } from "@/socle/contextes/I18nProvider";
import { SoundProvider } from "@/socle/contextes/SoundContext";
import { SoundSettingsSync } from "@/components/sound/SoundSettingsSync";
import { ProfilePreferencesSync } from "@/domaines/profil";
import { AccentColorSync } from "@/domaines/profil";
import { OnlineStatusPing } from "@/domaines/social";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000,
      gcTime: 3_600_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onVis = () => {
      document.documentElement.classList.toggle(
        "tab-hidden",
        document.visibilityState !== "visible",
      );
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ProfilePreferencesSync />
              <AccentColorSync />
              <OnlineStatusPing />
              <I18nProvider>
                <SoundProvider>
                  <SoundSettingsSync />
                  <CurrencyProvider>
                    {children}
                  </CurrencyProvider>
                </SoundProvider>
              </I18nProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
