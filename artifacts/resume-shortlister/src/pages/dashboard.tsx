import React, { useState } from "react";
import { useGetDashboardSummary, useGetTopCandidates, useGetSkillGaps } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, CheckCircle, Clock, XCircle, Briefcase, Target,
  Eye, Play, X, ChevronRight, Zap, ArrowUpRight
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#ef4444"];

const barData = [
  { month: "Jan", apps: 38, picked: 14 },
  { month: "Feb", apps: 52, picked: 21 },
  { month: "Mar", apps: 91, picked: 38 },
  { month: "Apr", apps: 44, picked: 19 },
  { month: "May", apps: 67, picked: 29 },
  { month: "Jun", apps: 78, picked: 34 },
  { month: "Jul", apps: 55, picked: 22 },
];

function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <video
          src="/demo.mp4"
          autoPlay
          controls
          className="w-full aspect-video bg-black"
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topCandidates, isLoading: isLoadingTop } = useGetTopCandidates();
  const [showVideo, setShowVideo] = useState(false);

  const pieData = summary
    ? [
        { name: "Shortlisted", value: summary.shortlisted || 0 },
        { name: "Pending", value: summary.pending || 0 },
        { name: "Rejected", value: summary.rejected || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "shortlisted":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/15 text-red-400 border-red-500/20";
      case "analyzed":
        return "bg-sky-500/15 text-sky-400 border-sky-500/20";
      default:
        return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-dashboard-title">
            Hiring Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-dashboard-subtitle">
            Live overview · updated just now
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs border-dashed"
          onClick={() => setShowVideo(true)}
        >
          <Play className="w-3 h-3 fill-current text-primary" />
          Watch demo
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Open Roles"
          value={summary?.totalJobs}
          icon={Briefcase}
          accent="cyan"
          isLoading={isLoadingSummary}
          testId="total-jobs"
        />
        <MetricCard
          label="Total Applied"
          value={summary?.totalCandidates}
          icon={Users}
          accent="blue"
          isLoading={isLoadingSummary}
          testId="total-candidates"
        />
        <MetricCard
          label="Shortlisted"
          value={summary?.shortlisted}
          icon={CheckCircle}
          accent="green"
          isLoading={isLoadingSummary}
          testId="shortlisted"
        />
        <MetricCard
          label="Rejected"
          value={summary?.rejected}
          icon={XCircle}
          accent="red"
          isLoading={isLoadingSummary}
          testId="rejected"
        />
        <MetricCard
          label="Pending"
          value={summary?.pending}
          icon={Clock}
          accent="amber"
          isLoading={isLoadingSummary}
          testId="pending"
        />
        <MetricCard
          label="Avg Score"
          value={summary?.averageScore ? `${summary.averageScore.toFixed(0)}` : undefined}
          icon={Target}
          accent="purple"
          isLoading={isLoadingSummary}
          testId="avg-score"
        />
      </div>

      {/* Middle row: Chart + Top performers + Demo */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart */}
        <Card className="lg:col-span-3 border-border/50" data-testid="card-vacancy-stats">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Application Volume</CardTitle>
                <CardDescription className="text-xs mt-0.5">Applications vs shortlisted, last 7 months</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary">
                <Zap className="w-2.5 h-2.5 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    dy={8}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="apps" name="Applications" fill="hsl(var(--primary)/0.3)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="picked" name="Shortlisted" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top candidates */}
        <Card className="lg:col-span-2 border-border/50" data-testid="card-job-posted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Top Scorers</CardTitle>
              <Link href="/candidates">
                <button className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                  All <ArrowUpRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <CardDescription className="text-xs">Highest ranked this cycle</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {isLoadingTop ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)
            ) : topCandidates?.length ? (
              topCandidates.slice(0, 4).map((c, i) => (
                <div
                  key={c.candidateId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-[11px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                      {c.candidateName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{c.candidateName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.jobTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-primary">{c.overallScore}</span>
                    <Link href={`/candidates/${c.candidateId}`}>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No candidates scored yet.
                <br />
                <Link href="/analyze">
                  <span className="text-primary hover:underline cursor-pointer">Run batch analysis →</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Recent applications + Pipeline donut */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/50" data-testid="card-applications">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
              <Link href="/candidates">
                <button className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-border/50 bg-muted/30">
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground tracking-wide">#</th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground tracking-wide">Candidate</th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground tracking-wide hidden sm:table-cell">Role</th>
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground tracking-wide">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium text-muted-foreground tracking-wide">Score</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTop ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                ) : topCandidates?.length ? (
                  topCandidates.slice(0, 5).map((c, i) => (
                    <tr
                      key={c.candidateId}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3 text-muted-foreground font-mono">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-5 py-3 font-medium">{c.candidateName}</td>
                      <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{c.jobTitle}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">{c.overallScore}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      No applications yet.{" "}
                      <Link href="/jobs">
                        <span className="text-primary hover:underline cursor-pointer">Post a role →</span>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pipeline donut + video thumbnail */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pipeline Breakdown</CardTitle>
              <CardDescription className="text-xs">Status distribution across all candidates</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                  Awaiting first analysis run
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video demo card */}
          <button
            onClick={() => setShowVideo(true)}
            className="w-full relative rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted/30 hover:border-primary/40 transition-all group"
          >
            <video
              src="/demo.mp4"
              muted
              playsInline
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="text-[11px] font-semibold text-white drop-shadow">Watch product demo</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, accent, isLoading, testId
}: {
  label: string;
  value?: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "blue" | "green" | "red" | "amber" | "purple";
  isLoading: boolean;
  testId: string;
}) {
  const accentMap = {
    cyan:   { bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/20" },
    blue:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
    green:  { bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20" },
    red:    { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
    amber:  { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  };
  const a = accentMap[accent];

  return (
    <Card
      data-testid={`stat-${testId}`}
      className={`border ${a.border} bg-card/60 py-4 px-4`}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      ) : (
        <>
          <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-3 ${a.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${a.text}`} />
          </div>
          <div className={`text-2xl font-bold tabular-nums ${a.text}`}>
            {value ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</div>
        </>
      )}
    </Card>
  );
}
