import React, { useState } from "react";
import { useListJobs, useListCandidates, useAnalyzeCandidate, getGetCandidateQueryKey, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, Play, CheckCircle2 } from "lucide-react";

export function Analyze() {
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  
  const { data: jobs } = useListJobs();
  const { data: candidates } = useListCandidates();
  
  const analyzeCandidate = useAnalyzeCandidate();
  const queryClient = useQueryClient();

  const handleBatchAnalyze = async () => {
    if (!selectedJob) return;
    
    const jobIdNum = parseInt(selectedJob, 10);
    const pendingCandidates = candidates?.filter(c => c.jobId === jobIdNum && c.status === 'pending') || [];
    
    if (pendingCandidates.length === 0) return;
    
    setIsAnalyzing(true);
    setResults([]);
    
    for (const candidate of pendingCandidates) {
      try {
        const result = await analyzeCandidate.mutateAsync({ data: { jobId: jobIdNum } });
        setResults(prev => [...prev, { candidateId: candidate.id, name: candidate.name, status: 'success', result }]);
      } catch (err) {
        setResults(prev => [...prev, { candidateId: candidate.id, name: candidate.name, status: 'error' }]);
      }
    }
    
    setIsAnalyzing(false);
    queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
  };

  const pendingCount = selectedJob 
    ? candidates?.filter(c => c.jobId === parseInt(selectedJob, 10) && c.status === 'pending').length || 0
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-analyze-title">Batch Analysis Runner</h1>
        <p className="text-muted-foreground" data-testid="text-analyze-subtitle">Trigger AI scoring on pending candidates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Run</CardTitle>
          <CardDescription>Select a requisition to analyze its pending candidates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedJob} onValueChange={setSelectedJob} disabled={isAnalyzing}>
                <SelectTrigger>
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
              className="w-48"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Play className="w-4 h-4 mr-2 fill-current" /> Run Analysis ({pendingCount})</>
              )}
            </Button>
          </div>
          
          {selectedJob && pendingCount === 0 && !isAnalyzing && results.length === 0 && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md text-center">
              No pending candidates found for this job. All candidates have been analyzed.
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" /> Live Results Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-sm">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border rounded-md">
                  <div className="flex items-center gap-3">
                    {r.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-red-500" />
                    )}
                    <span>Analyzed <span className="font-bold">{r.name}</span></span>
                  </div>
                  {r.status === 'success' && (
                    <div className="flex gap-4 text-xs">
                      <span>Overall: <span className="font-bold">{r.result?.overallScore}</span></span>
                      <span className="text-blue-600 dark:text-blue-400">Velocity: <span className="font-bold">{r.result?.velocityScore}</span></span>
                      <span className="uppercase font-bold text-muted-foreground">{r.result?.recommendation}</span>
                    </div>
                  )}
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex items-center gap-3 p-3 text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing next candidate...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
