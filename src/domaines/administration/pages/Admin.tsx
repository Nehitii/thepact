import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Shield, ChevronRight, ScrollText, AlertTriangle } from "lucide-react";
import { supabase } from "@/socle/supabase/client";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
import { SECTIONS_ADMIN } from "@/domaines/administration/composants/sections";
import { useAnnuaire, useJournalAdmin, useRosterAdmin } from "@/domaines/administration/hooks/useAdminServeur";

/**
 * LE CENTRE DE L'ADMINISTRATION.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QU'IL RACONTAIT DE FAUX
 *
 * — « TOTAL USERS : 1 ». Il comptait `profiles`, que la politique de
 *   lecture réduit à sa propre ligne. QUATRIÈME occurrence du même
 *   piège dans ce dépôt, après les conversations privées, la recherche
 *   d'alliés et la diffusion. Il lit maintenant l'annuaire, qui compte
 *   côté serveur.
 *
 * — TROIS ÉCRANS QUI N'EXISTAIENT PAS, sous un repli « à venir » :
 *   « User Manager », « Analytics », « System Settings ». Annoncer ce
 *   qu'on n'a pas dans son propre panneau d'administration n'informe
 *   personne — on sait ce qu'on n'a pas écrit. Les deux premiers
 *   existent d'ailleurs depuis, sous d'autres noms.
 *
 * — UNE VÉRIFICATION D'ADMINISTRATEUR EN DOUBLE, avec sa propre
 *   redirection et son propre message d'erreur, par-dessus celle
 *   d'AdminRoute qui garde déjà la route. Deux gardes pour une porte,
 *   et deux comportements à tenir d'accord.
 *
 * ═══ CE QU'IL DIT MAINTENANT ═══
 *
 * Un centre d'administration sert à savoir où regarder. Il porte donc
 * ce qui APPELLE une décision — combien de comptes, combien de clés,
 * qui dort, ce qui a été fait en dernier — et non un décompte de
 * cosmétiques que la page des cosmétiques affiche déjà.
 * ═══════════════════════════════════════════════════════════════
 */

