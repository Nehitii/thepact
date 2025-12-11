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

  // Luminous label style for consistency
  const labelStyle = "text-[#8ACBFF] font-rajdhani uppercase tracking-wide text-sm drop-shadow-[0_0_4px_rgba(138,203,255,0.4)]";
  
  // Input field style with improved readability
  const inputStyle = "bg-[#0d1a2d]/90 border-[#3a5f8a]/50 text-[#e0f0ff] placeholder:text-[#6b9ec4] font-orbitron focus:border-[#8ACBFF]/70 focus:ring-1 focus:ring-[#8ACBFF]/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(138,203,255,0.1)]";
  
  // Select trigger style
  const selectTriggerStyle = "bg-[#0d1a2d]/90 border-[#3a5f8a]/50 text-[#e0f0ff] font-orbitron focus:border-[#8ACBFF]/70 hover:border-[#8ACBFF]/50 hover:bg-[#0d1a2d] shadow-[inset_0_1px_4px_rgba(0,0,0,0.3),0_0_8px_rgba(138,203,255,0.1)]";
  
  // Select content style
  const selectContentStyle = "bg-[#0a1628]/98 backdrop-blur-xl border-[#3a5f8a]/60 shadow-[0_0_20px_rgba(138,203,255,0.15)]";
  
  // Select item style
  const selectItemStyle = "text-[#c8e0f4] font-rajdhani hover:bg-[#1a3352]/60 focus:bg-[#1a3352]/60 focus:text-[#e0f0ff]";

  return (
    <ProfileMenuCard
      icon={<User className="h-5 w-5 text-[#8ACBFF] drop-shadow-[0_0_6px_rgba(138,203,255,0.6)]" />}
      title="Account Information"
      description="Your identity and app preferences"
    >
      <div className="space-y-5">
        {/* Email (disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email" className={labelStyle}>
            Email
          </Label>
          <Input 
            id="email" 
            value={email} 
            disabled 
            className="bg-[#0d1a2d]/70 border-[#3a5f8a]/40 text-[#6b9ec4] font-orbitron cursor-not-allowed shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]" 
          />
          <p className="text-xs text-[#6b9ec4]/80 font-rajdhani">Email cannot be changed</p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className={labelStyle}>
            Display Name
          </Label>
          <Input
            id="displayName"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            maxLength={100}
            className={inputStyle}
          />
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label className={labelStyle}>
            Birthday Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  selectTriggerStyle,
                  !birthday && "text-[#6b9ec4]"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#8ACBFF]" />
                {birthday ? (
                  <span className="text-[#e0f0ff]">{format(birthday, "PPP")}</span>
                ) : (
                  <span className="text-[#6b9ec4]">Select your birthday</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-0 z-50", selectContentStyle)} align="start">
              <Calendar
                mode="single"
                selected={birthday}
                onSelect={onBirthdayChange}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                className="pointer-events-auto [&_.rdp-caption_select]:bg-[#0d1a2d] [&_.rdp-caption_select]:text-[#e0f0ff] [&_.rdp-caption_select]:border-[#3a5f8a]/50 [&_.rdp-day]:text-[#c8e0f4] [&_.rdp-day_button:hover]:bg-[#1a3352] [&_.rdp-day_button.rdp-day_selected]:bg-[#8ACBFF]/30 [&_.rdp-day_button.rdp-day_selected]:text-[#e0f0ff] [&_.rdp-head_cell]:text-[#8ACBFF] [&_.rdp-nav_button]:text-[#8ACBFF] [&_.rdp-nav_button:hover]:bg-[#1a3352]"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className={labelStyle}>
            Country
          </Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger id="country" className={selectTriggerStyle}>
              <SelectValue placeholder="Select country" className="text-[#6b9ec4]" />
            </SelectTrigger>
            <SelectContent className={selectContentStyle}>
              {countries.map((c) => (
                <SelectItem key={c.value} value={c.value} className={selectItemStyle}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="timezone" className={labelStyle}>
            Time Zone
          </Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger id="timezone" className={selectTriggerStyle}>
              <SelectValue placeholder="Select timezone" className="text-[#6b9ec4]" />
            </SelectTrigger>
            <SelectContent className={selectContentStyle}>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className={selectItemStyle}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className={labelStyle}>
            Language
          </Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger id="language" className={selectTriggerStyle}>
              <SelectValue placeholder="Select language" className="text-[#6b9ec4]" />
            </SelectTrigger>
            <SelectContent className={selectContentStyle}>
              <SelectItem value="en" className={selectItemStyle}>English</SelectItem>
              <SelectItem value="fr" className={selectItemStyle}>Français</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency" className={labelStyle}>
            Currency
          </Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger id="currency" className={selectTriggerStyle}>
              <SelectValue placeholder="Select currency" className="text-[#6b9ec4]" />
            </SelectTrigger>
            <SelectContent className={selectContentStyle}>
              <SelectItem value="eur" className={selectItemStyle}>Euros (€)</SelectItem>
              <SelectItem value="usd" className={selectItemStyle}>Dollars ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#1a3352]/80 border-2 border-[#8ACBFF]/40 hover:border-[#8ACBFF]/70 hover:bg-[#1a3352] text-[#e0f0ff] font-orbitron uppercase tracking-wider shadow-[0_0_12px_rgba(138,203,255,0.2)] hover:shadow-[0_0_20px_rgba(138,203,255,0.4)] transition-all duration-300"
        >
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </Button>
      </div>
    </ProfileMenuCard>
  );
}
