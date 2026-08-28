import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Copy, Loader2, AlertTriangle, Check } from "lucide-react";
import { Bouton, Reglage } from "@/components/ds/console-ui";
import "@/domaines/profil/mfa.css";
import { useCodesDeSecours, motifLisible } from "@/hooks/useCodesDeSecours";

/**
 * Les codes de secours, dans l ecran du second facteur.
 *
 * Ils ne s affichent qu une fois : la fonction ne les rend en clair que
 * dans la reponse qui les cree, et la base n en garde que l empreinte.
 * L ecran le dit avant de les montrer, pas apres.
 */
export function CodesDeSecours({ actif }: { actif: boolean }) {
  const { restants, enChargement, codesEnClair, oublierLesCodes, generer } = useCodesDeSecours(actif);
  const [occupe, setOccupe] = useState(false);
  const [copie, setCopie] = useState(false);

  if (!actif) return null;

  const lancer = async () => {
    setOccupe(true);
    try {
      await generer();
    } catch (e) {
      toast.error("Génération impossible", {
        description: motifLisible(e instanceof Error ? e.message : String(e)),
      });
    } finally {
      setOccupe(false);
    }
  };

  const copier = async () => {
    if (!codesEnClair) return;
    try {
      await navigator.clipboard.writeText(codesEnClair.join("\n"));
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      toast.error("Copie impossible", { description: "Recopie-les à la main." });
    }
  };

  /* ── LES CODES, MONTRÉS UNE SEULE FOIS ── */
  if (codesEnClair) {
    return (
      <div className="mfa-codes">
        <p className="rg-alerte" data-ton="warn" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Note-les maintenant. Ils ne seront plus jamais affichés : la base
          n’en garde que l’empreinte.
        </p>

        <ul className="mfa-serie">
          {codesEnClair.map((c) => <li key={c}>{c}</li>)}
        </ul>

        <div className="mfa-gestes">
          <Bouton role="primaire" onClick={copier}>
            {copie ? <Check /> : <Copy />}
            {copie ? "Copiés" : "Copier les huit"}
          </Bouton>
          <Bouton role="discret" onClick={oublierLesCodes}>
            J’ai fini
          </Bouton>
        </div>
      </div>
    );
  }

  /* ── L’ÉTAT COURANT ──
     Une ligne de reglage, comme tout le reste de la console. Elle se
     dessinait sa propre carte a l interieur du panneau qui la
     contient deja — une carte dans une carte. */
  return (
    <Reglage
      nom="Codes de secours"
      note={
        enChargement
          ? "Vérification…"
          : restants === null
            ? "État inconnu."
            : restants === 0
              ? "Aucun code. Sans ton téléphone, tu ne pourrais plus entrer."
              : `${restants} code${restants > 1 ? "s" : ""} inutilisé${restants > 1 ? "s" : ""}. Une nouvelle série annule les précédents.`
      }
      icone={<KeyRound aria-hidden="true" />}
    >
      <Bouton
        role={restants === 0 && !enChargement ? "primaire" : "normal"}
        onClick={lancer}
        disabled={occupe}
      >
        {occupe ? <Loader2 className="animate-spin" /> : <KeyRound />}
        {restants ? "Renouveler" : "Générer"}
      </Bouton>
    </Reglage>
  );
}
