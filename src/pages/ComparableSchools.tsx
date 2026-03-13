import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, ChevronDown, ChevronUp, Users, Plus, X, Search, Eye, EyeOff, FileText, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import SchoolReportCard from "@/components/SchoolReportCard";
import type { ComparableSchool } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Legend } from "recharts";
import WorkflowProgress from "@/components/WorkflowProgress";
import SimilarityBadge from "@/components/SimilarityBadge";
import { metrics, peerTrendData } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolMetrics, getMetricValue } from "@/hooks/useSchoolMetrics";

// Map metric IDs to the relevant dimension delta column for ordering
// Map app metric IDs to the goal_metric values stored in the DB
const metricToGoalMetric: Record<string, string | string[]> = {
  ela_proficiency: "Reading Proficiency",
  math_proficiency: "Math Proficiency",
  chronic_absenteeism: "Attendance",
  ela_growth_percentile: "SGP Reading",
  math_growth_percentile: ["SGP Math", "SPG Math"],
  isa_proficiency: "Reading Proficiency",
  graduation_rate_4yr: "Attendance",
  graduation_rate_5yr: "Attendance",
  pct_9th_on_track: "Attendance",
};

interface DbSimilarSchool {
  id: string;
  school_id: string;
  similar_school_id: string;
  rank: number;
  euclidean_distance: number;
  goal_metric: string | null;
  school_level: string;
  d_el: number | null;
  d_iep: number | null;
  d_stls: number | null;
  d_teach_ret: number | null;
  d_poverty: number | null;
  d_hardship: number | null;
  d_life_exp: number | null;
  d_uninsured: number | null;
  d_diversity: number | null;
  d_fund_a: number | null;
  d_fund_b: number | null;
  similar_school?: {
    school_id: string;
    school_name: string;
    students: number | null;
    school_level: string;
  };
}

// Convert euclidean distance to a similarity percentage (lower distance = higher match)
function distanceToSimilarity(distance: number): number {
  // Using an exponential decay: similarity = 100 * e^(-distance)
  // This gives ~100% for distance 0, ~37% for distance 1, ~14% for distance 2
  const similarity = Math.round(100 * Math.exp(-distance * 0.5));
  return Math.max(1, Math.min(99, similarity));
}

function dbSchoolToComparable(sim: DbSimilarSchool): ComparableSchool {
  const school = sim.similar_school;
  const similarity = distanceToSimilarity(sim.euclidean_distance);
  return {
    id: sim.similar_school_id,
    name: school?.school_name || sim.similar_school_id,
    communityArea: "",
    opportunityIndex: 0,
    similarityMatch: similarity,
    similarityRank: sim.rank,
    currentPerformance: 0,
    trend3Year: [0, 0, 0],
    enrollment: school?.students || 0,
    gradeSpan: school?.school_level === "ES" ? "K-8" : "9-12",
  };
}

