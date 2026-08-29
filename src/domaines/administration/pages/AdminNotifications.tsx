import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell, Send, Gift, Loader2, Star, Trophy, Zap, Heart, Info,
  AlertTriangle, History, Megaphone, MessageSquare, ArrowRight,
} from "lucide-react";
import {
  ICONES, CATEGORIES, PRIORITES, TEINTES,
  type Categorie, type Priorite, type Recompense,
} from "@/domaines/administration/logique/vocabulaireDesAvis";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
/* L'APERÇU PARTAGE LA CARTE D'AVIS, IL NE L'EMPRUNTE PLUS. Il
   importait `inbox.css` : l'administration entrait par la fenêtre chez
   le social. Le pourquoi de la coupe est dans `socle/ds/avis.css`. */
import "@/socle/ds/avis.css";
import {
  useAnnuaire, useDiffuser, useJournalAdmin, motDeLErreur,
} from "@/domaines/administration/hooks/useAdminServeur";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/socle/ui/alert-dialog";

/**
 * LA DIFFUSION.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI ÉTAIT FAUX, ET QUI L'EST RESTÉ LONGTEMPS
 *
 * — « ENVOYER À TOUS » ATTEIGNAIT UNE PERSONNE. L'écran énumérait ses
 *   destinataires depuis le navigateur, et `profiles` ne rend qu'une
 *   ligne. Mesuré : 1 sur 4. Corrigé par `diffuser_notification`, qui
 *   énumère côté serveur — voir la migration.
 *
 * — L'ONGLET « MESSAGE » ENVOYAIT UNE NOTIFICATION. Il masquait trois
 *   champs et changeait la couleur du bouton ; la ligne écrite en base
 *   était la même. Promettre un message privé et livrer un avis
 *   système est un mensonge d'interface — et il n'y a pas de
 *   messagerie de masse : on n'écrit qu'à ses alliés. L'onglet part.
 *
 * — L'HISTORIQUE MONTRAIT CE QU'ON AVAIT REÇU. Il lisait
 *   `notifications` sans filtre ; RLS ne rend que les siennes. Il lit
 *   le journal d'administration, qui est l'endroit où cette
 *   information a toujours dû vivre.
 *
 * — L'APERÇU NE RESSEMBLAIT PAS À L'AVIS REÇU. Rond gris, icône au
 *   centre, deux lignes de texte — la boîte de réception dessine tout
 *   autre chose. Il reprend maintenant ses classes.
 * ═══════════════════════════════════════════════════════════════
 */

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [vue, setVue] = useState<"ecrire" | "journal">("ecrire");

  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [categorie, setCategorie] = useState<Categorie>("system");
  const [priorite, setPriorite] = useState<Priorite>("informational");
  const [icone, setIcone] = useState("bell");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  const [avecDon, setAvecDon] = useState(false);
  const [typeDon, setTypeDon] = useState<Recompense>("bonds");
  const [montantDon, setMontantDon] = useState(0);
  const [cosmetiqueDon, setCosmetiqueDon] = useState("");

  const [aTous, setATous] = useState(true);
  const [destinataire, setDestinataire] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  /* La liste venait de `profiles`, qui ne rend que sa propre ligne :
     elle contenait UN nom, et viser quelqu'un d'autre était impossible. */
  const { data: annuaire = [] } = useAnnuaire();
  const { data: journal = [] } = useJournalAdmin(50);
  const diffuser = useDiffuser();

  const { data: cosmetiques = [] } = useQuery({
    queryKey: ["admin-cosmetiques", typeDon],
    queryFn: async () => {
      if (typeDon === "bonds") return [];
      const table = typeDon === "frame" ? "cosmetic_frames"
        : typeDon === "banner" ? "cosmetic_banners" : "cosmetic_titles";
      const champ = typeDon === "title" ? "id, title_text" : "id, name";
      const { data } = await supabase.from(table).select(champ).eq("is_active", true);
      return ((data ?? []) as unknown as Record<string, string>[])
        .map((c) => ({ id: c.id, nom: c.name ?? c.title_text }));
    },
    enabled: avecDon && typeDon !== "bonds",
  });

  const diffusions = journal.filter((l) => l.action === "diffusion");
  const peutEnvoyer = titre.trim().length > 0 && (aTous || !!destinataire);
  const IconeApercu = ICONES[icone] ?? Bell;

  const envoyer = () => {
    diffuser.mutate(
      {
        titre,
        description: texte || undefined,
        categorie,
        priorite,
        icone,
        ctaLabel: ctaLabel || undefined,
        ctaUrl: ctaUrl || undefined,
        recompenseType: avecDon ? typeDon : null,
        recompenseMontant: avecDon && typeDon === "bonds" ? montantDon : null,
        recompenseCosmetique: avecDon && typeDon !== "bonds" ? cosmetiqueDon : null,
        destinataire: aTous ? null : destinataire,
      },
      {
        onSuccess: (r) => {
          toast.success(`Envoyé à ${r.envoyes} personne${r.envoyes > 1 ? "s" : ""}`, {
            description: r.ecartes > 0
              ? `${r.ecartes} écarté${r.ecartes > 1 ? "s" : ""} : cette catégorie est coupée dans leurs réglages.`
              : undefined,
          });
          setTitre(""); setTexte(""); setCtaLabel(""); setCtaUrl("");
          setAvecDon(false); setMontantDon(0); setCosmetiqueDon("");
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
        onError: (e) => toast.error("Envoi refusé", { description: motDeLErreur(e) }),
      },
    );
  };

  return (
    <AdminPageShell
      titre="Diffusion"
      sous="Écrire à tout le monde, ou à une personne"
      icone={<Bell aria-hidden="true" />}
      action={
        vue === "ecrire" ? (
          <button
            type="button" className="ad-geste" data-ton="primaire"
            disabled={!peutEnvoyer || diffuser.isPending}
            onClick={() => setConfirmation(true)}
          >
            {diffuser.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {aTous ? "Envoyer à tout le monde" : "Envoyer à cette personne"}
          </button>
        ) : undefined
      }
    >
      <div className="ad-rail" role="tablist" aria-label="Diffusion">
        <button type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "ecrire"} data-actif={vue === "ecrire"} onClick={() => setVue("ecrire")}>
          <Send aria-hidden="true" /> Écrire
        </button>
        <button type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "journal"} data-actif={vue === "journal"} onClick={() => setVue("journal")}>
          <History aria-hidden="true" /> Envois passés <i>{diffusions.length}</i>
        </button>
      </div>

      {vue === "journal" ? (
        diffusions.length === 0 ? (
          <div className="ad-vide">
            <History aria-hidden="true" />
            <h3>Aucune diffusion</h3>
            <p>
              Ce qui part d'ici est journalisé dans la même transaction que
              l'envoi : la liste ne peut pas être incomplète.
            </p>
          </div>
        ) : (
          <div className="ad-liste">
            {diffusions.map((l) => (
              <div key={l.id} className="ad-ligne">
                <span className="ad-apercu"><Send aria-hidden="true" /></span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{String(l.details?.titre ?? "—")}</span>
                  <span className="ad-ligne-meta">
                    <span className="ad-etat" data-ton="actif">
                      {String(l.details?.envoyes ?? 0)} envoyé(s)
                    </span>
                    {Number(l.details?.ecartes ?? 0) > 0 && (
                      <span className="ad-etat" data-ton="dormant">
                        {String(l.details?.ecartes)} écarté(s)
                      </span>
                    )}
                    <span>{l.details?.cible === "tous" ? "à tous" : "à une personne"}</span>
                    <span>{String(l.details?.categorie ?? "")}</span>
                    <span>{format(new Date(l.quand), "d MMM yyyy, HH:mm", { locale: fr })}</span>
                    <span>{l.qui}</span>
                  </span>
                </span>
                <span />
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <section className="ad-panneau">
            <header className="ad-panneau-tete">
              <h2 className="ad-panneau-titre">Le message</h2>
            </header>

            <div className="ad-champs">
              <label className="ad-champ ad-champ--large">
                <span>Titre — obligatoire</span>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="La saison 3 est ouverte" maxLength={120} />
              </label>

              <label className="ad-champ ad-champ--large">
                <span>Corps</span>
                <textarea value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Deux phrases suffisent. Ce qui est long ne se lit pas dans une boîte de réception." />
              </label>

              <label className="ad-champ">
                <span>Catégorie</span>
                <select value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)}>
                  {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.mot}</option>)}
                </select>
              </label>

              <label className="ad-champ">
                <span>Priorité</span>
                <select value={priorite} onChange={(e) => setPriorite(e.target.value as Priorite)}>
                  {PRIORITES.map((p) => <option key={p.v} value={p.v}>{p.mot}</option>)}
                </select>
              </label>

              <label className="ad-champ">
                <span>Icône</span>
                <select value={icone} onChange={(e) => setIcone(e.target.value)}>
                  {Object.keys(ICONES).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>

              <label className="ad-champ">
                <span>Libellé de l'action</span>
                <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Voir la boutique" />
              </label>

              <label className="ad-champ">
                <span>Où elle mène — chemin interne</span>
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="/shop" />
              </label>
            </div>

            <p className="ad-aide">
              {CATEGORIES.find((c) => c.v === categorie)?.quoi}. Le serveur écarte
              les personnes qui ont coupé cette catégorie, et le compte rendu le
              dira. Le lien doit commencer par « / » : une adresse externe est
              refusée côté base, pas seulement ici.
            </p>
          </section>

          {/* ── La récompense ─────────────────────────────────── */}
          <section className="ad-panneau">
            <header className="ad-panneau-tete">
              <h2 className="ad-panneau-titre">Récompense</h2>
              <button type="button" className="ad-bascule" aria-pressed={avecDon} onClick={() => setAvecDon((v) => !v)}>
                <u aria-hidden="true" />
                {avecDon ? "Attachée" : "Aucune"}
              </button>
            </header>

            {avecDon && (
              <div className="ad-champs">
                <label className="ad-champ">
                  <span>Nature</span>
                  <select
                    value={typeDon}
                    onChange={(e) => { setTypeDon(e.target.value as Recompense); setCosmetiqueDon(""); setMontantDon(0); }}
                  >
                    <option value="bonds">Bonds</option>
                    <option value="frame">Cadre d'avatar</option>
                    <option value="banner">Bannière</option>
                    <option value="title">Titre</option>
                  </select>
                </label>

                {typeDon === "bonds" ? (
                  <label className="ad-champ">
                    <span>Montant</span>
                    <input type="number" min={0} value={montantDon} onChange={(e) => setMontantDon(Number(e.target.value))} />
                  </label>
                ) : (
                  <label className="ad-champ">
                    <span>Lequel</span>
                    <select value={cosmetiqueDon} onChange={(e) => setCosmetiqueDon(e.target.value)}>
                      <option value="">Choisir…</option>
                      {cosmetiques.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
          </section>

          {/* ── Le destinataire ───────────────────────────────── */}
          <section className="ad-panneau">
            <header className="ad-panneau-tete">
              <h2 className="ad-panneau-titre">Destinataire</h2>
              <button type="button" className="ad-bascule" aria-pressed={aTous} onClick={() => setATous((v) => !v)}>
                <u aria-hidden="true" />
                {aTous ? `Tout le monde · ${annuaire.length}` : "Une personne"}
              </button>
            </header>

            {!aTous && (
              <label className="ad-champ">
                <span>Qui</span>
                <select value={destinataire} onChange={(e) => setDestinataire(e.target.value)}>
                  <option value="">Choisir une personne…</option>
                  {annuaire.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.nom}{u.est_admin ? " · admin" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>

          {/* ── L'aperçu, dans la langue de la boîte de réception ──
              Il dessinait un rond gris et deux lignes ; la boîte dessine
              tout autre chose. Un aperçu qui ne ressemble pas au résultat
              ne sert qu'à rassurer. */}
          <section className="ad-panneau">
            <header className="ad-panneau-tete">
              <h2 className="ad-panneau-titre">Ce que la personne verra</h2>
            </header>

            <div className="bx" style={{ padding: 0, width: "100%", gap: 0 }}>
              <article className="bx-avis" data-lu="non" data-agir={ctaLabel ? "oui" : "non"}
                style={{ ["--bx-teinte" as string]: TEINTES[priorite] ?? "var(--ad-signal)" }}>
                <span className="bx-avis-icone"><IconeApercu aria-hidden="true" /></span>
                <div className="bx-avis-corps">
                  <h3 className="bx-avis-titre">{titre || "Titre de l'avis"}</h3>
                  {texte && <p className="bx-avis-texte">{texte}</p>}
                  <div className="bx-avis-pied">
                    <span className="bx-avis-quand">à l'instant</span>
                    {avecDon && (montantDon > 0 || cosmetiqueDon) && (
                      <span className="bx-don">
                        <Gift aria-hidden="true" />
                        {typeDon === "bonds" ? `Récupérer +${montantDon}` : "Récupérer"}
                      </span>
                    )}
                    {ctaLabel && (
                      <span className="bx-avis-aller">
                        {ctaLabel}
                        <ArrowRight aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </div>
                <span />
              </article>
            </div>
          </section>
        </>
      )}

      {/* ÉCRIRE À TOUT LE MONDE NE SE FAIT PAS EN UN CLIC.
          Un envoi ne se rattrape pas : il atterrit chez chacun, et le
          retirer ne le fait pas oublier. */}
      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {aTous
                ? `Envoyer à ${annuaire.length} personne${annuaire.length > 1 ? "s" : ""} ?`
                : "Envoyer cet avis ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              « {titre || "sans titre"} » — catégorie {CATEGORIES.find((c) => c.v === categorie)?.mot},
              priorité {PRIORITES.find((p) => p.v === priorite)?.mot}.
              {aTous && " Ceux qui ont coupé cette catégorie seront écartés, et le compte rendu le dira."}
              {" "}Un avis envoyé ne se reprend pas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={envoyer}>Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}

