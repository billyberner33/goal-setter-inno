import { LayoutDashboard, Target, BarChart3, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Target, label: "Goal Setting", path: "/goals" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const InnovareSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/goals") return location.pathname.startsWith("/goals");
    return location.pathname === path;
  };

  return (
    <aside className="w-16 bg-sidebar flex flex-col items-center py-6 gap-2 fixed left-0 top-0 h-screen z-50">
      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center mb-6">
        <span className="text-primary-foreground font-heading font-bold text-sm">I</span>
      </div>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
            isActive(item.path)
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
          title={item.label}
        >
          <item.icon size={20} />
        </button>
      ))}
    </aside>
  );
};

export default InnovareSidebar;
