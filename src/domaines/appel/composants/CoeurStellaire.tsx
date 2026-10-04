import { useEffect, useRef } from "react";
import {
  RENDU, clamp01, contractionDuCoeur, intensiteDuFond, lobesDuCoeur, rayonDuCoeur, renduDe,
  souffleDuCoeur, teinte, transformationDePhase,
  type PhaseCoeur, type Rendu,
} from "@/domaines/appel/logique/coeur";
import {
  avancerLaMain, avancerLeRecit, mainNeuve, recitNeuf,
  type EtatDeLaMain, type EtatDuRecit, type EvenementMain,
} from "@/domaines/appel/logique/coeurRecit";
import { avancerLaFaille, construireLaFaille, failleNeuve } from "@/domaines/appel/logique/faille";
import {
  ECARTEMENT, avancerLaFusion, horlogeDeLaFusionNeuve, pureteDuScript,
} from "@/domaines/appel/logique/fusion";
import { dosageNeuf, lireLeMontage, suivreLeFocus } from "@/domaines/appel/logique/montage";
import { forceDesJets } from "@/domaines/appel/logique/nervure";
import { creerLesAnneaux } from "@/domaines/appel/composants/toile/anneaux";
import { creerLaCamera } from "@/domaines/appel/composants/toile/camera";
import { creerLeChamp } from "@/domaines/appel/composants/toile/champ";
import { creerLesOndes, tracerLaGrille, tracerLeFond } from "@/domaines/appel/composants/toile/decor";
import {
  tracerLaDetonation, tracerLaFaille, tracerLaPromesse, tracerLeCol,
} from "@/domaines/appel/composants/toile/evenements";
import { creerLaFin } from "@/domaines/appel/composants/toile/fin";
import { creerLesJets } from "@/domaines/appel/composants/toile/jets";
import { creerLaMatiere } from "@/domaines/appel/composants/toile/matiere";
import { creerLeNexus } from "@/domaines/appel/composants/toile/nexus";
import { creerLesPlumes } from "@/domaines/appel/composants/toile/plumes";

export type { EvenementMain, PhaseCoeur };

/* LE COEUR
 *
 * Vingt secondes de patience doivent ressembler a quelque chose. Ce
 * n est pas une barre de progression deguisee : c est un reacteur. Un
 * nexus — une sphere, avec son limbe, sa matiere et ses eclairs — que
 * cinq corps orbitent, qu un disque de matiere nourrit, et qui crache
 * des protuberances puis deux jets. A la fin il gonfle, s effondre, se
 * tait, et projette : le souffle efface tout, les jets restent.
 *
 * Tout est peint sur une seule toile, hors de React : la boucle lit des
 * references, elle ne declenche aucun rendu. Chaque calque vit dans
 * `composants/toile/`, chaque nombre qui compte dans `logique/` — ici ne
 * reste que l ORDRE : qui se peint avant le coeur, qui apres, et ce que
 * la table de montage accorde a chacun.
 *
 * Cinq comportements sont en options :
 *   « recit »   — quatre seuils, chacun avec son evenement
 *   « matiere » — le disque d accretion, ses grains et leurs impacts
 *   « gravite » — la grille se courbe vers le coeur, et le coeur la refracte
 *   « main »    — le coeur repond a l appui et au relachement
 *   « apres »   — un astre calme se leve apres le rituel
 */

export interface OptionsCoeur {
  recit?: boolean;
  matiere?: boolean;
  gravite?: boolean;
  main?: boolean;
  apres?: boolean;
}

interface CoeurStellaireProps {
  progres: React.MutableRefObject<number>;
  phase: PhaseCoeur;
  immobile: boolean;
  /** Le coeur se centre sur CET element, pas sur la toile. */
  cible: React.RefObject<HTMLElement>;
  options?: OptionsCoeur;
  /** La page y depose « appui » ou « rupture » ; la boucle les consomme. */
  evenements?: React.MutableRefObject<EvenementMain[]>;
}

