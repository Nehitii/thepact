interface FocusConfigPanelProps {
  workMin: number;
  breakMin: number;
  onWorkChange: (v: number) => void;
  onBreakChange: (v: number) => void;
}

export function FocusConfigPanel({
  workMin,
  breakMin,
  onWorkChange,
  onBreakChange,
}: FocusConfigPanelProps) {
  return (
    <div className="w-full max-w-lg space-y-3 p-4 rounded-xl bg-card/40 backdrop-blur border border-border/50">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground text-center mb-3">
        Timer Configuration
      </p>
      <DurationRow
        label="Work"
        options={[15, 25, 30, 45]}
        value={workMin}
        onChange={onWorkChange}
        color="primary"
      />
      <DurationRow
        label="Break"
        options={[3, 5, 10, 15]}
        value={breakMin}
        onChange={onBreakChange}
        color="accent"
      />
    </div>
  );
}

function DurationRow({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
  color: "primary" | "accent";
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
      <span className="text-xs font-mono text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all ${
              value === m
                ? color === "primary"
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                  : "bg-accent text-accent-foreground shadow-[0_0_10px_hsl(var(--accent)/0.3)]"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
