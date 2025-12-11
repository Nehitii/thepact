import { NavLink } from "react-router-dom";
import { Home, Target, User, ShoppingBag, Users } from "lucide-react";

const navItems = [
  { to: "/shop", icon: ShoppingBag, label: "Shop" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/", icon: Home, label: "Home" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Outer glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent blur-xl" />
      </div>

      {/* Main bar with improved opacity for readability */}
      <div className="relative bg-gradient-to-b from-[#0a1525]/95 to-[#050d18]/98 backdrop-blur-2xl border-t border-primary/40 overflow-hidden">
        {/* Top border glow lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute top-[3px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Holographic reflection layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] pointer-events-none" />

        {/* Subtle scan line effect */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(91,180,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />

        <div className="max-w-lg mx-auto px-3">
          <div className="flex justify-between items-center h-18 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-all duration-300 group ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground/80 hover:text-primary/90"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active state background panel */}
                      {isActive && (
                        <>
                          {/* Glowing background */}
                          <div className="absolute inset-0 bg-primary/15 rounded-lg" />
                          {/* Outer border */}
                          <div className="absolute inset-0 border border-primary/50 rounded-lg" />
                          {/* Inner border for depth */}
                          <div className="absolute inset-[1px] border border-primary/20 rounded-[7px]" />
                          {/* Pulse animation */}
                          <div className="absolute inset-0 bg-primary/10 rounded-lg animate-neon-pulse" />
                          {/* Bottom indicator line */}
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                        </>
                      )}
                      
                      {/* Hover state */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 rounded-lg transition-all duration-300 border border-transparent group-hover:border-primary/30" />
                      )}
                      
                      {/* Icon container with glow */}
                      <div className="relative z-10 flex items-center justify-center h-6">
                        <Icon 
                          className={`h-5 w-5 transition-all duration-300 ${
                            isActive 
                              ? 'drop-shadow-[0_0_8px_rgba(91,180,255,0.9)] filter brightness-110' 
                              : 'drop-shadow-[0_0_2px_rgba(91,180,255,0.3)] group-hover:drop-shadow-[0_0_6px_rgba(91,180,255,0.7)]'
                          }`} 
                        />
                      </div>
                      
                      {/* Label with improved visibility */}
                      <span 
                        className={`relative z-10 text-[10px] font-orbitron uppercase tracking-wider mt-1 transition-all duration-300 ${
                          isActive 
                            ? 'font-bold text-primary drop-shadow-[0_0_6px_rgba(91,180,255,0.8)]' 
                            : 'font-medium text-muted-foreground/90 group-hover:text-primary/80 group-hover:drop-shadow-[0_0_4px_rgba(91,180,255,0.5)]'
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Corner accents on hover for inactive items */}
                      {!isActive && (
                        <>
                          <div className="absolute top-1 left-1 w-0 h-0 border-l border-t border-transparent group-hover:w-2 group-hover:h-2 group-hover:border-primary/50 transition-all duration-300 rounded-tl-sm" />
                          <div className="absolute bottom-1 right-1 w-0 h-0 border-r border-b border-transparent group-hover:w-2 group-hover:h-2 group-hover:border-primary/50 transition-all duration-300 rounded-br-sm" />
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
