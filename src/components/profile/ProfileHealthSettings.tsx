import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";

interface ProfileHealthSettingsProps {
  age: number | undefined;
  weight: number | undefined;
  height: number | undefined;
  onAgeChange: (value: number | undefined) => void;
  onWeightChange: (value: number | undefined) => void;
  onHeightChange: (value: number | undefined) => void;
}

export function ProfileHealthSettings({
  age,
  weight,
  height,
  onAgeChange,
  onWeightChange,
  onHeightChange,
}: ProfileHealthSettingsProps) {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Health Settings
        </CardTitle>
        <CardDescription>Basic health information for tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            value={age ?? ""}
            onChange={(e) => onAgeChange(e.target.value ? parseInt(e.target.value) : undefined)}
            min={0}
            max={150}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            placeholder="Enter your weight"
            value={weight ?? ""}
            onChange={(e) => onWeightChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            min={0}
            max={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="Enter your height"
            value={height ?? ""}
            onChange={(e) => onHeightChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            min={0}
            max={300}
          />
        </div>
      </CardContent>
    </Card>
  );
}