/* LES DEUX ETINCELLES DU VISUEL DU PACTE.
 *
 * `Ember` monte, `StarFlash` scintille. Toutes deux sont decoratives,
 * animees, et ne servent qu a ce visuel — sorties de `PactVisual.tsx`
 * avec les neuf emblemes, pour la meme raison et par le meme geste.
 */

export function Ember({ color, index }: { color: string; index: number }) {
  const dx = (((index % 5) - 2) * 14).toFixed(0);
  const delay = (index * 0.4).toFixed(1);
  const dur = (1.3 + (index % 3) * 0.4).toFixed(1);
  return (
    <span
      aria-hidden
      style={
        {
          position: "absolute",
          bottom: "18%",
          left: `${42 + (index % 4) * 5}%`,
          width: 3 + (index % 2),
          height: 3 + (index % 2),
          borderRadius: "50%",
          background: index % 2 === 0 ? "#ff8c00" : "#ffdd00",
          ["--pv-dx" as string]: `${dx}px`,
          animation: `pv-ember ${dur}s ease-out ${delay}s infinite`,
          pointerEvents: "none",
        } as React.CSSProperties
      }
    />
  );
}

export function StarFlash({ color, index }: { color: string; index: number }) {
  const positions: React.CSSProperties[] = [
    { top: "2%", left: "8%" },
    { top: "12%", right: "6%" },
    { bottom: "8%", left: "4%" },
    { top: "55%", right: "2%" },
  ];
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        ...positions[index % 4],
        fontSize: 10,
        color,
        lineHeight: 1,
        animation: `pv-star-flash 3s ease-in-out ${index * 0.75}s infinite`,
        pointerEvents: "none",
      }}
    >
      ✦
    </span>
  );
}
