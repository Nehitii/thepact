import { useState } from "react";
import { DevilNoteModal } from "./DevilNoteModal";
import { Skull } from "lucide-react";

export function ProfileDevilNote() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 text-xs font-rajdhani tracking-wide group relative"
        aria-label="Devil Note"
      >
        {/* Demonic glow aura - hidden by default, revealed on hover */}
        <div className="absolute inset-0 -m-2 rounded-full bg-gradient-to-r from-red-900/0 via-destructive/0 to-red-900/0 group-hover:from-red-900/20 group-hover:via-destructive/30 group-hover:to-red-900/20 blur-md transition-all duration-500" />
        
        {/* Inner demonic container */}
        <div className="relative flex items-center gap-2 px-2 py-1 rounded transition-all duration-300
          group-hover:bg-[#1a0505]/40">
          
          {/* Skull icon with demonic styling */}
          <div className="relative">
            {/* Pulsing dark aura */}
            <div className="absolute inset-0 -m-1 rounded-full bg-gradient-radial from-destructive/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
            
            {/* Skull */}
            <Skull className="relative h-3.5 w-3.5 text-destructive/50 group-hover:text-destructive transition-all duration-300 
              group-hover:drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]
              group-hover:animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
          
          {/* Text with arcane feel */}
          <span className="text-destructive/40 group-hover:text-destructive/80 transition-colors duration-300
            group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]
            font-light italic">
            Devil Note
          </span>
        </div>
      </button>

      <DevilNoteModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
