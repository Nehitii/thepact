import { useEffect, useMemo, useState } from "react";
import {
  apercuDeLExistant, fusionDeDeuxArticles, prixCorrige, prixDuFormulaire, prixEnregistre,
} from "@/domaines/souhaits/logique/prix";
import { useTranslation } from "react-i18next";
import { DSPageShell } from "@/socle/ds";
import { useAuth } from "@/socle/contextes/AuthContext";
import { useCurrency } from "@/socle/contextes/CurrencyContext";
import { formatCurrency } from "@/socle/outils/currency";
import { toast } from "sonner";
import { format } from "date-fns";
import { depenseDUnAchat, moisDeLAchat } from "@/domaines/souhaits/logique/acquisition";
import { fr as dateFr } from "date-fns/locale";
import { useEcrirePointage, useEffacerPointage } from "@/domaines/finance";
import { Globe, Plus } from "lucide-react";
import {
  PactWishlistItemType,
  WishlistPriority,
  useCreatePactWishlistItem,
  useDeletePactWishlistItem,
  usePactWishlistItems,
  useUpdatePactWishlistItem,
  type PactWishlistItem,
} from "@/domaines/souhaits/hooks/usePactWishlist";
import { usePact } from "@/domaines/objectifs";
import { useGoals } from "@/domaines/objectifs";
import { useWishlistGoalSync } from "@/domaines/souhaits/hooks/useWishlistGoalSync";
import { useWishlistPieces } from "@/domaines/souhaits/hooks/useWishlistPieces";
import { useDepotImages } from "@/domaines/souhaits/hooks/useDepotImages";
import { cheminDuDepot } from "@/domaines/souhaits/logique/wishlistDepot";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/domaines/souhaits/composants/DuplicateMergeDialog";
import { ImportFromUrlModal, type ScrapedProduct } from "@/domaines/souhaits/composants/ImportFromUrlModal";
import { DeleteConfirmDialog } from "@/domaines/souhaits/composants/DeleteConfirmDialog";
import { WishlistFiche } from "@/domaines/souhaits/composants/WishlistFiche";

/* La forme de la liste, retenue d une visite a l autre. */
import { WishlistRegistre } from "@/domaines/souhaits/composants/WishlistRegistre";
import { GestionDesListes } from "@/domaines/souhaits/composants/GestionDesListes";
import { useListesWishlist } from "@/domaines/souhaits/hooks/useWishlistLists";
import { WishlistArchive } from "@/domaines/souhaits/composants/WishlistArchive";
import "@/domaines/souhaits/souhaits.css";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { FormulaireArticle } from "@/domaines/souhaits/composants/FormulaireArticle";
import { trouverDoublon } from "@/domaines/souhaits/logique/doublons";
import type { Vue, Tri } from "@/domaines/souhaits/types";
import { compterLesArticles, filtrerEtTrier } from "@/domaines/souhaits/logique/inventaire";
import { BandeauMesures } from "@/domaines/souhaits/composants/BandeauMesures";
import { BarreListe } from "@/domaines/souhaits/composants/BarreListe";
import { DndContext, rectIntersection } from "@dnd-kit/core";
import { OngletsDeVue } from "@/domaines/souhaits/composants/OngletsDeVue";
import { useRangementParGlissement } from "@/domaines/souhaits/hooks/useRangementParGlissement";

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

