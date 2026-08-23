import { useRef, useState } from "react";
import { CircleCheck, ImagePlus, MessagesSquare, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CommunityPostCard } from "./CommunityPostCard";
import { PostFilters } from "./PostFilters";
import { NATURES, libelleNature, type NaturePost } from "./vocabulaire";
import { Pastille } from "./Pastille";
import { useCadres } from "@/hooks/community/useCadres";
import { ChoixObjectif } from "./ChoixObjectif";
import { ChoixEmoji } from "./ChoixEmoji";
import { deposerMedia, estUnTypeAccepte, retirerMedia, TYPES_ACCEPTES } from "@/lib/communityMedia";
import {
  useCommunityPosts,
  useCreatePost,
  useFilEnDirect,
  type PostFilterType,
  type PostSortOption,
} from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/* LE FIL.
 *
 * Le changement le plus net est le composeur : il est POSE DANS LE
 * FIL, a sa premiere ligne, au lieu d etre cache derriere un bouton
 * qui ouvrait une fenetre. Ecrire est l action principale de la
 * page ; l enfermer dans une modale ajoutait un clic et un
 * changement de contexte a la seule chose qu on vient faire. X,
 * Instagram et Snapchat ouvrent tous les trois sur un champ pret a
 * recevoir. La modale reste pour la video, ou le televersement
 * justifie une focalisation protegee.
 *
 * Le champ grandit avec le texte, annonce ce qu il reste de
 * caracteres a partir du moment ou la limite approche, et se plie
 * des qu il est vide.
 *
 * Cinq animations d entree ont disparu de ce fichier — trois
 * « opacity: 0 » sur le composeur, la liste et l etat vide. Elles
 * laissaient la page blanche dans un onglet d arriere-plan, ou le
 * navigateur suspend les images par seconde. */

const LIMITE = 500;
const SEUIL_ALERTE = 60;

/* Le filtre et le tri viennent de la page : le bloc « Sujets » du
   rail doit pouvoir les poser, et le rail n est pas dans le fil. */
interface Props {
  filtre: PostFilterType;
  onFiltre: (f: PostFilterType) => void;
  tri: PostSortOption;
  onTri: (s: PostSortOption) => void;
}

