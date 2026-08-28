import { useEffect, useRef, useState } from "react";
import { Eye, Pause, Play, Target, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReactionButton } from "@/domaines/social/composants/ReactionButton";
import { nomAffichable, REACTIONS, type TypeReaction } from "@/domaines/social/logique/vocabulaire";
import { Pastille } from "@/domaines/social/composants/Pastille";
import {
  VictoryReel,
  useAddReaction,
  useRemoveReaction,
  useIncrementReelView,
} from "@/domaines/social/hooks/useCommunity";
import { useAuth } from "@/socle/contextes/AuthContext";

/* UNE VIDEO DE VICTOIRE — plein cadre, vertical, une a la fois.
 *
 * C est la grammaire de Snapchat et des Reels : la video occupe la
 * surface, l interface se retire sur les bords et repose sur un
 * degrade plutot que sur des boites. Les trois reactions passent en
 * colonne a droite, comme sur les deux references.
 *
 * L objectif celebre s affiche depuis goal_name — la copie figee a la
 * publication — quand la jointure ne rend rien, ce qui est le cas de
 * toutes les videos qui ne sont pas les notres : RLS ne laisse voir
 * que ses propres objectifs. Sans elle, une victoire s affichait sans
 * dire de quoi elle etait la victoire. */

export function VictoryReelCard({ reel, isActive }: { reel: VictoryReel; isActive: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const video = useRef<HTMLVideoElement>(null);
  const [joue, setJoue] = useState(false);
  const [muet, setMuet] = useState(true);
  const [vue, setVue] = useState(false);

  const poser = useAddReaction();
  const retirer = useRemoveReaction();
  const compterVue = useIncrementReelView();

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (isActive) {
      el.play().then(() => setJoue(true)).catch(() => {});
      if (!vue) {
        setVue(true);
        compterVue.mutate(reel.id);
      }
    } else {
      el.pause();
      setJoue(false);
    }
    // compterVue est une mutation stable ; la reinscrire relancerait la vue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, reel.id, vue]);

  const basculerLecture = () => {
    const el = video.current;
    if (!el) return;
    if (joue) { el.pause(); setJoue(false); }
    else { el.play().catch(() => {}); setJoue(true); }
  };

  const basculerReaction = (type: TypeReaction) => {
    if (!user) return;
    if (reel.user_reactions?.includes(type)) retirer.mutate({ reel_id: reel.id, reaction_type: type });
    else poser.mutate({ reel_id: reel.id, reaction_type: type });
  };

  const decouvrable = reel.profile?.community_profile_discoverable ?? true;
  const objectifVisible = reel.profile?.share_goals_progress ?? true;
  const anonyme = t("community.post.anonymous", "Anonyme");
  const nom = decouvrable ? nomAffichable(reel.profile?.display_name, anonyme) : anonyme;
  const objectif = objectifVisible ? reel.goal?.name : null;

  return (
    <div className="co-scene">
      <video
        ref={video}
        src={reel.video_url}
        muted={muet}
        loop
        playsInline
        preload="metadata"
        poster={reel.thumbnail_url || undefined}
        onClick={basculerLecture}
      />

      <div className="co-nav" style={{ top: 12, transform: "none" }}>
        <button type="button" onClick={basculerLecture} aria-label={joue ? t("community.reels.pause", "Pause") : t("community.reels.play", "Lecture")}>
          {joue ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => setMuet((v) => !v)} aria-label={muet ? t("community.reels.unmute", "Activer le son") : t("community.reels.mute", "Couper le son")}>
          {muet ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
      </div>

      <div className="co-scene-cote">
        {REACTIONS.map((type) => (
          <ReactionButton
            key={type}
            type={type}
            count={reel.reactions_count?.[type] ?? 0}
            isActive={!!reel.user_reactions?.includes(type)}
            onToggle={() => basculerReaction(type)}
            variante="scene"
          />
        ))}
        <span className="co-action" style={{ flexDirection: "column", gap: 3, color: "#fff", height: "auto" }}>
          <i className="co-action-rond"><Eye aria-hidden="true" /></i>
          <span>{reel.view_count || 0}</span>
        </span>
      </div>

      <div className="co-scene-bas">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Pastille
            identifiant={decouvrable ? reel.user_id : nom}
            nom={nom}
            image={decouvrable ? reel.profile?.avatar_url : null}
            petite
          />
          <p className="co-scene-titre">{nom}</p>
        </div>

        {objectif && (
          <span className="co-objectif" style={{ marginTop: 0, marginBottom: 8, borderColor: "rgb(255 255 255 / 0.22)", color: "rgb(255 255 255 / 0.9)" }}>
            <Target aria-hidden="true" />
            <b style={{ color: "#fff" }}>{objectif}</b>
          </span>
        )}

        {reel.caption && <p className="co-scene-legende">{reel.caption}</p>}
      </div>
    </div>
  );
}
