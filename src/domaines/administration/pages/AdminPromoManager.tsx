import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket, Plus, Copy, Dices, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/domaines/administration/composants/AdminPageShell";
import { AdminDeleteConfirm } from "@/domaines/administration/composants/AdminDeleteConfirm";
import { logAdminAction } from "@/domaines/administration/hooks/useAdminAudit";
import {
  usePromoCodes, useCreatePromoCode, useUpdatePromoCode, useDeletePromoCode,
} from "@/domaines/boutique";

/**
 * LES CODES PROMOTIONNELS.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CHANGE
 *
 * — UN TABLEAU DE SIX COLONNES pour quatre informations. Sur un
 *   téléphone il débordait, et « Expires : Never » occupait autant de
 *   largeur que le code lui-même. C'est devenu une liste, comme
 *   partout ailleurs dans l'administration.
 *
 * — LA CRÉATION VIVAIT DANS UNE MODALE. Créer un code est le geste
 *   principal de cet écran, pas une exception : le formulaire se
 *   déplie sur place et se referme après.
 *
 * — TOUT ÉTAIT EN ANGLAIS : « New Code », « Reward Type », « Max Uses
 *   (empty = unlimited) », « Copied! », « No promo codes found ».
 *
 * — UN CODE ÉPUISÉ OU EXPIRÉ S'AFFICHAIT COMME LES AUTRES. Ce sont
 *   pourtant les deux seuls états qui expliquent pourquoi quelqu'un
 *   écrit « ton code ne marche pas ».
 * ═══════════════════════════════════════════════════════════════
 */