export function CommunityFeed({ filtre, onFiltre, tri, onTri }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const champ = useRef<HTMLTextAreaElement>(null);

  const [texte, setTexte] = useState("");
  const [nature, setNature] = useState<NaturePost>("reflection");
  const [objectif, setObjectif] = useState<{ id: string; nom: string | null }>({ id: "", nom: null });
  /* Le media est depose des qu il est choisi, pas a la publication :
     on voit l aperçu tout de suite, et une image lourde ne fait pas
     attendre au moment ou l on clique sur Publier. Le chemin est
     garde pour pouvoir la retirer du depot si on change d avis. */
  const [media, setMedia] = useState<{ url: string; chemin: string } | null>(null);
  const [depotEnCours, setDepotEnCours] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const [deploye, setDeploye] = useState(false);

  const { data: profil } = useQuery({
    queryKey: ["my-community-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  /* L abonnement au direct vivait dans useCommunityPosts, un hook de
     requete qui ouvrait un canal. Il a le sien, et c est le fil qui
     l installe. */
  useFilEnDirect();
  const publier = useCreatePost();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommunityPosts(filtre, tri);

  const posts = data?.pages.flatMap((p) => p.posts) || [];
  /* Une requete pour tous les auteurs visibles, et le sien pour le
     composeur. */
  const { data: cadres } = useCadres([...posts.map((p) => p.user_id), user?.id]);
  const monNom = profil?.display_name || t("community.post.you", "Vous");
  const reste = LIMITE - texte.length;

  const grandir = () => {
    const el = champ.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const choisirFichier = async (f: File | undefined) => {
    if (!f || !user) return;
    if (!estUnTypeAccepte(f.type)) {
      toast.error(t("community.create.badType", "Format non accepté : images et GIF seulement"));
      return;
    }
    setDepotEnCours(true);
    try {
      if (media) await retirerMedia(media.chemin);
      const depose = await deposerMedia(f, user.id);
      setMedia(depose);
    } catch (e) {
      const trop = e instanceof Error && e.message === "trop-lourd";
      toast.error(trop
        ? t("community.create.tooHeavy", "Fichier trop lourd (8 Mo maximum)")
        : t("community.create.uploadFailed", "Le dépôt a échoué"));
    } finally {
      setDepotEnCours(false);
      if (fichier.current) fichier.current.value = "";
    }
  };

  const retirerLeMedia = async () => {
    if (!media) return;
    const aRetirer = media.chemin;
    setMedia(null);
    await retirerMedia(aRetirer);
  };

  /* L emoji s insere LA OU EST LE CURSEUR, pas au bout du texte :
     on ajoute souvent un emoji au milieu d une phrase qu on vient
     d ecrire. */
  const insererEmoji = (emoji: string) => {
    const el = champ.current;
    if (!el) { setTexte((t2) => t2 + emoji); return; }
    const debut = el.selectionStart ?? texte.length;
    const fin = el.selectionEnd ?? texte.length;
    const suite = texte.slice(0, debut) + emoji + texte.slice(fin);
    setTexte(suite);
    setDeploye(true);
    requestAnimationFrame(() => {
      el.focus();
      const pos = debut + emoji.length;
      el.setSelectionRange(pos, pos);
      grandir();
    });
  };

  const envoyer = () => {
    const propre = texte.trim();
    /* Une image seule est une publication valable — c est le cas le
       plus courant d un GIF. Le texte n est donc plus obligatoire des
       lors qu il y a un media. */
    if ((!propre && !media) || propre.length > LIMITE) return;
    publier.mutate(
      {
        content: propre,
        post_type: nature,
        goal_id: objectif.id || undefined,
        goal_name: objectif.nom || undefined,
        image_url: media?.url ?? null,
      },
      {
        onSuccess: () => {
          setTexte("");
          setObjectif({ id: "", nom: null });
          setMedia(null);
          setDeploye(false);
          if (champ.current) champ.current.style.height = "auto";
          toast.success(t("community.feed.published", "Publié"));
        },
        onError: () => toast.error(t("community.feed.publishFailed", "La publication a échoué")),
      },
    );
  };

  return (
    <>
      {user && (
        <div className="co-composeur">
          <Pastille identifiant={user.id} nom={monNom} image={profil?.avatar_url} cadre={cadres?.get(user.id)} />

          <div style={{ minWidth: 0 }}>
            <textarea
              ref={champ}
              className="co-composeur-champ"
              value={texte}
              rows={1}
              placeholder={t("community.feed.placeholder", "Quoi de neuf sur ton pacte ?")}
              aria-label={t("community.feed.placeholder", "Quoi de neuf sur ton pacte ?")}
              onFocus={() => setDeploye(true)}
              onChange={(e) => { setTexte(e.target.value); grandir(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); envoyer(); }
              }}
            />

            {(deploye || texte) && (
              <>
                <div className="co-composeur-natures">
                  {NATURES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="co-puce"
                      aria-pressed={nature === n}
                      onClick={() => setNature(n)}
                    >
                      <span className="co-nature" data-nature={n} style={{ gap: 0, fontSize: 0 }} aria-hidden="true" />
                      {libelleNature(n, t)}
                    </button>
                  ))}
                </div>

                {(media || depotEnCours) && (
                  <div className="co-composeur-media">
                    {depotEnCours && !media ? (
                      <span className="co-os" style={{ display: "block", height: 180, borderRadius: 12 }} />
                    ) : (
                      <>
                        <img src={media!.url} alt="" />
                        <button
                          type="button"
                          className="co-media-retirer"
                          aria-label={t("community.create.removeImage", "Retirer l'image")}
                          onClick={retirerLeMedia}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="co-composeur-pied">
                  <input
                    ref={fichier}
                    type="file"
                    accept={TYPES_ACCEPTES.join(",")}
                    hidden
                    onChange={(e) => choisirFichier(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="co-puce"
                    aria-label={t("community.create.addImage", "Ajouter une image ou un GIF")}
                    title={t("community.create.addImage", "Ajouter une image ou un GIF")}
                    disabled={depotEnCours}
                    onClick={() => fichier.current?.click()}
                  >
                    <ImagePlus aria-hidden="true" />
                  </button>

                  <ChoixEmoji onChoisir={insererEmoji} />

                  <ChoixObjectif
                    valeur={objectif.id}
                    onChoisir={(id, nom) => setObjectif({ id, nom })}
                  />

                  {reste <= SEUIL_ALERTE && (
                    <span
                      className="co-composeur-reste"
                      data-proche={reste < 0 ? "depasse" : "oui"}
                      aria-live="polite"
                    >
                      {reste}
                    </span>
                  )}

                  <button
                    type="button"
                    className="co-bouton"
                    style={reste > SEUIL_ALERTE ? { marginLeft: "auto" } : undefined}
                    onClick={envoyer}
                    disabled={(!texte.trim() && !media) || reste < 0 || depotEnCours || publier.isPending}
                  >
                    {publier.isPending
                      ? t("community.create.posting", "Publication…")
                      : t("community.create.post", "Publier")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PostFilters
        activeFilter={filtre}
        onFilterChange={onFiltre}
        activeSort={tri}
        onSortChange={onTri}
      />

      {isLoading ? (
        <div aria-busy="true" aria-label={t("community.feed.loading", "Chargement des publications…")}>
          {[0, 1, 2].map((i) => (
            <div className="co-fantome" key={i}>
              <span className="co-os co-os--rond" />
              <div style={{ display: "grid", gap: 8 }}>
                <span className="co-os" style={{ height: 12, width: "34%" }} />
                <span className="co-os" style={{ height: 12, width: "88%" }} />
                <span className="co-os" style={{ height: 12, width: "62%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <CommunityPostCard key={post.id} post={post} cadre={cadres?.get(post.user_id)} />
          ))}
          {!hasNextPage && posts.length > 2 && (
            <p className="co-fin">
              <CircleCheck aria-hidden="true" style={{ width: 15, height: 15 }} />
              {t("community.feed.end", "Vous êtes à jour")}
            </p>
          )}
          {hasNextPage && (
            <div style={{ padding: 16, textAlign: "center", borderBottom: "1px solid var(--co-filet)" }}>
              <button
                type="button"
                className="co-bouton co-bouton--discret"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? t("community.feed.loading", "Chargement des publications…")
                  : t("community.feed.more", "Voir plus")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="co-vide">
          <MessagesSquare aria-hidden="true" />
          <h3>{t("community.feed.noPostsTitle", "Pas encore de publications")}</h3>
          <p>{t("community.feed.noPostsDesc", "Sois le premier à partager ton parcours")}</p>
          {user && (
            <button type="button" className="co-bouton" onClick={() => champ.current?.focus()}>
              {t("community.feed.createPost", "Créer une publication")}
            </button>
          )}
        </div>
      )}
    </>
  );
}
