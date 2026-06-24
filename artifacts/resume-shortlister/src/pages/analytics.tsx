import React, { useMemo, useState } from "react";
import { useListCandidates, useListJobs, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { TrendingUp, Users, CheckCircle, Target, Award, Zap } from "lucide-react";

/* ── Colour palette ── */
const BRAND   = "hsl(var(--primary))";
const MUTED   = "hsl(var(--primary)/0.25)";
const GREEN   = "#10b981";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const BLUE    = "#3b82f6";
const PURPLE  = "#a855f7";
const COLORS  = [BRAND, GREEN, AMBER, RED, BLUE, PURPLE, "#06b6d4", "#ec4899"];

/* ── Shared tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border shadow-xl px-4 py-3 text-xs space-y-1 min-w-[140px]"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
    >
      {label && <p className="font-bold text-sm mb-1.5" style={{ color: "hsl(var(--foreground))" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill || p.color }} />
            {p.name}
          </span>
          <span className="font-bold tabular-nums" style={{ color: p.fill || p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ h = 48 }: { h?: number }) {
  return <Skeleton className={`h-${h} w-full rounded-xl`} />;
}

/* ── Stat chip ── */
function Chip({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/60">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function Analytics() {
  const { data: candidates, isLoading: loadingC } = useListCandidates();
  const { data: jobs, isLoading: loadingJ } = useListJobs();
  const { data: summary, isLoading: loadingS } = useGetDashboardSummary();

  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  /* ── Derived data ── */
  const scoreBuckets = useMemo(() => {
    if (!candidates) return [];
    const buckets: Record<string, number> = {
      "50–60": 0, "60–70": 0, "70–80": 0, "80–90": 0, "90–100": 0,
    };
    candidates.forEach((c) => {
      const s = c.overallScore;
      if (s < 60)       buckets["50–60"]++;
      else if (s < 70)  buckets["60–70"]++;
      else if (s < 80)  buckets["70–80"]++;
      else if (s < 90)  buckets["80–90"]++;
      else              buckets["90–100"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [candidates]);

  const skillFrequency = useMemo(() => {
    if (!candidates) return [];
    const freq: Record<string, number> = {};
    candidates.forEach((c) => {
      (c.extractedSkills ?? []).forEach((sk: string) => {
        freq[sk] = (freq[sk] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }, [candidates]);

  const byJob = useMemo(() => {
    if (!candidates || !jobs) return [];
    return jobs.map((j) => {
      const cs = candidates.filter((c) => c.jobId === j.id);
      const avg = cs.length ? Math.round(cs.reduce((s, c) => s + c.overallScore, 0) / cs.length) : 0;
      const shortlisted = cs.filter((c) => c.status === "shortlisted").length;
      return { name: j.title.replace("Engineer", "Eng.").replace("Machine Learning", "ML"), total: cs.length, avg, shortlisted };
    }).filter((r) => r.total > 0);
  }, [candidates, jobs]);

  const funnelData = useMemo(() => {
    if (!candidates) return [];
    const total     = candidates.length;
    const analyzed  = candidates.filter((c) => c.overallScore > 0).length;
    const short     = candidates.filter((c) => c.status === "shortlisted").length;
    const rejected  = candidates.filter((c) => c.status === "rejected").length;
    return [
      { name: "Applied",      value: total,    fill: BRAND },
      { name: "Analyzed",     value: analyzed, fill: BLUE },
      { name: "Shortlisted",  value: short,    fill: GREEN },
      { name: "Rejected",     value: rejected, fill: RED },
    ];
  }, [candidates]);

  const verifiedData = useMemo(() => {
    if (!candidates) return [];
    const verified   = candidates.filter((c) => c.verifiedProofOfWork).length;
    const unverified = candidates.length - verified;
    return [
      { name: "Verified PoW",   value: verified,   fill: GREEN },
      { name: "No PoW",         value: unverified, fill: MUTED },
    ];
  }, [candidates]);

  const avgScore  = candidates?.length
    ? Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / candidates.length)
    : 0;
  const topScore  = candidates?.length ? Math.max(...candidates.map((c) => c.overallScore)) : 0;
  const shortRate = candidates?.length
    ? Math.round((candidates.filter((c) => c.status === "shortlisted").length / candidates.length) * 100)
    : 0;

  const loading = loadingC || loadingJ || loadingS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pipeline intelligence · score distributions · skill gaps</p>
      </div>

      {/* KPI strip */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} h={20} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Chip label="Avg Score"      value={avgScore}        icon={Target}     color={BRAND}   />
          <Chip label="Top Score"      value={topScore}        icon={Award}      color={AMBER}   />
          <Chip label="Shortlist Rate" value={`${shortRate}%`} icon={CheckCircle} color={GREEN}  />
          <Chip label="Total Reviewed" value={candidates?.filter(c => c.overallScore > 0).length ?? 0} icon={Users} color={BLUE} />
        </div>
      )}

      {/* Row 1: Funnel + Score dist */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Hiring funnel */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Hiring Funnel</CardTitle>
            <CardDescription className="text-xs">Candidates through each stage</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <CardSkeleton h={44} /> : (
              <div className="space-y-2 pt-2">
                {funnelData.map((stage, i) => {
                  const pct = funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0;
                  return (
                    <div key={stage.name}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground font-medium">{stage.name}</span>
                        <span className="font-bold tabular-nums" style={{ color: stage.fill }}>
                          {stage.value}
                          {i > 0 && funnelData[0].value > 0 && (
                            <span className="text-muted-foreground font-normal ml-1">
                              ({Math.round(pct)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-6 rounded-md overflow-hidden bg-muted/30">
                        <div
                          className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                          style={{ width: `${Math.max(pct, 8)}%`, background: stage.fill }}
                        >
                          {pct > 20 && (
                            <span className="text-[10px] font-bold text-white/90">{stage.value}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score distribution */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Score Distribution</CardTitle>
            <CardDescription className="text-xs">Number of candidates per score band — hover for details</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <CardSkeleton h={44} /> : (
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBuckets} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)", radius: 4 }} />
                    <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {scoreBuckets.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={hoveredScore === null || hoveredScore === idx ? BRAND : MUTED}
                          style={{ transition: "fill 0.15s", cursor: "pointer" }}
                          onMouseEnter={() => setHoveredScore(idx)}
                          onMouseLeave={() => setHoveredScore(null)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top skills + by role */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Top skills */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Candidate Skills</CardTitle>
            <CardDescription className="text-xs">Most common skills across all resumes</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <CardSkeleton h={44} /> : (
              <div className="space-y-2 pt-2">
                {skillFrequency.map((s, i) => {
                  const pct = (s.count / (candidates?.length ?? 1)) * 100;
                  const isHovered = hoveredSkill === i;
                  return (
                    <div
                      key={s.skill}
                      className="cursor-default"
                      onMouseEnter={() => setHoveredSkill(i)}
                      onMouseLeave={() => setHoveredSkill(null)}
                    >
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span
                          className="font-medium transition-colors"
                          style={{ color: isHovered ? COLORS[i % COLORS.length] : "hsl(var(--foreground))" }}
                        >
                          {s.skill}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{s.count} candidate{s.count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            background: COLORS[i % COLORS.length],
                            opacity: hoveredSkill === null || isHovered ? 1 : 0.35,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score by role */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Score by Role</CardTitle>
            <CardDescription className="text-xs">Avg score and shortlisted count per job opening</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <CardSkeleton h={44} /> : (
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byJob} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={8}
                      interval={0} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)", radius: 4 }} />
                    <Bar dataKey="avg"        name="Avg Score"   fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="shortlisted" name="Shortlisted" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="total"       name="Applied"     fill={MUTED} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-5 mt-3 pl-1">
                  {[["Avg Score", BRAND], ["Shortlisted", GREEN], ["Applied", MUTED]].map(([lbl, col]) => (
                    <div key={lbl} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="w-3 h-2 rounded-sm inline-block" style={{ background: col }} />
                      {lbl}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Verified PoW + per-candidate score table */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Verified PoW donut */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Proof of Work</CardTitle>
            <CardDescription className="text-xs">Candidates with verified GitHub / portfolio</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <CardSkeleton h={44} /> : (
              <div className="flex flex-col items-center pt-2">
                <div className="relative h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={verifiedData} cx="50%" cy="50%" innerRadius={40} outerRadius={58}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {verifiedData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold tabular-nums" style={{ color: GREEN }}>
                      {verifiedData[0]?.value ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">verified</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-3">
                  {verifiedData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-bold" style={{ color: d.fill }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All candidates ranked table */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Full Ranking</CardTitle>
            <CardDescription className="text-xs">All candidates sorted by overall score</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <CardSkeleton h={44} /> : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-border/40 bg-muted/20">
                    <th className="px-5 py-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-5 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-5 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Synergy</th>
                    <th className="px-5 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Velocity</th>
                    <th className="px-5 py-2 text-right font-medium text-muted-foreground">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {(candidates ?? [])
                    .slice()
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .map((c, i) => {
                      const bar = (v: number, color: string) => (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
                          </div>
                          <span className="tabular-nums w-6 text-right">{v}</span>
                        </div>
                      );
                      return (
                        <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                          <td className="px-5 py-2.5 font-medium">{c.name}</td>
                          <td className="px-5 py-2.5 hidden sm:table-cell w-32">{bar(c.skillSynergyScore, BRAND)}</td>
                          <td className="px-5 py-2.5 hidden sm:table-cell w-32">{bar(c.velocityScore, AMBER)}</td>
                          <td className="px-5 py-2.5 text-right font-bold tabular-nums" style={{ color: BRAND }}>{c.overallScore}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
