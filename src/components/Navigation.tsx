import { NavLink } from "react-router-dom";
import { Home, Target, Heart, DollarSign, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/health", icon: Heart, label: "Health" },
  { to: "/finance", icon: DollarSign, label: "Finance" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
