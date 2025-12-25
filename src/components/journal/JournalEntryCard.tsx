import { format } from "date-fns";
import { JournalEntry, MOOD_CONFIG, JournalMood } from "@/hooks/useJournal";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
}

export function JournalEntryCard({ entry, onEdit, onDelete }: JournalEntryCardProps) {
  const moodConfig = MOOD_CONFIG[entry.mood as JournalMood] || MOOD_CONFIG.reflective;
  const createdDate = new Date(entry.created_at);
  
  return (
    <motion.div 
      className="group relative rounded-[20px] overflow-hidden transition-all duration-500"
      style={{
        background: 'linear-gradient(180deg, rgba(20, 26, 38, 0.6) 0%, rgba(15, 20, 30, 0.5) 100%)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
      whileHover={{ 
        y: -2,
        boxShadow: '0 8px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Glass-like inner border */}
      <div className="absolute inset-[1px] rounded-[19px] pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
          border: '1px solid rgba(255,255,255,0.03)'
        }}
      />
      
      {/* Subtle mood-colored glow on hover */}
      <motion.div 
        className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 0%, ${moodConfig.bgColor.replace('bg-', 'rgba(').replace('/20', ', 0.08)')} 0%, transparent 60%)`
        }}
      />
      
      <div className="relative z-10 p-7">
        {/* Top Row: Mood Icon + Title */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-5">
            {/* Mood Icon - Premium glossy style */}
            <div className="relative shrink-0">
              {/* Soft glow behind icon */}
              <div 
                className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                style={{ 
                  background: moodConfig.bgColor.includes('indigo') ? 'rgba(99, 102, 241, 0.3)' :
                              moodConfig.bgColor.includes('amber') ? 'rgba(245, 158, 11, 0.3)' :
                              moodConfig.bgColor.includes('cyan') ? 'rgba(6, 182, 212, 0.3)' :
                              moodConfig.bgColor.includes('slate') ? 'rgba(100, 116, 139, 0.3)' :
                              moodConfig.bgColor.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' :
                              moodConfig.bgColor.includes('purple') ? 'rgba(139, 92, 246, 0.3)' :
                              moodConfig.bgColor.includes('pink') ? 'rgba(236, 72, 153, 0.3)' :
                              'rgba(59, 130, 246, 0.3)'
                }}
              />
              <div 
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: moodConfig.bgColor.includes('indigo') ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.15) 100%)' :
                              moodConfig.bgColor.includes('amber') ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)' :
                              moodConfig.bgColor.includes('cyan') ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.15) 100%)' :
                              moodConfig.bgColor.includes('slate') ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)' :
                              moodConfig.bgColor.includes('emerald') ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)' :
                              moodConfig.bgColor.includes('purple') ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)' :
                              moodConfig.bgColor.includes('pink') ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.15) 100%)' :
                              'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {moodConfig.icon}
              </div>
            </div>
            
            <div className="pt-1">
              <h3 className="text-xl font-normal text-white/90 tracking-tight leading-tight mb-2"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {entry.title}
              </h3>
              {/* Metadata Row */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500 font-light">{format(createdDate, "EEEE, MMMM d")}</span>
                <span className="text-slate-700">·</span>
                <span 
                  className="capitalize font-light px-2.5 py-0.5 rounded-full text-xs"
                  style={{
                    background: moodConfig.bgColor.includes('indigo') ? 'rgba(99, 102, 241, 0.12)' :
                                moodConfig.bgColor.includes('amber') ? 'rgba(245, 158, 11, 0.12)' :
                                moodConfig.bgColor.includes('cyan') ? 'rgba(6, 182, 212, 0.12)' :
                                moodConfig.bgColor.includes('slate') ? 'rgba(100, 116, 139, 0.12)' :
                                moodConfig.bgColor.includes('emerald') ? 'rgba(16, 185, 129, 0.12)' :
                                moodConfig.bgColor.includes('purple') ? 'rgba(139, 92, 246, 0.12)' :
                                moodConfig.bgColor.includes('pink') ? 'rgba(236, 72, 153, 0.12)' :
                                'rgba(59, 130, 246, 0.12)',
                    color: moodConfig.bgColor.includes('indigo') ? 'rgba(165, 180, 252, 0.9)' :
                           moodConfig.bgColor.includes('amber') ? 'rgba(252, 211, 77, 0.9)' :
                           moodConfig.bgColor.includes('cyan') ? 'rgba(103, 232, 249, 0.9)' :
                           moodConfig.bgColor.includes('slate') ? 'rgba(148, 163, 184, 0.9)' :
                           moodConfig.bgColor.includes('emerald') ? 'rgba(110, 231, 183, 0.9)' :
                           moodConfig.bgColor.includes('purple') ? 'rgba(196, 181, 253, 0.9)' :
                           moodConfig.bgColor.includes('pink') ? 'rgba(249, 168, 212, 0.9)' :
                           'rgba(147, 197, 253, 0.9)'
                  }}
                >
                  {entry.mood}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions - Fade in on hover */}
          <motion.div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={false}
          >
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(entry)}
                className="h-9 w-9 text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] rounded-xl transition-all duration-300"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(entry.id)}
                className="h-9 w-9 text-slate-500 hover:text-red-400/80 hover:bg-red-500/[0.06] rounded-xl transition-all duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        </div>
        
        {/* Main Content */}
        <div 
          className="text-slate-300/80 leading-[1.8] whitespace-pre-wrap text-[15px] font-light max-w-prose"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {entry.content}
        </div>
        
        {/* Life Context - Editorial style */}
        {entry.life_context && (
          <motion.div 
            className="mt-7 pt-5 border-t border-white/[0.04]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-sm text-slate-500/80 italic font-light leading-relaxed">
              "{entry.life_context}"
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
