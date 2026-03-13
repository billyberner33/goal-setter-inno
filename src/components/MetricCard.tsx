import { ArrowRight, Info } from "lucide-react";
import { MetricData } from "@/data/mockData";

interface MetricCardProps {
  metric: MetricData;
  onSetGoal: (metricId: string) => void;
  onMoreInfo: (metricId: string) => void;
}

const MetricCard = ({ metric, onSetGoal, onMoreInfo }: MetricCardProps) => {

  return (
    <div className="innovare-card p-5 hover:shadow-md transition-all group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{metric.icon}</span>
          <div>
            <h3 className="font-heading font-semibold text-card-foreground text-sm">
              {metric.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[240px]">
              {metric.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between mt-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Performance</p>
            <p className="text-2xl font-heading font-bold text-card-foreground">
              {metric.currentValue}{metric.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Last Year</p>
            <p className="text-2xl font-heading font-bold text-muted-foreground">
              {metric.lastYearValue}{metric.unit}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={() => onSetGoal(metric.id)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors group-hover:shadow-md"
          >
            Set Goal
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => onMoreInfo(metric.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Info size={12} />
            More Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