export default function Admin() {
  const { data: annuaire = [] } = useAnnuaire();
  const { data: roster = [] } = useRosterAdmin();
  const { data: journal = [] } = useJournalAdmin(6);

  /* Les décomptes du catalogue : une requête par table, en tête
     seulement — on ne rapatrie aucune ligne. */
  const { data: compteurs } = useQuery({
    queryKey: ["admin-compteurs"],
    queryFn: async () => {
      const tete = (t: "cosmetic_frames" | "cosmetic_banners" | "cosmetic_titles"
        | "shop_modules" | "bond_packs" | "special_offers" | "promo_codes") =>
        supabase.from(t).select("id", { count: "exact", head: true });
      const [cadres, bannieres, titres, modules, lots, offres, codes] = await Promise.all([
        tete("cosmetic_frames"), tete("cosmetic_banners"), tete("cosmetic_titles"),
        tete("shop_modules"), tete("bond_packs"), tete("special_offers"), tete("promo_codes"),
      ]);
      return {
        cosmetics: (cadres.count ?? 0) + (bannieres.count ?? 0) + (titres.count ?? 0),
        modules: modules.count ?? 0,
        money: (lots.count ?? 0) + (offres.count ?? 0),
        promos: codes.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  const admins = roster.filter((r) => r.role === "admin");

  /* Un compte à pouvoirs qui n'a pas servi depuis deux mois est une clé
     en circulation. C'est la seule alerte que ce centre lève. */
  const dormants = useMemo(() => admins.filter((a) => {
    if (a.c_est_moi) return false;
    if (!a.derniere_connexion) return true;
    return (Date.now() - new Date(a.derniere_connexion).getTime()) / 86_400_000 > 60;
  }), [admins]);

  const sansFacteur = admins.filter((a) => !a.a_un_second_facteur).length;

  const nouveaux = useMemo(() => annuaire.filter((u) => {
    if (!u.inscrit_le) return false;
    return (Date.now() - new Date(u.inscrit_le).getTime()) / 86_400_000 <= 30;
  }).length, [annuaire]);

  return (
    <AdminPageShell
      titre="Centre"
      sous="Ce qui appelle une décision, et ce qui a été fait en dernier"
      icone={<Shield aria-hidden="true" />}
      compteurs={compteurs}
    >
      {dormants.length > 0 && (
        <p className="ad-avis">
          <AlertTriangle aria-hidden="true" />
          <span>
            <b>{dormants.length} compte{dormants.length > 1 ? "s" : ""} d'administrateur
            {dormants.length > 1 ? " dorment" : " dort"}</b> depuis plus de deux mois.
            Une clé à pouvoirs qui ne sert plus reste une clé en circulation.{" "}
            <Link to="/admin/acces" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
              Voir les accès
            </Link>
          </span>
        </p>
      )}

      <div className="ad-mesures">
        <div className="ad-mesure">
          <b>{annuaire.length}</b>
          <span>Comptes</span>
          {nouveaux > 0 && <em>dont {nouveaux} ce mois-ci</em>}
        </div>
        <div className="ad-mesure">
          <b>{admins.length}</b>
          <span>Administrateurs</span>
          {sansFacteur > 0 && <em>{sansFacteur} sans second facteur</em>}
        </div>
        <div className="ad-mesure">
          <b>{compteurs?.cosmetics ?? "—"}</b>
          <span>Cosmétiques</span>
        </div>
        <div className="ad-mesure">
          <b>{journal.length > 0 ? formatDistanceToNow(new Date(journal[0].quand), { locale: fr }) : "—"}</b>
          <span>Dernier acte</span>
          {journal.length > 0 && <em>{journal[0].action} · {journal[0].qui}</em>}
        </div>
      </div>

      <section className="ad-panneau">
        <header className="ad-panneau-tete">
          <h2 className="ad-panneau-titre">Où aller</h2>
        </header>
        <div className="ad-liste">
          {SECTIONS_ADMIN.filter((s) => s.cle !== "centre").map((s) => {
            const Icone = s.icone;
            const n = compteurs?.[s.cle as keyof typeof compteurs];
            return (
              <Link key={s.cle} to={s.href} className="ad-ligne">
                <span className="ad-apercu"><Icone aria-hidden="true" /></span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{s.libelle}</span>
                  <span className="ad-ligne-meta">{s.quoi}</span>
                </span>
                <span className="ad-ligne-gestes">
                  {typeof n === "number" && <span className="ad-ligne-meta">{n}</span>}
                  <ChevronRight aria-hidden="true" style={{ width: 16, height: 16, opacity: 0.5 }} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="ad-panneau">
        <header className="ad-panneau-tete">
          <h2 className="ad-panneau-titre">
            <ScrollText aria-hidden="true" style={{ width: 12, height: 12, display: "inline", marginRight: 6, verticalAlign: -1 }} />
            Derniers actes
          </h2>
          <Link to="/admin/acces" className="ad-onglet" data-actif={false}>Tout voir</Link>
        </header>
        {journal.length === 0 ? (
          <p className="ad-aide">Aucun acte enregistré pour le moment.</p>
        ) : (
          <div className="ad-liste">
            {journal.map((l) => (
              <div key={l.id} className="ad-ligne">
                <span className="ad-apercu"><ScrollText aria-hidden="true" /></span>
                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">
                    {l.action} — {l.cible_type}
                    {l.details?.titre ? ` « ${String(l.details.titre)} »` : ""}
                  </span>
                  <span className="ad-ligne-meta">
                    {l.qui} · il y a {formatDistanceToNow(new Date(l.quand), { locale: fr })}
                    {typeof l.details?.envoyes === "number" && ` · ${l.details.envoyes} destinataire(s)`}
                  </span>
                </span>
                <span />
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
