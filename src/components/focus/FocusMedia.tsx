import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2, Check, X, ChevronDown, ChevronUp, Music, Youtube } from "lucide-react";
import { PREF } from "@/lib/preferencesAffichage";

/* LE LIEN AUDIO
 *
 * Le lecteur precedent avait deux defauts, et le second etait le vrai.
 *
 * Il n acceptait que Spotify. Et surtout, replier le lecteur DEMONTAIT
 * l iframe : la musique s arretait. C est ce qui donnait l impression
 * qu il ne fonctionnait pas. Ici l iframe reste montee quoi qu il arrive
 * — on ne change que sa hauteur — et le repli devient ce qu il devrait
 * toujours avoir ete : cacher l image, pas couper le son.
 */

export type SourceMedia = "spotify" | "youtube";

export interface LienMedia {
  source: SourceMedia;
  embed: string;
  titre: string;
}

/** Reconnait Spotify et YouTube sous toutes leurs formes d adresse. */
/* Local : aucun autre fichier ne l'appelle. */
function analyserLien(url: string): LienMedia | null {
  const brut = url.trim();
  if (!brut) return null;

  const spotifyWeb = brut.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album|episode|show)\/([a-zA-Z0-9]+)/,
  );
  const spotifyUri = brut.match(/spotify:(track|playlist|album|episode|show):([a-zA-Z0-9]+)/);
  const sp = spotifyWeb || spotifyUri;
  if (sp) {
    return {
      source: "spotify",
      embed: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?utm_source=generator&theme=0`,
      titre: "Spotify",
    };
  }

  // Une playlist YouTube passe par videoseries, pas par un identifiant
  // de video : la confondre donnait une iframe vide.
  const ytListe = brut.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  const ytVideo = brut.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytVideo) {
    const liste = ytListe ? `&list=${ytListe[1]}` : "";
    return {
      source: "youtube",
      embed: `https://www.youtube-nocookie.com/embed/${ytVideo[1]}?rel=0${liste}`,
      titre: "YouTube",
    };
  }
  if (ytListe && /youtube\.com/.test(brut)) {
    return {
      source: "youtube",
      embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${ytListe[1]}&rel=0`,
      titre: "YouTube",
    };
  }

  return null;
}

/* La cle est PAR UTILISATEUR : deux comptes sur le meme
   navigateur ne se partagent pas un lien colle. La racine vient de
   l inventaire des preferences, qui la recense sans l effacer — un
   lien colle est du contenu saisi, pas de la mise en page. */
function cle(userId?: string) {
  return userId ? `${PREF.FOCUS_MEDIA}.${userId}` : PREF.FOCUS_MEDIA;
}

interface FocusMediaProps {
  userId?: string;
  /** Pendant une session, le lecteur se fait discret. */
  compact?: boolean;
  /** Dans la plaque, l en-tete nomme deja le panneau : le repeter dans
   *  le lecteur donnait « Audio link » deux fois de suite. */
  sansEntete?: boolean;
}

export function FocusMedia({ userId, compact = false, sansEntete = false }: FocusMediaProps) {
  const { t } = useTranslation();
  const stockage = cle(userId);

  const [url, setUrl] = useState("");
  const [enregistre, setEnregistre] = useState<string | null>(null);
  const [edition, setEdition] = useState(false);
  const [replie, setReplie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    try {
      const lu = localStorage.getItem(stockage) ?? localStorage.getItem(`focus-spotify-${userId}`);
      if (lu) { setEnregistre(lu); setUrl(lu); }
    } catch { /* stockage indisponible */ }
  }, [stockage, userId]);

  const lien = enregistre ? analyserLien(enregistre) : null;

  const valider = () => {
    setErreur(null);
    const propre = url.trim();
    if (!propre) {
      setEnregistre(null);
      try { localStorage.removeItem(stockage); } catch { /* ignore */ }
      setEdition(false);
      return;
    }
    if (!analyserLien(propre)) { setErreur(t("focus.media.invalid")); return; }
    try { localStorage.setItem(stockage, propre); } catch { /* ignore */ }
    setEnregistre(propre);
    setEdition(false);
  };

  const retirer = () => {
    setUrl("");
    setEnregistre(null);
    try { localStorage.removeItem(stockage); } catch { /* ignore */ }
    setEdition(false);
  };

  if (!lien && !edition) {
    return (
      <button type="button" className="cyb cyb--or md-appel" onClick={() => setEdition(true)}>
        <Music className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t("focus.media.add")}</span>
      </button>
    );
  }

  if (edition) {
    return (
      <div className="md md-edition">
        {!sansEntete && (
          <div className="md-tete">
            <span className="md-titre">{t("focus.media.link")}</span>
          </div>
        )}
        <div className="md-champ">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") valider(); }}
            placeholder={t("focus.media.paste")}
            aria-label={t("focus.media.paste")}
            autoFocus
          />
          <button type="button" onClick={valider} aria-label={t("common.save")} className="md-ok">
            <Check className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => { setEdition(false); setUrl(enregistre || ""); setErreur(null); }}
            aria-label={t("common.cancel")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {erreur && <p className="md-erreur">{erreur}</p>}
        <p className="md-aide">{t("focus.media.hint")}</p>
      </div>
    );
  }

  const estVideo = lien!.source === "youtube";
  // Replier ne demonte pas l iframe : la lecture continue, seule l image
  // disparait. C est tout l interet d un lecteur sur une page de
  // concentration.
  const hauteur = replie ? 0 : estVideo ? (compact ? 150 : 210) : compact ? 80 : 152;

  return (
    <div className="md" data-source={lien!.source}>
      <div className="md-tete">
        {estVideo ? <Youtube className="h-3.5 w-3.5" aria-hidden="true" />
                  : <Music className="h-3.5 w-3.5" aria-hidden="true" />}
        <span className="md-titre">{lien!.titre}</span>
        <span className="md-fil" aria-hidden="true" />
        <button type="button" onClick={() => setEdition(true)} aria-label={t("focus.media.edit")}>
          <Link2 className="h-3 w-3" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setReplie((v) => !v)}
          aria-expanded={!replie}
          aria-label={replie ? t("focus.media.expand") : t("focus.media.collapse")}
        >
          {replie ? <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  : <ChevronUp className="h-3 w-3" aria-hidden="true" />}
        </button>
        <button type="button" onClick={retirer} aria-label={t("focus.media.remove")} className="md-retirer">
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      <div className="md-cadre" style={{ height: hauteur }}>
        <iframe
          src={lien!.embed}
          title={lien!.titre}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>

      {replie && <p className="md-replie">{t("focus.media.stillPlaying")}</p>}
    </div>
  );
}

export default FocusMedia;
