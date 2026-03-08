import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Loader2, ImageIcon, AlertCircle } from "lucide-react";

export interface ScrapedProduct {
  name: string | null;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  source_url: string;
}

interface ImportFromUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (product: ScrapedProduct) => void;
}

export function ImportFromUrlModal({ open, onOpenChange, onImport }: ImportFromUrlModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScrapedProduct | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scrape-product", {
        body: { url: url.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Extraction failed");

      setPreview(data.data as ScrapedProduct);
    } catch (e: any) {
      setError(e?.message || "Could not extract product data");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!preview) return;
    onImport(preview);
    setUrl("");
    setPreview(null);
    setError(null);
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setUrl("");
      setPreview(null);
      setError(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border-primary/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-primary tracking-wider flex items-center gap-2">
            <Globe className="h-5 w-5" /> Import from URL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">
              Product URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://amazon.com/product/..."
                type="url"
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
              <Button
                onClick={handleFetch}
                disabled={!url.trim() || loading}
                className="shrink-0 font-orbitron text-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "FETCH"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {preview && (
            <div className="rounded-xl border border-primary/20 bg-card/60 overflow-hidden">
              {/* Image preview */}
              {preview.image_url ? (
                <div className="aspect-video bg-muted/20 relative overflow-hidden">
                  <img
                    src={preview.image_url}
                    alt={preview.name || "Product"}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted/10 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}

              <div className="p-4 space-y-2">
                <p className="font-rajdhani font-semibold text-foreground leading-tight">
                  {preview.name || "Unknown product"}
                </p>
                {preview.price !== null && (
                  <p className="font-orbitron text-lg font-bold text-primary">
                    {preview.currency ? `${preview.price} ${preview.currency}` : preview.price}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">{preview.source_url}</p>
              </div>

              <div className="px-4 pb-4">
                <Button onClick={handleImport} className="w-full font-orbitron text-xs tracking-wider">
                  ADD TO WISHLIST
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