const ComparableSchools = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "ela_proficiency";
  const metric = metrics.find((m) => m.id === metricId) || metrics[0];
  const { selectedSchool, setSelectedPeers } = useSchool();
  const [allSchoolIdsForMetrics, setAllSchoolIdsForMetrics] = useState<string[]>([]);
  const { metrics: schoolMetricsData, loading: metricsLoading } = useSchoolMetrics(allSchoolIdsForMetrics);

  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [showBand, setShowBand] = useState(true);
  const [reportCardSchool, setReportCardSchool] = useState<ComparableSchool | null>(null);

  // DB state
  const [dbSchools, setDbSchools] = useState<ComparableSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedSchools, setAddedSchools] = useState<ComparableSchool[]>([]);
  const [searchResults, setSearchResults] = useState<ComparableSchool[]>([]);

  // Fetch top 10 similar schools from DB
  useEffect(() => {
    if (!selectedSchool) return;

    const fetchSimilarSchools = async () => {
      setLoading(true);
      const goalMetricValue = metricToGoalMetric[metricId];
      let query = supabase
        .from("school_similarities")
        .select(`
          *,
          similar_school:schools!school_similarities_similar_school_id_fkey (
            school_id,
            school_name,
            students,
            school_level
          )
        `)
        .eq("school_id", selectedSchool.school_id)
        .order("euclidean_distance", { ascending: true })
        .limit(10);

      if (goalMetricValue) {
        if (Array.isArray(goalMetricValue)) {
          query = query.in("goal_metric", goalMetricValue);
        } else {
          query = query.eq("goal_metric", goalMetricValue);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching similar schools:", error);
        setDbSchools([]);
      } else if (data) {
        const mapped = (data as unknown as DbSimilarSchool[]).map((s) => dbSchoolToComparable(s));
        setDbSchools(mapped);
        // Collect all school IDs for metrics lookup (peers + own school)
        const ids = mapped.map((s) => s.id);
        if (selectedSchool) ids.push(selectedSchool.school_id);
        setAllSchoolIdsForMetrics(ids);
      }
      setLoading(false);
    };

    fetchSimilarSchools();
  }, [selectedSchool, metricId]);

  const allSchools = useMemo(() => {
    const combined = [...dbSchools, ...addedSchools];
    // Hide schools that don't have data for the selected metric
    const filtered = metricsLoading ? combined : combined.filter((s) => {
      const peerData = schoolMetricsData[s.id];
      if (!peerData) return false;
      const curVal = getMetricValue(peerData.y2024, metricId);
      const prevVal = getMetricValue(peerData.y2023, metricId);
      return curVal !== null || prevVal !== null;
    });
    // Sort by original similarity rank; manually-added schools (rank 0) go last
    return filtered.sort((a, b) => {
      if (a.similarityRank === 0 && b.similarityRank === 0) return 0;
      if (a.similarityRank === 0) return 1;
      if (b.similarityRank === 0) return -1;
      return a.similarityRank - b.similarityRank;
    });
  }, [dbSchools, addedSchools, schoolMetricsData, metricsLoading, metricId]);
  const allSchoolIds = useMemo(() => new Set(allSchools.map((s) => s.id)), [allSchools]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-select all schools when dbSchools loads
  useEffect(() => {
    if (dbSchools.length > 0) {
      setSelectedIds(new Set(dbSchools.map((s) => s.id)));
    }
  }, [dbSchools]);

  // Prune selected IDs when schools get filtered out
  useEffect(() => {
    if (!metricsLoading && allSchools.length > 0) {
      setSelectedIds((prev) => {
        const valid = new Set(allSchools.map((s) => s.id));
        const pruned = new Set([...prev].filter((id) => valid.has(id)));
        if (pruned.size === 0 && allSchools.length > 0) pruned.add(allSchools[0].id);
        return pruned;
      });
    }
  }, [allSchools, metricsLoading]);

  // Search for additional schools in the DB
  useEffect(() => {
    if (!searchQuery.trim() || !selectedSchool) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("schools")
        .select("*")
        .ilike("school_name", `%${searchQuery}%`)
        .neq("school_id", selectedSchool.school_id)
        .limit(10);

      if (data) {
        const results = data
          .filter((s) => !allSchoolIds.has(s.school_id))
          .map((s) => ({
            id: s.school_id,
            name: s.school_name,
            communityArea: "",
            opportunityIndex: 0,
            similarityMatch: 0,
            similarityRank: 0,
            currentPerformance: 0,
            trend3Year: [0, 0, 0],
            enrollment: s.students || 0,
            gradeSpan: s.school_level === "ES" ? "K-8" : "9-12",
          }));
        setSearchResults(results);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSchool, allSchoolIds]);

  const addSchool = (school: ComparableSchool) => {
    setAddedSchools((prev) => [...prev, school]);
    setSelectedIds((prev) => new Set([...prev, school.id]));
    setSearchQuery("");
  };

  const removeAddedSchool = (id: string) => {
    setAddedSchools((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSchool = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allSchools.map((s) => s.id)));
  const deselectAll = () => {
    if (allSchools.length > 0) setSelectedIds(new Set([allSchools[0].id]));
  };

  const selectedSchools = useMemo(
    () => allSchools.filter((s) => selectedIds.has(s.id)),
    [selectedIds, allSchools]
  );

  const peerStats = useMemo(() => {
    if (selectedSchools.length === 0) return { count: 0, median: 0, p25: 0, p75: 0, topQuartile: 0, typicalImprovement: 0 };
    const matches = selectedSchools.map((s) => s.similarityMatch).sort((a, b) => a - b);
    const count = matches.length;
    const median = matches[Math.floor(count / 2)];
    const p25 = matches[Math.floor(count * 0.25)];
    const p75 = matches[Math.floor(count * 0.75)];
    const topQuartile = matches[matches.length - 1];
    return { count, median, p25, p75, topQuartile, typicalImprovement: 0 };
  }, [selectedSchools]);

  const chartData = peerTrendData.filter((d) => d.yourSchool !== null);

  const handleStepClick = (step: number) => {
    if (step === 1) navigate(`/goals`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="ml-3 text-muted-foreground">Loading comparable schools…</span>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={2} onStepClick={handleStepClick} />

      {/* Your School Performance Banner */}
      <div className="innovare-card p-4 mb-4 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {selectedSchool?.school_name || "Your School"} — {metric.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                {(() => {
                  const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
                  const currentVal = ownData ? getMetricValue(ownData.y2024, metricId) : null;
                  const lastYearVal = ownData ? getMetricValue(ownData.y2023, metricId) : null;
                  const cur = currentVal ?? metric.currentValue;
                  const prev = lastYearVal ?? metric.lastYearValue;
                  return (
                    <>
                      <span className="text-2xl font-heading font-bold text-card-foreground">{cur}{metric.unit}</span>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        cur > prev ? "bg-innovare-green/10 text-innovare-green" : "bg-innovare-orange/10 text-innovare-orange"
                      )}>
                        {cur > prev ? "↑" : "↓"} {Math.abs(cur - prev).toFixed(1)} pts from last year
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last Year</p>
            {(() => {
              const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
              const lastYearVal = ownData ? getMetricValue(ownData.y2023, metricId) : null;
              return (
                <p className="text-lg font-heading font-semibold text-muted-foreground">{lastYearVal ?? metric.lastYearValue}{metric.unit}</p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="innovare-card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Selected Metric
            </p>
            <h2 className="font-heading font-bold text-lg text-card-foreground">
              {metric.icon} {metric.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {allSchools.length} schools most similar to yours, ranked by Euclidean distance across key dimensions.
            </p>
          </div>
          <button className="flex items-center gap-2 border border-border px-3 py-2 rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
            <Filter size={14} />
            Adjust Filters
          </button>
        </div>
      </div>

      {/* Why This Metric Matters */}
      <div className="innovare-card p-5 mb-4 border-l-4 border-l-innovare-teal">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{metric.icon}</span>
          <div>
            <h3 className="font-heading font-semibold text-sm text-card-foreground mb-1">
              Why {metric.name} Matters for Student Success
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {metric.importance}
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="schools" className="mb-4">
        <TabsList className="mb-4">
          <TabsTrigger value="schools">Comparable Schools</TabsTrigger>
          <TabsTrigger value="trends">Peer Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="schools">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Table */}
            <div className="xl:col-span-2 innovare-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-semibold text-sm text-card-foreground">
                  Comparable Schools ({Math.min(selectedIds.size, allSchools.length)} of {allSchools.length} selected)
                </h3>
                <div className="flex items-center gap-2">
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors border border-primary/30 px-2.5 py-1.5 rounded-md hover:bg-primary/5">
                        <Plus size={12} />
                        Add School
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <div className="p-3 border-b border-border">
                        <div className="relative">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search schools by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9 text-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto">
                        {searchQuery.trim() === "" ? (
                          <p className="text-xs text-muted-foreground p-3 text-center">Type to search for schools to add</p>
                        ) : searchResults.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3 text-center">No matching schools found</p>
                        ) : (
                          searchResults.map((school) => (
                            <button
                              key={school.id}
                              onClick={() => { addSchool(school); setSearchOpen(false); }}
                              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-card-foreground">{school.name}</p>
                                  <p className="text-xs text-muted-foreground">{school.enrollment} students · {school.gradeSpan}</p>
                                </div>
                                <Plus size={14} className="text-primary shrink-0" />
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button onClick={selectAll} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Select All
                  </button>
                  <span className="text-muted-foreground text-xs">|</span>
                  <button onClick={deselectAll} className="text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors">
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-10 p-3"><span className="sr-only">Include</span></th>
                      <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">School</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">2024</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">2023</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Enrollment</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Sim. Rank</th>
                      <th className="w-8 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSchools.map((school, idx) => {
                      const isSelected = selectedIds.has(school.id);
                      const isAdded = addedSchools.some((s) => s.id === school.id);
                      const peerData = schoolMetricsData[school.id];
                      const curVal = peerData ? getMetricValue(peerData.y2024, metricId) : null;
                      const prevVal = peerData ? getMetricValue(peerData.y2023, metricId) : null;
                      const displayRank = idx + 1;
                      return (
                        <>
                          <tr
                            key={school.id}
                            className={cn(
                              "border-b border-border transition-colors",
                              isSelected ? "hover:bg-muted/30" : "opacity-50 bg-muted/10",
                              expandedSchool === school.id && "bg-muted/30"
                            )}
                          >
                            <td className="p-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSchool(school.id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </td>
                            <td className="p-3 font-medium text-card-foreground cursor-pointer" onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}>
                              <div className="flex items-center gap-2">
                                {school.name}
                                {isAdded && (
                                  <button onClick={(e) => { e.stopPropagation(); removeAddedSchool(school.id); }} className="text-muted-foreground hover:text-destructive">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-semibold text-card-foreground">{curVal !== null ? `${curVal}${metric.unit}` : "—"}</td>
                            <td className="p-3 text-center text-muted-foreground">{prevVal !== null ? `${prevVal}${metric.unit}` : "—"}</td>
                            <td className="p-3 text-center text-muted-foreground">{school.enrollment > 0 ? school.enrollment : "—"}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/30">
                                #{displayRank}
                              </span>
                            </td>
                            <td className="p-3 cursor-pointer" onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}>
                              {expandedSchool === school.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </td>
                          </tr>
                          {expandedSchool === school.id && (
                            <tr key={`${school.id}-detail`}>
                              <td colSpan={7} className="p-4 bg-muted/20">
                                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                  <div><span className="text-muted-foreground">Enrollment:</span> <span className="font-medium">{school.enrollment > 0 ? `${school.enrollment} students` : "N/A"}</span></div>
                                  <div><span className="text-muted-foreground">Grade Span:</span> <span className="font-medium">{school.gradeSpan}</span></div>
                                  <div><span className="text-muted-foreground">Similarity:</span> <span className="font-medium">{school.similarityMatch > 0 ? `${school.similarityMatch}%` : "N/A"}</span></div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {allSchools.length === 0 && !loading && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No comparable schools found for this school. Try importing school data first.
                </div>
              )}
            </div>

            {/* Peer Summary */}
            <div className="space-y-4">
              <div className="innovare-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-primary" />
                  <h3 className="font-heading font-semibold text-sm text-card-foreground">Peer Context Summary</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedSchools.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-1 rounded-full">
                      {s.name.split(" ")[0]}
                      <button onClick={() => toggleSchool(s.id)} className="hover:text-primary/70 transition-colors" aria-label={`Remove ${s.name}`}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="space-y-3">
                  {(() => {
                    const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
                    const ownCur = ownData ? getMetricValue(ownData.y2024, metricId) : null;
                    const ownPrev = ownData ? getMetricValue(ownData.y2023, metricId) : null;
                    const ownGrowth = ownCur !== null && ownPrev !== null ? ownCur - ownPrev : null;

                    // Peer averages
                    const peerVals2023: number[] = [];
                    const peerVals2024: number[] = [];
                    selectedSchools.forEach((s) => {
                      const pd = schoolMetricsData[s.id];
                      const v23 = pd ? getMetricValue(pd.y2023, metricId) : null;
                      const v24 = pd ? getMetricValue(pd.y2024, metricId) : null;
                      if (v23 !== null) peerVals2023.push(v23);
                      if (v24 !== null) peerVals2024.push(v24);
                    });
                    const pAvg23 = peerVals2023.length > 0 ? peerVals2023.reduce((a, b) => a + b, 0) / peerVals2023.length : null;
                    const pAvg24 = peerVals2024.length > 0 ? peerVals2024.reduce((a, b) => a + b, 0) / peerVals2024.length : null;

                    const items = [
                      { label: "Comparable Schools", value: `${peerStats.count} schools` },
                      { label: `Your 2023-24 Performance`, value: ownCur !== null ? `${ownCur}${metric.unit}` : "—" },
                      { label: `Growth from Last Year`, value: ownGrowth !== null ? `${ownGrowth > 0 ? "+" : ""}${ownGrowth.toFixed(1)} pts` : "—", highlight: ownGrowth },
                      { label: `Peer Avg 2022-23`, value: pAvg23 !== null ? `${Math.round(pAvg23 * 10) / 10}${metric.unit}` : "—" },
                      { label: `Peer Avg 2023-24`, value: pAvg24 !== null ? `${Math.round(pAvg24 * 10) / 10}${metric.unit}` : "—" },
                    ];

                    return items.map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className={cn(
                          "text-sm font-semibold",
                          "highlight" in item && item.highlight !== null && item.highlight !== undefined
                            ? (item.highlight as number) > 0 ? "text-innovare-green" : (item.highlight as number) < 0 ? "text-innovare-orange" : "text-card-foreground"
                            : "text-card-foreground"
                        )}>{item.value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          {(() => {
            // Build chart data from real metrics
            const ownData = selectedSchool ? schoolMetricsData[selectedSchool.school_id] : undefined;
            const ownCur = ownData ? getMetricValue(ownData.y2024, metricId) : null;
            const ownPrev = ownData ? getMetricValue(ownData.y2023, metricId) : null;

            // Compute peer values for selected schools
            const peerValues2023: number[] = [];
            const peerValues2024: number[] = [];
            const schoolLines: { name: string; v2023: number | null; v2024: number | null }[] = [];

            selectedSchools.forEach((s) => {
              const pd = schoolMetricsData[s.id];
              const v23 = pd ? getMetricValue(pd.y2023, metricId) : null;
              const v24 = pd ? getMetricValue(pd.y2024, metricId) : null;
              if (v23 !== null) peerValues2023.push(v23);
              if (v24 !== null) peerValues2024.push(v24);
              schoolLines.push({ name: s.name, v2023: v23, v2024: v24 });
            });

            const average = (arr: number[]) => {
              if (arr.length === 0) return null;
              return arr.reduce((sum, v) => sum + v, 0) / arr.length;
            };

            const peerAvg2023 = average(peerValues2023);
            const peerAvg2024 = average(peerValues2024);

            const trendChartData = [
              { year: "2022-23", yourSchool: ownPrev, peerAverage: peerAvg2023 !== null ? Math.round(peerAvg2023 * 10) / 10 : null },
              { year: "2023-24", yourSchool: ownCur, peerAverage: peerAvg2024 !== null ? Math.round(peerAvg2024 * 10) / 10 : null },
            ];

            // Compute insights
            const ownChange = ownCur !== null && ownPrev !== null ? ownCur - ownPrev : null;
            const peerAvgChange = peerAvg2024 !== null && peerAvg2023 !== null ? peerAvg2024 - peerAvg2023 : null;
            const gapToPeerAvg = ownCur !== null && peerAvg2024 !== null ? ownCur - peerAvg2024 : null;

            return (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Chart */}
                <div className="xl:col-span-3 innovare-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-heading font-semibold text-sm text-card-foreground">
                      {metric.name} — 2-Year Performance
                    </h3>
                  </div>

                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} unit={metric.unit} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            fontSize: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                          formatter={(value: number) => `${value}${metric.unit}`}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="yourSchool" stroke="hsl(262 72% 50%)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: "white" }} name={selectedSchool?.school_name || "Your School"} />
                        <Line type="monotone" dataKey="peerAverage" stroke="hsl(174 62% 47%)" strokeWidth={2} dot={{ r: 4 }} name="Peer Average" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Individual peer lines table */}
                  <div className="mt-4 border-t border-border pt-4">
                    <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Individual Peer Performance</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium">School</th>
                            <th className="text-right py-2 px-3 font-medium">2022-23</th>
                            <th className="text-right py-2 px-3 font-medium">2023-24</th>
                            <th className="text-right py-2 pl-3 font-medium">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Your school row */}
                          <tr className="border-b border-border bg-primary/5">
                            <td className="py-2 pr-4 font-semibold text-card-foreground">{selectedSchool?.school_name || "Your School"}</td>
                            <td className="text-right py-2 px-3 font-medium">{ownPrev !== null ? `${ownPrev}${metric.unit}` : "—"}</td>
                            <td className="text-right py-2 px-3 font-medium">{ownCur !== null ? `${ownCur}${metric.unit}` : "—"}</td>
                            <td className="text-right py-2 pl-3 font-semibold">
                              {ownChange !== null ? (
                                <span className={cn(
                                  (metric.polarity === "positive" ? ownChange > 0 : ownChange < 0) ? "text-innovare-green" : "text-innovare-orange"
                                )}>
                                  {ownChange > 0 ? "+" : ""}{ownChange.toFixed(1)}{metric.unit}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                          {schoolLines.map((sl) => {
                            const change = sl.v2024 !== null && sl.v2023 !== null ? sl.v2024 - sl.v2023 : null;
                            return (
                              <tr key={sl.name} className="border-b border-border last:border-0">
                                <td className="py-2 pr-4 text-card-foreground">{sl.name}</td>
                                <td className="text-right py-2 px-3">{sl.v2023 !== null ? `${sl.v2023}${metric.unit}` : "—"}</td>
                                <td className="text-right py-2 px-3">{sl.v2024 !== null ? `${sl.v2024}${metric.unit}` : "—"}</td>
                                <td className="text-right py-2 pl-3 font-medium">
                                  {change !== null ? (
                                    <span className={cn(
                                      (metric.polarity === "positive" ? change > 0 : change < 0) ? "text-innovare-green" : "text-innovare-orange"
                                    )}>
                                      {change > 0 ? "+" : ""}{change.toFixed(1)}{metric.unit}
                                    </span>
                                  ) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-4">
                  <div className="innovare-card p-5">
                    <h4 className="font-heading font-semibold text-sm text-card-foreground mb-3">Key Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs font-semibold text-primary mb-0.5">Your Year-over-Year Change</p>
                        <p className="text-lg font-heading font-bold text-card-foreground">
                          {ownChange !== null ? `${ownChange > 0 ? "+" : ""}${ownChange.toFixed(1)}${metric.unit}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ownChange !== null && peerAvgChange !== null
                            ? (metric.polarity === "positive"
                                ? ownChange >= peerAvgChange ? "Above peer average change" : "Below peer average change"
                                : ownChange <= peerAvgChange ? "Better than peer average change" : "Worse than peer average change")
                            : "Comparing to peer average"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Peer Average Change</p>
                        <p className="text-lg font-heading font-bold text-card-foreground">
                          {peerAvgChange !== null ? `${peerAvgChange > 0 ? "+" : ""}${peerAvgChange.toFixed(1)}${metric.unit}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Across {selectedSchools.length} comparable schools</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Gap to Peer Average</p>
                        <p className="text-lg font-heading font-bold text-card-foreground">
                          {gapToPeerAvg !== null ? `${gapToPeerAvg > 0 ? "+" : ""}${gapToPeerAvg.toFixed(1)}${metric.unit}` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Current year position</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate("/goals")}
          className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          ← Back to Metrics
        </button>
        <button
          onClick={() => {
            // Persist selected peers to context for the next step
            const peers = selectedSchools.map((s) => {
              const peerData = schoolMetricsData[s.id];
              const perfValue = peerData ? getMetricValue(peerData.y2024, metricId) : null;
              return {
                id: s.id,
                name: s.name,
                enrollment: s.enrollment,
                similarityMatch: s.similarityMatch,
                similarityRank: s.similarityRank,
                gradeSpan: s.gradeSpan,
                euclideanDistance: 0,
                currentPerformance: perfValue ?? 0,
              };
            });
            setSelectedPeers(peers);
            navigate(`/goals/recommendation?metric=${metricId}`);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Goal Range
          <ArrowRight size={14} />
        </button>
      </div>

      <SchoolReportCard
        school={reportCardSchool}
        open={!!reportCardSchool}
        onOpenChange={(open) => !open && setReportCardSchool(null)}
      />
    </div>
  );
};

export default ComparableSchools;
