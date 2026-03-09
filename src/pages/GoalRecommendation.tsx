import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Check, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import WorkflowProgress from "@/components/WorkflowProgress";
import ExplanationPanel from "@/components/ExplanationPanel";
import { metrics, goalRecommendation, comparableSchools } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TargetType = "conservative" | "typical" | "ambitious";

const GoalRecommendation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "math";
  const metric = metrics.find((m) => m.id === metricId) || metrics[1];

  const [selectedTarget, setSelectedTarget] = useState<TargetType>("typical");
  const [evidence, setEvidence] = useState<{ label: string; text: string }[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

  const { conservative, typical, ambitious } = goalRecommendation;
  const rangeMin = conservative - 1;
  const rangeMax = ambitious + 1;
  const range = rangeMax - rangeMin;

  // Build peer ranking with your school inserted
  const peerRanking = useMemo(() => {
    const peers = comparableSchools.map((s) => ({
      name: s.name,
      value: s.currentPerformance,
      isYourSchool: false,
      similarity: s.similarityMatch,
      enrollment: s.enrollment,
    }));
    peers.push({ name: "Your School", value: metric.currentValue, isYourSchool: true, similarity: 100, enrollment: 410 });
    peers.sort((a, b) => b.value - a.value);
    return peers;
  }, [metric.currentValue]);

  const getPosition = (value: number) => ((value - rangeMin) / range) * 100;

  const handleStepClick = (step: number) => {
    if (step === 1) navigate("/goals");
    if (step === 2) navigate(`/goals/comparable?metric=${metricId}`);
  };

  const targets: { key: TargetType; label: string; value: number; color: string; desc: string; isRecommended?: boolean }[] = [
    {
      key: "conservative",
      label: "Conservative",
      value: conservative,
      color: "bg-innovare-blue",
      desc: "Maintain current growth trajectory with high confidence",
    },
    {
      key: "typical",
      label: "Typical",
      value: typical,
      color: "bg-innovare-teal",
      desc: "Match peer median improvement rate — recommended",
      isRecommended: true,
    },
    {
      key: "ambitious",
      label: "Ambitious",
      value: ambitious,
      color: "bg-innovare-orange",
      desc: "Reach 75th percentile of comparable peer performance",
    },
  ];

  const selectedTargetData = targets.find((t) => t.key === selectedTarget)!;

  // Fetch AI evidence when selection changes
  useEffect(() => {
    const fetchEvidence = async () => {
      setIsLoadingEvidence(true);
      setEvidence([]);

      try {
        const { data, error } = await supabase.functions.invoke("goal-evidence", {
          body: {
            targetType: selectedTarget,
            targetValue: selectedTargetData.value,
            metricName: metric.name,
            currentValue: metric.currentValue,
            schoolName: "Your School",
          },
        });

        if (error) {
          console.error("Error fetching evidence:", error);
          toast.error("Failed to load AI evidence");
          setEvidence([{ label: "Error", text: "Unable to generate evidence at this time. Please try again." }]);
          return;
        }

        if (data?.error) {
          toast.error(data.error);
          setEvidence([{ label: "Error", text: "Unable to generate evidence at this time." }]);
          return;
        }

        const parsed = data?.evidence;
        setEvidence(Array.isArray(parsed) ? parsed : [{ label: "Analysis", text: String(parsed || "No evidence available.") }]);
      } catch (err) {
        console.error("Evidence fetch error:", err);
        setEvidence([{ label: "Error", text: "Unable to generate evidence at this time." }]);
      } finally {
        setIsLoadingEvidence(false);
      }
    };

    fetchEvidence();
  }, [selectedTarget, selectedTargetData.value, metric.name, metric.currentValue]);

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={3} onStepClick={handleStepClick} />

      {/* Your School Performance Banner */}
      <div className="innovare-card p-4 mb-4 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Your School — {metric.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-heading font-bold text-card-foreground">
                  {metric.currentValue}
                  {metric.unit}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    metric.currentValue > metric.lastYearValue
                      ? "bg-innovare-green/10 text-innovare-green"
                      : "bg-innovare-orange/10 text-innovare-orange",
                  )}
                >
                  {metric.currentValue > metric.lastYearValue ? "↑" : "↓"}{" "}
                  {Math.abs(metric.currentValue - metric.lastYearValue).toFixed(1)} pts from last year
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last Year</p>
            <p className="text-lg font-heading font-semibold text-muted-foreground">
              {metric.lastYearValue}
              {metric.unit}
            </p>
          </div>
        </div>
      </div>

      <div className="innovare-card p-5 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Goal Recommendation</p>
        <h2 className="font-heading font-bold text-lg text-card-foreground">
          {metric.icon} Recommended Target Range — {metric.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Based on analysis of {8} comparable schools, peer trends, and your school's growth trajectory.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Range bar + Target cards */}
        <div className="xl:col-span-2 space-y-4">
          {/* Visual Range Bar */}
          <div className="innovare-card p-6">
            <h3 className="font-heading font-semibold text-sm text-card-foreground mb-6">Target Range Visualization</h3>
            <div className="relative mb-2">
              <div className="text-xs text-muted-foreground mb-1">Your Current: {metric.currentValue}%</div>
            </div>
            <div className="relative h-12 bg-muted rounded-xl overflow-hidden mb-3">
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                style={{ left: `${getPosition(metric.currentValue)}%` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  Current
                </div>
              </div>
              <div
                className="absolute top-0 bottom-0 bg-innovare-blue/20"
                style={{
                  left: `${getPosition(conservative)}%`,
                  width: `${getPosition(typical) - getPosition(conservative)}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 bg-innovare-teal/30"
                style={{
                  left: `${getPosition(typical) - 2}%`,
                  width: `${getPosition(ambitious) - getPosition(typical) + 4}%`,
                }}
              />
              {targets.map((t) => (
                <div
                  key={t.label}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-card z-20",
                    t.color,
                  )}
                  style={{ left: `${getPosition(t.value)}%`, marginLeft: "-8px" }}
                >
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-card-foreground whitespace-nowrap">
                    {t.value}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-6 px-1">
              <span>Conservative</span>
              <span>Typical</span>
              <span>Ambitious</span>
            </div>
          </div>

          {/* Target Cards */}
          <div className="grid grid-cols-3 gap-3">
            {targets.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedTarget(t.key)}
                className={cn(
                  "innovare-card p-4 relative overflow-hidden transition-all text-left",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  selectedTarget === t.key && "ring-2 ring-primary shadow-md bg-primary/5",
                )}
              >
                {selectedTarget === t.key && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
                {t.isRecommended && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                    RECOMMENDED
                  </div>
                )}
                <div className={cn("w-3 h-3 rounded-full mb-3", t.color, selectedTarget === t.key && "ml-6")} />
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.label}</p>
                <p className="text-2xl font-heading font-bold text-card-foreground mt-1">{t.value}%</p>
                <p className="text-xs font-semibold text-innovare-teal mt-1">
                  +{(t.value - metric.currentValue).toFixed(1)}% from current
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: AI Evidence + Explanation */}
        <div className="space-y-4">
          {/* AI Evidence Panel */}
          <div className="innovare-card p-5 border-l-4 border-l-innovare-teal">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className={cn("text-innovare-teal", isLoadingEvidence && "animate-spin")} />
              <h4 className="font-heading font-semibold text-sm text-card-foreground">
                AI Evidence — {selectedTargetData.label} Target
              </h4>
              {isLoadingEvidence && (
                <span className="text-xs text-muted-foreground italic animate-pulse ml-auto">Analyzing...</span>
              )}
            </div>
            {isLoadingEvidence ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-innovare-teal animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-innovare-teal animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-innovare-teal animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Reviewing peer data and growth trends…</span>
                </div>
                <Skeleton className="h-4 w-full animate-pulse" />
                <Skeleton className="h-4 w-11/12 animate-pulse [animation-delay:150ms]" />
                <Skeleton className="h-4 w-4/5 animate-pulse [animation-delay:300ms]" />
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {evidence.map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-sm text-card-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ExplanationPanel
            title="How This Goal Was Determined"
            items={[
              {
                label: "Peer Selection",
                text: "8 schools matched via Opportunity Index banding (OI score 2.9–3.5) and contextual similarity scoring based on enrollment, grade span, community demographics, and prior performance.",
              },
              {
                label: "Key Contextual Factors",
                text: "Enrollment size (367–456 students), grade span (K-8), community Opportunity Index, and percentage of students from low-income households were weighted most heavily.",
              },
              {
                label: "Trend Analysis",
                text: "Comparable schools averaged +2.1 percentage points of annual growth in Math proficiency over the past 3 years. Your school's growth rate (+2.0 pts/yr) closely tracks the peer median.",
              },
              {
                label: "Your Position",
                text: "Your school sits at the 35th percentile of peer performance. The recommended target (17.2%) would place you near the peer median, reflecting achievable but meaningful growth.",
              },
            ]}
          />
        </div>
      </div>

      {/* Peer Ranking Table — Full Width Below */}
      <div className="innovare-card mt-4 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-heading font-semibold text-sm text-card-foreground">
            Peer Ranking — {metric.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your position among {comparableSchools.length} comparable peers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-10">Rank</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">School</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Similarity</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Students</th>
                <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">{metric.name}</th>
                <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-1/4">Performance</th>
              </tr>
            </thead>
            <tbody>
              {peerRanking.map((school, i) => {
                const maxVal = peerRanking[0].value;
                const barWidth = (school.value / maxVal) * 100;
                return (
                  <tr
                    key={school.name}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      school.isYourSchool
                        ? "bg-primary/5 font-semibold"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <td className="p-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className={cn("p-3 text-sm", school.isYourSchool ? "text-primary font-bold" : "text-card-foreground font-medium")}>
                      {school.isYourSchool ? "⭐ Your School" : school.name}
                    </td>
                    <td className="p-3 text-right">
                      {school.isYourSchool ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                          school.similarity >= 90 ? "bg-innovare-green/15 text-innovare-green border-innovare-green/30" :
                          school.similarity >= 80 ? "bg-innovare-blue/15 text-innovare-blue border-innovare-blue/30" :
                          "bg-innovare-orange/15 text-innovare-orange border-innovare-orange/30"
                        )}>
                          {school.similarity}%
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-right text-muted-foreground">
                      {school.enrollment.toLocaleString()}
                    </td>
                    <td className={cn("p-3 text-sm text-right font-semibold", school.isYourSchool ? "text-primary" : "text-card-foreground")}>
                      {school.value}{metric.unit}
                    </td>
                    <td className="p-3">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            school.isYourSchool ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(() => {
          const yourIdx = peerRanking.findIndex((s) => s.isYourSchool);
          const percentile = Math.round(((peerRanking.length - yourIdx) / peerRanking.length) * 100);
          return (
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                You rank <span className="font-bold text-card-foreground">#{yourIdx + 1}</span> of {peerRanking.length} schools ({percentile}th percentile)
              </p>
            </div>
          );
        })()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate(`/goals/comparable?metric=${metricId}`)}
          className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          ← Comparable Schools
        </button>
        <button
          onClick={() => navigate(`/goals/customize?metric=${metricId}&target=${selectedTarget}`)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Set Your Goal
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default GoalRecommendation;
