import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Coins, Gift, Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDeleteConfirm } from "@/components/admin/AdminDeleteConfirm";
import { logAdminAction } from "@/hooks/useAdminAudit";

/**
 * LA MONNAIE : LOTS DE BONDS ET OFFRES SPÉCIALES.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CHANGE
 *
 * — DEUX ÉDITEURS EN MODALE, dont l'un tenait ses onze champs sur une
 *   seule ligne de code. Ils se déplient sur place, au-dessus de leur
 *   liste, qui reste visible : on fixe un prix en regardant les autres.
 *
 * — LES ERREURS ÉTAIENT AVALÉES : « Pack saved! » s'affichait que
 *   l'écriture ait abouti ou non. On regarde avant de féliciter.
 *
 * — UNE OFFRE DATÉE NE DISAIT PAS SON ÉTAT. Une offre dont la fenêtre
 *   est passée reste « active » en base et s'affichait comme les
 *   autres — alors que c'est précisément ce qu'on vient vérifier ici.
 *   Trois états lisibles : à venir, en cours, terminée.
 *
 * — LE BONUS D'UN LOT NE SE VOYAIT PAS. « +20 % » est l'argument de
 *   vente ; il était rangé dans un champ parmi d'autres.
 * ═══════════════════════════════════════════════════════════════
 */

interface BondPack {
  id: string; name: string; bond_amount: number; price_eur: number;
  bonus_percentage: number | null; is_active: boolean; display_order: number | null;
}

interface SpecialOffer {
  id: string; name: string; description: string | null; image_url: string | null;
  price_bonds: number | null; price_eur: number | null;
  original_price_bonds: number | null; original_price_eur: number | null;
  items: unknown | null; starts_at: string | null; ends_at: string | null;
  is_active: boolean; display_order: number | null;
}

type Vue = "lots" | "offres";

const NOUVEAU_LOT: Partial<BondPack> = {
  name: "", bond_amount: 500, price_eur: 4.99, bonus_percentage: 0,
  is_active: true, display_order: 0,
};
const NOUVELLE_OFFRE: Partial<SpecialOffer> = {
  name: "", description: "", price_bonds: null, price_eur: null,
  is_active: true, display_order: 0,
};

/** À venir, en cours, ou terminée — la seule chose qu'on vient vérifier. */
function fenetreDe(o: SpecialOffer): { ton: string; mot: string } {
  if (!o.is_active) return { ton: "dormant", mot: "coupée" };
  const now = Date.now();
  if (o.starts_at && new Date(o.starts_at).getTime() > now) return { ton: "veille", mot: "à venir" };
  if (o.ends_at && new Date(o.ends_at).getTime() < now) return { ton: "alerte", mot: "terminée" };
  return { ton: "actif", mot: "en cours" };
}

