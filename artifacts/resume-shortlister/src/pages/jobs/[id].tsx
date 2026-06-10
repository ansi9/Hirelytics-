import React from "react";
import { useGetJob, useListJobCandidates } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Zap, Target, ArrowUpRight, Github, Award, Users, Briefcase, MapPin, Clock, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function JobDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: job, isLoading: isJobLoading } = useGetJob(id);
  const { data: candidates, isLoading: isCandidatesLoading } = useListJobCandidates(id);

  if (isJobLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Briefcase className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Job Not Found</h2>
        <p className="text-slate-500 mt-2">The requisition you're looking for doesn't exist.</p>
        <Link href="/jobs" className="mt-4 text-blue-600 hover:underline">Return to Jobs</Link>
      </div>
    );
  }

  // Sort candidates by overall score
  const sortedCandidates = [...(candidates || [])].sort((a, b) => b.overallScore - a.overallScore);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'analyzed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getCompanyColor = (id: number) => {
    const colors = ['bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[id % colors.length];
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-violet-100 text-violet-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 rounded-xl shrink-0">
            <AvatarFallback className={`${getCompanyColor(job.id)} text-white font-bold text-xl rounded-xl`}>
              {job.title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800" data-testid="text-jobdetail-title">{job.title}</h1>
              <Badge variant="outline" className={`border-0 uppercase text-[10px] font-bold tracking-wide ${job.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {job.status}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-3">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Remote</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Full-time</div>
              <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.experienceYears}+ Years Exp</div>
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {candidates?.length || 0} Candidates</div>
            </div>

            <p className="text-slate-600 max-w-3xl leading-relaxed text-sm" data-testid="text-jobdetail-desc">{job.description}</p>
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {job.requiredSkills.map(skill => (
                <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-xs font-semibold rounded-md">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden" data-testid="card-job-pipeline">
        <CardHeader className="pb-4 border-b border-slate-100 bg-white">
          <CardTitle className="text-lg text-slate-800">Candidate Pipeline</CardTitle>
          <CardDescription>Candidates matched to this requisition</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isCandidatesLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            </div>
          ) : sortedCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Candidate</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Overall Match</th>
                    <th className="px-6 py-4 font-semibold">Velocity</th>
                    <th className="px-6 py-4 font-semibold">Synergy</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCandidates.map((candidate) => (
                    <TableRow key={candidate.id} data-testid={`row-candidate-${candidate.id}`} className="bg-white hover:bg-slate-50/80 border-0 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                            <AvatarFallback className={`${getAvatarColor(candidate.name)} font-bold`}>
                              {candidate.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-slate-800">{candidate.name}</div>
                              {candidate.verifiedProofOfWork && (
                                <Award className="w-4 h-4 text-amber-500" title="Verified Proof of Work" />
                              )}
                              {candidate.githubUrl && (
                                <Github className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{candidate.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-slate-800 text-base">{candidate.overallScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-sky-500" />
                          <span className="font-bold text-sky-600 text-base">{candidate.velocityScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium text-slate-500">
                        {candidate.skillSynergyScore}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/candidates/${candidate.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No candidates yet</h3>
              <p className="text-slate-500 text-sm">Add candidates or wait for applications to arrive.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
