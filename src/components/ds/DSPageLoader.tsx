interface DSPageLoaderProps {
  variant?: "minimal" | "verbose";
  message?: string;
}

/**
 * Centered full-screen loader. Use as Suspense fallback or initial data loading state.
 */
export function DSPageLoader({ variant = "minimal", message }: DSPageLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin motion-reduce:animate-pulse"
          role="status"
          aria-label="Loading"
        />
        {variant === "verbose" && (
          <span className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/40">
            {message ?? "Initializing..."}
          </span>
        )}
      </div>
    </div>
  );
}