export default function AdminMoneyManager() {
  const [vue, setVue] = useState<Vue>("lots");
  const [lots, setLots] = useState<BondPack[]>([]);
  const [offres, setOffres] = useState<SpecialOffer[]>([]);
  const [editionLot, setEditionLot] = useState<Partial<BondPack> | null>(null);
  const [editionOffre, setEditionOffre] = useState<Partial<SpecialOffer> | null>(null);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const [l, o] = await Promise.all([
      supabase.from("bond_packs").select("*").order("display_order"),
      supabase.from("special_offers").select("*").order("display_order"),
    ]);
    if (l.error) toast.error("Lots : chargement impossible", { description: l.error.message });
    if (o.error) toast.error("Offres : chargement impossible", { description: o.error.message });
    if (l.data) setLots(l.data);
    if (o.data) setOffres(o.data);
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const enregistrerLot = async () => {
    if (!editionLot?.name?.trim()) { toast.error("Il manque le nom"); return; }
    const ligne = {
      name: editionLot.name.trim(),
      bond_amount: editionLot.bond_amount ?? 500,
      price_eur: editionLot.price_eur ?? 4.99,
      bonus_percentage: editionLot.bonus_percentage ?? 0,
      is_active: editionLot.is_active ?? true,
      display_order: editionLot.display_order ?? 0,
    };
    const { error } = editionLot.id
      ? await supabase.from("bond_packs").update(ligne).eq("id", editionLot.id)
      : await supabase.from("bond_packs").insert(ligne);
    if (error) { toast.error("Enregistrement refusé", { description: error.message }); return; }
    await logAdminAction(editionLot.id ? "update" : "create", "bond_pack", editionLot.id, { name: ligne.name });
    toast.success(`« ${ligne.name} » enregistré`);
    setEditionLot(null);
    charger();
  };

  const enregistrerOffre = async () => {
    if (!editionOffre?.name?.trim()) { toast.error("Il manque le nom"); return; }
    const ligne = {
      name: editionOffre.name.trim(),
      description: editionOffre.description || null,
      image_url: editionOffre.image_url || null,
      price_bonds: editionOffre.price_bonds ?? null,
      price_eur: editionOffre.price_eur ?? null,
      original_price_bonds: editionOffre.original_price_bonds ?? null,
      original_price_eur: editionOffre.original_price_eur ?? null,
      starts_at: editionOffre.starts_at || null,
      ends_at: editionOffre.ends_at || null,
      is_active: editionOffre.is_active ?? true,
      display_order: editionOffre.display_order ?? 0,
    };
    const { error } = editionOffre.id
      ? await supabase.from("special_offers").update(ligne).eq("id", editionOffre.id)
      : await supabase.from("special_offers").insert(ligne);
    if (error) { toast.error("Enregistrement refusé", { description: error.message }); return; }
    await logAdminAction(editionOffre.id ? "update" : "create", "special_offer", editionOffre.id, { name: ligne.name });
    toast.success(`« ${ligne.name} » enregistrée`);
    setEditionOffre(null);
    charger();
  };

  const ouvrirNouveau = () => {
    if (vue === "lots") { setEditionOffre(null); setEditionLot(editionLot ? null : { ...NOUVEAU_LOT }); }
    else { setEditionLot(null); setEditionOffre(editionOffre ? null : { ...NOUVELLE_OFFRE }); }
  };

  const enEdition = vue === "lots" ? !!editionLot : !!editionOffre;

  return (
    <AdminPageShell
      titre="Monnaie"
      sous="Lots de Bonds et offres spéciales"
      icone={<Coins aria-hidden="true" />}
      action={
        <button type="button" className="ad-geste" data-ton="primaire" onClick={ouvrirNouveau}>
          {enEdition ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {enEdition ? "Fermer" : vue === "lots" ? "Nouveau lot" : "Nouvelle offre"}
        </button>
      }
    >
      <div className="ad-rail" role="tablist" aria-label="Monnaie">
        <button
          type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "lots"} data-actif={vue === "lots"}
          onClick={() => setVue("lots")}
        >
          <Coins aria-hidden="true" /> Lots de Bonds <i>{lots.length}</i>
        </button>
        <button
          type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "offres"} data-actif={vue === "offres"}
          onClick={() => setVue("offres")}
        >
          <Gift aria-hidden="true" /> Offres spéciales <i>{offres.length}</i>
        </button>
      </div>

      {/* ── Les lots ─────────────────────────────────────────── */}
      {vue === "lots" && (
        <>
          {editionLot && (
            <section className="ad-panneau">
              <header className="ad-panneau-tete">
                <h2 className="ad-panneau-titre">
                  {editionLot.id ? `Modifier « ${editionLot.name} »` : "Nouveau lot"}
                </h2>
              </header>
              <div className="ad-champs">
                <label className="ad-champ">
                  <span>Nom</span>
                  <input value={editionLot.name ?? ""} onChange={(e) => setEditionLot({ ...editionLot, name: e.target.value })} placeholder="Poignée de Bonds" />
                </label>
                <label className="ad-champ">
                  <span>Bonds livrés</span>
                  <input type="number" min={1} value={editionLot.bond_amount ?? 0}
                    onChange={(e) => setEditionLot({ ...editionLot, bond_amount: parseInt(e.target.value, 10) || 0 })} />
                </label>
                <label className="ad-champ">
                  <span>Prix en euros</span>
                  <input type="number" min={0} step="0.01" value={editionLot.price_eur ?? 0}
                    onChange={(e) => setEditionLot({ ...editionLot, price_eur: parseFloat(e.target.value) || 0 })} />
                </label>
                <label className="ad-champ">
                  <span>Bonus en %</span>
                  <input type="number" min={0} value={editionLot.bonus_percentage ?? 0}
                    onChange={(e) => setEditionLot({ ...editionLot, bonus_percentage: parseInt(e.target.value, 10) || 0 })} />
                </label>
                <label className="ad-champ">
                  <span>Ordre d'affichage</span>
                  <input type="number" value={editionLot.display_order ?? 0}
                    onChange={(e) => setEditionLot({ ...editionLot, display_order: parseInt(e.target.value, 10) || 0 })} />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="ad-bascule" aria-pressed={editionLot.is_active ?? true}
                  onClick={() => setEditionLot({ ...editionLot, is_active: !(editionLot.is_active ?? true) })}>
                  <u aria-hidden="true" />
                  {(editionLot.is_active ?? true) ? "En vente" : "Retiré de la vente"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ad-geste" data-ton="primaire" onClick={enregistrerLot}>Enregistrer</button>
                <button type="button" className="ad-geste" onClick={() => setEditionLot(null)}>Annuler</button>
              </div>
            </section>
          )}

          {chargement ? (
            <div className="ad-liste" aria-busy="true">
              {[0, 1].map((i) => <span key={i} className="ad-os" style={{ height: 62 }} />)}
            </div>
          ) : lots.length === 0 ? (
            <div className="ad-vide">
              <Coins aria-hidden="true" />
              <h3>Aucun lot</h3>
              <p>Un lot vend des Bonds contre de l'argent. Sans lot, la boutique n'a rien à proposer.</p>
            </div>
          ) : (
            <div className="ad-liste">
              {lots.map((l) => (
                <div key={l.id} className="ad-ligne" data-inactif={!l.is_active}>
                  <span className="ad-apercu"><Coins aria-hidden="true" /></span>
                  <span className="ad-ligne-corps">
                    <span className="ad-ligne-nom">{l.name}</span>
                    <span className="ad-ligne-meta">
                      {!l.is_active && <span className="ad-etat" data-ton="dormant">retiré</span>}
                      {!!l.bonus_percentage && <span className="ad-etat" data-ton="actif">+{l.bonus_percentage} %</span>}
                      <span>{l.bond_amount} Bonds</span>
                      <span>{l.price_eur.toFixed(2)} €</span>
                    </span>
                  </span>
                  <span className="ad-ligne-gestes">
                    <button type="button" className="ad-icone" aria-label={`Modifier ${l.name}`} onClick={() => setEditionLot(l)}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <AdminDeleteConfirm
                      onConfirm={async () => {
                        const { error } = await supabase.from("bond_packs").delete().eq("id", l.id);
                        if (error) { toast.error("Suppression refusée", { description: error.message }); return; }
                        await logAdminAction("delete", "bond_pack", l.id, { name: l.name });
                        toast.success(`« ${l.name} » supprimé`);
                        charger();
                      }}
                      itemName={l.name}
                      itemType="lot de Bonds"
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Les offres ───────────────────────────────────────── */}
      {vue === "offres" && (
        <>
          {editionOffre && (
            <section className="ad-panneau">
              <header className="ad-panneau-tete">
                <h2 className="ad-panneau-titre">
                  {editionOffre.id ? `Modifier « ${editionOffre.name} »` : "Nouvelle offre"}
                </h2>
              </header>
              <div className="ad-champs">
                <label className="ad-champ">
                  <span>Nom</span>
                  <input value={editionOffre.name ?? ""} onChange={(e) => setEditionOffre({ ...editionOffre, name: e.target.value })} />
                </label>
                <label className="ad-champ">
                  <span>Prix en Bonds</span>
                  <input type="number" min={0} value={editionOffre.price_bonds ?? ""}
                    onChange={(e) => setEditionOffre({ ...editionOffre, price_bonds: e.target.value ? parseInt(e.target.value, 10) : null })} />
                </label>
                <label className="ad-champ">
                  <span>Prix en euros</span>
                  <input type="number" min={0} step="0.01" value={editionOffre.price_eur ?? ""}
                    onChange={(e) => setEditionOffre({ ...editionOffre, price_eur: e.target.value ? parseFloat(e.target.value) : null })} />
                </label>
                <label className="ad-champ">
                  <span>Prix barré en Bonds</span>
                  <input type="number" min={0} value={editionOffre.original_price_bonds ?? ""}
                    onChange={(e) => setEditionOffre({ ...editionOffre, original_price_bonds: e.target.value ? parseInt(e.target.value, 10) : null })} />
                </label>
                <label className="ad-champ">
                  <span>Ouvre le</span>
                  <input type="datetime-local" value={(editionOffre.starts_at ?? "").slice(0, 16)}
                    onChange={(e) => setEditionOffre({ ...editionOffre, starts_at: e.target.value || null })} />
                </label>
                <label className="ad-champ">
                  <span>Ferme le</span>
                  <input type="datetime-local" value={(editionOffre.ends_at ?? "").slice(0, 16)}
                    onChange={(e) => setEditionOffre({ ...editionOffre, ends_at: e.target.value || null })} />
                </label>
                <label className="ad-champ ad-champ--large">
                  <span>Description — lue en boutique</span>
                  <textarea value={editionOffre.description ?? ""}
                    onChange={(e) => setEditionOffre({ ...editionOffre, description: e.target.value })} />
                </label>
              </div>
              <p className="ad-aide">
                Sans date, l'offre reste ouverte tant qu'elle est active. Avec des
                dates, elle s'ouvre et se ferme seule — la liste dit alors où elle
                en est.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="ad-bascule" aria-pressed={editionOffre.is_active ?? true}
                  onClick={() => setEditionOffre({ ...editionOffre, is_active: !(editionOffre.is_active ?? true) })}>
                  <u aria-hidden="true" />
                  {(editionOffre.is_active ?? true) ? "Active" : "Coupée"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="ad-geste" data-ton="primaire" onClick={enregistrerOffre}>Enregistrer</button>
                <button type="button" className="ad-geste" onClick={() => setEditionOffre(null)}>Annuler</button>
              </div>
            </section>
          )}

          {chargement ? (
            <div className="ad-liste" aria-busy="true">
              {[0, 1].map((i) => <span key={i} className="ad-os" style={{ height: 62 }} />)}
            </div>
          ) : offres.length === 0 ? (
            <div className="ad-vide">
              <Gift aria-hidden="true" />
              <h3>Aucune offre</h3>
              <p>Une offre spéciale est un lot à prix réduit, généralement sur une fenêtre de temps.</p>
            </div>
          ) : (
            <div className="ad-liste">
              {offres.map((o) => {
                const f = fenetreDe(o);
                return (
                  <div key={o.id} className="ad-ligne" data-inactif={!o.is_active}>
                    <span className="ad-apercu">
                      {o.image_url ? <img src={o.image_url} alt="" loading="lazy" /> : <Gift aria-hidden="true" />}
                    </span>
                    <span className="ad-ligne-corps">
                      <span className="ad-ligne-nom">{o.name}</span>
                      <span className="ad-ligne-meta">
                        <span className="ad-etat" data-ton={f.ton}>{f.mot}</span>
                        {o.price_bonds != null && <span>{o.price_bonds} Bonds</span>}
                        {o.price_eur != null && <span>{o.price_eur.toFixed(2)} €</span>}
                        {o.ends_at && <span>jusqu'au {format(new Date(o.ends_at), "d MMM yyyy", { locale: fr })}</span>}
                      </span>
                    </span>
                    <span className="ad-ligne-gestes">
                      <button type="button" className="ad-icone" aria-label={`Modifier ${o.name}`} onClick={() => setEditionOffre(o)}>
                        <Pencil aria-hidden="true" />
                      </button>
                      <AdminDeleteConfirm
                        onConfirm={async () => {
                          const { error } = await supabase.from("special_offers").delete().eq("id", o.id);
                          if (error) { toast.error("Suppression refusée", { description: error.message }); return; }
                          await logAdminAction("delete", "special_offer", o.id, { name: o.name });
                          toast.success(`« ${o.name} » supprimée`);
                          charger();
                        }}
                        itemName={o.name}
                        itemType="offre spéciale"
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
