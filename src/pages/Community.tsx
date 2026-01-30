import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Film, Sparkles } from "lucide-react";
import { CyberBackground } from "@/components/CyberBackground";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { VictoryReelsFeed } from "@/components/community/VictoryReelsFeed";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type CommunityTab = 'feed' | 'reels';

export default function Community() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CommunityTab>('feed');
  
  const tabs: { id: CommunityTab; labelKey: string; icon: typeof Users }[] = [
    { id: 'feed', labelKey: 'community.tabs.feed', icon: Users },
    { id: 'reels', labelKey: 'community.tabs.reels', icon: Film },
  ];
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse" />
            </div>
          </div>
          
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold tracking-wider mb-2">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              {t("community.title")}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("community.subtitle")}
          </p>
        </motion.div>
        
        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm font-medium",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
        
        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'feed' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'feed' ? (
            <CommunityFeed />
          ) : (
            <VictoryReelsFeed />
          )}
        </motion.div>
      </div>
    </div>
  );
}
