import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

export default function Finance() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const [income, setIncome] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState("");
  const [variableExpenses, setVariableExpenses] = useState("");
  const [savings, setSavings] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadMonthData = async () => {
      const { data } = await supabase
        .from("finance")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .maybeSingle();

      if (data) {
        setIncome(data.income?.toString() || "");
        setFixedExpenses(data.fixed_expenses?.toString() || "");
        setVariableExpenses(data.variable_expenses?.toString() || "");
        setSavings(data.savings?.toString() || "");
      }
    };

    loadMonthData();
  }, [user, currentMonth]);

  const calculateRemaining = () => {
    const inc = parseFloat(income) || 0;
    const fixed = parseFloat(fixedExpenses) || 0;
    const variable = parseFloat(variableExpenses) || 0;
    const save = parseFloat(savings) || 0;
    return inc - fixed - variable - save;
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const remaining = calculateRemaining();

    const financeData = {
      user_id: user.id,
      month: currentMonth,
      income: income ? parseFloat(income) : 0,
      fixed_expenses: fixedExpenses ? parseFloat(fixedExpenses) : 0,
      variable_expenses: variableExpenses ? parseFloat(variableExpenses) : 0,
      savings: savings ? parseFloat(savings) : 0,
      remaining_budget: remaining,
    };

    const { error } = await supabase
      .from("finance")
      .upsert(financeData, { onConflict: "user_id,month" });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Finance Data Saved",
        description: "Your monthly financial data has been recorded",
      });
    }

    setLoading(false);
  };

  const remaining = calculateRemaining();
  const monthName = new Date(currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="pt-8 text-center space-y-3 animate-fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Finance
          </h1>
          <p className="text-primary/70 tracking-wide font-rajdhani">Manage your financial flow</p>
        </div>

        {/* This Month */}
        <div className="relative group animate-fade-in">
          <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
          <Card className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/50 transition-all overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-orbitron text-primary uppercase tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
                {monthName}
              </CardTitle>
              <CardDescription className="text-primary/60 font-rajdhani">Track your monthly finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Income */}
              <div className="space-y-2">
                <Label htmlFor="income" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Income</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-orbitron">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    id="income"
                    type="number"
                    step="0.01"
                    className="pl-7 bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
                    placeholder="0.00"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                  />
                </div>
              </div>

              {/* Fixed Expenses */}
              <div className="space-y-2">
                <Label htmlFor="fixed" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Fixed Expenses</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-orbitron">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    id="fixed"
                    type="number"
                    step="0.01"
                    className="pl-7 bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
                    placeholder="0.00"
                    value={fixedExpenses}
                    onChange={(e) => setFixedExpenses(e.target.value)}
                  />
                </div>
                <p className="text-xs text-primary/50 font-rajdhani">
                  Rent, utilities, subscriptions...
                </p>
              </div>

              {/* Variable Expenses */}
              <div className="space-y-2">
                <Label htmlFor="variable" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Variable Expenses</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-orbitron">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    id="variable"
                    type="number"
                    step="0.01"
                    className="pl-7 bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
                    placeholder="0.00"
                    value={variableExpenses}
                    onChange={(e) => setVariableExpenses(e.target.value)}
                  />
                </div>
                <p className="text-xs text-primary/50 font-rajdhani">
                  Food, entertainment, shopping...
                </p>
              </div>

              {/* Savings */}
              <div className="space-y-2">
                <Label htmlFor="savings" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Savings</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 font-orbitron">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    id="savings"
                    type="number"
                    step="0.01"
                    className="pl-7 bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
                    placeholder="0.00"
                    value={savings}
                    onChange={(e) => setSavings(e.target.value)}
                  />
                </div>
              </div>

              {/* Remaining Budget */}
              <div className="relative group/budget">
                <div className={`absolute inset-0 rounded-lg blur-md ${
                  remaining >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                }`} />
                <div
                  className={`relative p-5 rounded-lg border-2 overflow-hidden ${
                    remaining >= 0
                      ? "border-green-500/30 bg-green-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute inset-[2px] border rounded-[6px] ${
                      remaining >= 0 ? "border-green-500/20" : "border-red-500/20"
                    }`} />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`font-medium font-rajdhani uppercase tracking-wider ${
                      remaining >= 0 ? "text-green-400" : "text-red-400"
                    }`}>Remaining Budget</span>
                    <span
                      className={`text-3xl font-bold font-orbitron ${
                        remaining >= 0 ? "text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      }`}
                    >
                      {formatCurrency(remaining, currency)}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider transition-all"
              >
                {loading ? "SAVING..." : "SAVE MONTH DATA"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
