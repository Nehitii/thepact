import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Copy, Loader2, AlertTriangle, Check } from "lucide-react";
import { Bouton } from "@/components/profile/console-ui";
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
      <div className="p-4 bg-card/40 border border-primary/30 space-y-3">
        <p className="rg-alerte" data-ton="warn" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Note-les maintenant. Ils ne seront plus jamais affichés : la base
          n’en garde que l’empreinte.
        </p>

        <ul className="grid grid-cols-2 gap-2">
          {codesEnClair.map((c) => (
            <li
              key={c}
              className="font-mono text-sm tracking-[0.14em] text-center py-2 border border-foreground/10 bg-background/60"
            >
              {c}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
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

  /* ── L’ÉTAT COURANT ── */
  return (
    <div className="p-4 bg-card/40 border border-foreground/10 space-y-3">
      <div className="flex items-center gap-3">
        <KeyRound className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-foreground/80">Codes de secours</p>
          <p className="font-mono ds-t-label text-muted-foreground mt-1">
            {enChargement
              ? "Vérification…"
              : restants === null
                ? "État inconnu"
                : restants === 0
                  ? "Aucun code. Sans téléphone, tu ne pourrais plus entrer."
                  : `${restants} code${restants > 1 ? "s" : ""} inutilisé${restants > 1 ? "s" : ""}.`}
          </p>
        </div>
        {restants === 0 && !enChargement && (
          <span className="px-2 py-1 ds-t-label font-mono tracking-widest uppercase border bg-destructive/10 border-destructive/40 text-destructive">
            AUCUN
          </span>
        )}
      </div>

      <p className="font-mono ds-t-label text-muted-foreground leading-relaxed">
        Un code de secours ne remplace pas ton application : il retire le
        second facteur pour te rendre l’accès. Tu le réactives ensuite.
      </p>

      <Bouton onClick={lancer} disabled={occupe}>
        {occupe ? <Loader2 className="animate-spin" /> : <KeyRound />}
        {restants ? "Générer une nouvelle série" : "Générer mes codes"}
      </Bouton>

      {!!restants && (
        <p className="font-mono ds-t-label text-muted-foreground">
          Une nouvelle série annule les {restants} précédents.
        </p>
      )}
    </div>
  );
}
