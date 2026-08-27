import { useState } from "react";
import {
  FlaskConical, Puzzle, Palette, Image as ImageIcon, RefreshCw, Zap,
  AlertTriangle, ChevronDown, TrendingUp, Phone, BookOpen, ListTodo, Heart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  useShopModules, useUserModulePurchases, useShopFrames, useShopBanners, useUserCosmetics,
} from "@/hooks/useShop";
import {
  useAdminForcePurchaseCosmetic, useAdminResetCosmetic,
  useAdminForcePurchaseModule, useAdminResetModule, useAdminResetAll,
} from "@/hooks/useAdminMode";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * LE BANC D'ESSAI.
 *
 * ═══════════════════════════════════════════════════════════════
 * IL S'APPELAIT « ADMIN MODE », ET C'ÉTAIT TROMPEUR
 *
 * Le nom laissait croire à un mode d'administration — un état global,
 * ou une console qui agit sur les comptes des autres. Il n'agit que
 * sur LE VÔTRE : chaque bouton envoie `user.id`, jamais autre chose.
 * C'est un banc d'essai, et il porte enfin ce nom.
 *
 * — « ∞ BONDS (ADMIN) » ANNONÇAIT UN SOLDE QUI N'EXISTE PAS. Le
 *   compte n'a pas de Bonds infinis : c'est la fonction serveur
 *   `admin_grant_cosmetic` qui saute la vérification du solde. La
 *   différence compte, parce que le solde affiché ailleurs, lui, est
 *   vrai. On dit ce qui se passe : les essais ne débitent rien.
 *
 * — « FORCE PURCHASE » ET « RESET » EN ANGLAIS, sur des cartes à
 *   double bordure qui ne ressemblaient à aucun autre écran.
 *
 * — LE PANNEAU DE DIAGNOSTIC RESTE. Il affiche les identifiants bruts
 *   des modules possédés en regard de leurs clés : c'est laid, c'est
 *   fait pour, et c'est ce qu'on regarde quand un module se croit
 *   acheté. Il se replie.
 * ═══════════════════════════════════════════════════════════════
 */

const ICONES_MODULE: Record<string, React.ComponentType<{ className?: string }>> = {
  finance: TrendingUp, "the-call": Phone, journal: BookOpen,
  "todo-list": ListTodo, "track-health": Heart,
};

type Vue = "modules" | "cadres" | "bannieres";

