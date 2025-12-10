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
    <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
      {/* Outer glow container - contained within nav */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent blur-xl" />
      </div>

      {/* Main bar structure */}
      <div className="relative bg-[#00050B]/98 backdrop-blur-xl border-t-2 border-primary/30 overflow-hidden">
        {/* Inner double border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-[2px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Holographic reflection layer - contained */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none" />

        <div className="max-w-lg mx-auto px-2">
          <div className="flex justify-around items-center h-16 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all duration-300 group overflow-hidden ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active state HUD panel - all effects contained */}
                      {isActive && (
                        <>
                          {/* Inner glow - contained within button */}
                          <div className="absolute inset-0 bg-primary/10 rounded-md" />
                          {/* Border */}
                          <div className="absolute inset-0 border border-primary/40 rounded-md" />
                          {/* Inner border */}
                          <div className="absolute inset-[2px] border border-primary/20 rounded-[5px]" />
                          {/* Subtle pulse - contained */}
                          <div className="absolute inset-0 bg-primary/5 rounded-md animate-neon-pulse" />
                        </>
                      )}
                      
                      {/* Hover state - contained glow */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 rounded-md transition-all duration-300" />
                      )}
                      
                      {/* Icon with contained glow effect */}
                      <div className="relative z-10 overflow-hidden">
                        <Icon 
                          className={`h-5 w-5 transition-all duration-300 ${
                            isActive 
                              ? 'drop-shadow-[0_0_6px_rgba(91,180,255,0.9)]' 
                              : 'group-hover:drop-shadow-[0_0_6px_rgba(91,180,255,0.6)]'
                          }`} 
                        />
                      </div>
                      
                      {/* Label with HUD font */}
                      <span 
                        className={`relative z-10 text-[10px] font-orbitron uppercase tracking-widest transition-all duration-300 ${
                          isActive 
                            ? 'font-bold drop-shadow-[0_0_4px_rgba(91,180,255,0.6)]' 
                            : 'font-medium group-hover:font-semibold'
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Minimal corner accents on hover - perfectly aligned */}
                      {!isActive && (
                        <>
                          <div className="absolute top-[2px] left-[2px] w-0 h-0 border-l border-t border-primary/0 group-hover:w-2 group-hover:h-2 group-hover:border-primary/60 transition-all duration-300 rounded-tl-[1px]" />
                          <div className="absolute bottom-[2px] right-[2px] w-0 h-0 border-r border-b border-primary/0 group-hover:w-2 group-hover:h-2 group-hover:border-primary/60 transition-all duration-300 rounded-br-[1px]" />
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
