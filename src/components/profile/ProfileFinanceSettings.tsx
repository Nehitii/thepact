import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function ProfileFinanceSettings() {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Finance Settings
        </CardTitle>
        <CardDescription>Financial configuration and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            More finance configuration options will appear here soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}