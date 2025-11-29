import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

interface ProfileAccountSettingsProps {
  email: string;
  displayName: string;
  timezone: string;
  language: string;
  currency: string;
  onDisplayNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
}

const timezones = [
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  { value: "America/New_York", label: "America/New York (GMT-5)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (GMT-8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (GMT+8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (GMT+11)" },
];

export function ProfileAccountSettings({
  email,
  displayName,
  timezone,
  language,
  currency,
  onDisplayNameChange,
  onTimezoneChange,
  onLanguageChange,
  onCurrencyChange,
}: ProfileAccountSettingsProps) {
  return (
    <div className="relative group animate-fade-in">
      <div className="absolute inset-0 bg-primary/5 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
      <Card className="relative bg-card/30 backdrop-blur-xl border-2 border-primary/30 hover:border-primary/50 transition-all overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-[2px] border border-primary/20 rounded-[6px]" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-primary font-orbitron uppercase tracking-wider drop-shadow-[0_0_10px_rgba(91,180,255,0.5)]">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription className="text-primary/60 font-rajdhani">Your identity and app preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Email</Label>
            <Input id="email" value={email} disabled className="bg-card/50 border-primary/20 text-primary/60 font-orbitron" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              maxLength={100}
              className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Time Zone</Label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger id="timezone" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30">
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-primary font-rajdhani">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Language</Label>
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger id="language" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30">
                <SelectItem value="en" className="text-primary font-rajdhani">English</SelectItem>
                <SelectItem value="fr" className="text-primary font-rajdhani">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">Currency</Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger id="currency" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30">
                <SelectItem value="eur" className="text-primary font-rajdhani">Euros (€)</SelectItem>
                <SelectItem value="usd" className="text-primary font-rajdhani">Dollars ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}