import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FinanceImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  onClear: () => void;
  size?: 'sm' | 'md';
}

export function FinanceImageUpload({ currentUrl, onUpload, onClear, size = 'md' }: FinanceImageUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const dimensions = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('finance.imageUpload.tooLarge'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t('finance.imageUpload.invalidType'));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('finance-icons').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('finance-icons').getPublicUrl(path);
      onUpload(publicUrl);
    } catch {
      toast.error(t('finance.imageUpload.failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />

      {currentUrl ? (
        <div className={`relative ${dimensions} rounded-xl overflow-hidden group`}>
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`${dimensions} rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </motion.button>
      )}
    </div>
  );
}
