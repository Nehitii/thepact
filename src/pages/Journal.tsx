import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Plus, Feather } from "lucide-react";
import { format } from "date-fns";
import { useJournalEntries, useDeleteJournalEntry, JournalEntry } from "@/hooks/useJournal";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalNewEntryModal } from "@/components/journal/JournalNewEntryModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  
  const { data: entries = [], isLoading } = useJournalEntries(user?.id);
  const deleteEntry = useDeleteJournalEntry();
  
  // Group entries by month/year
  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    
    entries.forEach((entry) => {
      const date = new Date(entry.created_at);
      const key = format(date, "MMMM yyyy");
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    
    return groups;
  }, [entries]);
  
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsNewEntryOpen(true);
  };
  
  const handleDelete = async () => {
    if (!deletingEntryId || !user) return;
    await deleteEntry.mutateAsync({ id: deletingEntryId, userId: user.id });
    setDeletingEntryId(null);
  };
  
  const handleCloseModal = (open: boolean) => {
    setIsNewEntryOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0c1018 0%, #0a0e17 25%, #080b12 50%, #060910 100%)'
    }}>
      {/* Premium cinematic background layers */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep navy gradient orb - top */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full blur-[150px]" 
          style={{ background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.04) 0%, transparent 70%)' }} 
        />
        
        {/* Subtle warm accent - bottom right */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.02) 0%, transparent 70%)' }}
        />
        
        {/* Film grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
        
        {/* Soft vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }} />
        
        {/* Ambient dust particles - barely visible */}
        <div className="absolute inset-0 opacity-[0.02]">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between pt-8 pb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/")}
              className="text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all duration-500 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-light tracking-wide">Back</span>
            </Button>
          </div>
          
          {/* Premium New Entry CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsNewEntryOpen(true)}
              className="relative overflow-visible group h-10 min-h-[40px] px-5 rounded-full border-0 transition-all duration-500 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.25)' }}
              />
              <Plus className="h-4 w-4 mr-2 text-emerald-400/90 shrink-0" />
              <span className="text-emerald-300/90 font-light tracking-wide text-sm leading-none">New Entry</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Title Section - Editorial Style */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center gap-4 mb-3">
            {/* Icon with soft glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-cyan-500/20" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/[0.05] flex items-center justify-center backdrop-blur-sm">
                <Feather className="h-5 w-5 text-cyan-400/80" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-light text-white/90 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Journal
              </h1>
            </div>
          </div>
          <p className="text-base text-slate-500 font-light ml-16 leading-relaxed italic">
            A quiet space for your thoughts and memories
          </p>
        </motion.div>
        
        {/* Content */}
        {isLoading ? (
          <motion.div 
            className="flex items-center justify-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div 
                className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <div className="text-slate-500 font-light text-sm tracking-wide">Loading memories...</div>
            </div>
          </motion.div>
        ) : entries.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full blur-2xl bg-slate-500/10" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/[0.03] flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="h-9 w-9 text-slate-500/60" />
              </div>
            </div>
            <h3 className="text-2xl text-slate-400 font-light mb-3 tracking-tight">No entries yet</h3>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed font-light">
              Your journal is a private space for reflection. Begin recording your memories and thoughts.
            </p>
            <motion.div
              className="mt-8"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setIsNewEntryOpen(true)}
                className="relative overflow-visible group h-11 min-h-[44px] px-6 rounded-full border-0 transition-all duration-500 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)'
                }}
              >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)' }}
                />
                <Plus className="h-4 w-4 mr-2 text-emerald-400/80 shrink-0" />
                <span className="text-emerald-300/80 font-light tracking-wide leading-none">Write your first entry</span>
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-16 pb-16">
            <AnimatePresence mode="wait">
              {Object.entries(groupedEntries).map(([monthYear, monthEntries], groupIndex) => (
                <motion.div 
                  key={monthYear} 
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: groupIndex * 0.1,
                    ease: [0.25, 0.1, 0.25, 1] 
                  }}
                >
                  {/* Month Header - Editorial Style */}
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: groupIndex * 0.1 + 0.1 }}
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    <h2 className="text-sm font-light text-slate-500 tracking-[0.2em] uppercase px-4">
                      {monthYear}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </motion.div>
                  
                  {/* Entries */}
                  <div className="space-y-5">
                    {monthEntries.map((entry, entryIndex) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.5,
                          delay: groupIndex * 0.1 + entryIndex * 0.08,
                          ease: [0.25, 0.1, 0.25, 1]
                        }}
                      >
                        <JournalEntryCard
                          entry={entry}
                          onEdit={handleEdit}
                          onDelete={(id) => setDeletingEntryId(id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* New/Edit Entry Modal */}
      <JournalNewEntryModal
        open={isNewEntryOpen}
        onOpenChange={handleCloseModal}
        userId={user.id}
        editingEntry={editingEntry}
      />
      
      {/* Delete Confirmation - Premium styled */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent className="border border-white/[0.05] shadow-2xl rounded-2xl"
          style={{ background: 'linear-gradient(180deg, rgba(15, 20, 30, 0.98) 0%, rgba(10, 14, 22, 0.98) 100%)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light text-white/90 tracking-tight">Delete Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-light leading-relaxed">
              This entry will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-white/[0.03] border-white/[0.05] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 rounded-xl transition-all duration-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 text-red-400/90 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-300"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
