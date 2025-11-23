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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="pt-8">
          <h1 className="text-3xl font-bold mb-2">Finance</h1>
          <p className="text-muted-foreground">Manage your financial flow</p>
        </div>

        {/* This Month */}
        <Card>
          <CardHeader>
            <CardTitle>{monthName}</CardTitle>
            <CardDescription>Track your monthly finances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Income */}
            <div className="space-y-2">
              <Label htmlFor="income">Income</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
            </div>

            {/* Fixed Expenses */}
            <div className="space-y-2">
              <Label htmlFor="fixed">Fixed Expenses</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="fixed"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={fixedExpenses}
                  onChange={(e) => setFixedExpenses(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Rent, utilities, subscriptions...
              </p>
            </div>

            {/* Variable Expenses */}
            <div className="space-y-2">
              <Label htmlFor="variable">Variable Expenses</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="variable"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={variableExpenses}
                  onChange={(e) => setVariableExpenses(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Food, entertainment, shopping...
              </p>
            </div>

            {/* Savings */}
            <div className="space-y-2">
              <Label htmlFor="savings">Savings</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="savings"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                />
              </div>
            </div>

            {/* Remaining Budget */}
            <div
              className={`p-4 rounded-lg border-2 ${
                remaining >= 0
                  ? "border-green-500/20 bg-green-500/10"
                  : "border-red-500/20 bg-red-500/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Remaining Budget</span>
                <span
                  className={`text-2xl font-bold ${
                    remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(remaining, currency)}
                </span>
              </div>
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Month Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}
