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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Zap, Target, ArrowLeft, Github, Globe, MapPin, GraduationCap, Briefcase, CheckCircle2, XCircle, Mail, Award, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function CandidateDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [blindMode, setBlindMode] = useState(false);
  
  const { data: regularCandidate, isLoading: isLoadingReg } = useGetCandidate(id, { query: { enabled: !blindMode, queryKey: getGetCandidateQueryKey(id) } });
  const { data: blindCandidate, isLoading: isLoadingBlind } = useGetCandidateBlind(id, { query: { enabled: blindMode, queryKey: getGetCandidateBlindQueryKey(id) } });
  
  const candidate = blindMode ? blindCandidate : regularCandidate;
  const isLoading = blindMode ? isLoadingBlind : isLoadingReg;

  const { data: job, isLoading: isJobLoading } = useGetJob(candidate?.jobId || 0, { query: { enabled: !!candidate?.jobId, queryKey: ['getJob', candidate?.jobId] }});
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
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'analyzed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const displayName = blindMode ? `Candidate #${candidate.id}` : ('name' in candidate ? candidate.name : `C${candidate.id}`);
  const initial = blindMode ? 'C' : ('name' in candidate ? candidate.name.charAt(0) : 'C');

  const ScoreRing = ({ value, label, color, sublabel }: { value: number, label: string, color: string, sublabel?: string }) => {
    const data = [
      { name: 'score', value: value },
      { name: 'remainder', value: 100 - value }
    ];
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={color} />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xl font-bold text-slate-800">{value}</span>
          </div>
        </div>
        <span className="font-bold text-sm mt-1 text-slate-700">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-500 mt-0.5">{sublabel}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-800">
          <Link href={`/jobs/${candidate.jobId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to {job?.title || 'Pipeline'}
          </Link>
        </Button>
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Switch id="blind-mode-detail" checked={blindMode} onCheckedChange={setBlindMode} className="data-[state=checked]:bg-blue-600 scale-75" />
          <Label htmlFor="blind-mode-detail" className="font-semibold cursor-pointer text-xs text-slate-700">Blind Mode</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="shadow-sm border-0 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-100 to-indigo-100"></div>
            <CardContent className="p-6 relative pt-0">
              <div className="flex justify-between items-end mb-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-sm -mt-10 bg-white">
                  <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(candidate.status)}`}>
                  {candidate.status}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-800 mb-1">{displayName}</h1>
              
              {!blindMode && 'email' in candidate && (
                <div className="text-sm text-slate-500 mb-4">{candidate.email}</div>
              )}

              {candidate.verifiedProofOfWork && (
                <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-bold uppercase tracking-wide">
                  <Award className="w-4 h-4" /> Verified Proof of Work
                </div>
              )}

              {!blindMode && 'location' in candidate && (
                <div className="space-y-3 mt-6">
                  {candidate.location && <div className="flex items-center gap-3 text-sm text-slate-600 font-medium"><MapPin className="w-4 h-4 text-slate-400" /> {candidate.location}</div>}
                  {candidate.university && <div className="flex items-center gap-3 text-sm text-slate-600 font-medium"><GraduationCap className="w-4 h-4 text-slate-400" /> {candidate.university}</div>}
                  {candidate.yearsExperience !== undefined && <div className="flex items-center gap-3 text-sm text-slate-600 font-medium"><Briefcase className="w-4 h-4 text-slate-400" /> {candidate.yearsExperience} Years Experience</div>}
                  {(candidate.githubUrl || candidate.portfolioUrl) && <Separator className="my-4 bg-slate-100" />}
                  {candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-blue-600 hover:underline font-semibold"><Github className="w-4 h-4" /> GitHub Profile</a>}
                  {candidate.portfolioUrl && <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-blue-600 hover:underline font-semibold"><Globe className="w-4 h-4" /> Portfolio Site</a>}
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Action</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={candidate.status === 'shortlisted' ? 'default' : 'outline'} 
                  className={candidate.status === 'shortlisted' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : 'bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}
                  onClick={() => handleStatusChange('shortlisted')}
                  disabled={updateCandidate.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Shortlist
                </Button>
                <Button 
                  variant={candidate.status === 'rejected' ? 'destructive' : 'outline'} 
                  className={candidate.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white border-0' : 'bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200'}
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updateCandidate.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Candidate Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-8">
              <div className="flex justify-around items-center">
                <ScoreRing value={candidate.overallScore} label="Overall Match" color="#3B82F6" />
                <div className="w-px h-16 bg-slate-100"></div>
                <ScoreRing value={candidate.velocityScore} label="Velocity" color="#0EA5E9" sublabel="Growth Potential" />
                <div className="w-px h-16 bg-slate-100"></div>
                <ScoreRing value={candidate.skillSynergyScore} label="Synergy" color="#8B5CF6" sublabel="Skill Relationships" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Extracted Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-2">
                {candidate.extractedSkills?.map((skill, i) => (
                  <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-xs font-semibold rounded-md">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {candidate.status === 'rejected' && feedback && (
            <Card className="shadow-sm border border-slate-200 bg-white">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" /> Auto-Generated Feedback Draft
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-4">
                  <div className="text-sm font-bold text-slate-800">Subject: <span className="font-normal">{feedback.emailSubject}</span></div>
                  <div className="text-sm whitespace-pre-wrap text-slate-600 p-4 rounded-lg bg-slate-50 border border-slate-100 font-serif leading-relaxed">
                    {feedback.emailBody}
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Identified Gaps</div>
                    <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                      {feedback.improvementAreas.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-0 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 bg-white shrink-0">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Raw Resume Text</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600 bg-slate-50 p-6 h-96 overflow-y-auto">
                {candidate.resumeText}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
