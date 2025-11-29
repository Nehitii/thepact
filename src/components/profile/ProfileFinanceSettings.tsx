import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function ProfileFinanceSettings() {
  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
      <Card className="relative border-2 border-primary/30 bg-card/30 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
            <DollarSign className="h-5 w-5" />
            Finance Settings
          </CardTitle>
          <CardDescription className="text-primary/60 font-rajdhani">Financial configuration and preferences</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-primary/60 font-rajdhani">
              More finance configuration options will appear here soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}