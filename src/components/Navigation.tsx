import { NavLink } from "react-router-dom";
import { Home, Target, DollarSign, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/finance", icon: DollarSign, label: "Finance" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t-2 border-primary/30 shadow-[0_-4px_20px_rgba(91,180,255,0.2)] z-50">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center h-16 relative">
          {/* Background scan effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-cyber-scan" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-sm transition-all duration-300 group ${
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 rounded-sm border border-primary/30 shadow-[0_0_15px_rgba(91,180,255,0.3)] animate-neon-pulse" />
                    )}
                    
                    {/* Icon with glow on active */}
                    <div className="relative z-10">
                      <Icon 
                        className={`h-6 w-6 transition-all ${
                          isActive 
                            ? 'drop-shadow-[0_0_8px_rgba(91,180,255,0.8)]' 
                            : 'group-hover:drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]'
                        }`} 
                      />
                    </div>
                    
                    {/* Label with HUD font */}
                    <span 
                      className={`relative z-10 text-xs font-orbitron uppercase tracking-wider ${
                        isActive ? 'font-bold' : 'font-medium'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Corner brackets on hover */}
                    {!isActive && (
                      <>
                        <div className="absolute top-0 left-0 w-0 h-0 border-l-2 border-t-2 border-primary/0 group-hover:w-3 group-hover:h-3 group-hover:border-primary/50 transition-all duration-300" />
                        <div className="absolute bottom-0 right-0 w-0 h-0 border-r-2 border-b-2 border-primary/0 group-hover:w-3 group-hover:h-3 group-hover:border-primary/50 transition-all duration-300" />
                      </>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
