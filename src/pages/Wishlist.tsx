import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DSPageShell } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { fr as dateFr } from "date-fns/locale";
import { useEcrirePointage, useEffacerPointage } from "@/hooks/usePointages";
import { Globe, Plus, Search } from "lucide-react";
import {
  PactWishlistItemType,
  WishlistPriority,
  useCreatePactWishlistItem,
  useDeletePactWishlistItem,
  usePactWishlistItems,
  useUpdatePactWishlistItem,
  type PactWishlistItem,
} from "@/hooks/usePactWishlist";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useWishlistGoalSync } from "@/hooks/useWishlistGoalSync";
import { useWishlistPieces } from "@/hooks/useWishlistPieces";
import { useDepotImages } from "@/hooks/useDepotImages";
import { cheminDuDepot } from "@/lib/wishlistDepot";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/components/wishlist/DuplicateMergeDialog";
import { ImportFromUrlModal, type ScrapedProduct } from "@/components/wishlist/ImportFromUrlModal";
import { DeleteConfirmDialog } from "@/components/wishlist/DeleteConfirmDialog";
import { WishlistFiche } from "@/components/wishlist/WishlistFiche";
import { WishlistRegistre } from "@/components/wishlist/WishlistRegistre";
import { WishlistArchive } from "@/components/wishlist/WishlistArchive";
import { WishlistRail } from "@/components/wishlist/WishlistRail";
import { ChampImage } from "@/components/wishlist/ChampImage";
import "@/styles/wishlist.css";

/* ═══════════════════════════════════════════════════════════════
   LE BORDEREAU

   Soixante-dix articles etaient melanges dans une grille unique.
   La mesure dit qu ils sont de deux natures : soixante-neuf viennent
   des objectifs — ce sont des lignes de budget — et un seul a ete
   ajoute a la main.

   Trois vues, donc, et deux formes. Le pacte se lit en REGISTRE,
   range sous les objectifs qui le reclament. Ce qui est libre se lit
   en FICHES, avec image et lien.

   CE QUI DISPARAIT, ET POURQUOI, mesure a l appui :

   — Le mode bulk. Demande retiree.
   — Le graphique « Need vs Want ». Il compare requis et optionnel :
     69 articles contre 1, soit 27 748 EUR contre 94. Un camembert a
     une part.
   — Les filtres categorie et type. 69 articles sur 70 portent la
     categorie « Goal Equipment » et le type « required », tous deux
     ecrits par la synchronisation. Ils ne separent rien.
   — Le tri manuel par glisser-deposer. sort_order vaut zero pour 64
     articles sur 70 : il n a jamais servi.
   — « Project total ». Il donnait la somme des objectifs au milieu de
     quatre compteurs qui parlaient de la liste. Il revient dans la
     vue du pacte, nomme pour ce qu il est.
   ═══════════════════════════════════════════════════════════════ */

type Vue = "tout" | "pacte" | "libre";
type Tri = "visuel" | "recent" | "cher" | "abordable";

const CLE_VUE = "vowpact.wishlist.vue";

function normaliserNom(valeur: string) {
  return valeur.trim().toLowerCase().replace(/\s+/g, " ");
}

function trouverDoublon(opts: {
  items: Array<{ id: string; name: string; goal_id: string | null }>;
  name: string;
  goalId: string | null;
  excludeId?: string | null;
}) {
  const cible = normaliserNom(opts.name);
  const objectif = opts.goalId ?? null;
  return opts.items.find(
    (i) => i.id !== (opts.excludeId ?? null)
      && normaliserNom(i.name) === cible
      && (i.goal_id ?? null) === objectif,
  ) ?? null;
}

