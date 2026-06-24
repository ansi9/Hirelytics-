import React, { useState } from "react";
import { useListJobs, useListCandidates, useAnalyzeCandidate, getGetCandidateQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Play, CheckCircle2, AlertCircle, Clock, Badge } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export function Analyze() {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  
  const { data: jobs } = useListJobs();
  const { data: candidates } = useListCandidates();
  
  const analyzeCandidate = useAnalyzeCandidate();
  const queryClient = useQueryClient();

  const pendingCount = selectedJob 
    ? candidates?.filter(c => c.jobId === parseInt(selectedJob, 10) && c.status === 'pending').length || 0
    : 0;

  const handleBatchAnalyze = async () => {
    if (!selectedJob) return;
    
    const jobIdNum = parseInt(selectedJob, 10);
    const pendingCandidates = candidates?.filter(c => c.jobId === jobIdNum && c.status === 'pending') || [];
    
    if (pendingCandidates.length === 0) return;
    
    setIsAnalyzing(true);
    setResults([]);
    setProgress(0);
    
    for (let i = 0; i < pendingCandidates.length; i++) {
      const candidate = pendingCandidates[i];
      try {
        const result = await analyzeCandidate.mutateAsync({ id: candidate.id, data: { jobId: jobIdNum } });
        setResults(prev => [{ candidateId: candidate.id, name: candidate.name, status: 'success', result }, ...prev]);
      } catch (err) {
        setResults(prev => [{ candidateId: candidate.id, name: candidate.name, status: 'error' }, ...prev]);
      }
      setProgress(((i + 1) / pendingCandidates.length) * 100);
    }
    
    setIsAnalyzing(false);
    queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
  };

  const getRecommendationColor = (rec: string) => {
    switch(rec?.toLowerCase()) {
      case 'shortlist': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'reject': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800" data-testid="text-analyze-title">Batch Analysis</h1>
        <p className="text-slate-500 text-sm mt-1" data-testid="text-analyze-subtitle">Score and rank pending candidates for a specific job.</p>
      </div>

      <Card className="shadow-sm border-0">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <CardTitle className="text-lg">Configure Run</CardTitle>
          <CardDescription>Select a requisition to analyze</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedJob} onValueChange={setSelectedJob} disabled={isAnalyzing}>
                <SelectTrigger className="bg-white border-slate-200 h-12">
                  <SelectValue placeholder="Select a job requisition..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleBatchAnalyze} 
              disabled={!selectedJob || pendingCount === 0 || isAnalyzing}
              className="h-12 w-full sm:w-48 bg-blue-600 hover:bg-blue-700 font-bold"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Play className="w-5 h-5 mr-2 fill-current" /> Run ({pendingCount})</>
              )}
            </Button>
          </div>
          
          {selectedJob && pendingCount === 0 && !isAnalyzing && results.length === 0 && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-sm font-medium justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              All candidates for this job have already been analyzed.
            </div>
          )}

          {isAnalyzing && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Analyzing {pendingCount} candidates...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Analysis Results
            </CardTitle>
            {isAnalyzing && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse">Running</Badge>}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {results.map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                        {r.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="text-xs font-medium flex items-center gap-1 mt-0.5">
                        {r.status === 'success' ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Successfully analyzed</span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error analyzing</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {r.status === 'success' && (
                    <div className="flex items-center gap-4 sm:gap-6 bg-white border border-slate-100 p-2 px-4 rounded-lg shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Score</div>
                        <div className="font-bold text-slate-800">{r.result?.overallScore}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Velocity</div>
                        <div className="font-bold text-blue-600">{r.result?.velocityScore}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-100"></div>
                      <div className="flex items-center justify-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getRecommendationColor(r.result?.recommendation)}`}>
                          {r.result?.recommendation || 'Hold'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
