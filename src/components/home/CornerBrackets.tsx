interface CornerBracketsProps {
  color?: string;
  size?: number;
}

export function CornerBrackets({ color = "rgba(0,210,255,0.3)", size = 12 }: CornerBracketsProps) {
  const style = (top: boolean, left: boolean): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    ...(top ? { top: -1 } : { bottom: -1 }),
    ...(left ? { left: -1 } : { right: -1 }),
    borderColor: color,
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
