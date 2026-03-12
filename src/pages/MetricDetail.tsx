import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { metrics } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const MetricDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const metricId = searchParams.get("metric");
  const metric = metrics.find((m) => m.id === metricId);

  if (!metric) {
    return (
      <div className="animate-slide-in text-center py-16">
        <p className="text-muted-foreground">Metric not found.</p>
        <Button variant="link" onClick={() => navigate("/goals")} className="mt-4">
          ← Back to Goals
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-slide-in max-w-2xl">
      <button
        onClick={() => navigate("/goals")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Goals
      </button>

      <div className="innovare-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{metric.icon}</span>
          <div>
            <h1 className="font-heading font-bold text-xl text-card-foreground">
              {metric.name}
            </h1>
            <p className="text-sm text-muted-foreground">{metric.description}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Why This Metric Matters
          </h2>
          <p className="text-sm text-card-foreground leading-relaxed">
            {metric.importance}
          </p>
        </div>

        <div className="mt-6">
          <Button onClick={() => navigate(`/goals/comparable?metric=${metric.id}`)}>
            Set Goal
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MetricDetail;
