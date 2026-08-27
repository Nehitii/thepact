import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
/* `Trans` plutôt que `t()` : la phrase porte le chemin DANS une balise
   <code>. Avec `t()` seul, il faudrait la couper en deux morceaux dont
   l'ordre change d'une langue à l'autre. C'est le seul endroit du dépôt
   qui en a besoin. */
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.1) 2px, hsl(var(--primary) / 0.1) 4px)" }}
      />

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary/30" />

      <div className="text-center relative z-10 space-y-6 px-4">
        {/* Error code */}
        <div className="relative">
          <h1
            className={`text-8xl md:text-9xl font-black font-rajdhani tracking-tighter text-primary/20 select-none transition-all ${glitch ? "translate-x-1 text-destructive/40" : ""}`}
          >
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>

        {/* HUD label */}
        <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-4 py-1.5 rounded font-mono text-xs text-primary/60 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          {t("notFound.signalPerdu", "Signal perdu — route introuvable")}
        </div>

        <p className="text-muted-foreground font-rajdhani text-lg max-w-md mx-auto">
          <Trans
            i18nKey="notFound.chemin"
            values={{ chemin: location.pathname }}
            components={[<code key="c" className="text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded text-sm" />]}
            defaults="Le chemin demandé <0>{{chemin}}</0> n’existe pas dans ce système."
          />
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 font-rajdhani uppercase tracking-wider text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("notFound.retour", "Retour")}
          </Button>
          <Button variant="default" size="sm" onClick={() => navigate("/")} className="gap-1.5 font-rajdhani uppercase tracking-wider text-xs">
            <Home className="h-3.5 w-3.5" /> {t("notFound.tableauDeBord", "Tableau de bord")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
