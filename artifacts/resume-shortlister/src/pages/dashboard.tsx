import React from "react";
import { useGetDashboardSummary, useGetTopCandidates, useGetSkillGaps } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, CheckCircle, Clock, XCircle, TrendingUp, Zap, Target } from "lucide-react";
import { Link } from "wouter";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topCandidates, isLoading: isLoadingTop } = useGetTopCandidates();
  const { data: skillGaps, isLoading: isLoadingGaps } = useGetSkillGaps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-dashboard-title">Pipeline Overview</h1>
        <p className="text-muted-foreground" data-testid="text-dashboard-subtitle">Real-time candidate metrics and system analytics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Jobs" value={summary?.totalJobs} icon={BarChart} isLoading={isLoadingSummary} testId="total-jobs" />
        <StatCard title="Total Candidates" value={summary?.totalCandidates} icon={Users} isLoading={isLoadingSummary} testId="total-candidates" />
        <StatCard title="Shortlisted" value={summary?.shortlisted} icon={CheckCircle} isLoading={isLoadingSummary} testId="shortlisted" />
        <StatCard title="Average Score" value={summary?.averageScore ? `${summary.averageScore.toFixed(1)}/100` : undefined} icon={Target} isLoading={isLoadingSummary} testId="avg-score" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4" data-testid="card-top-candidates">
          <CardHeader>
            <CardTitle>Top Candidates Across Pipeline</CardTitle>
            <CardDescription>Highest scoring candidates pending review.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTop ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topCandidates?.length ? (
              <div className="space-y-4">
                {topCandidates.map((candidate) => (
                  <div key={candidate.candidateId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">{candidate.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{candidate.jobTitle}</p>
                    </div>
                    <div className="flex gap-4 items-center text-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">Overall</span>
                        <span className="font-mono font-medium">{candidate.overallScore}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">Velocity</span>
                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{candidate.velocityScore}</span>
                      </div>
                      <Link href={`/candidates/${candidate.candidateId}`} className="text-primary hover:underline font-medium ml-2">
                        Review
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

        <Card className="col-span-3" data-testid="card-skill-gaps">
          <CardHeader>
            <CardTitle>Identified Skill Gaps</CardTitle>
            <CardDescription>High-demand skills with low candidate scores.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingGaps ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : skillGaps?.length ? (
              <div className="space-y-4">
                {skillGaps.map((gap, idx) => (
                  <div key={idx} className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{gap.skill}</span>
                      <span className="font-mono text-destructive">{gap.averageCandidateScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Required in {gap.jobTitle}</span>
                      <span>{gap.frequency} candidates missing</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No significant skill gaps identified.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, testId }: { title: string, value?: string | number, icon: any, isLoading: boolean, testId: string }) {
  return (
    <Card data-testid={`stat-${testId}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold font-mono">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
