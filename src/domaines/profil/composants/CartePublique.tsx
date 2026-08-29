/* LES TROIS PIECES DE LA CARTE PUBLIQUE : le relief, le nom, la rarete.
 *
 * Cent une lignes sorties de `ProfileBoundedProfile.tsx`, sous un
 * commentaire qui disait « SUB-COMPONENTS » — une etiquette qui ne dit
 * ni ce qu elles font ni pourquoi elles sont la.
 *
 * Elles vont ensemble : la carte se souleve au survol, le nom porte son
 * aberration chromatique, et la rarete donne les couleurs des deux. Un
 * pur deplacement — le compilateur suffit a le prouver, et l empreinte
 * de l ecran le confirme.
 */
import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export function HolographicCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;
    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        perspective: 1200,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full transition-all duration-200 ease-out"
    >
      <div className="relative h-full transform-style-3d shadow-2xl shadow-black/80 rounded-[20px] overflow-hidden bg-[var(--surface-elevated)] border border-border group">
        {/* Holographic Shine Effect overlay on mouse move */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[60] mix-blend-overlay"
          style={{
            background: useTransform(
              mouseX,
              [-0.5, 0.5],
              [
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
                "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.1) 35%, transparent 40%)",
              ],
            ),
          }}
        />

        {children}

        {/* Static Noise Grain */}
        <div className="absolute inset-0 z-[50] pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </motion.div>
  );
}

/* Les deux calques colores sont une aberration chromatique au survol.
   Sans `aria-hidden`, un lecteur d ecran annoncait le pseudo trois fois
   de suite. */
export const CyberText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <div className={`relative group/nom inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span aria-hidden="true" className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-400 opacity-0 group-hover/nom:opacity-70 group-hover/nom:translate-x-[1px] transition-all duration-75 select-none blur-[0.5px]">
        {text}
      </span>
      <span aria-hidden="true" className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 group-hover/nom:opacity-70 group-hover/nom:-translate-x-[1px] transition-all duration-75 delay-75 select-none blur-[0.5px]">
        {text}
      </span>
    </div>
  );
};