/* « libre » a disparu, et avec lui la notion de HORS PACTE.
   C etait une categorie negative : tout ce qui ne rentrait nulle
   part ailleurs. Depuis qu on peut nommer ses listes, mieux vaut une
   liste qu on baptise qu un orphelinat — les articles qui y
   trainaient ont ete rattaches par migration, sans qu aucun ne
   bouge. Une vue vaut donc « tout », « pacte », ou l identifiant
   d une liste. */

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
    const garde = typeof window !== "undefined" ? window.localStorage.getItem(PREF.WISHLIST_VUE) : null;
    /* Une liste supprimee laisse sa cle dans le stockage : la vue est
       verifiee plus bas, une fois les listes connues. */
    return garde || "tout";
  });
  useEffect(() => {
    window.localStorage.setItem(PREF.WISHLIST_VUE, vue);
  }, [vue]);

  const [recherche, setRecherche] = useState("");

  /* VITRINE OU REGISTRE.

     Quatre-vingt-trois articles en tuiles a photo font vingt-neuf
     ecrans, dont 86 % de surface d image. La vitrine est belle pour
     choisir ; elle est aveugle pour compter, comparer, retrouver.

     Le registre est la ligne de l archive, appliquee a la liste
     active : tranche rouge sur le flanc, nom, provenance, prix,
     gestes. Rien n est perdu — seule l image s en va, et c est elle
     qu on retirait.

     Retenu en localStorage : un reglage de lecture sur une page. */
  const [affichage, setAffichage] = useState<"vitrine" | "registre">(() => {
    try {
      return localStorage.getItem(PREF.WISHLIST_AFFICHAGE) === "registre" ? "registre" : "vitrine";
    } catch { return "vitrine"; }
  });
  useEffect(() => {
    try { localStorage.setItem(PREF.WISHLIST_AFFICHAGE, affichage); } catch { /* stockage indisponible */ }
  }, [affichage]);
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
  const [editListId, setEditListId] = useState("none");
  const [newListId, setNewListId] = useState("none");
  const { data: listesWishlist = [] } = useListesWishlist(user?.id);
  /* LE GESTE QUI MANQUAIT. Les listes existaient, la mutation qui y
     range un article existait, et rien ne les reliait. */
  const glisse = useRangementParGlissement(items);
  const rangementOffert = useMemo(
    () => ({ listes: listesWishlist, onRanger: glisse.rangerDirectement }),
    [listesWishlist, glisse.rangerDirectement],
  );
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

  /* Les comptes et le filtre vivent dans `logique/inventaire.ts` :
     ce sont des nombres et un ordre, et les deux se trompent sans
     bruit. */
  const comptes = useMemo(() => compterLesArticles(items, goals), [items, goals]);

  const vus = useMemo(
    () => filtrerEtTrier({ vue, items, comptes, recherche, tri }),
    [vue, items, comptes, recherche, tri],
  );

  // ═══ GESTES ═══

  const ouvrirEdition = (item: PactWishlistItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditCost(String(item.estimated_cost ?? 0));
    setEditType(item.item_type);
    setEditNotes(item.notes ?? "");
    setEditGoalId(item.goal_id ?? "none");
    setEditListId((item as { list_id?: string | null }).list_id ?? "none");
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
      const nombre = prixCorrige(valeur);
      if (nombre === null) return;
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

    /* Les trois refus silencieux — hors pacte, montant lisible et non
       nul — vivent dans logique/acquisition.ts, avec leur pourquoi. */
    const issue = depenseDUnAchat(items.find((i) => i.id === id));
    if ("refus" in issue) return;
    const montant = issue.ligne.montant_reel;

    const { debut, cle: mois } = moisDeLAchat(new Date());
    const moisLisible = format(debut, "MMMM yyyy", { locale: dateFr });

    if (acquired) {
      ecrirePointage.mutate({ mois, ...issue.ligne }, {
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
      cost: prixEnregistre(item.estimated_cost),
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
    const prix = prixDuFormulaire(newCost);
    const objectif = newGoalId === "none" ? null : newGoalId;

    if (!opts?.skipDuplicateCheck) {
      const doublon = trouverDoublon({ items, name: nom, goalId: objectif });
      if (doublon) {
        const complet = items.find((i) => i.id === doublon.id);
        setMergeMode("create");
        setMergeDuplicateId(doublon.id);
        setMergeExistingPreview(apercuDeLExistant(complet, doublon));
        setMergeIncomingPreview({
          name: nom, goalId: objectif,
          goalName: objectif ? goals.find((g) => g.id === objectif)?.name ?? null : null,
          category: newCategory.trim() || null,
          estimatedCost: prix, itemType: newType, notes: null,
        });
        setMergeOpen(true);
        return;
      }
    }

    try {
      await createItem.mutateAsync({
        userId: user.id, name: nom,
        estimatedCost: prix,
        itemType: newType, category: newCategory.trim() || null,
        goalId: objectif,
        listId: newListId === "none" ? null : newListId,
        url: newUrl.trim() || null,
        imageUrl: newImageUrl.trim() || null, priority: newPriority,
      });
      setNewName(""); setNewCost(""); setNewCategory(""); setNewType("optional");
      setNewUrl(""); setNewImageUrl(""); setNewGoalId("none"); setNewListId("none"); setNewPriority("low");
      setNewOpen(false);
    } catch {
      /* La mutation a deja prevenu. */
    }
  };

  const enregistrerEdition = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user || !editId) return;
    const nom = editName.trim();
    if (!nom) return;
    const prix = prixDuFormulaire(editCost);
    const objectif = editGoalId === "none" ? null : editGoalId;

    if (!opts?.skipDuplicateCheck) {
      const doublon = trouverDoublon({ items, name: nom, goalId: objectif, excludeId: editId });
      if (doublon) {
        const complet = items.find((i) => i.id === doublon.id);
        setMergeMode("edit");
        setMergeDuplicateId(doublon.id);
        setMergeExistingPreview(apercuDeLExistant(complet, doublon));
        setMergeIncomingPreview({
          name: nom, goalId: objectif,
          goalName: objectif ? goals.find((g) => g.id === objectif)?.name ?? null : null,
          category: editCategory.trim() || null,
          estimatedCost: prix,
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
          estimated_cost: prix,
          item_type: editType, notes: editNotes.trim() || null,
          goal_id: objectif,
          /* Exclusif par contrainte de table : un objectif chasse la
             liste, et le formulaire l'a déjà fait côté écran. */
          list_id: objectif ? null : (editListId === "none" ? null : editListId),
          url: editUrl.trim() || null,
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
      await updateItem.mutateAsync({
        userId: user.id, id: mergeDuplicateId,
        patch: fusionDeDeuxArticles(garde, mergeIncomingPreview),
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

  /* UNE VUE QUI NE DESIGNE PLUS RIEN RETOMBE SUR « GLOBAL ». La liste
     retenue au dernier passage peut avoir ete supprimee depuis, et un
     onglet actif sans onglet correspondant laisse la page vide sans
     rien dire. On attend d avoir les listes pour juger. */
  useEffect(() => {
    if (vue === "tout" || vue === "pacte") return;
    if (!listesWishlist.length) return;
    if (!listesWishlist.some((l) => l.id === vue)) setVue("tout");
  }, [vue, listesWishlist]);


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
        listId={newListId} setListId={setNewListId}
        listes={listesWishlist}
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
        listId={editListId} setListId={setEditListId}
        listes={listesWishlist}
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
          <DndContext
            sensors={glisse.capteurs}
            collisionDetection={rectIntersection}
            onDragStart={glisse.auDepart}
            onDragEnd={glisse.aLArrivee}
            onDragCancel={glisse.aLAbandon}
          >
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

          {/* ── Les vues, qui sont aussi les cibles du rangement ── */}
          <OngletsDeVue
            vue={vue} setVue={setVue} enVol={glisse.article}
            total={items.length} duPacte={comptes.duPacte.length}
            parListe={comptes.parListe} listes={listesWishlist}
          />

          <BandeauMesures vue={vue} comptes={comptes} currency={currency} nbArticles={items.length} />
          <BarreListe vue={vue} recherche={recherche} setRecherche={setRecherche} tri={tri} setTri={setTri} affichage={affichage} setAffichage={setAffichage} />

          {/* LES LISTES NE CONCERNENT PAS LE PACTE.
              Un poste rattaché à un objectif est financé par le pacte et
              ne peut pas rejoindre une liste — la table le refuse. Le
              panneau ne se montre donc pas dans la vue du pacte, où il
              n'aurait rien à ranger. */}
          {vue !== "pacte" && (
            <GestionDesListes
              userId={user?.id}
              listeActive={vue === "tout" ? null : vue}
            />
          )}

          {/* Cent trente tabulations separaient l en-tete de
              l archive : ce lien les enjambe, et ne se montre qu au
              clavier. */}
          {vus.acquis.length > 0 && vue !== "pacte" && (
            <a className="wl-saut" href="#wl-archive">
              {t("wishlist.saut", "Aller à l’archive")}
            </a>
          )}

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
                items={vus.tous} currency={currency} pieces={pieces} listes={listesWishlist}
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
                affichage === "registre" ? (
                  /* LE REGISTRE HORS PACTE SE GROUPE AUSSI.
                     Il posait soixante-neuf lignes à plat : c'était la
                     seule forme possible tant que rien ne les rangeait.
                     Maintenant que les listes existent, le même composant
                     que la vue du pacte sait les tenir — et ce qui
                     n'appartient à rien retombe dans « Sans objectif »,
                     comme avant. */
                  <WishlistRegistre
                    items={vus.actifs} currency={currency} pieces={pieces} listes={listesWishlist}
                    onEdit={ouvrirEdition} onDelete={demanderSuppression} onToggleAcquired={basculerAcquis}
                    onRanger={vue === "pacte" ? undefined : glisse.rangerDirectement}
                  />
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
                      rangement={vue === "pacte" ? undefined : rangementOffert}
                    />
                  ))}
                </div>
                )
              )}

              <WishlistArchive
                items={vus.acquis} currency={currency} pieces={pieces}
                onToggleAcquired={basculerAcquis} onEdit={ouvrirEdition}
              />
            </>
          )}
          </DndContext>
        </div>
      </div>
    </DSPageShell>
  );
}
