import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Legend } from "recharts";
import WorkflowProgress from "@/components/WorkflowProgress";
import { metrics, peerTrendData } from "@/data/mockData";

const PeerTrends = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "ela_proficiency";
  const metric = metrics.find((m) => m.id === metricId) || metrics[0];

  const [showTop, setShowTop] = useState(false);
  const [showBand, setShowBand] = useState(true);

  const chartData = peerTrendData.filter((d) => d.yourSchool !== null);

  const handleStepClick = (step: number) => {
    if (step === 1) navigate("/goals");
    if (step === 2) navigate(`/goals/comparable?metric=${metricId}`);
  };

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={3} onStepClick={handleStepClick} />

      <div className="innovare-card p-5 mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Peer Trend Analysis</p>
        <h2 className="font-heading font-bold text-lg text-card-foreground">
          {metric.icon} {metric.name} — 5-Year Trajectories
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Compare your school's trajectory against comparable peer performance over time.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Chart */}
        <div className="xl:col-span-3 innovare-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-heading font-semibold text-sm text-card-foreground">Performance Over Time</h3>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowBand(!showBand)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showBand ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {showBand ? <Eye size={12} /> : <EyeOff size={12} />}
                Percentile Band
              </button>
              <button
                onClick={() => setShowTop(!showTop)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showTop ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {showTop ? <Eye size={12} /> : <EyeOff size={12} />}
                Top Performers
              </button>
            </div>
          </div>

          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 89%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220 10% 46%)" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(220 14% 89%)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                {showBand && (
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stackId="band"
                    fill="hsl(210 80% 55% / 0.1)"
                    stroke="none"
                    name="75th Percentile"
                  />
                )}
                {showBand && (
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stackId="band-low"
                    fill="hsl(210 80% 55% / 0.05)"
                    stroke="hsl(210 80% 55% / 0.3)"
                    strokeDasharray="4 4"
                    name="25th Percentile"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="peerMedian"
                  stroke="hsl(174 62% 47%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Peer Median"
                />
                <Line
                  type="monotone"
                  dataKey="yourSchool"
                  stroke="hsl(262 72% 50%)"
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                  name="Your School"
                />
                {showTop && (
                  <Line
                    type="monotone"
                    dataKey="topPerformers"
                    stroke="hsl(142 52% 50%)"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ r: 3 }}
                    name="Top Performers"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          <div className="innovare-card p-5">
            <h4 className="font-heading font-semibold text-sm text-card-foreground mb-3">Key Insights</h4>
            <div className="space-y-3">
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-xs font-semibold text-primary mb-0.5">Your Growth Rate</p>
                <p className="text-lg font-heading font-bold text-card-foreground">+2.0 pts/yr</p>
                <p className="text-xs text-muted-foreground">Above peer average of +1.8 pts/yr</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Peer Median Gap</p>
                <p className="text-lg font-heading font-bold text-card-foreground">-1.9 pts</p>
                <p className="text-xs text-muted-foreground">Gap narrowing over time</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">Projected Crossover</p>
                <p className="text-lg font-heading font-bold text-card-foreground">SY 2027–28</p>
                <p className="text-xs text-muted-foreground">At current growth rate</p>
              </div>
            </div>
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
          onClick={() => navigate(`/goals/recommendation?metric=${metricId}`)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Goal Range
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default PeerTrends;
