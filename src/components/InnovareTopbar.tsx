import { User, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const InnovareTopbar = () => {
  return (
    <header className="h-14 bg-secondary flex items-center justify-between px-6 fixed top-0 left-16 right-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-secondary-foreground font-heading font-medium text-sm">
          Welcome, <span className="text-innovare-purple-glow">Sarah Kim</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
          <Bell size={18} />
        </button>
        <button className="text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
          <User size={18} />
        </button>
        <Badge className="bg-primary text-primary-foreground border-0 font-medium text-xs px-3 py-1">
          Westlake Academy
        </Badge>
      </div>
    </header>
  );
};

export default InnovareTopbar;
