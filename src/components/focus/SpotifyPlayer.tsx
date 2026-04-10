import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, X, Link, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cyberClip = "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";

interface SpotifyPlayerProps {
  className?: string;
  compact?: boolean;
  userId?: string;
}

function getStorageKey(userId?: string) {
  return userId ? `focus-spotify-${userId}` : "focus-spotify-url";
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  const webMatch = url.match(/open\.spotify\.com\/(track|playlist|album|episode|show)\/([a-zA-Z0-9]+)/);
  if (webMatch) return { type: webMatch[1], id: webMatch[2] };
  const uriMatch = url.match(/spotify:(track|playlist|album|episode|show):([a-zA-Z0-9]+)/);
  if (uriMatch) return { type: uriMatch[1], id: uriMatch[2] };
  return null;
}

export function SpotifyPlayer({ className, compact = false, userId }: SpotifyPlayerProps) {
  const { t } = useTranslation();
  const storageKey = getStorageKey(userId);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setSavedUrl(saved);
      setSpotifyUrl(saved);
    }
  }, [storageKey]);

  const handleSave = () => {
    setError(null);
    if (!spotifyUrl.trim()) {
      setSavedUrl(null);
      localStorage.removeItem(storageKey);
      setIsEditing(false);
      return;
    }
    const extracted = extractSpotifyId(spotifyUrl);
    if (!extracted) {
      setError(t("focus.spotify.invalid"));
      return;
    }
    localStorage.setItem(storageKey, spotifyUrl);
    setSavedUrl(spotifyUrl);
    setIsEditing(false);
  };

  const handleClear = () => {
    setSpotifyUrl("");
    setSavedUrl(null);
    localStorage.removeItem(storageKey);
    setIsEditing(false);
  };

  const extracted = savedUrl ? extractSpotifyId(savedUrl) : null;
  const embedUrl = extracted
    ? `https://open.spotify.com/embed/${extracted.type}/${extracted.id}?utm_source=generator&theme=0`
    : null;

  if (!savedUrl && !isEditing) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4",
          "bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954]",
          "hover:bg-[#1DB954]/20 transition-all text-xs font-mono uppercase tracking-wider",
          "focus-visible:ring-2 focus-visible:ring-[#1DB954]",
          className
        )}
        style={{ clipPath: cyberClip }}
      >
        <Music className="h-4 w-4" />
        {t("focus.spotify.add")}
      </motion.button>
    );
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full p-4 bg-card/60 backdrop-blur border border-border/50 space-y-3", className)}
        style={{ clipPath: cyberClip }}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Music className="h-3.5 w-3.5 text-[#1DB954]" />
          <span>SPOTIFY</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder={t("focus.spotify.paste")}
            className="flex-1 h-9 text-sm bg-background/50"
          />
          <Button size="sm" onClick={handleSave} className="h-9 px-3 bg-[#1DB954] hover:bg-[#1DB954]/80 text-black">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setIsEditing(false); setSpotifyUrl(savedUrl || ""); setError(null); }}
            className="h-9 px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-[10px] text-destructive font-mono">{error}</p>}
        <p className="text-[10px] text-muted-foreground font-mono">{t("focus.spotify.pasteHint")}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("w-full bg-card/60 backdrop-blur border border-border/50 overflow-hidden", className)}
      style={{ clipPath: cyberClip }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-[#1DB954]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Spotify</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary" aria-label="Edit Spotify link">
            <Link className="h-3 w-3" />
          </button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary" aria-label={isCollapsed ? "Expand" : "Collapse"}>
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
          <button onClick={handleClear} className="p-1.5 hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary" aria-label="Remove Spotify link">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {!isCollapsed && embedUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: compact ? 80 : 152, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <iframe
              src={embedUrl}
              width="100%"
              height={compact ? 80 : 152}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
