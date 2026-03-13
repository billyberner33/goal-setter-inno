import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Check, Sparkles, TrendingUp, TrendingDown, Minus, ChevronDown, BarChart3 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

  // Compute box plot stats from peer 2024 values
  const peerBoxPlot = useMemo(() => {
    const peerValues = selectedPeers
      .map((p) => {
        const peerData = schoolMetricsData[p.id];
        return getMetricValue(peerData?.y2024, metricId);
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (peerValues.length === 0) return null;

    const q = (arr: number[], p: number) => {
      const pos = (arr.length - 1) * p;
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
    };

    return {
      min: peerValues[0],
      q1: q(peerValues, 0.25),
      median: q(peerValues, 0.5),
      q3: q(peerValues, 0.75),
      max: peerValues[peerValues.length - 1],
      values: peerValues,
    };
  }, [selectedPeers, schoolMetricsData, metricId]);

  // Range for visualization: encompass current value, all peers, and all targets
  const vizMin = useMemo(() => {
    const vals = [currentValue, conservative];
    if (peerBoxPlot) vals.push(peerBoxPlot.min);
    return Math.min(...vals) - 2;
  }, [currentValue, conservative, peerBoxPlot]);

  const vizMax = useMemo(() => {
    const vals = [ambitious];
    if (peerBoxPlot) vals.push(peerBoxPlot.max);
    return Math.max(...vals) + 2;
  }, [ambitious, peerBoxPlot]);

  const vizRange = vizMax - vizMin;
  const getPosition = (value: number) => Math.max(0, Math.min(100, ((value - vizMin) / vizRange) * 100));

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
      <div className="flex items-center gap-3 mb-0">
        <button
          onClick={() => navigate(`/goals/comparable?metric=${metricId}`)}
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-card-foreground hover:bg-muted transition-colors whitespace-nowrap"
        >
          ← Back
        </button>
        <div className="flex-1">
          <WorkflowProgress currentStep={3} onStepClick={handleStepClick} />
        </div>
        <button
          onClick={() => navigate(`/goals/customize?metric=${metricId}&target=${selectedTarget}`)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Set Your Goal
          <ArrowRight size={12} />
        </button>
      </div>

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
            <h3 className="font-heading text-sm text-card-foreground mb-5">
              <span className="font-bold text-primary">{selectedSchool?.school_name || "Your School"}</span>
              <span className="text-muted-foreground font-medium"> — </span>
              <span className="font-bold text-card-foreground">{metric.name}</span>
              <span className="text-muted-foreground font-normal text-xs ml-1">Target Visualization based on Historical Peer Performance</span>
            </h3>

            {peerBoxPlot ? (() => {
              // Build a smooth bell-curve shape based on peer stats
              const mean = peerBoxPlot.median;
              const stdDev = (peerBoxPlot.q3 - peerBoxPlot.q1) / 1.349; // IQR to stdDev approx
              const curvePoints = 200;
              const gaussian = (x: number) =>
                Math.exp(-0.5 * ((x - mean) / (stdDev || 1)) ** 2);

              // Generate SVG path points
              const svgW = 100; // percentage width
              const svgH = 120; // px height for the curve area
              const points: { x: number; y: number; val: number }[] = [];
              for (let i = 0; i <= curvePoints; i++) {
                const val = vizMin + (vizRange * i) / curvePoints;
                const gVal = gaussian(val);
                points.push({
                  x: (i / curvePoints) * svgW,
                  y: svgH - gVal * (svgH - 10),
                  val,
                });
              }

              // Build filled regions with color coding
              const getRegionColor = (val: number) => {
                if (val < peerBoxPlot.q1) return "hsl(var(--innovare-red) / 0.25)";
                if (val > peerBoxPlot.q3) return "hsl(var(--innovare-green) / 0.25)";
                return "hsl(var(--innovare-teal) / 0.2)";
              };

              // Split points into 3 regions for fills
              const regionBreaks = [peerBoxPlot.q1, peerBoxPlot.q3];
              const regions: { points: typeof points; color: string; label: string }[] = [];
              let currentRegion: typeof points = [];
              let currentColor = getRegionColor(points[0].val);
              let currentLabel = points[0].val < peerBoxPlot.q1 ? "<25th" : "25-75th";

              for (const pt of points) {
                const color = getRegionColor(pt.val);
                if (color !== currentColor && currentRegion.length > 0) {
                  // Close current region, start new
                  currentRegion.push(pt); // overlap point
                  regions.push({ points: [...currentRegion], color: currentColor, label: currentLabel });
                  currentRegion = [pt];
                  currentColor = color;
                  currentLabel = pt.val > peerBoxPlot.q3 ? ">75th" : pt.val < peerBoxPlot.q1 ? "<25th" : "25-75th";
                } else {
                  currentRegion.push(pt);
                }
              }
              if (currentRegion.length > 0) {
                regions.push({ points: currentRegion, color: currentColor, label: currentLabel });
              }

              return (
                <div className="relative pt-8 pb-4">
                  {/* Distribution curve */}
                  <div className="relative" style={{ height: `${svgH + 60}px` }}>
                    <svg
                      viewBox={`0 0 ${svgW} ${svgH}`}
                      preserveAspectRatio="none"
                      className="w-full absolute top-0 left-0"
                      style={{ height: `${svgH}px` }}
                    >
                      {/* Filled regions */}
                      {regions.map((region, idx) => {
                        const first = region.points[0];
                        const last = region.points[region.points.length - 1];
                        const pathD =
                          `M ${first.x} ${svgH} ` +
                          region.points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
                          ` L ${last.x} ${svgH} Z`;
                        return <path key={idx} d={pathD} fill={region.color} />;
                      })}

                      {/* Curve outline */}
                      <path
                        d={points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                        fill="none"
                        stroke="hsl(var(--muted-foreground) / 0.4)"
                        strokeWidth="0.3"
                      />

                      {/* Q1 line */}
                      <line
                        x1={getPosition(peerBoxPlot.q1)}
                        y1="0"
                        x2={getPosition(peerBoxPlot.q1)}
                        y2={svgH}
                        stroke="hsl(var(--muted-foreground) / 0.3)"
                        strokeWidth="0.2"
                        strokeDasharray="1 1"
                      />
                      {/* Q3 line */}
                      <line
                        x1={getPosition(peerBoxPlot.q3)}
                        y1="0"
                        x2={getPosition(peerBoxPlot.q3)}
                        y2={svgH}
                        stroke="hsl(var(--muted-foreground) / 0.3)"
                        strokeWidth="0.2"
                        strokeDasharray="1 1"
                      />
                      {/* Median line */}
                      <line
                        x1={getPosition(peerBoxPlot.median)}
                        y1="0"
                        x2={getPosition(peerBoxPlot.median)}
                        y2={svgH}
                        stroke="hsl(var(--muted-foreground) / 0.5)"
                        strokeWidth="0.3"
                      />
                    </svg>

                    {/* Peer dots on curve */}
                    {peerBoxPlot.values.map((v, i) => {
                      const gVal = gaussian(v);
                      const dotY = svgH - gVal * (svgH - 10);
                      return (
                        <div
                          key={i}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-muted-foreground/50"
                          style={{
                            left: `${getPosition(v)}%`,
                            top: `${dotY}px`,
                            backgroundColor: v < peerBoxPlot.q1
                              ? "hsl(var(--innovare-red) / 0.6)"
                              : v > peerBoxPlot.q3
                                ? "hsl(var(--innovare-green) / 0.6)"
                                : "hsl(var(--innovare-teal) / 0.5)",
                          }}
                        />
                      );
                    })}

                    {/* Current value marker */}
                    <div
                      className="absolute flex flex-col items-center z-30"
                      style={{ left: `${getPosition(currentValue)}%`, top: 0, height: `${svgH}px` }}
                    >
                      <div className="absolute -top-7 flex flex-col items-center">
                        <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">Current</span>
                        <span className="text-xs font-heading font-bold text-card-foreground">{currentValue}{metric.unit}</span>
                      </div>
                      <div className="w-0.5 h-full bg-foreground/50 rounded-full" />
                    </div>

                    {/* Target markers */}
                    {targets.map((t) => {
                      const isSelected = selectedTarget === t.key;
                      return (
                        <div
                          key={t.key}
                          className={cn(
                            "absolute flex flex-col items-center -translate-x-1/2 transition-all duration-300 ease-out",
                            isSelected ? "z-30" : "z-20",
                          )}
                          style={{ left: `${getPosition(t.value)}%`, top: 0, height: `${svgH}px` }}
                        >
                          <div className={cn(
                            "h-full flex items-center justify-center",
                          )}>
                            <div
                              className={cn(
                                "rounded-full transition-all duration-300 ease-out h-full",
                                isSelected ? "w-2 shadow-lg" : "w-0.5",
                                t.key === "conservative" && "bg-innovare-blue",
                                t.key === "typical" && "bg-innovare-teal",
                                t.key === "ambitious" && "bg-innovare-orange",
                              )}
                            />
                          </div>
                          <div
                            className={cn(
                              "absolute flex flex-col items-center transition-all duration-300 ease-out",
                              isSelected ? "scale-110" : "scale-100",
                            )}
                            style={{ top: `${svgH + 4}px` }}
                          >
                            <span
                              className={cn(
                                "font-heading font-bold whitespace-nowrap transition-all duration-300 ease-out",
                                isSelected ? "text-sm text-card-foreground" : "text-[11px] text-muted-foreground",
                              )}
                            >
                              {t.value}{metric.unit}
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

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-6 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--innovare-red) / 0.4)" }} />
                      &lt;25th pctl
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--innovare-teal) / 0.35)" }} />
                      25th–75th pctl
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(var(--innovare-green) / 0.4)" }} />
                      &gt;75th pctl
                    </span>
                    <span className="ml-auto text-muted-foreground/60">Peer distribution (n={peerBoxPlot.values.length})</span>
                  </div>

                  {/* Expandable Statistical Details */}
                  {(() => {
                    const n = peerBoxPlot.values.length;
                    const mean = peerBoxPlot.values.reduce((s, v) => s + v, 0) / n;
                    const variance = peerBoxPlot.values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
                    const stdDev = Math.sqrt(variance);
                    const skewness = n >= 3
                      ? (peerBoxPlot.values.reduce((s, v) => s + ((v - mean) / (stdDev || 1)) ** 3, 0) * n) / ((n - 1) * (n - 2) || 1)
                      : 0;
                    const iqr = peerBoxPlot.q3 - peerBoxPlot.q1;
                    const range = peerBoxPlot.max - peerBoxPlot.min;
                    const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

                    // Percentile of current school within peer distribution
                    const belowCount = peerBoxPlot.values.filter(v => v < currentValue).length;
                    const equalCount = peerBoxPlot.values.filter(v => v === currentValue).length;
                    const schoolPercentile = ((belowCount + 0.5 * equalCount) / n) * 100;

                    const q = (arr: number[], p: number) => {
                      const pos = (arr.length - 1) * p;
                      const lo = Math.floor(pos);
                      const hi = Math.ceil(pos);
                      return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
                    };
                    const p10 = q(peerBoxPlot.values, 0.10);
                    const p90 = q(peerBoxPlot.values, 0.90);

                    const statSections = [
                      {
                        title: "Central Tendency",
                        stats: [
                          { label: "Mean", value: mean.toFixed(1) + metric.unit },
                          { label: "Median (P50)", value: peerBoxPlot.median.toFixed(1) + metric.unit },
                          { label: "Mean–Median Gap", value: (mean - peerBoxPlot.median).toFixed(2) + " pts" },
                        ],
                      },
                      {
                        title: "Spread & Variability",
                        stats: [
                          { label: "Std Deviation (σ)", value: stdDev.toFixed(2) },
                          { label: "Variance (σ²)", value: variance.toFixed(2) },
                          { label: "IQR (Q3 − Q1)", value: iqr.toFixed(1) },
                          { label: "Range", value: range.toFixed(1) },
                          { label: "Coeff. of Variation", value: cv.toFixed(1) + "%" },
                        ],
                      },
                      {
                        title: "Percentiles",
                        stats: [
                          { label: "P10", value: p10.toFixed(1) + metric.unit },
                          { label: "P25 (Q1)", value: peerBoxPlot.q1.toFixed(1) + metric.unit },
                          { label: "P50 (Median)", value: peerBoxPlot.median.toFixed(1) + metric.unit },
                          { label: "P75 (Q3)", value: peerBoxPlot.q3.toFixed(1) + metric.unit },
                          { label: "P90", value: p90.toFixed(1) + metric.unit },
                        ],
                      },
                      {
                        title: "Distribution Shape",
                        stats: [
                          { label: "Skewness", value: skewness.toFixed(3) },
                          { label: "Interpretation", value: Math.abs(skewness) < 0.5 ? "Approx. symmetric" : skewness > 0 ? "Right-skewed" : "Left-skewed" },
                        ],
                      },
                      {
                        title: "Your School's Position",
                        stats: [
                          { label: "Current Value", value: currentValue + metric.unit },
                          { label: "Peer Percentile", value: schoolPercentile.toFixed(0) + "th" },
                          { label: "Distance from Mean", value: (currentValue - mean).toFixed(1) + " pts" },
                          { label: "Z-Score", value: stdDev > 0 ? ((currentValue - mean) / stdDev).toFixed(2) : "N/A" },
                        ],
                      },
                    ];

                    return (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors group w-full">
                          <BarChart3 size={12} />
                          <span>Statistical Details</span>
                          <ChevronDown size={12} className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                              {statSections.map((section) => (
                                <div key={section.title}>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{section.title}</p>
                                  <div className="space-y-1.5">
                                    {section.stats.map((stat) => (
                                      <div key={stat.label} className="flex justify-between items-baseline gap-2">
                                        <span className="text-[10px] text-muted-foreground truncate">{stat.label}</span>
                                        <span className="text-[11px] font-mono font-semibold text-card-foreground whitespace-nowrap">{stat.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-[9px] text-muted-foreground/60 mt-3">
                              Statistics computed from {n} comparable peer schools · {metric.name} · 2024 values
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
                </div>
              );
            })() : (
              <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                No peer data available for visualization
              </div>
            )}
          </div>

          {/* Target Percentile Amongst Peers */}
          {peerBoxPlot && (
            <div className="innovare-card p-5">
              <h3 className="font-heading text-sm font-bold text-card-foreground mb-1">
                Target Visualization Compared to Peers
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                See what percentile each target would place your school at among the {peerBoxPlot.values.length} selected peers.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Current", value: currentValue, color: "bg-foreground/60", textColor: "text-card-foreground" },
                  ...targets.map(t => ({
                    label: t.label,
                    value: t.value,
                    color: t.color,
                    textColor: selectedTarget === t.key ? "text-card-foreground" : "text-muted-foreground",
                  })),
                ].map((item) => {
                  const below = peerBoxPlot.values.filter(v => v < item.value).length;
                  const equal = peerBoxPlot.values.filter(v => v === item.value).length;
                  const pctl = Math.round(((below + 0.5 * equal) / peerBoxPlot.values.length) * 100);
                  const barColor = pctl < 25
                    ? "bg-innovare-red/40"
                    : pctl > 75
                      ? "bg-innovare-green/40"
                      : "bg-innovare-teal/30";
                  const dotColor = pctl < 25
                    ? "bg-innovare-red"
                    : pctl > 75
                      ? "bg-innovare-green"
                      : "bg-innovare-teal";

                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className={cn("text-[11px] font-semibold w-24 text-right shrink-0", item.textColor)}>
                        {item.label}
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">({item.value}{metric.unit})</span>
                      </span>
                      <div className="flex-1 relative h-5 rounded-full bg-muted/50 overflow-hidden">
                        {/* Quartile zone backgrounds */}
                        <div className="absolute inset-y-0 left-0 w-1/4 bg-innovare-red/10 border-r border-border/30" />
                        <div className="absolute inset-y-0 left-1/4 w-1/2 bg-innovare-teal/8 border-r border-border/30" />
                        <div className="absolute inset-y-0 left-3/4 w-1/4 bg-innovare-green/10" />
                        {/* Fill bar */}
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", barColor)}
                          style={{ width: `${Math.max(pctl, 2)}%` }}
                        />
                        {/* Dot marker */}
                        <div
                          className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background shadow-sm transition-all duration-500", dotColor)}
                          style={{ left: `${Math.max(pctl, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-card-foreground w-12 text-right">
                        P{pctl}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Scale labels */}
              <div className="flex justify-between mt-1.5 px-[calc(6rem+12px)] text-[9px] text-muted-foreground/50">
                <span>0th</span>
                <span>25th</span>
                <span>50th</span>
                <span>75th</span>
                <span>100th</span>
              </div>
            </div>
          )}

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

    </div>
  );
};

export default GoalRecommendation;
