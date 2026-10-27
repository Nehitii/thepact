import { useEffect, useRef, useState } from "react";
import { Search, Film, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/socle/supabase/client";

/**
 * LE CHOIX D'UN GIF.
 *
 * ═══════════════════════════════════════════════════════════════
 * LA CLÉ NE DESCEND PAS ICI. Une clé dans le paquet du client est
 * lisible par quiconque ouvre l'onglet réseau, et elle porte le quota de
 * tout le monde. La fonction « gif-search » relaie ; ce composant ne
 * connaît ni la clé ni le fournisseur — Giphy ne répondait pas, on est
 * passé à Tenor sans toucher à une ligne d'ici.
 *
 * UN GIF CHOISI N'EST PAS DÉPOSÉ. Le composeur garde son adresse chez le
 * fournisseur plutôt que d'en recopier huit mégaoctets dans le stockage : un
 * GIF de réaction est un objet qu'on montre, pas qu'on archive. C'est
 * pourquoi le média porte alors un chemin nul — il n'y a rien à
 * effacer si l'on change d'avis.
 *
 * LA RECHERCHE ATTEND QU'ON AIT FINI DE TAPER. Une requête par frappe
 * viderait le quota en une phrase.
 * ═══════════════════════════════════════════════════════════════
 */

interface Gif {
  id: string;
  url: string;
  apercu: string;
  largeur: number;
  hauteur: number;
  titre: string;
}

interface ChoixGifProps {
  onChoisir: (gif: { url: string; titre: string }) => void;
}

export function ChoixGif({ onChoisir }: ChoixGifProps) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [souci, setSouci] = useState<string | null>(null);
  /* Les deux services demandent d'être nommés quand on montre leurs
     images. Le relais dit lequel a répondu — le composeur ne le choisit
     pas, il ne fait que le créditer. */
  const [source, setSource] = useState<"giphy" | "tenor" | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    champ.current?.focus();
    const dehors = (e: MouseEvent) => {
      if (boite.current && !boite.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  /* Une requête par frappe viderait le quota en une phrase : on attend
     que la saisie se pose. Le premier chargement, lui, part tout de
     suite — une grille vide n'apprend pas ce qu'on peut y trouver. */
  useEffect(() => {
    if (!ouvert) return;
    let vivant = true;
    const partir = async () => {
      setEnCours(true);
      setSouci(null);
      try {
        const { data, error } = await supabase.functions.invoke("gif-search", {
          body: { recherche },
        });
        if (!vivant) return;
        if (error) throw error;
        if (data?.error === "cle-absente") {
          setSouci(t("community.gif.cleAbsente", "Le service de GIF n'est pas configuré."));
          setGifs([]);
          return;
        }
        setGifs(Array.isArray(data?.gifs) ? data.gifs : []);
        setSource(data?.source === "tenor" ? "tenor" : data?.source === "giphy" ? "giphy" : null);
      } catch {
        if (vivant) setSouci(t("community.gif.indisponible", "Les GIF sont injoignables pour le moment."));
      } finally {
        if (vivant) setEnCours(false);
      }
    };
    const minuteur = window.setTimeout(partir, recherche ? 380 : 0);
    return () => { vivant = false; window.clearTimeout(minuteur); };
  }, [ouvert, recherche, t]);

  return (
    <div className="co-choix" ref={boite}>
      <button
        type="button"
        className="co-puce"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={t("community.create.gif", "GIF")}
        onClick={() => setOuvert((v) => !v)}
      >
        <Film aria-hidden="true" />
      </button>

      {ouvert && (
        <div className="co-choix-panneau co-gifs">
          <div className="co-choix-recherche">
            <Search aria-hidden="true" />
            <input
              ref={champ}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t("community.gif.chercher", "Chercher un GIF…")}
              aria-label={t("community.gif.chercher", "Chercher un GIF…")}
            />
          </div>

          {souci ? (
            <p className="co-gifs-etat">{souci}</p>
          ) : enCours && gifs.length === 0 ? (
            <p className="co-gifs-etat">
              <Loader2 className="co-gifs-roue" aria-hidden="true" />
              {t("common.loading", "Chargement…")}
            </p>
          ) : gifs.length === 0 ? (
            <p className="co-gifs-etat">{t("community.gif.rien", "Rien sous ce mot.")}</p>
          ) : (
            <div className="co-gifs-grille" role="listbox" aria-label={t("community.create.gif", "GIF")}>
              {gifs.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="co-gif"
                  onClick={() => { onChoisir({ url: g.url, titre: g.titre }); setOuvert(false); }}
                  title={g.titre}
                >
                  <img src={g.apercu} alt={g.titre} loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {source && (
            <p className="co-gifs-source">
              {t("community.gif.source", "Propulsé par {{service}}", {
                service: source === "giphy" ? "GIPHY" : "Tenor",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
