import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const authSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMin")),
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: t("auth.validationError"),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: t("auth.loginFailed"),
              description: t("auth.invalidCredentials"),
              variant: "destructive",
            });
          } else {
            toast({
              title: t("common.error"),
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: t("auth.accountExists"),
              description: t("auth.emailAlreadyRegistered"),
              variant: "destructive",
            });
          } else {
            toast({
              title: t("common.error"),
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: t("common.success"),
            description: t("auth.accountCreated"),
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Flame className="h-12 w-12 text-primary animate-glow-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{t("auth.brand")}</CardTitle>
          <CardDescription className="text-base">
            {isLogin ? t("auth.welcomeBack") : t("auth.beginJourney")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.processing") : isLogin ? t("auth.signIn") : t("auth.createAccount")}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? t("auth.toggleToSignup") : t("auth.toggleToLogin")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
