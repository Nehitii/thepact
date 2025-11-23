import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>("eur");

  const loadCurrency = useCallback(async () => {
    if (!user) {
      setCurrencyState("eur"); // Reset to default when no user
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.currency) {
      setCurrencyState(data.currency);
    }
  }, [user]);

  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  const refreshCurrency = async () => {
    await loadCurrency();
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, refreshCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