const rendu = (): Rendu =>
  renduDe(typeof document === "undefined" || document.documentElement.classList.contains("dark"));

/* CE QUI COUTE A LA FIN NE SE VOIT PAS DANS LE TEMPS DE DESSIN : ce sont
   de grandes surfaces translucides empilees — halo, cendre, anneaux de
   souffle, boule de feu —, un travail proportionnel au nombre de PIXELS.
   A deux fois la densite, une fenetre de 1600 par 900 en fait 5,8
   millions a remplir plusieurs fois par image. On borne donc le nombre
   total de pixels, pas la densite : les petites toiles gardent leur
   nettete, les grandes cessent de payer une definition que personne ne
   regarde de si pres. */
const PIXELS_MAX = 2.6e6;

/* L ECHELLE DE LA SCENE EST CELLE DU BANC. Le coeur se centre sur la
   prise et en tirait aussi sa taille : la moitie de son diametre, 150 px
   sur un ecran de bureau. Mais tout ce qui fait le cinema a ete regle sur
   une prise de 176 px, donc une base de 88 : la table de montage, la
   portee du halo, les jets qui sortent du cadre sans que leur pavillon
   sorte avec eux, la faille dont le pic couvre une maille de grille. A
   150, la scene est 1,7 fois plus grande, et mesure a l appui : 30 % de
   noir a p 0,95 au lieu de 72 %, et un faisceau dont on ne voit plus que
   la lame. La base reste celle de la prise sur les ecrans ou elle est
   plus petite. */
const BASE_DE_LA_SCENE = 88;

