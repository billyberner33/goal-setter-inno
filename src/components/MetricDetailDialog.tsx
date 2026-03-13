import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MetricData } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MetricDetailDialogProps {
  metric: MetricData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MetricDetailDialog = ({ metric, open, onOpenChange }: MetricDetailDialogProps) => {
  const navigate = useNavigate();

  if (!metric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{metric.icon}</span>
            <div>
              <DialogTitle className="font-heading font-bold text-xl">
                {metric.name}
              </DialogTitle>
              <DialogDescription>{metric.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-t border-border pt-4">
          <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Why This Metric Matters
          </h2>
          <p className="text-sm text-card-foreground leading-relaxed">
            {metric.importance}
          </p>
        </div>

        <div className="mt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate(`/goals/comparable?metric=${metric.id}`);
            }}
          >
            Set Goal
            <ArrowRight size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetricDetailDialog;