export default function AdminMode() {
  const { user } = useAuth();
  const [vue, setVue] = useState<Vue>("modules");
  const [diagnostic, setDiagnostic] = useState(false);

  const { data: modules = [] } = useShopModules();
  const { data: modulesAchetes = [] } = useUserModulePurchases(user?.id);
  const { data: cadres = [] } = useShopFrames();
  const { data: bannieres = [] } = useShopBanners();
  const { data: mesCosmetiques } = useUserCosmetics(user?.id);

  const acheterCosmetique = useAdminForcePurchaseCosmetic();
  const retirerCosmetique = useAdminResetCosmetic();
  const acheterModule = useAdminForcePurchaseModule();
  const retirerModule = useAdminResetModule();
  const toutRetirer = useAdminResetAll();

  const aLeModule = (id: string) => modulesAchetes.includes(id);
  const aLeCadre = (id: string) => mesCosmetiques?.frames.includes(id) ?? false;
  const aLaBanniere = (id: string) => mesCosmetiques?.banners.includes(id) ?? false;

  const enCours = acheterCosmetique.isPending || retirerCosmetique.isPending
    || acheterModule.isPending || retirerModule.isPending;

  /** Une ligne du banc : possédé ou non, et le geste qui bascule. */
  const Ligne = ({
    id, nom, rarete, prix, possede, apercu, onPrendre, onRendre,
  }: {
    id: string; nom: string; rarete?: string; prix?: number; possede: boolean;
    apercu: React.ReactNode; onPrendre: () => void; onRendre: () => void;
  }) => (
    <div key={id} className="ad-ligne">
      <span className="ad-apercu">{apercu}</span>
      <span className="ad-ligne-corps">
        <span className="ad-ligne-nom">{nom}</span>
        <span className="ad-ligne-meta">
          <span className="ad-etat" data-ton={possede ? "actif" : "dormant"}>
            {possede ? "possédé" : "non possédé"}
          </span>
          {rarete && <span>{rarete}</span>}
          {prix != null && <span>{prix} Bonds</span>}
        </span>
      </span>
      <span className="ad-ligne-gestes">
        {possede ? (
          <button type="button" className="ad-geste" data-ton="danger" disabled={enCours} onClick={onRendre}>
            <RefreshCw aria-hidden="true" /> Rendre
          </button>
        ) : (
          <button type="button" className="ad-geste" disabled={enCours} onClick={onPrendre}>
            <Zap aria-hidden="true" /> Prendre
          </button>
        )}
      </span>
    </div>
  );

  return (
    <AdminPageShell
      titre="Banc d'essai"
      sous="Se débloquer de quoi essayer — sur votre compte, et nulle part ailleurs"
      icone={<FlaskConical aria-hidden="true" />}
      action={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="ad-geste" data-ton="danger">
              <RefreshCw aria-hidden="true" /> Tout rendre
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle aria-hidden="true" style={{ width: 18, height: 18, color: "hsl(var(--ds-accent-warning))" }} />
                Tout rendre ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tous les modules et cosmétiques de <strong>votre compte</strong> seront
                retirés — y compris ceux que vous auriez achetés pour de vrai. Aucun
                autre compte n'est touché.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => user && toutRetirer.mutate({ userId: user.id })}>
                Tout rendre
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      <p className="ad-avis">
        <FlaskConical aria-hidden="true" />
        <span>
          <b>Ce qui se passe ici ne touche que votre compte.</b> Les essais ne
          débitent rien : la fonction serveur saute la vérification du solde,
          elle ne vous crédite pas de Bonds. Votre solde affiché ailleurs reste
          le vrai.
        </span>
      </p>

      <div className="ad-rail" role="tablist" aria-label="Banc d'essai">
        <button type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "modules"} data-actif={vue === "modules"} onClick={() => setVue("modules")}>
          <Puzzle aria-hidden="true" /> Modules <i>{modules.length}</i>
        </button>
        <button type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "cadres"} data-actif={vue === "cadres"} onClick={() => setVue("cadres")}>
          <Palette aria-hidden="true" /> Cadres <i>{cadres.length}</i>
        </button>
        <button type="button" role="tab" className="ad-onglet"
          aria-selected={vue === "bannieres"} data-actif={vue === "bannieres"} onClick={() => setVue("bannieres")}>
          <ImageIcon aria-hidden="true" /> Bannières <i>{bannieres.length}</i>
        </button>
      </div>

      {vue === "modules" && (
        <div className="ad-liste">
          {modules.map((m) => {
            const Icone = ICONES_MODULE[m.key] ?? Puzzle;
            return (
              <Ligne
                key={m.id}
                id={m.id} nom={m.name} rarete={m.rarity} prix={m.price_bonds}
                possede={aLeModule(m.id)}
                apercu={<Icone aria-hidden="true" />}
                onPrendre={() => user && acheterModule.mutate({ userId: user.id, moduleId: m.id })}
                onRendre={() => user && retirerModule.mutate({ userId: user.id, moduleId: m.id })}
              />
            );
          })}
          {modules.length === 0 && (
            <div className="ad-vide"><Puzzle aria-hidden="true" /><h3>Aucun module</h3></div>
          )}
        </div>
      )}

      {vue === "cadres" && (
        <div className="ad-liste">
          {cadres.map((c) => (
            <Ligne
              key={c.id}
              id={c.id} nom={c.name} rarete={c.rarity} prix={c.price}
              possede={aLeCadre(c.id)}
              apercu={
                <span
                  style={{
                    width: 26, height: 26, borderRadius: 8,
                    border: `2px solid ${c.border_color ?? "currentColor"}`,
                    boxShadow: c.glow_color ? `0 0 8px ${c.glow_color}` : undefined,
                  }}
                />
              }
              onPrendre={() => user && acheterCosmetique.mutate({ userId: user.id, cosmeticId: c.id, cosmeticType: "frame" })}
              onRendre={() => user && retirerCosmetique.mutate({ userId: user.id, cosmeticId: c.id })}
            />
          ))}
          {cadres.length === 0 && (
            <div className="ad-vide"><Palette aria-hidden="true" /><h3>Aucun cadre</h3></div>
          )}
        </div>
      )}

      {vue === "bannieres" && (
        <div className="ad-liste">
          {bannieres.map((b) => (
            <Ligne
              key={b.id}
              id={b.id} nom={b.name} rarete={b.rarity} prix={b.price}
              possede={aLaBanniere(b.id)}
              apercu={
                <span
                  style={{
                    width: 30, height: 20, borderRadius: 5,
                    background: `linear-gradient(135deg, ${b.gradient_start ?? "#0a0a12"}, ${b.gradient_end ?? "#1a1a2e"})`,
                  }}
                />
              }
              onPrendre={() => user && acheterCosmetique.mutate({ userId: user.id, cosmeticId: b.id, cosmeticType: "banner" })}
              onRendre={() => user && retirerCosmetique.mutate({ userId: user.id, cosmeticId: b.id })}
            />
          ))}
          {bannieres.length === 0 && (
            <div className="ad-vide"><ImageIcon aria-hidden="true" /><h3>Aucune bannière</h3></div>
          )}
        </div>
      )}

      {/* ── Le diagnostic ────────────────────────────────────────
          Laid par nécessité : c'est ce qu'on regarde quand un module se
          croit acheté. Les identifiants bruts en regard des clés. */}
      <section className="ad-panneau">
        <header className="ad-panneau-tete">
          <h2 className="ad-panneau-titre">Diagnostic — ce que la base dit</h2>
          <button type="button" className="ad-geste" onClick={() => setDiagnostic((v) => !v)}>
            <ChevronDown
              aria-hidden="true"
              style={{ transform: diagnostic ? "rotate(180deg)" : undefined, transition: "transform 160ms" }}
            />
            {diagnostic ? "Replier" : "Déplier"}
          </button>
        </header>

        {diagnostic && (
          <div className="ad-champs">
            <div className="ad-champ">
              <span>Identifiants des modules possédés</span>
              <div
                style={{
                  maxHeight: 130, overflow: "auto", padding: "8px 10px",
                  border: "1px solid var(--ad-trait)", borderRadius: 8,
                  background: "var(--ad-creux)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11,
                }}
              >
                {modulesAchetes.length > 0
                  ? modulesAchetes.map((id) => <div key={id}>{id}</div>)
                  : <span style={{ color: "var(--ad-encre-3)" }}>aucun</span>}
              </div>
            </div>

            <div className="ad-champ">
              <span>Clé du module → possédé ?</span>
              <div
                style={{
                  maxHeight: 130, overflow: "auto", padding: "8px 10px",
                  border: "1px solid var(--ad-trait)", borderRadius: 8,
                  background: "var(--ad-creux)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11,
                }}
              >
                {modules.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "var(--ad-encre-3)" }}>{m.key}</span>
                    <span style={{ color: aLeModule(m.id) ? "var(--ad-vif)" : "var(--ad-alerte)" }}>
                      {aLeModule(m.id) ? "oui" : "non"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
