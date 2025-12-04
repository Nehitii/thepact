import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { User, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfileAccountSettingsProps {
  userId: string;
  email: string;
  displayName: string;
  timezone: string;
  language: string;
  currency: string;
  birthday: Date | undefined;
  country: string;
  onDisplayNameChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onBirthdayChange: (date: Date | undefined) => void;
  onCountryChange: (value: string) => void;
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

const countries = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
  { value: "cn", label: "China" },
  { value: "au", label: "Australia" },
  { value: "ca", label: "Canada" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "br", label: "Brazil" },
  { value: "in", label: "India" },
  { value: "other", label: "Other" },
];

export function ProfileAccountSettings({
  userId,
  email,
  displayName,
  timezone,
  language,
  currency,
  birthday,
  country,
  onDisplayNameChange,
  onTimezoneChange,
  onLanguageChange,
  onCurrencyChange,
  onBirthdayChange,
  onCountryChange,
}: ProfileAccountSettingsProps) {
  const { toast } = useToast();
  const { setCurrency: updateGlobalCurrency, refreshCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        timezone,
        language,
        currency,
        birthday: birthday ? birthday.toISOString().split('T')[0] : null,
        country: country || null,
      })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      updateGlobalCurrency(currency);
      await refreshCurrency();
      toast({
        title: "Account Updated",
        description: "Your account information has been saved",
      });
    }

    setSaving(false);
  };

  return (
    <ProfileMenuCard
      icon={<User className="h-5 w-5 text-primary" />}
      title="Account Information"
      description="Your identity and app preferences"
    >
      <div className="space-y-5">
        {/* Email (disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Email
          </Label>
          <Input 
            id="email" 
            value={email} 
            disabled 
            className="bg-card/50 border-primary/20 text-primary/60 font-orbitron" 
          />
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Display Name
          </Label>
          <Input
            id="displayName"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            maxLength={100}
            className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron"
          />
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Birthday Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-card/50 border-primary/20 hover:border-primary/50 hover:bg-card/60 text-primary font-orbitron",
                  !birthday && "text-primary/60"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthday ? format(birthday, "PPP") : <span>Select your birthday</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-primary/30 z-50" align="start">
              <Calendar
                mode="single"
                selected={birthday}
                onSelect={onBirthdayChange}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Country
          </Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger id="country" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30 z-50">
              {countries.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-primary font-rajdhani">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Time Zone
          </Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger id="timezone" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30 z-50">
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="text-primary font-rajdhani">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Language
          </Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger id="language" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30 z-50">
              <SelectItem value="en" className="text-primary font-rajdhani">English</SelectItem>
              <SelectItem value="fr" className="text-primary font-rajdhani">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-primary/90 font-rajdhani uppercase tracking-wide text-sm">
            Currency
          </Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger id="currency" className="bg-card/50 border-primary/20 text-primary focus:border-primary/50 font-orbitron">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/30 z-50">
              <SelectItem value="eur" className="text-primary font-rajdhani">Euros (€)</SelectItem>
              <SelectItem value="usd" className="text-primary font-rajdhani">Dollars ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary/20 border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/30 text-primary font-orbitron uppercase tracking-wider"
        >
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </ProfileMenuCard>
  );
}
