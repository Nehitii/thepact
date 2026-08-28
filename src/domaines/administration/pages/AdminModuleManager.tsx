import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Puzzle, Plus, Pencil, TrendingUp, Phone, BookOpen, ListTodo, Heart, Search, Copy, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/socle/supabase/client";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
import { AdminDeleteConfirm } from "@/domaines/administration/composants/AdminDeleteConfirm";
import { logAdminAction } from "@/domaines/administration/hooks/useAdminAudit";

/**
 * LES MODULES DE LA BOUTIQUE.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CHANGE
 *
 * — L'ÉDITION VIVAIT DANS UNE MODALE, par-dessus la liste qu'on
 *   vient de quitter. Modifier un prix demande de voir les autres
 *   prix : le formulaire se déplie EN TÊTE de la liste, qui reste
 *   visible dessous.
 *
 * — « DUPLIQUER » PUBLIAIT LA COPIE. Il créait un doublon actif, en
 *   boutique, nommé « (copy) ». Dupliquer pour ajuster ensuite est le
 *   cas courant ; vendre deux fois le même module est l'accident. La
 *   copie naît coupée.
 *
 * — « COMING SOON » ET « ACTIVE » ÉTAIENT DEUX INTERRUPTEURS SANS
 *   ÉTIQUETTE dans une grille. Ce sont les deux seuls réglages qui
 *   décident si un module se vend : ils portent leur mot.
 *
 * — LES ERREURS ÉTAIENT AVALÉES. Chaque écriture annonçait « Module
 *   saved! » sans regarder si elle avait abouti.
 *
 * — TOUT ÉTAIT EN ANGLAIS.
 * ═══════════════════════════════════════════════════════════════
 */

interface ShopModule {
  id: string;
  key: string;
  name: string;
  description: string | null;
  price_bonds: number;
  price_eur: number | null;
  rarity: string;
  icon_key: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  display_order: number | null;
}

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp,
  "the-call": Phone,
  journal: BookOpen,
  "todo-list": ListTodo,
  "track-health": Heart,
};

const RARETES = ["common", "rare", "epic", "legendary"] as const;

const NOUVEAU: Partial<ShopModule> = {
  key: "", name: "", description: "",
  price_bonds: 2200, price_eur: 19.99,
  rarity: "epic", is_active: true, is_coming_soon: false, display_order: 0,
};