export default function Wishlist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: items = [], isLoading } = usePactWishlistItems(user?.id);
  const createItem = useCreatePactWishlistItem();
  const updateItem = useUpdatePactWishlistItem();
  const deleteItem = useDeletePactWishlistItem();

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);

  useWishlistGoalSync(user?.id, pact?.id, items);

  /* LA PASSERELLE VERS FINANCE.
     Un article hors pacte paye ne laissait aucune trace dans les
     comptes : le mois ou l achat tombe ne le savait pas. Les pieces
     du pacte, elles, sont deja comptees par le financement du
     pacte — les ajouter ici les compterait deux fois. La passerelle
     ne concerne donc QUE ce qui n engage que soi. */
  const ecrirePointage = useEcrirePointage();
  const effacerPointage = useEffacerPointage();

  /* La provenance des pieces : quelle etape les paie, et laquelle a
     ete cochee par la validation de cette etape. */
  const idsPieces = useMemo(
    () => items.map((i) => i.source_goal_cost_id).filter((v): v is string => Boolean(v)),
    [items],
  );
  const { data: pieces } = useWishlistPieces(user?.id, idsPieces);

  /* Les images deposees sont rangees en chemin, pas en adresse : le
     depot est prive. On les signe toutes en une requete. */
  const cheminsDepot = useMemo(
    () => items.map((i) => cheminDuDepot(i.image_url)).filter((v): v is string => Boolean(v)),
    [items],
  );
  const { data: depot } = useDepotImages(user?.id, cheminsDepot);
  const adresseImage = (item: PactWishlistItem) => {
    const chemin = cheminDuDepot(item.image_url);
    if (chemin) return depot?.get(chemin) ?? null;
    return item.image_url?.trim() || null;
  };

  /* La vue retenue survit a la visite, comme le mois de Finance. */
  const [vue, setVue] = useState<Vue>(() => {
    const garde = typeof window !== "undefined" ? window.localStorage.getItem(CLE_VUE) : null;
    return garde === "pacte" || garde === "libre" ? garde : "tout";
  });
  useEffect(() => {
    window.localStorage.setItem(CLE_VUE, vue);
  }, [vue]);

  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<Tri>("visuel");

  // ── Formulaire de creation ──
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newType, setNewType] = useState<PactWishlistItemType>("optional");
  const [newCategory, setNewCategory] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newGoalId, setNewGoalId] = useState("none");
  const [newPriority, setNewPriority] = useState<WishlistPriority>("low");

  const [importOpen, setImportOpen] = useState(false);

  // ── Formulaire d edition ──
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editType, setEditType] = useState<PactWishlistItemType>("optional");
  const [editNotes, setEditNotes] = useState("");
  const [editGoalId, setEditGoalId] = useState("none");
  const [editUrl, setEditUrl] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPriority, setEditPriority] = useState<WishlistPriority>("low");

  // ── Fusion de doublons ──
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMode, setMergeMode] = useState<"create" | "edit" | null>(null);
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string | null>(null);
  const [mergeExistingPreview, setMergeExistingPreview] = useState<DuplicateMergePreview | null>(null);
  const [mergeIncomingPreview, setMergeIncomingPreview] = useState<DuplicateMergePreview | null>(null);

  // ── Suppression ──
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  /* La cible porte de quoi ecrire un avertissement VRAI : le nom de
     l objectif touche et le montant qui va quitter son cout. */
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string; name: string;
    sourceGoalCostId: string | null; goalId: string | null;
    goalName: string | null; cost: number;
  } | null>(null);

  /* ── LES COMPTES ──
     Une seule source pour toute la page : chaque chiffre affiche
     descend de ce bloc, et aucun n est recalcule ailleurs. */
  const comptes = useMemo(() => {
    const duPacte = items.filter((i) => i.source_goal_cost_id);
    const libres = items.filter((i) => !i.source_goal_cost_id);
    const somme = (liste: PactWishlistItem[]) =>
      liste.reduce((s, i) => s + Number(i.estimated_cost || 0), 0);

    return {
      duPacte, libres,
      total: somme(items),
      totalPacte: somme(duPacte),
      totalLibre: somme(libres),
      paye: somme(items.filter((i) => i.acquired)),
      payePacte: somme(duPacte.filter((i) => i.acquired)),
      payeLibre: somme(libres.filter((i) => i.acquired)),
      nbPaye: items.filter((i) => i.acquired).length,
      /* Le cout des objectifs du pacte, pour ce qu il est : une
         verification. Il doit egaler la somme des pieces. */
      coutObjectifs: goals.reduce((s, g) => s + Number(g.estimated_cost || 0), 0),
      nbObjectifs: new Set(duPacte.map((i) => i.goal_id)).size,
    };
  }, [items, goals]);

  /* ── LE FILTRE ──
     La recherche s applique a la vue courante ; elle ne cherche pas
     ailleurs que ce qu on regarde. */
  const vus = useMemo(() => {
    const base = vue === "pacte" ? comptes.duPacte : vue === "libre" ? comptes.libres : items;
    const mot = recherche.trim().toLowerCase();
    const filtres = mot
      ? base.filter((i) =>
        i.name.toLowerCase().includes(mot)
        || (i.category ?? "").toLowerCase().includes(mot)
        || (i.goal?.name ?? "").toLowerCase().includes(mot)
        || (i.notes ?? "").toLowerCase().includes(mot))
      : base;

    const recence = (a: PactWishlistItem, b: PactWishlistItem) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    const ordonnes = [...filtres].sort((a, b) => {
      if (tri === "cher") return Number(b.estimated_cost) - Number(a.estimated_cost);
      if (tri === "abordable") return Number(a.estimated_cost) - Number(b.estimated_cost);
      if (tri === "visuel") {
        /* Une photo achete une case : encore faut-il la voir. Sans
           ce tri, les quatre articles photographies tombaient a deux
           mille pixels du haut. */
        const ecart = Number(Boolean(b.image_url)) - Number(Boolean(a.image_url));
        return ecart !== 0 ? ecart : recence(a, b);
      }
      return recence(a, b);
    });

    return {
      tous: ordonnes,
      actifs: ordonnes.filter((i) => !i.acquired),
      acquis: ordonnes.filter((i) => i.acquired),
    };
  }, [vue, items, comptes.duPacte, comptes.libres, recherche, tri]);

  // ═══ GESTES ═══

  const ouvrirEdition = (item: PactWishlistItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditCost(String(item.estimated_cost ?? 0));
    setEditType(item.item_type);
    setEditNotes(item.notes ?? "");
    setEditGoalId(item.goal_id ?? "none");
    setEditUrl(item.url ?? "");
    setEditImageUrl(item.image_url ?? "");
    setEditPriority(item.priority ?? "low");
    setEditOpen(true);
  };

  /* CORRIGER SANS OUVRIR DE FENETRE.
     Un prix illisible ne devient pas zero : on refuse l ecriture
     plutot que d inventer un montant. */
  const corriger = (id: string, champ: "prix" | "lien", valeur: string) => {
    if (!user) return;
    if (champ === "prix") {
      const nombre = Number(valeur.replace(",", ".").trim());
      if (!Number.isFinite(nombre) || nombre < 0) return;
      updateItem.mutate({ userId: user.id, id, patch: { estimated_cost: nombre } });
      return;
    }
    const adresse = valeur.trim();
    if (adresse && !/^https?:\/\//i.test(adresse)) return;
    updateItem.mutate({ userId: user.id, id, patch: { url: adresse || null } });
  };

  const basculerAcquis = (id: string, acquired: boolean) => {
    if (!user) return;
    updateItem.mutate({ userId: user.id, id, patch: { acquired } });

    const item = items.find((i) => i.id === id);
    /* Seulement hors pacte, et seulement si le montant existe : une
       depense a zero euro n apprend rien au mois. */
    if (!item || item.source_goal_cost_id) return;
    const montant = Number(item.estimated_cost || 0);
    if (!(montant > 0)) return;

    const mois = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const moisLisible = format(startOfMonth(new Date()), "MMMM yyyy", { locale: dateFr });

    if (acquired) {
      ecrirePointage.mutate({
        mois,
        /* L identifiant de l article sert de cle : repointer corrige
           au lieu d empiler, et decocher retrouve la bonne ligne. */
        ligne_id: id,
        genre: "expense",
        /* La contrainte de la table refuse un nom vide et coupe a
           cent vingt caracteres. */
        nom: (item.name.trim() || "Achat").slice(0, 120),
        montant_prevu: montant,
        montant_reel: montant,
        pointe: true,
      }, {
        onSuccess: () => toast.success(
          t("wishlist.finance.ajoute", "Ajouté aux dépenses de {{mois}}", { mois: moisLisible }),
          { description: formatCurrency(montant, currency) },
        ),
      });
    } else {
      effacerPointage.mutate({ ligneId: id, mois });
    }
  };

  const demanderSuppression = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    /* L avertissement decrit la PROPAGATION, pas le rattachement. Un
       article cree a la main peut porter un goal_id sans avoir de piece
       dans le cout de l objectif : le supprimer n enleve alors rien a
       cet objectif. On ne nomme donc l objectif que si une piece part
       reellement avec l article — sinon la fenetre annoncerait une
       consequence qui n arrive pas. */
    const pieceLiee = item.source_goal_cost_id ?? null;
    setDeleteTarget({
      id, name: item.name,
      sourceGoalCostId: pieceLiee,
      goalId: item.goal_id ?? null,
      goalName: pieceLiee ? item.goal?.name ?? null : null,
      cost: Number(item.estimated_cost || 0),
    });
    setDeleteConfirmOpen(true);
  };

  const confirmerSuppression = () => {
    if (!user || !deleteTarget) return;
    deleteItem.mutate({
      userId: user.id,
      id: deleteTarget.id,
      sourceGoalCostId: deleteTarget.sourceGoalCostId,
      goalId: deleteTarget.goalId,
    });
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const creer = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user) return;
    const nom = newName.trim();
    if (!nom) return;
    const prix = Number((newCost || "0").replace(",", "."));
    const objectif = newGoalId === "none" ? null : newGoalId;

    if (!opts?.skipDuplicateCheck) {
      const doublon = trouverDoublon({ items, name: nom, goalId: objectif });
      if (doublon) {
        const complet = items.find((i) => i.id === doublon.id);
        setMergeMode("create");
        setMergeDuplicateId(doublon.id);
        setMergeExistingPreview({
          name: complet?.name ?? doublon.name, goalId: complet?.goal_id ?? null,
          goalName: complet?.goal?.name ?? null, category: complet?.category ?? null,
          estimatedCost: Number(complet?.estimated_cost ?? 0),
          itemType: complet?.item_type ?? "optional", notes: complet?.notes ?? null,
        });
        setMergeIncomingPreview({
          name: nom, goalId: objectif,
          goalName: objectif ? goals.find((g) => g.id === objectif)?.name ?? null : null,
          category: newCategory.trim() || null,
          estimatedCost: Number.isFinite(prix) ? prix : 0, itemType: newType, notes: null,
        });
        setMergeOpen(true);
        return;
      }
    }

    try {
      await createItem.mutateAsync({
        userId: user.id, name: nom,
        estimatedCost: Number.isFinite(prix) ? prix : 0,
        itemType: newType, category: newCategory.trim() || null,
        goalId: objectif, url: newUrl.trim() || null,
        imageUrl: newImageUrl.trim() || null, priority: newPriority,
      });
      setNewName(""); setNewCost(""); setNewCategory(""); setNewType("optional");
      setNewUrl(""); setNewImageUrl(""); setNewGoalId("none"); setNewPriority("low");
      setNewOpen(false);
    } catch {
      /* La mutation a deja prevenu. */
    }
  };

  const enregistrerEdition = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user || !editId) return;
    const nom = editName.trim();
    if (!nom) return;
    const prix = Number((editCost || "0").replace(",", "."));
    const objectif = editGoalId === "none" ? null : editGoalId;

    if (!opts?.skipDuplicateCheck) {
      const doublon = trouverDoublon({ items, name: nom, goalId: objectif, excludeId: editId });
      if (doublon) {
        const complet = items.find((i) => i.id === doublon.id);
        setMergeMode("edit");
        setMergeDuplicateId(doublon.id);
        setMergeExistingPreview({
          name: complet?.name ?? doublon.name, goalId: complet?.goal_id ?? null,
          goalName: complet?.goal?.name ?? null, category: complet?.category ?? null,
          estimatedCost: Number(complet?.estimated_cost ?? 0),
          itemType: complet?.item_type ?? "optional", notes: complet?.notes ?? null,
        });
        setMergeIncomingPreview({
          name: nom, goalId: objectif,
          goalName: objectif ? goals.find((g) => g.id === objectif)?.name ?? null : null,
          category: editCategory.trim() || null,
          estimatedCost: Number.isFinite(prix) ? prix : 0,
          itemType: editType, notes: editNotes.trim() || null,
        });
        setMergeOpen(true);
        return;
      }
    }

    try {
      await updateItem.mutateAsync({
        userId: user.id, id: editId,
        patch: {
          name: nom, category: editCategory.trim() || null,
          estimated_cost: Number.isFinite(prix) ? prix : 0,
          item_type: editType, notes: editNotes.trim() || null,
          goal_id: objectif, url: editUrl.trim() || null,
          image_url: editImageUrl.trim() || null, priority: editPriority,
        },
      });
      setEditOpen(false);
    } catch {
      /* La mutation a deja prevenu. */
    }
  };

  const fusionner = async () => {
    if (!user || !mergeMode || !mergeDuplicateId || !mergeExistingPreview || !mergeIncomingPreview) return;
    try {
      setMergeBusy(true);
      const garde = items.find((i) => i.id === mergeDuplicateId);
      const courant = editId ? items.find((i) => i.id === editId) : null;
      const coutFusionne = Number(garde?.estimated_cost ?? 0) + Number(mergeIncomingPreview.estimatedCost ?? 0);
      const typeFusionne: PactWishlistItemType =
        (garde?.item_type === "required" || mergeIncomingPreview.itemType === "required") ? "required" : "optional";
      const categorieFusionnee = (garde?.category ?? "").trim() || (mergeIncomingPreview.category ?? "").trim() || null;
      const notesFusionnees = [garde?.notes?.trim(), mergeIncomingPreview.notes?.trim()].filter(Boolean).join("\n\n") || null;

      await updateItem.mutateAsync({
        userId: user.id, id: mergeDuplicateId,
        patch: {
          name: garde?.name ?? mergeIncomingPreview.name,
          goal_id: garde?.goal_id ?? mergeIncomingPreview.goalId ?? null,
          estimated_cost: coutFusionne, item_type: typeFusionne,
          category: categorieFusionnee, notes: notesFusionnees,
        },
      });

      if (mergeMode === "edit" && courant && courant.id !== mergeDuplicateId) {
        await deleteItem.mutateAsync({
          userId: user.id, id: courant.id,
          sourceGoalCostId: courant.source_goal_cost_id ?? null,
          goalId: courant.goal_id ?? null,
        });
        setEditOpen(false);
      }

      toast.success(t("wishlist.merge.done", "Doublon fusionné"));
      setMergeOpen(false); setMergeMode(null); setMergeDuplicateId(null);
      setMergeExistingPreview(null); setMergeIncomingPreview(null); setNewOpen(false);
    } finally {
      setMergeBusy(false);
    }
  };

  const garderLesDeux = async () => {
    if (!mergeMode) return;
    setMergeOpen(false);
    if (mergeMode === "create") { await creer({ skipDuplicateCheck: true }); return; }
    await enregistrerEdition({ skipDuplicateCheck: true });
  };

  const importer = (produit: ScrapedProduct) => {
    setNewName(produit.name || "");
    setNewCost(produit.price !== null ? String(produit.price) : "");
    setNewUrl(produit.source_url || "");
    setNewImageUrl(produit.image_url || "");
    setNewType("optional"); setNewCategory(""); setNewGoalId("none"); setNewPriority("low");
    setNewOpen(true);
  };

  // ═══ RENDU ═══

  const onglets: Array<{ cle: Vue; mot: string; compte: number }> = [
    { cle: "tout", mot: t("wishlist.vue.tout", "Global"), compte: items.length },
    { cle: "pacte", mot: t("wishlist.vue.pacte", "Le pacte"), compte: comptes.duPacte.length },
    { cle: "libre", mot: t("wishlist.vue.libre", "Hors pacte"), compte: comptes.libres.length },
  ];

  const partPayee = comptes.total > 0 ? comptes.paye / comptes.total : 0;
  const partPayeePacte = comptes.totalPacte > 0 ? comptes.payePacte / comptes.totalPacte : 0;

  /* LE SHOWROOM EST ALLUME. La page pose son propre sol clair dans
     l emplacement de fond, par-dessus le fond sombre de
     l application, quel que soit le theme. C est une decision, pas un
     oubli : sur les quinze photos du bordereau, treize sont des
     photos de produit detourees SUR FOND BLANC. Sur un fond noir
     elles apparaissaient comme des rectangles eblouissants a arete
     dure. Ces photos veulent du clair. */
  return (
    <DSPageShell width="xl" className="!px-0 !pt-0 !pb-0" background={<div className="wl-fond" />}>
      <DuplicateMergeDialog
        open={mergeOpen} onOpenChange={setMergeOpen}
        existing={mergeExistingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null }}
        incoming={mergeIncomingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null }}
        isBusy={mergeBusy} onMerge={fusionner} onKeepBoth={garderLesDeux}
      />

      {/* Le controle d import a besoin de la liste pour reconnaitre un
          doublon avant d ecrire, et de la devise pour dire dans
          laquelle le montant va entrer. */}
      <ImportFromUrlModal
        open={importOpen} onOpenChange={setImportOpen} onImport={importer}
        items={items} currency={currency} userId={user?.id}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}
        itemName={deleteTarget?.name ?? ""}
        goalName={deleteTarget?.goalName ?? null}
        cost={deleteTarget?.cost ?? 0}
        currency={currency}
        onConfirm={confirmerSuppression}
      />

      <FormulaireArticle
        open={newOpen} onOpenChange={setNewOpen}
        titre={t("wishlist.form.nouveau", "Nouvel article")}
        name={newName} setName={setNewName}
        cost={newCost} setCost={setNewCost}
        category={newCategory} setCategory={setNewCategory}
        url={newUrl} setUrl={setNewUrl}
        imageUrl={newImageUrl} setImageUrl={setNewImageUrl}
        goalId={newGoalId} setGoalId={setNewGoalId}
        type={newType} setType={setNewType}
        priority={newPriority} setPriority={setNewPriority}
        goals={goals}
        userId={user?.id}
        onSubmit={() => creer()}
        submitLabel={t("wishlist.form.ajouter", "Ajouter")}
        busy={createItem.isPending}
      />

      <FormulaireArticle
        open={editOpen} onOpenChange={setEditOpen}
        titre={t("wishlist.form.modifier", "Modifier l’article")}
        name={editName} setName={setEditName}
        cost={editCost} setCost={setEditCost}
        category={editCategory} setCategory={setEditCategory}
        url={editUrl} setUrl={setEditUrl}
        imageUrl={editImageUrl} setImageUrl={setEditImageUrl}
        goalId={editGoalId} setGoalId={setEditGoalId}
        type={editType} setType={setEditType}
        priority={editPriority} setPriority={setEditPriority}
        notes={editNotes} setNotes={setEditNotes}
        goals={goals}
        userId={user?.id}
        onSubmit={() => enregistrerEdition()}
        submitLabel={t("common.save", "Enregistrer")}
        busy={updateItem.isPending}
      />

      <div className="max-w-6xl mx-auto page-px py-6 md:py-8">
        <div className="wl">

          {/* ── L en-tete ── */}
          <header className="wl-tete">
            <div className="wl-tete-id">
              {/* L enseigne : une colonne verticale, une seule, a un
                  seul endroit. 取得 — acquisition. */}
              <span className="wl-colonne" aria-hidden="true">取得</span>
              <span className="wl-jeton" aria-hidden="true">₩</span>
              <span className="wl-tete-mots">
                <b>{t("wishlist.tete.ref", "Bordereau // Acquisitions")}</b>
                <i>
                  {t("wishlist.tete.compte", "{{n}} articles", { n: items.length })}
                  {" · "}
                  {formatCurrency(comptes.total, currency)}
                </i>
              </span>
            </div>
            <div className="wl-tete-gestes">
              <button type="button" className="wl-bouton" onClick={() => setImportOpen(true)}>
                <Globe aria-hidden="true" /> {t("wishlist.tete.importer", "Importer")}
              </button>
              <button type="button" className="wl-bouton wl-bouton--fort" onClick={() => setNewOpen(true)}>
                <Plus aria-hidden="true" /> {t("wishlist.tete.ajouter", "Ajouter")}
              </button>
            </div>
          </header>

          {/* ── Les trois vues ── */}
          <div className="wl-onglets" role="tablist" aria-label={t("wishlist.vue.aria", "Vues de la liste")}>
            {onglets.map((o) => (
              <button
                key={o.cle}
                type="button"
                role="tab"
                className="wl-onglet"
                data-veine={o.cle}
                aria-selected={vue === o.cle}
                onClick={() => setVue(o.cle)}
              >
                {o.mot} <b>{o.compte}</b>
              </button>
            ))}
          </div>

          {/* ── Le bandeau de mesures ──
              Chaque vue montre ses propres comptes. Aucun chiffre ne
              parle d autre chose que de ce qu on regarde. */}
          {vue === "tout" && (
            <div className="wl-bandeau">
              <div className="wl-mesure" data-veine="du">
                <u>{t("wishlist.mesure.reste", "Reste à acquérir")}</u>
                <b>{formatCurrency(comptes.total - comptes.paye, currency)}</b>
              </div>
              <div className="wl-mesure" data-veine="acquis">
                <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
                <b>{formatCurrency(comptes.paye, currency)}</b>
              </div>
              <div className="wl-mesure">
                <u>{t("wishlist.mesure.articles", "Articles")}</u>
                <b>{items.length - comptes.nbPaye}<s>/{items.length}</s></b>
              </div>
              <div className="wl-jauge">
                <div className="wl-mesure">
                  <u>
                    {t("wishlist.mesure.repartition", "Pacte {{pacte}} · libre {{libre}}", {
                      pacte: formatCurrency(comptes.totalPacte, currency),
                      libre: formatCurrency(comptes.totalLibre, currency),
                    })}
                  </u>
                </div>
                <WishlistRail className="wl-rail" part={partPayee} />
              </div>
            </div>
          )}

          {vue === "pacte" && (
            <div className="wl-bandeau">
              <div className="wl-mesure" data-veine="du">
                <u>{t("wishlist.mesure.restePacte", "Reste à financer")}</u>
                <b>{formatCurrency(comptes.totalPacte - comptes.payePacte, currency)}</b>
              </div>
              <div className="wl-mesure" data-veine="acquis">
                <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
                <b>{formatCurrency(comptes.payePacte, currency)}</b>
              </div>
              <div className="wl-mesure">
                <u>{t("wishlist.mesure.objectifs", "Objectifs concernés")}</u>
                <b>{comptes.nbObjectifs}</b>
              </div>
              <div className="wl-jauge">
                <div className="wl-mesure">
                  {/* Le cout des objectifs du pacte, nomme pour ce
                      qu il est. Il doit egaler la somme des pieces —
                      s il en differe, une piece manque quelque part. */}
                  <u>
                    {t("wishlist.mesure.coutObjectifs", "Coût des objectifs du pacte : {{montant}}", {
                      montant: formatCurrency(comptes.coutObjectifs, currency),
                    })}
                  </u>
                </div>
                <WishlistRail className="wl-rail" part={partPayeePacte} />
              </div>
            </div>
          )}

          {vue === "libre" && (
            <div className="wl-bandeau">
              <div className="wl-mesure" data-veine="libre">
                <u>{t("wishlist.mesure.total", "Total")}</u>
                <b>{formatCurrency(comptes.totalLibre, currency)}</b>
              </div>
              <div className="wl-mesure" data-veine="acquis">
                <u>{t("wishlist.mesure.paye", "Déjà payé")}</u>
                <b>{formatCurrency(comptes.payeLibre, currency)}</b>
              </div>
              <div className="wl-mesure">
                <u>{t("wishlist.mesure.articles", "Articles")}</u>
                <b>{comptes.libres.length}</b>
              </div>
            </div>
          )}

          {/* ── Recherche et tri ── */}
          <div className="wl-barre">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder={t("wishlist.barre.chercher", "Chercher un article, un objectif, une note…")}
                className="pl-9 bg-transparent border-[var(--wl-trait)] font-rajdhani"
              />
            </div>
            {vue !== "pacte" && (
              <>
                <button type="button" className="wl-tri" aria-pressed={tri === "visuel"} onClick={() => setTri("visuel")}>
                  {t("wishlist.tri.visuel", "Visuel")}
                </button>
                <button type="button" className="wl-tri" aria-pressed={tri === "recent"} onClick={() => setTri("recent")}>
                  {t("wishlist.tri.recent", "Récent")}
                </button>
                <button type="button" className="wl-tri" aria-pressed={tri === "cher"} onClick={() => setTri("cher")}>
                  {t("wishlist.tri.cher", "Prix ↓")}
                </button>
                <button type="button" className="wl-tri" aria-pressed={tri === "abordable"} onClick={() => setTri("abordable")}>
                  {t("wishlist.tri.abordable", "Prix ↑")}
                </button>
              </>
            )}
          </div>

          {/* ── Le corps ── */}
          {isLoading ? (
            <div className="wl-vide"><small>{t("common.loading", "Chargement…")}</small></div>
          ) : vue === "pacte" ? (
            vus.tous.length === 0 ? (
              <div className="wl-vide">
                <p>{recherche
                  ? t("wishlist.vide.recherche", "Aucun article ne correspond à cette recherche.")
                  : t("wishlist.vide.pacte", "Aucun objectif du pacte n’a encore de dépense.")}</p>
                <small>{t("wishlist.vide.pacteAide", "Les dépenses ajoutées à un objectif apparaissent ici automatiquement.")}</small>
              </div>
            ) : (
              <WishlistRegistre
                items={vus.tous} currency={currency} pieces={pieces}
                onEdit={ouvrirEdition} onDelete={demanderSuppression} onToggleAcquired={basculerAcquis}
              />
            )
          ) : (
            <>
              {vus.actifs.length === 0 ? (
                <div className="wl-vide">
                  <p>{recherche
                    ? t("wishlist.vide.recherche", "Aucun article ne correspond à cette recherche.")
                    : vue === "libre"
                      ? t("wishlist.vide.libre", "Rien ici qui n’engage que toi.")
                      : t("wishlist.vide.tout", "Tout est acquis.")}</p>
                  {!recherche && vue === "libre" && (
                    <small>{t("wishlist.vide.libreAide", "Un article hors pacte est une envie qui ne pèse sur aucun objectif.")}</small>
                  )}
                </div>
              ) : (
                <div className="wl-grille">
                  {vus.actifs.map((item) => (
                    <WishlistFiche
                      key={item.id}
                      item={item}
                      src={adresseImage(item)}
                      currency={currency}
                      piece={item.source_goal_cost_id ? pieces?.get(item.source_goal_cost_id) : undefined}
                      onEdit={ouvrirEdition}
                      onDelete={demanderSuppression}
                      onToggleAcquired={basculerAcquis}
                      onCorriger={corriger}
                    />
                  ))}
                </div>
              )}

              <WishlistArchive
                items={vus.acquis} currency={currency} pieces={pieces}
                onToggleAcquired={basculerAcquis} onEdit={ouvrirEdition}
              />
            </>
          )}
        </div>
      </div>
    </DSPageShell>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LE FORMULAIRE

   Creation et edition demandaient les memes champs dans deux blocs
   recopies, en anglais. Un seul formulaire, deux usages.
   ═══════════════════════════════════════════════════════════════ */
