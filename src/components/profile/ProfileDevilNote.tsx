import { useState } from "react";
import { DevilNoteModal } from "./DevilNoteModal";
import { Skull } from "lucide-react";

export function ProfileDevilNote() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Floating Devil Note Button - Bottom Left */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 left-4 z-40 group"
        aria-label="Devil Note"
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-destructive/20 blur-md group-hover:blur-lg group-hover:bg-destructive/30 transition-all duration-300" />
        
        {/* Button container */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#1a0808]/90 border border-destructive/40 group-hover:border-destructive/60 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]">
          {/* Inner glow */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-destructive/10 to-transparent" />
          
          {/* Skull icon */}
          <Skull className="relative h-5 w-5 text-destructive group-hover:text-red-400 transition-colors duration-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        </div>
      </button>

      <DevilNoteModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
