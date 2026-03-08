import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, X, Link, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpotifyPlayerProps {
  className?: string;
  compact?: boolean;
}

const STORAGE_KEY = "focus-spotify-url";

function extractSpotifyId(url: string): { type: string; id: string } | null {
  // Match patterns like:
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3
  // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  const webMatch = url.match(/open\.spotify\.com\/(track|playlist|album|episode|show)\/([a-zA-Z0-9]+)/);
  if (webMatch) {
    return { type: webMatch[1], id: webMatch[2] };
  }
  
  const uriMatch = url.match(/spotify:(track|playlist|album|episode|show):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { type: uriMatch[1], id: uriMatch[2] };
  }
  
  return null;
}

export function SpotifyPlayer({ className, compact = false }: SpotifyPlayerProps) {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved URL on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedUrl(saved);
      setSpotifyUrl(saved);
    }
  }, []);

  const handleSave = () => {
    setError(null);
    
    if (!spotifyUrl.trim()) {
      setSavedUrl(null);
      localStorage.removeItem(STORAGE_KEY);
      setIsEditing(false);
      return;
    }

    const extracted = extractSpotifyId(spotifyUrl);
    if (!extracted) {
      setError("URL Spotify invalide");
      return;
    }

    localStorage.setItem(STORAGE_KEY, spotifyUrl);
    setSavedUrl(spotifyUrl);
    setIsEditing(false);
  };

  const handleClear = () => {
    setSpotifyUrl("");
    setSavedUrl(null);
    localStorage.removeItem(STORAGE_KEY);
    setIsEditing(false);
  };

  const extracted = savedUrl ? extractSpotifyId(savedUrl) : null;
  const embedUrl = extracted 
    ? `https://open.spotify.com/embed/${extracted.type}/${extracted.id}?utm_source=generator&theme=0`
    : null;

  // No saved URL - show setup prompt
  if (!savedUrl && !isEditing) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
          "bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954]",
          "hover:bg-[#1DB954]/20 transition-all text-xs font-mono uppercase tracking-wider",
          className
        )}
      >
        <Music className="h-4 w-4" />
        Ajouter Spotify
      </motion.button>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 space-y-3",
          className
        )}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Music className="h-3.5 w-3.5 text-[#1DB954]" />
          <span>SPOTIFY</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="Coller l'URL Spotify..."
            className="flex-1 h-9 text-sm bg-background/50"
          />
          <Button
            size="sm"
            onClick={handleSave}
            className="h-9 px-3 bg-[#1DB954] hover:bg-[#1DB954]/80 text-black"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setSpotifyUrl(savedUrl || "");
              setError(null);
            }}
            className="h-9 px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-[10px] text-destructive font-mono">{error}</p>
        )}

        <p className="text-[10px] text-muted-foreground font-mono">
          Colle l'URL d'une playlist, album ou track Spotify
        </p>
      </motion.div>
    );
  }

  // Player mode
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "w-full rounded-xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Music className="h-3.5 w-3.5 text-[#1DB954]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Spotify
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Link className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Embed */}
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
              className="rounded-b-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
