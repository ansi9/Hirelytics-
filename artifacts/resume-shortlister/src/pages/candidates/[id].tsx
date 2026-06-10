import React, { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetCandidate, 
  useGetCandidateBlind, 
  useGetCandidateFeedback,
  useUpdateCandidate,
  useGetJob,
  getGetCandidateQueryKey,
  getGetCandidateBlindQueryKey,
  CandidateStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Zap, Target, ArrowLeft, Github, Globe, MapPin, GraduationCap, Clock, Award, Mail, Briefcase, CheckCircle2, XCircle } from "lucide-react";

export function CandidateDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [blindMode, setBlindMode] = useState(false);
  
  // Conditionally use hooks based on blind mode
  const { data: regularCandidate, isLoading: isLoadingReg } = useGetCandidate(id, { query: { enabled: !blindMode, queryKey: getGetCandidateQueryKey(id) } });
  const { data: blindCandidate, isLoading: isLoadingBlind } = useGetCandidateBlind(id, { query: { enabled: blindMode, queryKey: getGetCandidateBlindQueryKey(id) } });
  
  const candidate = blindMode ? blindCandidate : regularCandidate;
  const isLoading = blindMode ? isLoadingBlind : isLoadingReg;

  const { data: job, isLoading: isJobLoading } = useGetJob(candidate?.jobId || 0, { query: { enabled: !!candidate?.jobId, queryKey: ['getJob', candidate?.jobId] }});
  
  // Only fetch feedback if rejected
  const { data: feedback, isLoading: isFeedbackLoading } = useGetCandidateFeedback(id, { query: { enabled: candidate?.status === 'rejected', queryKey: ['getFeedback', id] }});

  const updateCandidate = useUpdateCandidate();

  const handleStatusChange = (status: CandidateStatus) => {
    updateCandidate.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCandidateQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetCandidateBlindQueryKey(id) });
      }
    });
  };

  if (isLoading || !candidate) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href={`/jobs/${candidate.jobId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pipeline
          </Link>
        </Button>
        <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md border">
          <Switch id="blind-mode-detail" checked={blindMode} onCheckedChange={setBlindMode} />
          <Label htmlFor="blind-mode-detail" className="font-medium cursor-pointer text-xs">Blind Hiring Mode</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Identity & Actions */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-2xl">
                  {blindMode ? `C${candidate.id}` : ('name' in candidate ? candidate.name.charAt(0) : `C`)}
                </div>
                <Badge variant={
                  candidate.status === 'shortlisted' ? 'default' : 
                  candidate.status === 'rejected' ? 'destructive' : 'secondary'
                } className="uppercase text-[10px]">
                  {candidate.status}
                </Badge>
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                {blindMode ? `Candidate #${candidate.id}` : ('name' in candidate ? candidate.name : `Candidate #${candidate.id}`)}
              </h1>
              
              {!blindMode && 'email' in candidate && (
                <div className="text-sm text-muted-foreground mb-4">{candidate.email}</div>
              )}

              {candidate.verifiedProofOfWork && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-amber-800 dark:text-amber-400 text-sm font-medium">
                  <Award className="w-4 h-4" /> Verified Proof of Work
                </div>
              )}

              {!blindMode && 'location' in candidate && (
                <div className="space-y-2 mt-6">
                  {candidate.location && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /> {candidate.location}</div>}
                  {candidate.university && <div className="flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="w-4 h-4" /> {candidate.university}</div>}
                  {candidate.yearsExperience && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="w-4 h-4" /> {candidate.yearsExperience} Years Exp</div>}
                  {(candidate.githubUrl || candidate.portfolioUrl) && <Separator className="my-3" />}
                  {candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><Github className="w-4 h-4" /> GitHub Profile</a>}
                  {candidate.portfolioUrl && <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><Globe className="w-4 h-4" /> Portfolio</a>}
                </div>
              )}

              <Separator className="my-6" />

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Decision</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={candidate.status === 'shortlisted' ? 'default' : 'outline'} 
                    className="w-full"
                    onClick={() => handleStatusChange('shortlisted')}
                    disabled={updateCandidate.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Shortlist
                  </Button>
                  <Button 
                    variant={candidate.status === 'rejected' ? 'destructive' : 'outline'} 
                    className="w-full"
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updateCandidate.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores Card */}
          <Card className="bg-slate-900 text-slate-50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100 flex items-center gap-2"><Target className="w-5 h-5" /> AI Analysis Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 pt-2">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Overall Match</div>
                    <div className="text-4xl font-display font-bold text-white">{candidate.overallScore}<span className="text-lg text-slate-500">/100</span></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium uppercase tracking-wider mb-1">
                      <Zap className="w-3 h-3" /> Velocity
                    </div>
                    <div className="text-2xl font-mono font-medium">{candidate.velocityScore}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">Potential over pedigree</div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex items-center gap-1.5 text-purple-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Synergy
                    </div>
                    <div className="text-2xl font-mono font-medium">{candidate.skillSynergyScore}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight">Complex skill relationships</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Resume & Details */}
        <div className="space-y-6 lg:col-span-2">
          
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Extracted Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {candidate.extractedSkills?.map(skill => (
                  <Badge key={skill} variant="secondary" className="font-mono text-xs">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {candidate.status === 'rejected' && feedback && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Auto-Generated Rejection Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm font-medium">Subject: {feedback.emailSubject}</div>
                  <div className="text-sm whitespace-pre-wrap font-serif text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded border">
                    {feedback.emailBody}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider mb-2">Areas for Improvement Identified</div>
                    <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
                      {feedback.improvementAreas.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Parsed Resume Text</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">RAW_DATA</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-md border h-96 overflow-y-auto">
                {candidate.resumeText}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