export function CoeurStellaire({
  progres, phase, immobile, cible, options, evenements,
}: CoeurStellaireProps) {
  const toileRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<PhaseCoeur>(phase);
  const optionsRef = useRef<OptionsCoeur>(options ?? {});
  /* Une reference, pas une dependance : changer le reglage en cours de
     rituel ne doit pas refaire toute la scene. */
  const immobileRef = useRef(immobile);

  useEffect(() => { optionsRef.current = options ?? {}; }, [options]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { immobileRef.current = immobile; }, [immobile]);

  useEffect(() => {
    const toile = toileRef.current;
    if (!toile) return;
    const ctx = toile.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1, largeur = 0, hauteur = 0;
    const redimensionner = () => {
      largeur = toile.clientWidth;
      hauteur = toile.clientHeight;
      const souhaite = Math.min(window.devicePixelRatio || 1, 2);
      dpr = Math.max(1, Math.min(souhaite, Math.sqrt(PIXELS_MAX / Math.max(1, largeur * hauteur))));
      toile.width = Math.round(largeur * dpr);
      toile.height = Math.round(hauteur * dpr);
    };
    redimensionner();
    const observateur = new ResizeObserver(redimensionner);
    observateur.observe(toile);

    /* L etat de la scene vit ici et dans ses calques, pas dans React. */
    let recit: EtatDuRecit = recitNeuf();
    let main: EtatDeLaMain = mainNeuve();
    const anneaux = creerLesAnneaux(ctx);
    const champ = creerLeChamp();
    const nexus = creerLeNexus(ctx, champ);
    const matiere = creerLaMatiere(ctx);
    const plumes = creerLesPlumes(ctx);
    const jets = creerLesJets(ctx);
    const fin = creerLaFin(ctx);
    const ondes = creerLesOndes(ctx);
    const faille = failleNeuve();
    const horlogeDeLaFusion = horlogeDeLaFusionNeuve();
    const dosage = dosageNeuf();
    let focusDeLaFusion = 0;
    const camera = creerLaCamera();
    /* Un ecran ou l on tient du doigt : le sujet y remonte au tiers. */
    const tactile = window.matchMedia("(pointer: coarse)");

    /* L HORLOGE DE LA TOILE EST ACCUMULEE, image par image, et chaque pas
       est borne a un vingtieme de seconde. Un onglet mis en arriere-plan
       ne fait donc rien sauter : la fusion, le verrou, la faille et la
       phase reprennent ou ils en etaient. La phase se date sur CETTE
       horloge, au moment ou la boucle la voit changer. */
    let horloge = 0;
    let phaseVue = phaseRef.current;
    let debutPhase = 0;
    let precedent = performance.now();
    let vivant = true;
    let boucleId = 0;

    const dessiner = (maintenantReel: number) => {
      if (!vivant) return;
      const dt = Math.max(0, Math.min((maintenantReel - precedent) / 1000, 0.05));
      precedent = maintenantReel;
      horloge += dt * 1000;
      const maintenant = horloge;

      const o = optionsRef.current;
      const immobile = immobileRef.current;
      const p = clamp01(progres.current);
      const ph = phaseRef.current;
      if (ph !== phaseVue) {
        phaseVue = ph;
        debutPhase = maintenant;
        /* Le verrou du souffle ne survit pas hors de la projection, et la
           quitter le coupe net : les jets tombent pendant que les mots
           s effacent, puis l astre se leve. La faille se ferme d un coup
           elle aussi — refermee en douceur, sa couture brillait un tiers
           de seconde sur le trace des jets qu on venait d eteindre. */
        if (ph !== "projection") fin.desarmer();
        if (ph === "verrouille") { fin.arreter(); faille.ouverture = 0; }
      }
      const depuis = (maintenant - debutPhase) / 1000;
      const r = rendu();

      // ── Ce que la main et le recit deviennent ────────────────
      main = avancerLaMain(main, dt, o.main ? evenements?.current.splice(0) ?? [] : [], !!o.main);
      const avance = avancerLeRecit(recit, p, dt, !!o.recit);
      recit = avance.etat;
      if (avance.onde) ondes.seuil();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, largeur, hauteur);
      if (largeur === 0 || hauteur === 0) { boucleId = requestAnimationFrame(dessiner); return; }

      const boite = cible.current?.getBoundingClientRect();
      const cadre = toile.getBoundingClientRect();
      const cx = boite ? boite.left - cadre.left + boite.width / 2 : largeur / 2;
      const cy = boite ? boite.top - cadre.top + boite.height / 2 : hauteur / 2;
      const base = Math.min(
        BASE_DE_LA_SCENE,
        (boite ? Math.min(boite.width, boite.height) : Math.min(largeur, hauteur) * 0.3) * 0.5,
      );
      const c = teinte(p);

      const { echelle, eclat, calme, naissance } =
        transformationDePhase(ph, depuis, recit.eclatSeuil, !!o.apres);
      /* LE REGIME PERMANENT EST UN ETAT, PAS UNE ANIMATION : il ne reste
         que les jets sur fond noir et le nexus ultra comprime. Un jet dans
         un ciel charge est un detail de plus ; le meme jet dans le noir est
         le sujet. Le silence commence un temps plus tot, au temps mort. */
      const regime = ph === "projection";
      const muette = regime || ph === "tempsMort";
      /* L astre d apres differe en nature, pas en taille : une coquille au
         repos, une derive lente, et rien d autre. */
      const auRepos = calme > 0;
      const force = forceDesJets(ph, depuis, p);

      /* LA TABLE DE MONTAGE SE LIT AVANT LE FOND, c est le premier calque
         qu elle dose — et la fusion, qui la commande quand elle lutte, se
         calcule avant elle. */
      const fusion = avancerLaFusion(horlogeDeLaFusion, recit.scission, maintenant);
      focusDeLaFusion = suivreLeFocus(focusDeLaFusion, fusion.luttant, dt);
      lireLeMontage(dosage, p, auRepos ? 0 : 1, focusDeLaFusion);

      /* LE RAYON DU COEUR SE CALCULE UNE FOIS, ET TOT : l occlusion des
         anneaux, la chute des grains et le pied de la faille le lisent
         avant que le coeur ne soit peint. */
      const rCoeur = rayonDuCoeur(
        base, echelle, souffleDuCoeur(maintenant, p, immobile), p,
        contractionDuCoeur(main.impulsion), calme,
      );
      avancerLaFaille(faille, dt, maintenant, base, recit.seuilAtteint >= 2 && !immobile);
      if (faille.ouverture > 0.001) construireLaFaille(faille, cx, cy, base, rCoeur);

      /* LE SOUFFLE SE DECIDE AVANT LA GRILLE, pour qu elle puisse
         l encaisser. */
      const souffle = fin.souffle(regime, maintenant, cx, cy, p, largeur, hauteur, immobile);

      /* L OEIL. La camera lit ce qui vient d arriver — un seuil, le clac
         du verrou, la faille, l union, le souffle — et pose son cadre :
         travelling, sujet remonte sous le doigt, secousse, bandes. La
         grille et les aplats couvrent ensuite le champ qu elle voit. */
      camera.avancer({
        dt, maintenant, p, phase: ph, depuis, cx, cy, hauteur, tactile: tactile.matches, immobile,
        seuil: avance.onde, aCoup: anneaux.aCoup(maintenant, immobile), failleOuverte: faille.ouverture > 0.001,
        union: fusion.union, souffle: souffle.actif, puissanceDeLaFusion: fusion.puissance,
        excentrique: recit.excentrique,
      });
      camera.appliquer(ctx);
      const vue = camera.vue(largeur, hauteur);

      // ── Le fond et la grille ─────────────────────────────────
      /* Le fond n est pas peint sous ce qui l efface : passe le quart du
         souffle, le balayage vide deja la moitie du cadre. */
      if (!muette && (!souffle.actif || souffle.u < 0.28)) {
        const intensite = intensiteDuFond(p, recit.eclatSeuil, calme, naissance)
          * (1 + fusion.puissance * 0.55) * dosage.fond;
        tracerLeFond(ctx, cx, cy, base, largeur, hauteur, c, p, intensite, dosage.fond, dosage.portee);
      }
      /* La grille reste peinte pendant le souffle : sans elle, il n y
         aurait rien a souffler. */
      if (o.gravite && !muette && (echelle > 0.02 || (souffle.actif && souffle.u < 0.5))) {
        tracerLaGrille(ctx, cx, cy, base, vue, c, p, dosage.grille, faille, souffle);
      }
      ctx.globalCompositeOperation = r.fusion;
      if (!muette) tracerLaFaille(ctx, faille, cx, cy, c, r, maintenant, force);

      if (echelle > 0.02) {
        if (muette) ondes.vider();
        else ondes.avancerEtTracer(dt, maintenant, cx, cy, echelle, largeur, hauteur, c, p, immobile, dosage.ondes);

        // ── Ce qui passe derriere le coeur ─────────────────────
        const matiereVive = !!o.matiere && !auRepos && !muette;
        if (matiereVive && !immobile) matiere.avancer(dt, p, Math.max(0.4, rCoeur / (base * echelle || 1)));
        anneaux.avancer(dt, p, recit, immobile, maintenant);
        const echs = anneaux.echantillonner({
          p, base, echelle, eclat, cx, cy,
          impulsion: main.impulsion, purge: main.purge, ecarts: main.ecarts, excentrique: recit.excentrique,
        }, maintenant);
        const plumesVives = !auRepos && !muette;
        if (plumesVives) plumes.avancer(dt, p, maintenant, recit.seuilAtteint >= 1, immobile);
        else plumes.vider();

        /* LES DEUX PASSES. Tout ce qui tourne autour du coeur se peint en
           deux moities : l arriere avant lui, l avant apres. C est ce qui le
           fait passer derriere les corps, la matiere, les protuberances et
           le jet qui vient vers nous — sans une ligne de plus par calque.
           L AVANT SE PEINT DANS L ORDRE INVERSE : les anneaux creusent ce
           qui est deja peint, et c est en dernier qu ils passent devant. */
        const calques: ((devant: boolean) => void)[] = [
          (devant) => {
            if (muette) return;
            ctx.globalAlpha = dosage.anneaux;
            anneaux.tracer(devant, echs, c, p, rCoeur, cx, cy, r, maintenant, fin.retenir);
            anneaux.tracerLeVerrou(devant, echs, r, maintenant, immobile);
            ctx.globalAlpha = 1;
          },
          (devant) => {
            if (!matiereVive) return;
            ctx.globalAlpha = dosage.matiere;
            matiere.tracer(devant, cx, cy, base, echelle, c, p, rCoeur, r, fin.retenir);
            ctx.globalAlpha = 1;
          },
          (devant) => {
            if (!regime) jets.tracer(devant, cx, cy, base, rCoeur, c, p, r, maintenant, force);
          },
          (devant) => {
            if (!plumesVives) return;
            ctx.globalAlpha = dosage.plumes;
            plumes.tracer(devant, cx, cy, rCoeur, c, p, r, maintenant);
            ctx.globalAlpha = 1;
          },
        ];
        for (const calque of calques) calque(false);

        // ── Le coeur ───────────────────────────────────────────
        /* L ecart monte a 0,34 de la base : en dessous, les deux noyaux ne
           se detachaient jamais de leur propre halo, et une scission qu on
           devine n est pas une scission. Rapporte au rayon, c est l unite
           des eclairs et du champ. */
        const separation = fusion.ecart * base * ECARTEMENT * echelle;
        const ecartRelatif = rCoeur > 1 ? separation / rCoeur : 0;
        const deuxLobes = lobesDuCoeur(cx, cy, separation).length > 1;
        const purete = pureteDuScript(ecartRelatif, deuxLobes);
        if (rCoeur > 1) {
          champ.peindreUneImageSurDeux(c, p, maintenant / 1000, ecartRelatif * 0.63, purete);
          nexus.avancerLaSurface(dt, main.impulsion);
          if (!auRepos && !muette) champ.avancerLesEclairs(dt, p, maintenant, ecartRelatif, immobile);
          else champ.eteindre();
          nexus.peindre(
            cx, cy, rCoeur, c, p, eclat * (1 + fusion.puissance * 0.95), maintenant, r,
            deuxLobes ? separation : 0, o.gravite ? { cx, cy, base } : null, dosage.aura, purete,
          );
          if (deuxLobes && fusion.puissance > 0.02) tracerLeCol(ctx, cx, cy, rCoeur, fusion.puissance, c, r);
          if (fusion.puissance > 0.12 && !auRepos) {
            tracerLaPromesse(ctx, cx, cy, rCoeur, base, fusion.puissance, maintenant, c, r);
          }
        } else champ.eteindre();
        if (fusion.union) tracerLaDetonation(ctx, cx, cy, rCoeur, fusion.tDeLUnion, largeur, hauteur, -vue.x0, -vue.y0, c, r);

        for (let i = calques.length - 1; i >= 0; i--) calques[i](true);
      }

      // ── Ce qui jaillit de l effondrement ─────────────────────
      if (souffle.actif) fin.tracer(cx, cy, largeur, hauteur, c, p, r, souffle.depuis, dt, immobile);

      /* LES JETS DU REGIME SE PEIGNENT APRES LE SOUFFLE — c est un ordre,
         pas un reglage. Son balayage RETIRE tout ce qui a ete peint avant
         lui, pendant pres de quatre secondes : peints avant, les jets
         etaient traces puis effaces a chaque image, et la projection
         commencait par quatre secondes de rien. */
      if (regime) {
        ctx.globalCompositeOperation = r.fusion;
        jets.tracer(false, cx, cy, base, rCoeur, c, p, r, maintenant, force, true);
        jets.tracer(true, cx, cy, base, rCoeur, c, p, r, maintenant, force, true);
      }

      /* Les bandes, a l ecran : hors de la camera, elles ne tremblent pas. */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      camera.tracerLesBandes(ctx, largeur, hauteur, r === RENDU.sombre);

      ctx.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      boucleId = requestAnimationFrame(dessiner);
    };

    boucleId = requestAnimationFrame(dessiner);
    return () => {
      vivant = false;
      cancelAnimationFrame(boucleId);
      observateur.disconnect();
    };
  }, [progres, cible, evenements]);

  return (
    <canvas
      ref={toileRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
