import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CyberBackground } from "@/components/CyberBackground";
import { ShopCurrencyDisplay } from "@/components/shop/ShopCurrencyDisplay";
import { ShopCategoryCard } from "@/components/shop/ShopCategoryCard";
import { ShopCategoryView } from "@/components/shop/ShopCategoryView";
import { Palette, Frame, Image, Puzzle, Sparkles } from "lucide-react";

type ShopView = "home" | "themes" | "frames" | "banners";

export default function Shop() {
  const [currentView, setCurrentView] = useState<ShopView>("home");

  const renderContent = () => {
    if (currentView !== "home") {
      return (
        <ShopCategoryView
          category={currentView}
          onBack={() => setCurrentView("home")}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-orbitron text-2xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,180,255,0.5)]">
                SHOP
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-rajdhani">
              Customize your experience
            </p>
          </div>
          <ShopCurrencyDisplay />
        </div>

        {/* Featured section */}
        <div className="relative p-4 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-card/80 to-primary/5 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-orbitron text-sm font-bold text-primary tracking-wider">
                FEATURED
              </h2>
              <p className="text-xs text-muted-foreground font-rajdhani">
                New items arriving soon
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h2 className="font-orbitron text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">
            Categories
          </h2>
          
          <div className="space-y-3">
            <ShopCategoryCard
              title="Themes"
              description="Transform your entire app experience"
              icon={Palette}
              itemCount={6}
              gradient="from-blue-500/20 to-cyan-500/10"
              onClick={() => setCurrentView("themes")}
            />
            
            <ShopCategoryCard
              title="Avatar Frames"
              description="Stand out with unique profile borders"
              icon={Frame}
              itemCount={6}
              gradient="from-purple-500/20 to-pink-500/10"
              onClick={() => setCurrentView("frames")}
            />
            
            <ShopCategoryCard
              title="Banners"
              description="Personalize your profile header"
              icon={Image}
              itemCount={6}
              gradient="from-amber-500/20 to-orange-500/10"
              onClick={() => setCurrentView("banners")}
            />
            
            <ShopCategoryCard
              title="Modules"
              description="Expand your capabilities"
              icon={Puzzle}
              isComingSoon
              gradient="from-emerald-500/20 to-teal-500/10"
            />
          </div>
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
          <p className="text-xs text-center text-muted-foreground font-rajdhani">
            Earn coins by completing goals and achieving milestones
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <div className="relative z-10 px-4 pt-6 pb-24">
        {renderContent()}
      </div>

      {/* Decorative corner accents */}
      <div className="fixed top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/20 rounded-tl-lg pointer-events-none" />
      <div className="fixed top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/20 rounded-tr-lg pointer-events-none" />

      <Navigation />
    </div>
  );
}
