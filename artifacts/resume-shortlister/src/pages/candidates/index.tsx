import React, { useState } from "react";
import { useListCandidates, useCreateCandidate, useListJobs, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Users, Plus, Loader2, Search, Filter, Award } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const candidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  jobId: z.coerce.number().min(1, "Job selection is required"),
  resumeText: z.string().min(10, "Resume text is required"),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
});

export function Candidates() {
  const { data: candidates, isLoading } = useListCandidates();
  const { data: jobs } = useListJobs();
  const [open, setOpen] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const createCandidate = useCreateCandidate();
  
  const form = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      email: "",
      jobId: 0,
      resumeText: "",
      githubUrl: "",
      portfolioUrl: "",
    }
  });

  const onSubmit = (values: z.infer<typeof candidateSchema>) => {
    createCandidate.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        setOpen(false);
        form.reset();
      }
    });
  };

  const filteredCandidates = candidates?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.overallScore - a.overallScore);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-candidates-title">Talent Pool</h1>
          <p className="text-muted-foreground" data-testid="text-candidates-subtitle">Review, analyze, and shortlist candidates across all requisitions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md border">
            <Switch id="blind-mode" checked={blindMode} onCheckedChange={setBlindMode} />
            <Label htmlFor="blind-mode" className="font-medium cursor-pointer">Blind Hiring Mode</Label>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-candidate">
                <Plus className="w-4 h-4 mr-2" /> Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Candidate Resume</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 grid grid-cols-2 gap-4">
                  <div className="space-y-4 col-span-1 mt-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="jobId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Requisition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a job..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobs?.map(job => (
                              <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-4 col-span-1">
                    <FormField control={form.control} name="resumeText" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resume Content (Text)</FormLabel>
                        <FormControl><Textarea {...field} className="h-48 font-mono text-xs" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full mt-2" disabled={createCandidate.isPending}>
                      {createCandidate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Submit for Analysis
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search candidates..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={blindMode}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filteredCandidates?.length ? (
        <div className="space-y-3">
          {filteredCandidates.map(candidate => {
            const job = jobs?.find(j => j.id === candidate.jobId);
            
            return (
              <Card key={candidate.id} className="hover:border-primary/50 transition-colors" data-testid={`card-cand-${candidate.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center font-display font-bold text-secondary-foreground shrink-0">
                      {blindMode ? `C${candidate.id}` : candidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/candidates/${candidate.id}`} className="font-semibold text-lg hover:underline">
                          {blindMode ? `Candidate #${candidate.id}` : candidate.name}
                        </Link>
                        {candidate.verifiedProofOfWork && !blindMode && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-1.5 py-0 items-center">
                            <Award className="w-3 h-3" /> PoW Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {job?.title || "Unknown Role"} • {candidate.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 px-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Overall</span>
                      <span className="font-mono text-xl font-bold">{candidate.overallScore}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Velocity</span>
                      <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">{candidate.velocityScore}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Synergy</span>
                      <span className="font-mono text-xl font-bold text-purple-600 dark:text-purple-400">{candidate.skillSynergyScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          No candidates found.
        </div>
      )}
    </div>
  );
}
