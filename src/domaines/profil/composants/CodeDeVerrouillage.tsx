import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { Panneau, Reglage, Bouton, ChampTexte } from "@/socle/ds/console-ui";

/**
 * LE CODE DE VERROUILLAGE A CHANGE DE SECTION.
 *
 * Il vivait dans « Regles du pacte », entre l echeance et la difficulte
 * — alors qu il ne regle rien du pacte : il masque le contenu d un
 * objectif a qui regarde l ecran. C est un mecanisme de securite, et sa
 * place est aupres du mot de passe et du second facteur.
 *
 * Il portait aussi la derniere forme etrangere de la console : un
 * `PactSettingsCard`, quand tout le reste est un `Panneau`.
 *
 * CE QU IL NE FAIT PAS. Le code est stocke en clair et rechargé dans le
 * champ, avec un bouton pour le reveler : quelqu un qui regarde ton
 * ecran — ce contre quoi le verrou protege — peut le lire ici. C est un
 * verrou contre le coup d oeil, pas contre quelqu un d assis a ta place.
 * L ecran le dit maintenant plutot que de le laisser croire.
 */
export function CodeDeVerrouillage({ userId }: { userId: string }) {
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [deja, setDeja] = useState(false);

  useEffect(() => {
    let vivant = true;
    (async () => {
      const { data } = await supabase
        .from("profiles").select("goal_unlock_code").eq("id", userId).maybeSingle();
      if (!vivant) return;
      if (data?.goal_unlock_code) { setDeja(true); setCode(data.goal_unlock_code); }
    })();
    return () => { vivant = false; };
  }, [userId]);

  const enregistrer = async () => {
    if (!/^\d{4}$/.test(code)) {
      toast.error("Code invalide", { description: "Quatre chiffres, ni plus ni moins." });
      return;
    }
    setEnCours(true);
    const { error } = await supabase
      .from("profiles").update({ goal_unlock_code: code }).eq("id", userId);
    setEnCours(false);
    if (error) { toast.error("Erreur", { description: error.message }); return; }
    setDeja(true);
    toast.success("Code enregistré", { description: "Tes objectifs verrouillés le demanderont." });
  };

  const retirer = async () => {
    setEnCours(true);
    const { error } = await supabase
      .from("profiles").update({ goal_unlock_code: null }).eq("id", userId);
    setEnCours(false);
    if (error) { toast.error("Erreur", { description: error.message }); return; }
    setDeja(false); setCode(""); setVisible(false);
    toast.success("Code retiré");
  };

  return (
    <Panneau
      code="Code de verrouillage"
      etat={deja ? "posé" : "aucun"}
      ton={deja ? "actif" : "neutre"}
      taille="pleine"
    >
      <Reglage
        nom="Masquer le contenu d’un objectif"
        note={deja
          ? "Ton code est posé. Tu peux le changer ou le retirer."
          : "Choisis un code à quatre chiffres. Une fois posé, tu pourras verrouiller un objectif pour en masquer le contenu."}
        icone={<Lock />}
        large
      >
        <div className="rg-champs">
          <ChampTexte
            etiquette="Code à quatre chiffres"
            type={visible ? "text" : "password"}
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aide="Il protège d’un coup d’œil par-dessus l’épaule, pas de quelqu’un assis à ta place : il se relit ici."
          />
        </div>

        <div className="rg-pied">
          <Bouton role="discret" type="button" onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff /> : <Eye />}
            {visible ? "Masquer" : "Afficher"}
          </Bouton>
          {deja && (
            <Bouton role="danger" onClick={retirer} disabled={enCours}>
              Retirer le code
            </Bouton>
          )}
          <Bouton role="primaire" onClick={enregistrer} disabled={enCours || code.length !== 4}>
            {enCours ? <Loader2 className="animate-spin" /> : <Check />}
            Enregistrer
          </Bouton>
        </div>
      </Reglage>
    </Panneau>
  );
}
