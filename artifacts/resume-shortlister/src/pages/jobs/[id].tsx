import React from "react";
import { useGetJob, useListJobCandidates } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Zap, Target, ArrowUpRight, Github, Award } from "lucide-react";
import { Link } from "wouter";

export function JobDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: job, isLoading: isJobLoading } = useGetJob(id);
  const { data: candidates, isLoading: isCandidatesLoading } = useListJobCandidates(id);

  if (isJobLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return <div className="p-8 text-center">Job not found</div>;
  }

  // Sort candidates by overall score
  const sortedCandidates = [...(candidates || [])].sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-jobdetail-title">{job.title}</h1>
          <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="uppercase">
            {job.status}
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl" data-testid="text-jobdetail-desc">{job.description}</p>
        
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge variant="outline" className="bg-muted/50">{job.experienceYears}+ Years Exp</Badge>
          {job.requiredSkills.map(skill => (
            <Badge key={skill} variant="secondary">{skill}</Badge>
          ))}
        </div>
      </div>

      <Card data-testid="card-job-pipeline">
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>{candidates?.length || 0} candidates analyzed for this role.</CardDescription>
        </CardHeader>
        <CardContent>
          {isCandidatesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sortedCandidates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Target className="w-3 h-3" /> Overall
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 text-blue-500" /> Velocity
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Synergy</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCandidates.map((candidate) => (
                  <TableRow key={candidate.id} data-testid={`row-candidate-${candidate.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{candidate.name}</div>
                        {candidate.verifiedProofOfWork && (
                          <Award className="w-4 h-4 text-amber-500" title="Verified Proof of Work" />
                        )}
                        {candidate.githubUrl && (
                          <Github className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{candidate.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        candidate.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400' :
                        candidate.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400' :
                        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400'
                      }>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-lg">
                      {candidate.overallScore}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {candidate.velocityScore}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {candidate.skillSynergyScore}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/candidates/${candidate.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-8 w-8">
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No candidates in pipeline yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
