import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Check, Globe, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { ChampImage } from "@/domaines/souhaits/composants/ChampImage";

/* Le serveur nomme la cause ; ici on la dit. Un « non-2xx » n apprend
   rien a qui essaie d importer un canape. */
const motifLisible = (code: unknown, t: (c: string, d: string) => string) => {
  switch (code) {
    case "site_refuse":
      return t(
        "wishlist.import.siteRefuse",
        "Ce site refuse la lecture automatique. Saisis le produit à la main.",
      );
    case "page_absente":
      return t("wishlist.import.pageAbsente", "Cette page n’existe plus.");
    case "trop_de_demandes":
      return t("wishlist.import.tropDeDemandes", "Le site nous demande d’attendre. Réessaie dans un instant.");
    case "site_injoignable":
      return t("wishlist.import.siteInjoignable", "Le site n’a pas répondu. Réessaie plus tard.");
    default:
      return t("wishlist.import.echec", "La page n’a rien livré.");
  }
};

/* `FunctionsHttpError` garde la reponse HTTP dans `context`. Sans cette
   relecture, le motif meurt dans le transport : `functions.invoke`
   rejette tout non-2xx avec un message generique et jette le corps. */
const motifDeLEchec = async (
  error: { message: string; context?: unknown },
  t: (c: string, d: string) => string,
) => {
  const reponse = error.context;
  if (reponse instanceof Response) {
    try {
      const corps = await reponse.clone().json();
      if (corps?.code) return motifLisible(corps.code, t);
    } catch {
      /* Corps illisible : on retombe sur le message d origine. */
    }
  }
  return error.message;
};

export interface ScrapedProduct {
  name: string | null;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  source_url: string;
}

/* Les parametres de campagne n identifient pas le produit. Mesure :
   l article deja present portait l adresse complete du lien
   publicitaire — wiz_medium, utm_source, gclid, gad_campaignid — et
   la relecture de la meme page rendait l adresse propre. Compares
   tels quels, deux liens vers LA MEME fiche ne se reconnaissaient
   pas, et le garde-fou laissait passer le doublon. */
const PISTAGE = /^(utm_|gcl|gad_|wiz_|mc_|ms_|fb|yc|_hs|pk_|piwik_|matomo_|igshid|mkt_|ref_?src)/i;

function clefAdresse(brut: string | null | undefined): string | null {
  if (!brut?.trim()) return null;
  try {
    const u = new URL(brut.trim());
    const aRetirer: string[] = [];
    u.searchParams.forEach((_, cle) => { if (PISTAGE.test(cle)) aRetirer.push(cle); });
    aRetirer.forEach((cle) => u.searchParams.delete(cle));
    u.hash = "";
    return (u.host + u.pathname.replace(/\/+$/, "") + u.search).toLowerCase();
  } catch {
    return brut.trim().toLowerCase();
  }
}

interface ArticleConnu {
  id: string;
  name: string;
  url: string | null;
}

interface ImportFromUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (product: ScrapedProduct) => void;
  /** Ce qui est deja dans la liste, pour reconnaitre un doublon avant d ecrire. */
  items?: ArticleConnu[];
  /** La devise dans laquelle ce compte tient ses montants. */
  currency?: string;
  /** Pour deposer un fichier a la place de l image devinee. */
  userId?: string;
}

/**
 * L IMPORT, ET SON GARDE-FOU.
 *
 * L import lit une page et devine trois choses : un nom, un prix, une
 * image. Un devineur se trompe — et ce qu il devine part dans un
 * budget. L ancien ecran affichait sa trouvaille en lecture seule,
 * sous un bouton « ADD TO WISHLIST » : on acceptait la supposition en
 * bloc, sans pouvoir dire laquelle des trois etait fausse.
 *
 * CE QUE LE CONTROLE VERIFIE MAINTENANT
 *
 * 1. L ADRESSE, avant de partir. https seulement, un vrai nom de
 *    domaine. On dit pourquoi on refuse au lieu d envoyer et de
 *    revenir avec une erreur opaque.
 *
 * 2. CE QUI MANQUE, nomme. Un champ que la page n a pas donne est
 *    signale comme absent, pas laisse vide.
 *
 * 3. LA DEVISE. Le champ currency etait lu par le serveur puis JETE
 *    par le client : un prix annonce en dollars entrait dans un
 *    budget tenu en euros, au meme chiffre, sans un mot. La table n a
 *    pas de colonne de devise — on ne peut donc pas stocker la
 *    verite. Alors on refuse de choisir a la place de l utilisateur :
 *    ou il reprend le montant a son compte, ou il ecrit lui-meme le
 *    montant converti. Aucun taux invente.
 *
 * 4. LE DOUBLON, avant l ecriture. Meme adresse ou meme nom : on
 *    nomme l article deja present. La detection du formulaire ne se
 *    declenchait qu a l enregistrement, et sur le nom seul.
 *
 * 5. LA CORRECTION SUR PLACE. Nom et prix sont modifiables ici. On ne
 *    valide pas une supposition : on valide ce qu on a relu.
 */