/* Sans I, O, 0 ni 1 : un code se lit à voix haute et se recopie à la
   main, et les confondre coûte un aller-retour de support. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export default function AdminPromoManager() {
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [usagesMax, setUsagesMax] = useState("");
  const [expire, setExpire] = useState("");

  const { data: codes = [], isLoading } = usePromoCodes();
  const creer = useCreatePromoCode();
  const modifier = useUpdatePromoCode();
  const supprimer = useDeletePromoCode();

  const tirerUnCode = () => {
    let c = "";
    for (let i = 0; i < 8; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    setCode(c);
  };

  const vider = () => {
    setCode(""); setDescription(""); setMontant(""); setUsagesMax(""); setExpire("");
  };

  const enregistrer = async () => {
    if (!code.trim() || !montant) {
      toast.error("Il manque le code ou le montant");
      return;
    }
    const propre = code.trim().toUpperCase();
    await creer.mutateAsync({
      code: propre,
      description: description || undefined,
      reward_type: "bonds",
      reward_amount: parseInt(montant, 10),
      max_uses: usagesMax ? parseInt(usagesMax, 10) : null,
      expires_at: expire || null,
    });
    await logAdminAction("create", "promo_code", undefined, { code: propre });
    vider();
    setOuvert(false);
    toast.success(`Code ${propre} créé`);
  };

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((c) =>
      c.code.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q));
  }, [codes, recherche]);

  const etatDe = (c: (typeof codes)[number]) => {
    if (!c.is_active) return { ton: "dormant", mot: "coupé" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { ton: "alerte", mot: "expiré" };
    if (c.max_uses && c.current_uses >= c.max_uses) return { ton: "alerte", mot: "épuisé" };
    return { ton: "actif", mot: "actif" };
  };

  return (
    <AdminPageShell
      titre="Codes"
      sous="Codes promotionnels et ce qu'ils débloquent"
      icone={<Ticket aria-hidden="true" />}
      action={
        <button type="button" className="ad-geste" data-ton="primaire" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {ouvert ? "Fermer" : "Nouveau code"}
        </button>
      }
    >
      {ouvert && (
        <section className="ad-panneau">
          <header className="ad-panneau-tete">
            <h2 className="ad-panneau-titre">Nouveau code</h2>
          </header>

          <div className="ad-champs">
            <label className="ad-champ">
              <span>Code</span>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ETE2026"
                  maxLength={32}
                />
                <button type="button" className="ad-geste" onClick={tirerUnCode} title="Tirer un code au hasard">
                  <Dices aria-hidden="true" />
                </button>
              </div>
            </label>

            <label className="ad-champ">
              <span>Bonds offerts</span>
              <input type="number" min={1} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="100" />
            </label>

            <label className="ad-champ">
              <span>Usages maximum</span>
              <input type="number" min={1} value={usagesMax} onChange={(e) => setUsagesMax(e.target.value)} placeholder="illimité" />
            </label>

            <label className="ad-champ">
              <span>Expire le</span>
              <input type="datetime-local" value={expire} onChange={(e) => setExpire(e.target.value)} />
            </label>

            <label className="ad-champ ad-champ--large">
              <span>Description — pour vous, jamais montrée</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lancement de la saison 3" />
            </label>
          </div>

          <p className="ad-aide">
            Le tirage évite I, O, 0 et 1 : un code se lit à voix haute et se
            recopie à la main.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ad-geste" data-ton="primaire" onClick={enregistrer} disabled={creer.isPending}>
              <Plus aria-hidden="true" /> {creer.isPending ? "Création…" : "Créer"}
            </button>
            <button type="button" className="ad-geste" onClick={() => { vider(); setOuvert(false); }}>
              Annuler
            </button>
          </div>
        </section>
      )}

      <div className="ad-champ">
        <div style={{ position: "relative" }}>
          <Search
            aria-hidden="true"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, opacity: 0.5 }}
          />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un code ou une description…"
            aria-label="Chercher un code"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="ad-liste" aria-busy="true">
          {[0, 1, 2].map((i) => <span key={i} className="ad-os" style={{ height: 62 }} />)}
        </div>
      ) : filtres.length === 0 ? (
        <div className="ad-vide">
          <Ticket aria-hidden="true" />
          <h3>{recherche ? "Aucun code de ce nom" : "Aucun code pour le moment"}</h3>
          <p>
            {recherche
              ? "La recherche porte sur le code et sur la description."
              : "Un code promotionnel crédite des Bonds à qui le saisit. Créez-en un avec le bouton ci-dessus."}
          </p>
        </div>
      ) : (
        <div className="ad-liste">
          {filtres.map((c) => {
            const etat = etatDe(c);
            return (
              <div key={c.id} className="ad-ligne" data-inactif={!c.is_active}>
                <span className="ad-apercu"><Ticket aria-hidden="true" /></span>

                <span className="ad-ligne-corps">
                  <span
                    className="ad-ligne-nom"
                    style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.06em" }}
                  >
                    {c.code}
                  </span>
                  <span className="ad-ligne-meta">
                    <span className="ad-etat" data-ton={etat.ton}>{etat.mot}</span>
                    <span>+{c.reward_amount} Bonds</span>
                    <span>{c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : ""} usage{c.current_uses > 1 ? "s" : ""}</span>
                    {c.expires_at && <span>jusqu'au {format(new Date(c.expires_at), "d MMM yyyy", { locale: fr })}</span>}
                    {c.description && <span>· {c.description}</span>}
                  </span>
                </span>

                <span className="ad-ligne-gestes">
                  <button
                    type="button" className="ad-icone"
                    aria-label={`Copier ${c.code}`}
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      toast.success(`Code ${c.code} copié`);
                    }}
                  >
                    <Copy aria-hidden="true" />
                  </button>

                  {/* L'interrupteur DIT ce qu'il fait, au lieu d'être une
                      case sans étiquette dans une colonne « Active ». */}
                  <button
                    type="button"
                    className="ad-bascule"
                    aria-pressed={c.is_active}
                    onClick={() => modifier.mutate({ id: c.id, updates: { is_active: !c.is_active } })}
                  >
                    <u aria-hidden="true" />
                    {c.is_active ? "Actif" : "Coupé"}
                  </button>

                  <AdminDeleteConfirm
                    onConfirm={async () => {
                      await supprimer.mutateAsync(c.id);
                      await logAdminAction("delete", "promo_code", c.id, { code: c.code });
                    }}
                    itemName={c.code}
                    itemType="code promotionnel"
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
