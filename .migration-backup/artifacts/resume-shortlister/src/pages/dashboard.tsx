import React from "react";
import { useGetDashboardSummary, useGetTopCandidates, useGetSkillGaps } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart as BarChartIcon, Users, CheckCircle, Clock, XCircle, TrendingUp, Briefcase, FileText, Target, MoreHorizontal, Eye } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topCandidates, isLoading: isLoadingTop } = useGetTopCandidates();
  const { data: skillGaps, isLoading: isLoadingGaps } = useGetSkillGaps();

  // Mock chart data based on summary for visuals
  const barData = [
    { name: 'Jan', sent: 400, shortlisted: 240 },
    { name: 'Feb', sent: 300, shortlisted: 139 },
    { name: 'Mar', sent: 200, shortlisted: 980 },
    { name: 'Apr', sent: 278, shortlisted: 390 },
    { name: 'May', sent: 189, shortlisted: 480 },
    { name: 'Jun', sent: 239, shortlisted: 380 },
    { name: 'Jul', sent: 349, shortlisted: 430 },
  ];

  const pieData = summary ? [
    { name: 'Shortlisted', value: summary.shortlisted },
    { name: 'Pending', value: summary.pending },
    { name: 'Rejected', value: summary.rejected },
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'analyzed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm" data-testid="text-dashboard-subtitle">Overview of recruitment activities</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Jobs" value={summary?.totalJobs} icon={Briefcase} colorClass="bg-blue-100 text-blue-600" isLoading={isLoadingSummary} testId="total-jobs" />
        <StatCard title="Total Applied" value={summary?.totalCandidates} icon={Users} colorClass="bg-teal-100 text-teal-600" isLoading={isLoadingSummary} testId="total-candidates" />
        <StatCard title="Shortlisted" value={summary?.shortlisted} icon={CheckCircle} colorClass="bg-emerald-100 text-emerald-600" isLoading={isLoadingSummary} testId="shortlisted" />
        <StatCard title="Rejected" value={summary?.rejected} icon={XCircle} colorClass="bg-red-100 text-red-600" isLoading={isLoadingSummary} testId="rejected" />
        <StatCard title="Pending" value={summary?.pending} icon={Clock} colorClass="bg-amber-100 text-amber-600" isLoading={isLoadingSummary} testId="pending" />
        <StatCard title="Avg Score" value={summary?.averageScore ? `${summary.averageScore.toFixed(0)}` : undefined} icon={Target} colorClass="bg-purple-100 text-purple-600" isLoading={isLoadingSummary} testId="avg-score" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 shadow-sm border-0" data-testid="card-vacancy-stats">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Vacancy Statistics</CardTitle>
              <CardDescription>Application trends over time</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="sent" name="Application Sent" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="shortlisted" name="Shortlisted" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-0" data-testid="card-job-posted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Top Candidates</CardTitle>
              <CardDescription>Highest scoring candidates</CardDescription>
            </div>
            <Link href="/candidates" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="px-2">
            {isLoadingTop ? (
              <div className="space-y-4 p-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topCandidates?.length ? (
              <div className="space-y-1 mt-2">
                {topCandidates.slice(0, 3).map((candidate, i) => (
                  <div key={candidate.candidateId} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarFallback className={`bg-blue-50 text-blue-700 font-semibold`}>
                          {candidate.candidateName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{candidate.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-sm text-slate-700">{candidate.overallScore}</div>
                      <Link href={`/candidates/${candidate.candidateId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No top candidates found.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 shadow-sm border-0" data-testid="card-applications">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Link href="/candidates" className="text-sm text-blue-600 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-y">
                  <tr>
                    <th className="px-6 py-3 font-medium">No.</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Job Title</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topCandidates?.slice(0, 4).map((candidate, i) => (
                    <tr key={candidate.candidateId} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500 font-medium">#{(i + 1).toString().padStart(3, '0')}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                        {candidate.candidateName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{candidate.jobTitle}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{candidate.overallScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pipeline Breakdown</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, testId, colorClass }: { title: string, value?: string | number, icon: any, isLoading: boolean, testId: string, colorClass: string }) {
  return (
    <Card data-testid={`stat-${testId}`} className="shadow-sm border-0 flex flex-col items-center justify-center py-6 hover:shadow-md transition-shadow">
      {isLoading ? (
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
      ) : (
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="text-3xl font-bold text-slate-800 mb-1">
        {isLoading ? <Skeleton className="h-8 w-16" /> : (value ?? 0)}
      </div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
    </Card>
  );
}