export function ImportFromUrlModal({
  open, onOpenChange, onImport, items = [], currency = "EUR", userId,
}: ImportFromUrlModalProps) {
  const { t } = useTranslation();

  const [url, setUrl] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lu, setLu] = useState<ScrapedProduct | null>(null);

  // Les valeurs relues, celles qui partiront vraiment.
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [image, setImage] = useState("");
  const [prixRepris, setPrixRepris] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(""); setLu(null); setErreur(null);
      setNom(""); setPrix(""); setImage(""); setPrixRepris(false);
    }
  }, [open]);

  /* On refuse l adresse ici plutot que de la faire refuser au loin :
     le serveur la controle aussi, mais une erreur immediate dit
     pourquoi. */
  const adresseRefusee = useMemo(() => {
    const brut = url.trim();
    if (!brut) return null;
    let u: URL;
    try { u = new URL(brut); } catch { return t("wishlist.import.urlInvalide", "Ce n’est pas une adresse."); }
    if (u.protocol !== "https:") return t("wishlist.import.urlHttps", "Seules les adresses https sont lues.");
    if (!u.hostname.includes(".") || u.hostname === "localhost") {
      return t("wishlist.import.urlLocale", "Cette adresse ne désigne pas un site public.");
    }
    return null;
  }, [url, t]);

  const lire = async () => {
    const brut = url.trim();
    if (!brut || adresseRefusee) return;
    setEnCours(true); setErreur(null); setLu(null);

    try {
      const { data, error } = await supabase.functions.invoke("scrape-product", { body: { url: brut } });
      if (error) throw new Error(await motifDeLEchec(error, t));
      if (!data?.success) throw new Error(motifLisible(data?.code, t));

      const produit = data.data as ScrapedProduct;
      setLu(produit);
      setNom(produit.name ?? "");
      setPrix(produit.price !== null ? String(produit.price) : "");
      setImage(produit.image_url ?? "");
      setPrixRepris(false);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("wishlist.import.echec", "La page n’a rien livré."));
    } finally {
      setEnCours(false);
    }
  };

  /* ── LES AVERTISSEMENTS ── */

  const doublon = useMemo(() => {
    if (!lu) return null;
    const clef = clefAdresse(lu.source_url);
    const parAdresse = clef ? items.find((i) => clefAdresse(i.url) === clef) : undefined;
    if (parAdresse) return { article: parAdresse, motif: "adresse" as const };
    const cible = nom.trim().toLowerCase().replace(/\s+/g, " ");
    if (!cible) return null;
    const parNom = items.find((i) => i.name.trim().toLowerCase().replace(/\s+/g, " ") === cible);
    return parNom ? { article: parNom, motif: "nom" as const } : null;
  }, [lu, items, nom]);

  const prixNombre = Number((prix || "").replace(",", "."));
  const prixLisible = prix.trim() !== "" && Number.isFinite(prixNombre) && prixNombre > 0;
  const prixModifie = lu ? prix.trim() !== (lu.price !== null ? String(lu.price) : "") : false;

  const deviseEtrangere = Boolean(
    lu?.currency && lu.currency.toUpperCase() !== currency.toUpperCase() && lu.price !== null,
  );
  /* Modifier le prix, c est le reprendre a son compte : l avertissement
     de devise n a alors plus d objet. */
  const deviseAResoudre = deviseEtrangere && !prixModifie && !prixRepris;

  const peutAjouter = Boolean(lu) && nom.trim().length > 0 && !deviseAResoudre;

  const valider = () => {
    if (!lu || !peutAjouter) return;
    onImport({
      ...lu,
      name: nom.trim(),
      /* L image est modifiable ici : un lecteur de page se trompe de
         visuel plus souvent que de nom, et c est le seul endroit ou
         l on voit ce qu il a choisi avant que ca entre dans la
         liste. */
      image_url: image.trim() || null,
      price: prixLisible ? prixNombre : null,
      /* Le montant part dans la devise du compte : soit l utilisateur
         l a reecrit, soit il a dit qu il le reprenait tel quel. */
      currency: currency.toUpperCase(),
    });
    onOpenChange(false);
  };

  const domaine = (() => {
    try { return lu ? new URL(lu.source_url).hostname.replace(/^www\./, "") : ""; } catch { return ""; }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wl-boite bg-card/95 backdrop-blur-2xl border-[var(--wl-trait)] max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm tracking-[0.2em] text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" aria-hidden="true" />
            {t("wishlist.import.titre", "Importer depuis une page")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── L adresse ── */}
          <div className="space-y-2">
            <Label className="font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground">
              {t("wishlist.import.adresse", "Adresse de la page")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lire(); }}
                placeholder="https://…"
                type="url"
                className="bg-transparent border-[var(--wl-trait)] font-mono text-xs"
              />
              <button
                type="button"
                className="wl-bouton shrink-0"
                onClick={lire}
                disabled={!url.trim() || Boolean(adresseRefusee) || enCours}
              >
                {enCours
                  ? <Loader2 className="animate-spin" aria-hidden="true" />
                  : t("wishlist.import.lire", "Lire")}
              </button>
            </div>
            {adresseRefusee && (
              <p className="wl-alerte" data-ton="refus">
                <X aria-hidden="true" /> <span>{adresseRefusee}</span>
              </p>
            )}
          </div>

          {erreur && (
            <p className="wl-alerte" data-ton="refus">
              <X aria-hidden="true" /> <span>{erreur}</span>
            </p>
          )}

          {/* ── LE CONTROLE ── */}
          {lu && (
            <div className="wl-controle">
              <p className="wl-controle-tete">
                {t("wishlist.import.luSur", "Lu sur {{domaine}}", { domaine })}
              </p>

              <div className="wl-controle-corps">
                <div className="space-y-2">
                  <Label className="font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    {t("wishlist.form.image", "Image")}
                    {lu.image_url
                      ? <span className="wl-lu"><Check aria-hidden="true" /> {t("wishlist.import.lu", "lu")}</span>
                      : <span className="wl-manque">{t("wishlist.import.nonTrouve", "non trouvé")}</span>}
                  </Label>
                  {/* Le lecteur devine mal une image plus souvent qu un
                      nom. On peut donc corriger l adresse, ou deposer
                      son propre fichier a la place. */}
                  <ChampImage value={image} onChange={setImage} userId={userId} />
                </div>

                <div className="space-y-2">
                  <Label className="font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    {t("wishlist.form.nom", "Nom")}
                    {lu.name
                      ? <span className="wl-lu"><Check aria-hidden="true" /> {t("wishlist.import.lu", "lu")}</span>
                      : <span className="wl-manque">{t("wishlist.import.nonTrouve", "non trouvé")}</span>}
                  </Label>
                  <Input value={nom} onChange={(e) => setNom(e.target.value)}
                    className="bg-transparent border-[var(--wl-trait)] font-rajdhani" />
                </div>

                <div className="space-y-2">
                  <Label className="font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    {t("wishlist.form.prix", "Prix estimé")}
                    {lu.price !== null
                      ? <span className="wl-lu"><Check aria-hidden="true" /> {lu.currency ?? currency}</span>
                      : <span className="wl-manque">{t("wishlist.import.nonTrouve", "non trouvé")}</span>}
                  </Label>
                  <Input value={prix} onChange={(e) => setPrix(e.target.value)} inputMode="decimal"
                    className="bg-transparent border-[var(--wl-trait)] font-mono" />
                  {prixLisible && (
                    <p className="wl-controle-note">
                      {t("wishlist.import.entrera", "Entrera pour {{montant}}", {
                        montant: formatCurrency(prixNombre, currency),
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Ce qui doit etre tranche avant d ecrire ── */}
              {deviseEtrangere && (
                <div className="wl-alerte" data-ton="attention">
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    {t("wishlist.import.devise", "La page annonce des {{lue}} ; ce compte tient ses montants en {{tienne}}. Rien ne convertit ce montant.", {
                      lue: lu.currency?.toUpperCase(), tienne: currency.toUpperCase(),
                    })}
                    {!prixModifie && (
                      <button type="button" className="wl-tri" style={{ marginTop: 8, display: "flex" }}
                        aria-pressed={prixRepris} onClick={() => setPrixRepris((v) => !v)}>
                        {t("wishlist.import.deviseAssume", "Je garde ce montant tel quel")}
                      </button>
                    )}
                  </span>
                </div>
              )}

              {doublon && (
                <div className="wl-alerte" data-ton="attention">
                  <AlertTriangle aria-hidden="true" />
                  <span>
                    {doublon.motif === "adresse"
                      ? t("wishlist.import.doublonAdresse", "Cette page est déjà dans ta liste, sous « {{nom}} ».", { nom: doublon.article.name })
                      : t("wishlist.import.doublonNom", "« {{nom}} » est déjà dans ta liste.", { nom: doublon.article.name })}
                  </span>
                </div>
              )}

              {!prixLisible && (
                <div className="wl-alerte" data-ton="attention">
                  <AlertTriangle aria-hidden="true" />
                  <span>{t("wishlist.import.sansPrix", "Sans prix, l’article entrera à zéro et ne pèsera dans aucun total.")}</span>
                </div>
              )}

              <Button onClick={valider} disabled={!peutAjouter}
                className="w-full font-mono tracking-[0.15em] uppercase text-xs">
                {t("wishlist.import.valider", "Contrôler et ajouter")}
              </Button>
              <p className="wl-controle-note">
                {t("wishlist.import.suite", "Le formulaire s’ouvrira ensuite pour l’objectif, la priorité et les notes.")}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
