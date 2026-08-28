import { useEffect, useRef, useState } from "react";
import { Loader2, Target, Trophy, Upload, Video, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { teinteDuPalier } from "@/hooks/useCarteObjectif";
import { useCreateVictoryReel, useCompletedGoals } from "@/hooks/useCommunity";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileSettings } from "@/domaines/profil";

/* PUBLIER UNE VIDEO DE VICTOIRE.
 *
 * Ce formulaire etait le dernier morceau de l ancienne page : un
 * Dialog de la bibliotheque d interface, un Select natif deguise, des
 * libelles en anglais — « Share your victory », « Which goal did you
 * complete? », « Please select a goal and upload a video » — et
 * Orbitron sur son titre. Il s ouvrait par-dessus une page entierement
 * refaite et n en parlait plus la langue.
 *
 * Il est reecrit dans le monde de la page : meme fond, meme filet,
 * meme fonte, memes puces. Et il explique ce qu il demande.
 *
 * TROIS CHOSES QUE L ANCIEN NE FAISAIT PAS.
 *
 * — LA DUREE ETAIT DEVINEE. « let duration = 30 » servait de repli
 *   quand la video n avait pas encore charge ses metadonnees : une
 *   video de deux minutes s enregistrait a trente secondes. On attend
 *   desormais l evenement loadedmetadata, et le formulaire ne se
 *   valide pas avant.
 *
 * — L OBJET DE L URL. La video est deposee dans un depot PRIVE ; on
 *   enregistre son chemin, signe a la lecture. C etait deja le cas,
 *   mais rien ne le disait.
 *
 * — LE REGLAGE DE CONFIDENTIALITE etait verifie APRES l ouverture du
 *   formulaire, au moment de valider : on remplissait tout pour
 *   s entendre dire non. Il est dit d entree.
 */

