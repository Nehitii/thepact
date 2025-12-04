import { useState } from "react";
import { ProfileMenuCard } from "./ProfileMenuCard";
import { DevilNoteModal } from "./DevilNoteModal";
import { Skull } from "lucide-react";

export function ProfileDevilNote() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ProfileMenuCard
        icon={<Skull className="h-5 w-5 text-destructive" />}
        title="Devil Note"
        description="A warning from beyond"
        variant="destructive"
        isClickOnly
        onClick={() => setModalOpen(true)}
      />
      <DevilNoteModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
