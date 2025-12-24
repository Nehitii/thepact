import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { format } from "date-fns";
import { useJournalEntries, useDeleteJournalEntry, JournalEntry } from "@/hooks/useJournal";
import { JournalEntryCard } from "@/components/journal/JournalEntryCard";
import { JournalNewEntryModal } from "@/components/journal/JournalNewEntryModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
    <div className="min-h-screen pb-20 bg-[#050508] relative overflow-hidden">
      {/* Calm premium background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080f] via-[#050508] to-[#030306]" />
        
        {/* Very subtle vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
        }} />
        
        {/* Minimal grain texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
        }} />
        
        {/* Soft ambient glow - very muted */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/3 rounded-full blur-[150px]" />
      </div>
      
      <div className="max-w-3xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white/40 hover:text-white/70 hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-white/50" />
                <h1 className="text-3xl font-light text-white/90 tracking-wide">
                  Journal
                </h1>
              </div>
              <p className="text-white/40 text-sm mt-1 ml-9 font-light">
                Your cultural memory timeline
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsNewEntryOpen(true)}
            className="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/30 font-light">Loading memories...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-white/20" />
            </div>
            <h3 className="text-xl text-white/60 font-light mb-2">No entries yet</h3>
            <p className="text-white/30 text-sm max-w-sm">
              Your journal is a private space for reflection. Start recording your memories and thoughts.
            </p>
            <Button
              onClick={() => setIsNewEntryOpen(true)}
              className="mt-6 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Write your first entry
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedEntries).map(([monthYear, monthEntries]) => (
              <div key={monthYear} className="space-y-6">
                {/* Month Header */}
                <h2 className="text-lg font-light text-white/50 tracking-widest uppercase border-b border-white/5 pb-3">
                  {monthYear}
                </h2>
                
                {/* Entries */}
                <div className="space-y-4">
                  {monthEntries.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeletingEntryId(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
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
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent className="bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white/90">Delete Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This entry will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Navigation />
    </div>
  );
}