const POIDS_MAX = 100 * 1024 * 1024;
const LEGENDE_MAX = 280;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateReelModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfileSettings();
  const navigate = useNavigate();

  const fichier = useRef<HTMLInputElement>(null);
  const apercu = useRef<HTMLVideoElement>(null);

  const [objectifId, setObjectifId] = useState("");
  const [legende, setLegende] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [urlApercu, setUrlApercu] = useState<string | null>(null);
  const [duree, setDuree] = useState<number | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [avancement, setAvancement] = useState(0);

  const creer = useCreateVictoryReel();
  const { data: accomplis, isLoading: chargement } = useCompletedGoals();

  const partagePermis = (profile?.share_goals_progress ?? true) !== false;
  const aDesObjectifs = !!accomplis && accomplis.length > 0;

  /* Fermer avec Echap, comme toute fenetre modale. */
  useEffect(() => {
    if (!isOpen) return;
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape" && !envoi) onClose(); };
    document.addEventListener("keydown", echap);
    return () => document.removeEventListener("keydown", echap);
  }, [isOpen, envoi, onClose]);

  /* L URL d apercu est un objet en memoire : il faut la relacher, ou
     le fichier reste retenu tant que l onglet vit. */
  useEffect(() => () => { if (urlApercu) URL.revokeObjectURL(urlApercu); }, [urlApercu]);

  if (!isOpen) return null;

  const viderLaVideo = () => {
    setVideo(null);
    setDuree(null);
    if (urlApercu) { URL.revokeObjectURL(urlApercu); setUrlApercu(null); }
    if (fichier.current) fichier.current.value = "";
  };

  const choisir = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error(t("community.reels.notAVideo", "Ce fichier n'est pas une vidéo"));
      return;
    }
    if (f.size > POIDS_MAX) {
      toast.error(t("community.reels.videoTooHeavy", "La vidéo dépasse 100 Mo"));
      return;
    }
    if (urlApercu) URL.revokeObjectURL(urlApercu);
    setVideo(f);
    setDuree(null);
    setUrlApercu(URL.createObjectURL(f));
  };

  const publier = async () => {
    if (!user || !video || !objectifId || duree === null) return;

    setEnvoi(true);
    setAvancement(10);
    try {
      const extension = video.name.split(".").pop() || "mp4";
      const chemin = `${user.id}/${Date.now()}.${extension}`;

      const { error } = await supabase.storage
        .from("victory-reels")
        .upload(chemin, video, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      setAvancement(75);

      await creer.mutateAsync({
        goal_id: objectifId,
        /* Le nom part avec la video : RLS empeche les autres de lire
           cet objectif, et sans cette copie leur fil afficherait une
           victoire sans dire de quoi elle est la victoire. */
        goal_name: accomplis?.find((g) => g.id === objectifId)?.name ?? null,
        video_url: chemin, // le CHEMIN, pas une URL : le depot est prive
        caption: legende.trim() || undefined,
        duration_seconds: duree,
      });

      setAvancement(100);
      toast.success(t("community.reels.published", "Votre victoire est publiée"));
      viderLaVideo();
      setObjectifId("");
      setLegende("");
      onClose();
    } catch (e) {
      console.error("[reel]", e);
      toast.error(
        e instanceof Error && e.message
          ? e.message
          : t("community.reels.uploadFailed", "Le téléversement de la vidéo a échoué"),
      );
    } finally {
      setEnvoi(false);
      setAvancement(0);
    }
  };

  const pret = !!video && !!objectifId && duree !== null && !envoi;

  return (
    <div className="co co-portail">
      <div className="co-modale-voile" onClick={() => !envoi && onClose()} />
      <div className="co-modale" role="dialog" aria-modal="true" aria-labelledby="co-modale-titre">
        <div className="co-modale-tete">
          <h2 className="co-modale-titre" id="co-modale-titre">
            <Trophy aria-hidden="true" />
            {t("community.reels.createReel", "Créer une vidéo")}
          </h2>
          <button
            type="button"
            className="co-media-retirer"
            style={{ position: "static" }}
            aria-label={t("community.post.cancel", "Annuler")}
            onClick={() => !envoi && onClose()}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="co-modale-corps">
          {!partagePermis ? (
            <div className="co-vide" style={{ padding: "34px 16px" }}>
              <Target aria-hidden="true" />
              <h3>{t("community.reels.privacyBlocked", "Le partage de progression est désactivé")}</h3>
              <p>
                {t(
                  "community.reels.privacyBlockedWhy",
                  "Vos réglages empêchent de rattacher un objectif à une publication. Réactivez « Partager ma progression » pour publier une vidéo de victoire.",
                )}
              </p>
              <a className="co-bouton co-bouton--discret" href="/profile">
                {t("community.reels.openSettings", "Ouvrir mes réglages")}
              </a>
            </div>
          ) : chargement ? (
            <p className="co-choix-message">{t("community.create.loadingGoals", "Chargement…")}</p>
          ) : !aDesObjectifs ? (
            <div className="co-vide" style={{ padding: "34px 16px" }}>
              <Trophy aria-hidden="true" />
              <h3>{t("community.reels.needGoal", "Il faut d'abord mener un objectif à son terme")}</h3>
              <p>
                {t(
                  "community.reels.what",
                  "Une vidéo de victoire est un format vertical, court, rattaché à un objectif que vous avez mené à son terme. C'est la preuve qui accompagne le chiffre.",
                )}
              </p>
              <button
                type="button"
                className="co-bouton co-bouton--discret"
                onClick={() => { onClose(); navigate("/goals"); }}
              >
                {t("community.reels.goToGoals", "Voir mes objectifs")}
              </button>
            </div>
          ) : (
            <>
              <div className="co-champ">
                <label className="co-champ-titre" htmlFor="co-reel-objectif">
                  {t("community.reels.whichGoal", "Quelle victoire racontez-vous ?")}
                </label>
                <div className="co-filtres" style={{ padding: 0, border: "none", gap: 6 }}>
                  {accomplis!.map((g) => {
                    const teinte = teinteDuPalier(g.difficulty);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        id={g.id === objectifId ? "co-reel-objectif" : undefined}
                        className="co-puce"
                        aria-pressed={g.id === objectifId}
                        onClick={() => setObjectifId(g.id)}
                      >
                        <span
                          style={{ width: 7, height: 7, borderRadius: 999, background: teinte.couleur }}
                          aria-hidden="true"
                        />
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="co-champ">
                <span className="co-champ-titre">
                  {t("community.reels.theVideo", "La vidéo")}
                </span>

                <input
                  ref={fichier}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => choisir(e.target.files?.[0])}
                />

                {!urlApercu ? (
                  <button type="button" className="co-depot" onClick={() => fichier.current?.click()}>
                    <Upload aria-hidden="true" />
                    <b>{t("community.reels.pick", "Choisir une vidéo")}</b>
                    <small>{t("community.reels.limits", "Format vertical conseillé · 100 Mo maximum")}</small>
                  </button>
                ) : (
                  <div className="co-composeur-media">
                    <video
                      ref={apercu}
                      src={urlApercu}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ display: "block", width: "100%", maxHeight: 300, background: "#000" }}
                      onLoadedMetadata={(e) => {
                        const d = Math.round(e.currentTarget.duration);
                        setDuree(Number.isFinite(d) && d > 0 ? d : null);
                      }}
                    />
                    <button
                      type="button"
                      className="co-media-retirer"
                      aria-label={t("community.reels.removeVideo", "Retirer la vidéo")}
                      onClick={viderLaVideo}
                    >
                      <X aria-hidden="true" />
                    </button>
                    <p className="co-depot-info">
                      <Video aria-hidden="true" />
                      {duree === null
                        ? t("community.reels.reading", "Lecture du fichier…")
                        : t("community.reels.duration", "{{n}} secondes", { n: duree })}
                    </p>
                  </div>
                )}
              </div>

              <div className="co-champ">
                <label className="co-champ-titre" htmlFor="co-reel-legende">
                  {t("community.reels.caption", "Légende")}
                  <em className="co-champ-option">{t("community.reels.optional", "facultatif")}</em>
                </label>
                <textarea
                  id="co-reel-legende"
                  className="co-composeur-champ"
                  style={{ fontSize: 15, minHeight: 64 }}
                  rows={2}
                  maxLength={LEGENDE_MAX}
                  value={legende}
                  onChange={(e) => setLegende(e.target.value)}
                  placeholder={t("community.reels.captionHint", "Ce qu'il a fallu pour y arriver…")}
                />
              </div>
            </>
          )}
        </div>

        {partagePermis && aDesObjectifs && (
          <div className="co-modale-pied">
            {envoi && (
              <span className="co-jauge" aria-hidden="true">
                <i style={{ width: `${avancement}%` }} />
              </span>
            )}
            <button
              type="button"
              className="co-bouton co-bouton--discret"
              onClick={onClose}
              disabled={envoi}
            >
              {t("community.post.cancel", "Annuler")}
            </button>
            <button type="button" className="co-bouton" onClick={publier} disabled={!pret}>
              {envoi ? <Loader2 className="co-tourne" aria-hidden="true" /> : <Trophy aria-hidden="true" />}
              {envoi
                ? t("community.reels.publishing", "Publication…")
                : t("community.create.post", "Publier")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
