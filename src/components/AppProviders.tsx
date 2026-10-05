import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { I18nProvider } from "@/contexts/I18nProvider";
import { SoundProvider } from "@/contexts/SoundContext";
import { SoundSettingsSync } from "@/components/sound/SoundSettingsSync";
import { ProfilePreferencesSync } from "@/components/profile/ProfilePreferencesSync";
import { AccentColorSync } from "@/components/profile/AccentColorSync";
import { OnlineStatusPing } from "@/components/friends/OnlineStatusPing";

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
