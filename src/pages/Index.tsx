import { useNavigate } from "react-router-dom";
import { Target, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-slide-in">
      <div className="innovare-card p-6 mb-6">
        <h1 className="font-heading font-bold text-xl text-card-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome to your dashboard. Content goes here.</p>
      </div>

      <button
        onClick={() => navigate("/goals")}
        className="innovare-card p-5 w-full flex items-center gap-4 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target size={22} className="text-primary" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-heading font-semibold text-card-foreground">Set Academic Goals</h3>
          <p className="text-sm text-muted-foreground">
            Use comparable school benchmarking to set realistic, data-driven goals.
          </p>
        </div>
        <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </button>
    </div>
  );
};

export default Index;