export default function AdminModuleManager() {
  const [modules, setModules] = useState<ShopModule[]>([]);
  const [edition, setEdition] = useState<Partial<ShopModule> | null>(null);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from("shop_modules").select("*").order("display_order");
    if (error) toast.error("Chargement impossible", { description: error.message });
    if (data) setModules(data);
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const enregistrer = async () => {
    if (!edition?.name?.trim() || !edition?.key?.trim()) {
      toast.error("Il manque le nom ou la clé");
      return;
    }
    const ligne = {
      key: edition.key.trim(),
      name: edition.name.trim(),
      description: edition.description || null,
      price_bonds: edition.price_bonds ?? 2200,
      price_eur: edition.price_eur ?? 19.99,
      rarity: edition.rarity || "epic",
      icon_key: edition.icon_key || null,
      is_active: edition.is_active ?? true,
      is_coming_soon: edition.is_coming_soon ?? false,
      display_order: edition.display_order ?? 0,
    };
    const { error } = edition.id
      ? await supabase.from("shop_modules").update(ligne).eq("id", edition.id)
      : await supabase.from("shop_modules").insert(ligne);
    if (error) { toast.error("Enregistrement refusé", { description: error.message }); return; }
    await logAdminAction(edition.id ? "update" : "create", "module", edition.id, { name: ligne.name });
    toast.success(`« ${ligne.name} » enregistré`);
    setEdition(null);
    charger();
  };

  const dupliquer = async (m: ShopModule) => {
    const { id, ...reste } = m;
    const { error } = await supabase.from("shop_modules").insert({
      ...reste,
      name: `${reste.name} (copie)`,
      key: `${reste.key}-copie`,
      is_active: false,
    });
    if (error) { toast.error("Copie refusée", { description: error.message }); return; }
    await logAdminAction("duplicate", "module", id, { name: m.name });
    toast.success(`« ${m.name} » copié`, { description: "La copie est coupée : activez-la quand elle est prête." });
    charger();
  };

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      m.name.toLowerCase().includes(q) || m.key.toLowerCase().includes(q));
  }, [modules, recherche]);

  return (
    <AdminPageShell
      titre="Modules"
      sous="Ce que la boutique vend, et à quel prix"
      icone={<Puzzle aria-hidden="true" />}
      action={
        <button
          type="button" className="ad-geste" data-ton="primaire"
          onClick={() => setEdition(edition ? null : { ...NOUVEAU })}
        >
          {edition ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {edition ? "Fermer" : "Nouveau module"}
        </button>
      }
    >
      {edition && (
        <section className="ad-panneau">
          <header className="ad-panneau-tete">
            <h2 className="ad-panneau-titre">
              {edition.id ? `Modifier « ${edition.name} »` : "Nouveau module"}
            </h2>
          </header>

          <div className="ad-champs">
            <label className="ad-champ">
              <span>Nom</span>
              <input value={edition.name ?? ""} onChange={(e) => setEdition({ ...edition, name: e.target.value })} placeholder="Finance" />
            </label>

            <label className="ad-champ">
              <span>Clé — identifiant technique, figé après création</span>
              <input
                value={edition.key ?? ""}
                onChange={(e) => setEdition({ ...edition, key: e.target.value })}
                placeholder="finance"
                disabled={!!edition.id}
              />
            </label>

            <label className="ad-champ">
              <span>Prix en Bonds</span>
              <input type="number" min={0} value={edition.price_bonds ?? 0}
                onChange={(e) => setEdition({ ...edition, price_bonds: parseInt(e.target.value, 10) || 0 })} />
            </label>

            <label className="ad-champ">
              <span>Prix en euros</span>
              <input type="number" min={0} step="0.01" value={edition.price_eur ?? 0}
                onChange={(e) => setEdition({ ...edition, price_eur: parseFloat(e.target.value) || 0 })} />
            </label>

            <label className="ad-champ">
              <span>Rareté</span>
              <select value={edition.rarity ?? "epic"} onChange={(e) => setEdition({ ...edition, rarity: e.target.value })}>
                {RARETES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>

            <label className="ad-champ">
              <span>Ordre d'affichage</span>
              <input type="number" value={edition.display_order ?? 0}
                onChange={(e) => setEdition({ ...edition, display_order: parseInt(e.target.value, 10) || 0 })} />
            </label>

            <label className="ad-champ ad-champ--large">
              <span>Description — lue en boutique</span>
              <textarea value={edition.description ?? ""} onChange={(e) => setEdition({ ...edition, description: e.target.value })} />
            </label>
          </div>

          {/* LES DEUX SEULS RÉGLAGES QUI DÉCIDENT S'IL SE VEND. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button" className="ad-bascule"
              aria-pressed={edition.is_active ?? true}
              onClick={() => setEdition({ ...edition, is_active: !(edition.is_active ?? true) })}
            >
              <u aria-hidden="true" />
              {(edition.is_active ?? true) ? "En boutique" : "Retiré de la boutique"}
            </button>

            <button
              type="button" className="ad-bascule"
              aria-pressed={edition.is_coming_soon ?? false}
              onClick={() => setEdition({ ...edition, is_coming_soon: !(edition.is_coming_soon ?? false) })}
            >
              <u aria-hidden="true" />
              {edition.is_coming_soon ? "Annoncé, pas encore vendu" : "Vendable"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ad-geste" data-ton="primaire" onClick={enregistrer}>
              Enregistrer
            </button>
            <button type="button" className="ad-geste" onClick={() => setEdition(null)}>Annuler</button>
          </div>
        </section>
      )}

      <div className="ad-champ">
        <div style={{ position: "relative" }}>
          <Search aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, opacity: 0.5 }} />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un module par nom ou par clé…"
            aria-label="Chercher un module"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {chargement ? (
        <div className="ad-liste" aria-busy="true">
          {[0, 1, 2].map((i) => <span key={i} className="ad-os" style={{ height: 62 }} />)}
        </div>
      ) : filtres.length === 0 ? (
        <div className="ad-vide">
          <Puzzle aria-hidden="true" />
          <h3>{recherche ? "Aucun module de ce nom" : "Aucun module"}</h3>
          <p>
            {recherche
              ? "La recherche porte sur le nom et sur la clé technique."
              : "Un module est une partie de l'application qui se vend séparément."}
          </p>
        </div>
      ) : (
        <div className="ad-liste">
          {filtres.map((m) => {
            const Icone = ICONES[m.key] ?? Puzzle;
            return (
              <div key={m.id} className="ad-ligne" data-inactif={!m.is_active}>
                <span className="ad-apercu"><Icone aria-hidden="true" /></span>

                <span className="ad-ligne-corps">
                  <span className="ad-ligne-nom">{m.name}</span>
                  <span className="ad-ligne-meta">
                    {!m.is_active && <span className="ad-etat" data-ton="dormant">retiré</span>}
                    {m.is_coming_soon && <span className="ad-etat" data-ton="veille">annoncé</span>}
                    <span>{m.key}</span>
                    <span>{m.price_bonds} Bonds</span>
                    {m.price_eur != null && <span>{m.price_eur.toFixed(2)} €</span>}
                    <span>{m.rarity}</span>
                  </span>
                </span>

                <span className="ad-ligne-gestes">
                  <button type="button" className="ad-icone" aria-label={`Modifier ${m.name}`} onClick={() => setEdition(m)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <button type="button" className="ad-icone" aria-label={`Dupliquer ${m.name}`} onClick={() => dupliquer(m)}>
                    <Copy aria-hidden="true" />
                  </button>
                  <AdminDeleteConfirm
                    onConfirm={async () => {
                      const { error } = await supabase.from("shop_modules").delete().eq("id", m.id);
                      if (error) { toast.error("Suppression refusée", { description: error.message }); return; }
                      await logAdminAction("delete", "module", m.id, { name: m.name });
                      toast.success(`« ${m.name} » supprimé`);
                      charger();
                    }}
                    itemName={m.name}
                    itemType="module"
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