interface FormulaireArticleProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titre: string;
  name: string; setName: (v: string) => void;
  cost: string; setCost: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  url: string; setUrl: (v: string) => void;
  imageUrl: string; setImageUrl: (v: string) => void;
  goalId: string; setGoalId: (v: string) => void;
  type: PactWishlistItemType; setType: (v: PactWishlistItemType) => void;
  priority: WishlistPriority; setPriority: (v: WishlistPriority) => void;
  notes?: string; setNotes?: (v: string) => void;
  goals: Array<{ id: string; name: string }>;
  userId: string | undefined;
  onSubmit: () => void;
  submitLabel: string;
  busy: boolean;
}

function FormulaireArticle(p: FormulaireArticleProps) {
  const { t } = useTranslation();

  const champ = "bg-transparent border-[var(--wl-trait)] font-rajdhani";
  const etiquette = "font-mono uppercase text-[10px] tracking-[0.2em] text-muted-foreground";

  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="wl-boite bg-card/95 backdrop-blur-2xl border-[var(--wl-trait)] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-sm tracking-[0.2em] text-foreground">
            {p.titre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.nom", "Nom")} *</Label>
            <Input value={p.name} onChange={(e) => p.setName(e.target.value)} className={champ} />
          </div>

          {/* DEUX CHAMPS QUE PERSONNE NE REMPLIT.
              Mesure : sur soixante-et-onze articles, soixante-neuf
              portent la categorie « Goal Equipment » et soixante-huit
              sur soixante-dix la priorite « basse » — les deux ecrites
              par la synchronisation, aucune par une main. Aucun
              article n a jamais porte « haute » ni « critique ».
              Ce qui decide de l ordre d achat, c est le prix et
              l objectif ; le formulaire cesse de demander le reste.
              Les valeurs existantes sont relues et reecrites telles
              quelles : rien n est efface. */}
          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.prix", "Prix estimé")}</Label>
            <Input value={p.cost} onChange={(e) => p.setCost(e.target.value)} inputMode="decimal"
              className={`${champ} font-mono`} />
          </div>

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.objectif", "Objectif lié")}</Label>
            <Select value={p.goalId} onValueChange={p.setGoalId}>
              <SelectTrigger className={champ}>
                <SelectValue placeholder={t("wishlist.form.aucunObjectif", "Aucun")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("wishlist.form.aucunObjectif", "Aucun")}</SelectItem>
                {p.goals.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.lien", "Lien vers la boutique")}</Label>
            <Input value={p.url} onChange={(e) => p.setUrl(e.target.value)} placeholder="https://…"
              className={`${champ} font-mono text-xs`} />
          </div>

          <div className="space-y-2">
            <Label className={etiquette}>{t("wishlist.form.image", "Image")}</Label>
            <ChampImage value={p.imageUrl} onChange={p.setImageUrl} userId={p.userId} />
          </div>

          {p.setNotes && (
            <div className="space-y-2">
              <Label className={etiquette}>{t("wishlist.form.notes", "Notes")}</Label>
              <Textarea value={p.notes ?? ""} onChange={(e) => p.setNotes?.(e.target.value)} rows={3} className={champ} />
            </div>
          )}

          <div className="flex items-center justify-between gap-4 p-3 border border-[var(--wl-trait)]">
            <div>
              <p className="text-sm font-rajdhani font-semibold text-foreground">
                {t("wishlist.form.requis", "Requis pour le pacte")}
              </p>
              <p className="text-xs text-muted-foreground font-rajdhani">
                {t("wishlist.form.requisAide", "Une nécessité, pas une envie.")}
              </p>
            </div>
            <Switch checked={p.type === "required"} onCheckedChange={(v) => p.setType(v ? "required" : "optional")} />
          </div>

          <Button onClick={p.onSubmit} disabled={!p.name.trim() || p.busy}
            className="w-full font-mono tracking-[0.15em] uppercase text-xs">
            {p.submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
