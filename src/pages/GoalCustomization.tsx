import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Check, Edit3, AlertTriangle } from "lucide-react";
import WorkflowProgress from "@/components/WorkflowProgress";
import { metrics } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSchool } from "@/contexts/SchoolContext";
import { useSchoolMetrics, getMetricValue } from "@/hooks/useSchoolMetrics";
import { supabase } from "@/integrations/supabase/client";

const GoalCustomization = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "ela_proficiency";
  const metric = metrics.find((m) => m.id === metricId) || metrics[0];
  const { selectedSchool, selectedPeers } = useSchool();

  // Fetch real metrics for peers + own school
  const allIds = useMemo(() => {
    const ids = selectedPeers.map((p) => p.id);
    if (selectedSchool) ids.push(selectedSchool.school_id);
    return ids;
  }, [selectedPeers, selectedSchool]);
  const { metrics: schoolMetricsData } = useSchoolMetrics(allIds);

  // Get real current/last year values for own school
  const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
  const currentValue = getMetricValue(ownData?.y2024, metricId) ?? metric.currentValue;
  const lastYearValue = getMetricValue(ownData?.y2023, metricId) ?? metric.lastYearValue;

  // Compute goal recommendation from real peer data
  const goalRecommendation = useMemo(() => {
    const peerValues = selectedPeers
      .map((p) => {
        const peerData = schoolMetricsData[p.id];
        return getMetricValue(peerData?.y2024, metricId) ?? p.currentPerformance;
      })
      .filter((v) => v > 0)
      .sort((a, b) => a - b);

    if (peerValues.length === 0) {
      return { conservative: currentValue + 1.5, typical: currentValue + 4, ambitious: currentValue + 6.5, recommended: currentValue + 4 };
    }

    const p25 = peerValues[Math.floor(peerValues.length * 0.25)];
    const median = peerValues[Math.floor(peerValues.length * 0.5)];
    const p75 = peerValues[Math.floor(peerValues.length * 0.75)];

    return {
      conservative: Math.round(p25 * 10) / 10,
      typical: Math.round(median * 10) / 10,
      ambitious: Math.round(p75 * 10) / 10,
      recommended: Math.round(median * 10) / 10,
    };
  }, [selectedPeers, schoolMetricsData, metricId, currentValue]);

  const [goalValue, setGoalValue] = useState(goalRecommendation.typical);
  const [rationale, setRationale] = useState("");
  const [mode, setMode] = useState<"accept" | "modify" | "override" | null>(null);

  const handleStepClick = (step: number) => {
    if (step === 1) navigate("/goals");
    if (step === 2) navigate(`/goals/comparable?metric=${metricId}`);
    if (step === 3) navigate(`/goals/recommendation?metric=${metricId}`);
  };

  const handleSubmit = () => {
    toast.success(`Goal set: ${metric.name} target of ${goalValue}${metric.unit}`, {
      description: "Your academic goal has been saved successfully.",
    });
    setTimeout(() => navigate("/goals"), 1500);
  };

  const isOutOfRange = goalValue < goalRecommendation.conservative - 2 || goalValue > goalRecommendation.ambitious + 3;

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={4} onStepClick={handleStepClick} />

      {/* Your School Performance Banner */}
      <div className="innovare-card p-4 mb-4 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {selectedSchool?.school_name || "Your School"} — {metric.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-heading font-bold text-card-foreground">{currentValue}{metric.unit}</span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  currentValue > lastYearValue
                    ? "bg-innovare-green/10 text-innovare-green"
                    : "bg-innovare-orange/10 text-innovare-orange"
                )}>
                  {currentValue > lastYearValue ? "↑" : "↓"} {Math.abs(currentValue - lastYearValue).toFixed(1)} pts from last year
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last Year</p>
            <p className="text-lg font-heading font-semibold text-muted-foreground">{lastYearValue}{metric.unit}</p>
          </div>
        </div>
      </div>

      <div className="innovare-card p-5 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Finalize Your Goal</p>
        <h2 className="font-heading font-bold text-lg text-card-foreground">
          {metric.icon} Set Your {metric.name} Target
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Accept the recommended target, adjust it, or set your own.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => { setMode("accept"); setGoalValue(goalRecommendation.typical); }}
              className={cn("innovare-card p-4 text-left transition-all hover:shadow-md", mode === "accept" && "ring-2 ring-primary innovare-glow")}
            >
              <Check size={20} className="text-innovare-green mb-2" />
              <p className="font-heading font-semibold text-sm text-card-foreground">Accept Recommendation</p>
              <p className="text-xs text-muted-foreground mt-1">Use the recommended target of {goalRecommendation.typical}{metric.unit}</p>
            </button>
            <button
              onClick={() => setMode("modify")}
              className={cn("innovare-card p-4 text-left transition-all hover:shadow-md", mode === "modify" && "ring-2 ring-primary innovare-glow")}
            >
              <Edit3 size={20} className="text-innovare-blue mb-2" />
              <p className="font-heading font-semibold text-sm text-card-foreground">Modify Goal</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust within the recommended range</p>
            </button>
            <button
              onClick={() => setMode("override")}
              className={cn("innovare-card p-4 text-left transition-all hover:shadow-md", mode === "override" && "ring-2 ring-primary innovare-glow")}
            >
              <AlertTriangle size={20} className="text-innovare-orange mb-2" />
              <p className="font-heading font-semibold text-sm text-card-foreground">Override Goal</p>
              <p className="text-xs text-muted-foreground mt-1">Set a custom target outside the range</p>
            </button>
          </div>

          {/* Goal Input */}
          {mode && (
            <div className="innovare-card p-6 animate-slide-in">
              <h3 className="font-heading font-semibold text-sm text-card-foreground mb-4">Your Target for {metric.name}</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">Target Value</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" value={goalValue} onChange={(e) => setGoalValue(parseFloat(e.target.value) || 0)}
                      disabled={mode === "accept"} step={0.1}
                      className={cn("w-32 h-14 text-2xl font-heading font-bold text-center rounded-xl border-2 transition-colors",
                        mode === "accept" ? "bg-muted border-border text-card-foreground" : "border-primary bg-card text-card-foreground focus:outline-none focus:ring-4 focus:ring-primary/20"
                      )}
                    />
                    <span className="text-xl text-muted-foreground">{metric.unit}</span>
                  </div>
                </div>
                {(mode === "modify" || mode === "override") && (
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">Adjust</label>
                    <input type="range" min={mode === "override" ? 0 : goalRecommendation.conservative} max={mode === "override" ? 100 : goalRecommendation.ambitious} step={0.1} value={goalValue} onChange={(e) => setGoalValue(parseFloat(e.target.value))} className="w-full accent-primary h-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{mode === "override" ? "0" : `${goalRecommendation.conservative}${metric.unit}`}</span>
                      <span>{mode === "override" ? "100" : `${goalRecommendation.ambitious}${metric.unit}`}</span>
                    </div>
                  </div>
                )}
              </div>

              {isOutOfRange && mode === "override" && (
                <div className="flex items-start gap-2 p-3 bg-innovare-orange/10 rounded-lg mb-4">
                  <AlertTriangle size={14} className="text-innovare-orange mt-0.5 shrink-0" />
                  <p className="text-xs text-card-foreground">
                    This target is outside the recommended range ({goalRecommendation.conservative}{metric.unit}–{goalRecommendation.ambitious}{metric.unit}).
                    Consider adding a rationale to document your reasoning.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Current</p>
                  <p className="text-lg font-heading font-bold text-card-foreground">{currentValue}{metric.unit}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Your Target</p>
                  <p className="text-lg font-heading font-bold text-primary">{goalValue}{metric.unit}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Growth Needed</p>
                  <p className="text-lg font-heading font-bold text-card-foreground">{(goalValue - currentValue) >= 0 ? "+" : ""}{(goalValue - currentValue).toFixed(1)} pts</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2 block">Add Rationale (Optional)</label>
                <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Document your reasoning for this goal selection..." className="w-full h-24 p-3 text-sm rounded-xl border border-border bg-card text-card-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <div className="innovare-card p-5">
            <h4 className="font-heading font-semibold text-sm text-card-foreground mb-3">Goal Summary</h4>
            <div className="space-y-3">
              {[
                { label: "Metric", value: metric.name },
                { label: "Current Performance", value: `${currentValue}${metric.unit}` },
                { label: "Peer Median", value: `${goalRecommendation.typical}${metric.unit}` },
                { label: "Recommended Range", value: `${goalRecommendation.conservative}${metric.unit}–${goalRecommendation.ambitious}${metric.unit}` },
                { label: "Selected Target", value: mode ? `${goalValue}${metric.unit}` : "—" },
                { label: "Selection Mode", value: mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          {mode && (
            <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold text-sm hover:bg-primary/90 transition-colors innovare-glow">
              Confirm & Save Goal
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button onClick={() => navigate(`/goals/recommendation?metric=${metricId}`)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
          ← Goal Range
        </button>
      </div>
    </div>
  );
};

export default GoalCustomization;
