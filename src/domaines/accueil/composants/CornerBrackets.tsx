import { useThemeSombre } from "@/socle/hooks/useThemeSombre";

/* Le cyan a 0,3 d alpha est fait pour un fond de nuit ; sur du papier
   il n existe pas. Ces equerres sont des REPERES DE CALAGE, et un
   repere de calage s imprime en encre. C est le seul defaut par
   defaut : un appelant qui passe sa propre couleur garde la main. */
const CALAGE_PAPIER = "rgba(20,24,26,0.5)";

interface CornerBracketsProps {
  color?: string;
  size?: number;
}

export function CornerBrackets({ color, size = 12 }: CornerBracketsProps) {
  const sombre = useThemeSombre();
  const trait = color ?? (sombre ? "rgba(0,210,255,0.3)" : CALAGE_PAPIER);
  const style = (top: boolean, left: boolean): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    ...(top ? { top: -1 } : { bottom: -1 }),
    ...(left ? { left: -1 } : { right: -1 }),
    borderColor: trait,
    borderStyle: "solid",
    borderWidth: 0,
    ...(top && left && { borderTopWidth: 1, borderLeftWidth: 1 }),
    ...(top && !left && { borderTopWidth: 1, borderRightWidth: 1 }),
    ...(!top && left && { borderBottomWidth: 1, borderLeftWidth: 1 }),
    ...(!top && !left && { borderBottomWidth: 1, borderRightWidth: 1 }),
    pointerEvents: "none" as const,
  });

  return (
    <>
      <div style={style(true, true)} />
      <div style={style(true, false)} />
      <div style={style(false, true)} />
      <div style={style(false, false)} />
    </>
  );
}
