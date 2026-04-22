export const CyberBackground = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden motion-reduce:hidden cyber-bg-root"
      style={{ contain: "strict" as const }}
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Glowing orbs (hidden when tab is hidden via .tab-hidden on <html>) */}
      <div
        className="cyber-orb absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float"
        style={{ willChange: "transform" }}
      />
      <div
        className="cyber-orb absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "-2s", willChange: "transform" }}
      />
    </div>
  );
};
