import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Check, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import WorkflowProgress from "@/components/WorkflowProgress";
import ExplanationPanel from "@/components/ExplanationPanel";
import { metrics } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchool } from "@/contexts/SchoolContext";
import { useSchoolMetrics, getMetricValue } from "@/hooks/useSchoolMetrics";

type TargetType = "conservative" | "typical" | "ambitious";

const GoalRecommendation = () => {
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
  const { metrics: schoolMetricsData, loading: metricsLoading } = useSchoolMetrics(allIds);

  // Get real current/last year values for own school
  const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
  const currentValue = getMetricValue(ownData?.y2024, metricId) ?? metric.currentValue;
  const lastYearValue = getMetricValue(ownData?.y2023, metricId) ?? metric.lastYearValue;

  // Compute goal recommendation from the normal distribution of peer YoY changes
  // Returns null while metrics are still loading so we don't compute from empty data
  const goalRecommendation = useMemo(() => {
    if (metricsLoading) return null;

    // Collect peer changes (y2024 - y2023) for peers that have both years
    const peerChanges = selectedPeers
      .map((p) => {
        const peerData = schoolMetricsData[p.id];
        const v2024 = getMetricValue(peerData?.y2024, metricId);
        const v2023 = getMetricValue(peerData?.y2023, metricId);
        if (v2024 == null || v2023 == null) return null;
        return v2024 - v2023;
      })
      .filter((v): v is number => v !== null);

    if (peerChanges.length === 0) {
      return {
        conservative: Math.round((currentValue + 1.5) * 10) / 10,
        typical:      Math.round((currentValue + 3.0) * 10) / 10,
        ambitious:    Math.round((currentValue + 5.0) * 10) / 10,
        recommended:  Math.round((currentValue + 3.0) * 10) / 10,
      };
    }

    // Mean of peer YoY changes
    const mean = peerChanges.reduce((sum, v) => sum + v, 0) / peerChanges.length;

    // Sample standard deviation of peer YoY changes
    const variance = peerChanges.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (peerChanges.length - 1 || 1);
    const stddev = Math.sqrt(variance);

    // Normal distribution z-scores: z = ±0.6745 maps exactly to p25 / p75
    const p25Change = mean + (-0.6745) * stddev;
    const p50Change = mean;
    const p75Change = mean + ( 0.6745) * stddev;

    return {
      conservative: Math.round((currentValue + p25Change) * 10) / 10,
      typical:      Math.round((currentValue + p50Change) * 10) / 10,
      ambitious:    Math.round((currentValue + p75Change) * 10) / 10,
      recommended:  Math.round((currentValue + p50Change) * 10) / 10,
    };
  }, [metricsLoading, selectedPeers, schoolMetricsData, metricId, currentValue]);

  const [selectedTarget, setSelectedTarget] = useState<TargetType>("typical");
  const [evidenceCache, setEvidenceCache] = useState<Record<TargetType, { label: string; text: string }[] | null>>({
    conservative: null,
    typical: null,
    ambitious: null,
  });
  const [loadingTargets, setLoadingTargets] = useState<Set<TargetType>>(new Set());
  const [isSwitchingTarget, setIsSwitchingTarget] = useState(false);

  const evidence = evidenceCache[selectedTarget] || [];
  const isLoadingEvidence = loadingTargets.has(selectedTarget) || isSwitchingTarget;

  // Pre-fetch AI evidence for all 3 targets on mount / when inputs change
  useEffect(() => {
    const peerPayload = selectedPeers.map((p) => {
      const peerData = schoolMetricsData[p.id];
      const perfValue = getMetricValue(peerData?.y2024, metricId) ?? p.currentPerformance;
      return {
        name: p.name,
        enrollment: p.enrollment,
        similarityMatch: p.similarityMatch,
        currentPerformance: perfValue,
      };
    });

    const fetchForTarget = async (target: TargetType, targetValue: number) => {
      setLoadingTargets((prev) => new Set(prev).add(target));
      try {
        const { data, error } = await supabase.functions.invoke("goal-evidence", {
          body: {
            targetType: target,
            targetValue,
            metricName: metric.name,
            currentValue,
            schoolName: selectedSchool?.school_name || "Your School",
            peerSchools: peerPayload,
          },
        });

        if (error || data?.error) {
          console.error("Error fetching evidence for", target, error || data?.error);
          setEvidenceCache((prev) => ({
            ...prev,
            [target]: [{ label: "Error", text: "Unable to generate evidence at this time." }],
          }));
          return;
        }

        const parsed = data?.evidence;
        setEvidenceCache((prev) => ({
          ...prev,
          [target]: Array.isArray(parsed)
            ? parsed
            : [{ label: "Analysis", text: String(parsed || "No evidence available.") }],
        }));
      } catch (err) {
        console.error("Evidence fetch error:", err);
        setEvidenceCache((prev) => ({
          ...prev,
          [target]: [{ label: "Error", text: "Unable to generate evidence at this time." }],
        }));
      } finally {
        setLoadingTargets((prev) => {
          const next = new Set(prev);
          next.delete(target);
          return next;
        });
      }
    };

    // Only fire once metrics have loaded and targets are computed
    if (metricsLoading || !goalRecommendation) return;

    // Reset cache and fetch all 3 in parallel
    setEvidenceCache({ conservative: null, typical: null, ambitious: null });
    fetchForTarget("conservative", goalRecommendation.conservative);
    fetchForTarget("typical", goalRecommendation.typical);
    fetchForTarget("ambitious", goalRecommendation.ambitious);
  }, [metric.name, currentValue, selectedPeers, schoolMetricsData, metricId, selectedSchool, goalRecommendation?.conservative, goalRecommendation?.typical, goalRecommendation?.ambitious, metricsLoading]);

  // Build peer ranking from persisted peer selections with real metric data
  const peerRanking = useMemo(() => {
    const peers = selectedPeers.map((s) => {
      const peerData = schoolMetricsData[s.id];
      const perfValue = getMetricValue(peerData?.y2024, metricId) ?? s.currentPerformance;
      const prevValue = getMetricValue(peerData?.y2023, metricId) ?? null;
      return {
        name: s.name,
        value: perfValue,
        prevValue,
        isYourSchool: false,
        similarity: s.similarityMatch,
        similarityRank: s.similarityRank,
        enrollment: s.enrollment,
        gradeSpan: s.gradeSpan,
      };
    });
    peers.push({
      name: selectedSchool?.school_name || "Your School",
      value: currentValue,
      prevValue: lastYearValue,
      isYourSchool: true,
      similarity: 100,
      similarityRank: 0,
      enrollment: selectedSchool?.students || 0,
      gradeSpan: selectedSchool?.school_level === "ES" ? "K-8" : selectedSchool?.school_level === "HS" ? "9-12" : "",
    });
    peers.sort((a, b) => b.value - a.value);
    return peers;
  }, [selectedPeers, schoolMetricsData, metricId, currentValue, selectedSchool]);

  const rec = goalRecommendation ?? { conservative: currentValue, typical: currentValue, ambitious: currentValue, recommended: currentValue };
  const { conservative, typical, ambitious } = rec;
  const rangeMin = conservative - 1;
  const rangeMax = ambitious + 1;
  const range = rangeMax - rangeMin;

  const getPosition = (value: number) => ((value - rangeMin) / range) * 100;

  const handleStepClick = (step: number) => {
    if (step === 1) navigate("/goals");
    if (step === 2) navigate(`/goals/comparable?metric=${metricId}`);
  };

  const targets: {
    key: TargetType;
    label: string;
    value: number;
    color: string;
    desc: string;
    isRecommended?: boolean;
  }[] = [
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

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={3} onStepClick={handleStepClick} />

      {/* Your School Performance Banner */}
      <div className="innovare-card p-4 mb-4 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {selectedSchool?.school_name || "Your School"} — {metric.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-heading font-bold text-card-foreground">
                  {currentValue}
                  {metric.unit}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    currentValue > lastYearValue
                      ? "bg-innovare-green/10 text-innovare-green"
                      : "bg-innovare-orange/10 text-innovare-orange",
                  )}
                >
                  {currentValue > lastYearValue ? "↑" : "↓"} {Math.abs(currentValue - lastYearValue).toFixed(1)} pts
                  from last year
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last Year</p>
            <p className="text-lg font-heading font-semibold text-muted-foreground">
              {lastYearValue}
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
          Based on analysis of {selectedPeers.length} comparable schools, peer trends, and your school's growth
          trajectory.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Range bar + Target cards */}
        <div className="xl:col-span-2 space-y-4">
          {/* Visual Range Bar */}
          <div className="innovare-card p-6">
            <h3 className="font-heading font-semibold text-sm text-card-foreground mb-4">Target Range Visualization</h3>
            <div className="relative mb-2">
              <div className="text-xs text-muted-foreground mb-1">Your Current: {currentValue}%</div>
            </div>
            {/* Bar + markers container */}
            <div className="relative">
              {/* The bar */}
              <div className="relative h-10 bg-muted rounded-xl overflow-hidden">
                {/* Shaded ranges */}
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
              </div>

              {/* Current value marker - full height line above bar */}
              <div
                className="absolute top-0 h-10 w-0.5 bg-foreground/40 z-10"
                style={{ left: `${getPosition(currentValue)}%` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                  Current
                </div>
              </div>

              {/* Target markers - full height lines with labels below */}
              {targets.map((t) => {
                const isSelected = selectedTarget === t.key;
                return (
                  <div
                    key={t.label}
                    className="absolute top-0 flex flex-col items-center z-20 transition-all duration-300 ease-out"
                    style={{ left: `${getPosition(t.value)}%` }}
                  >
                    {/* Full-height vertical line */}
                    <div
                      className={cn(
                        "h-10 rounded-full transition-all duration-300 ease-out",
                        isSelected ? "w-1.5" : "w-0.5",
                        t.key === "conservative" && "bg-innovare-blue",
                        t.key === "typical" && "bg-innovare-teal",
                        t.key === "ambitious" && "bg-innovare-orange",
                        isSelected && "shadow-md",
                      )}
                    />
                    {/* Label below */}
                    <div
                      className={cn(
                        "mt-2 flex flex-col items-center transition-all duration-300 ease-out",
                        isSelected ? "scale-110" : "scale-100",
                      )}
                    >
                      <span
                        className={cn(
                          "font-heading font-bold whitespace-nowrap transition-all duration-300 ease-out",
                          isSelected ? "text-sm text-card-foreground" : "text-[11px] text-muted-foreground",
                        )}
                      >
                        {t.value}%
                      </span>
                      <span
                        className={cn(
                          "whitespace-nowrap transition-all duration-300 ease-out",
                          isSelected
                            ? "text-[11px] font-semibold text-primary"
                            : "text-[10px] text-muted-foreground",
                        )}
                      >
                        {t.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Spacer for labels below bar */}
            <div className="h-12" />
          </div>

          {/* Target Cards */}
          <div className="grid grid-cols-3 gap-3">
            {targets.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key === selectedTarget) return;
                  setIsSwitchingTarget(true);
                  setSelectedTarget(t.key);
                  // Add small delay to show "loading" even if cached
                  setTimeout(() => setIsSwitchingTarget(false), 400);
                }}
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
                  +{(t.value - currentValue).toFixed(1)}% from current
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Peer Ranking Table */}
          <div className="innovare-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-sm text-card-foreground">Peer Ranking — {metric.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Your position among {selectedPeers.length} comparable peers
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-10">
                      #
                    </th>
                    <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      School
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      2023-24
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      2024-25
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Change
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Sim. Rank
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Students
                    </th>
                    <th className="text-right p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peerRanking.map((school, i) => {
                    const change = school.prevValue != null ? school.value - school.prevValue : null;
                    return (
                    <tr
                      key={school.name}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        school.isYourSchool ? "bg-primary/5 font-semibold" : "hover:bg-muted/30",
                      )}
                    >
                      <td className="p-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td
                        className={cn(
                          "p-3 text-sm",
                          school.isYourSchool ? "text-primary font-bold" : "text-card-foreground font-medium",
                        )}
                      >
                        {school.isYourSchool ? `⭐ ${selectedSchool?.school_name || "Your School"}` : school.name}
                      </td>
                      <td className="p-3 text-right text-sm text-muted-foreground">
                        {school.prevValue != null ? `${school.prevValue}${metric.unit}` : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            school.isYourSchool ? "text-primary" : "text-card-foreground",
                          )}
                        >
                          {school.value}
                          {metric.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {change != null ? (
                          <span className={cn(
                            "text-xs font-semibold",
                            change > 0 ? "text-innovare-green" : change < 0 ? "text-destructive" : "text-muted-foreground",
                          )}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-right">
                        {school.isYourSchool ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/30">
                            #{school.similarityRank}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {school.enrollment > 0 ? school.enrollment.toLocaleString() : "—"}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">{school.gradeSpan || "—"}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-card-foreground">{selectedPeers.length}</span> comparable peer schools
                selected from the previous step
              </p>
            </div>
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
        </div>
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
