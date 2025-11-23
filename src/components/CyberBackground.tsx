export const CyberBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-cyber-scan"
          style={{ top: '20%' }}
        />
      </div>
      
      {/* Corner accent decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30" />
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
    </div>
  );
};
