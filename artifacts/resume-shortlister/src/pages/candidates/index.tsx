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
import { Users, Plus, Loader2, Search, Filter, Award, Eye, MoreHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'analyzed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700'; // pending
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700', 'bg-violet-100 text-violet-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800" data-testid="text-candidates-title">Applications</h1>
          <p className="text-slate-500 text-sm mt-1" data-testid="text-candidates-subtitle">Review, analyze, and manage candidates.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search candidates..." 
              className="pl-9 bg-slate-50 border-slate-200 rounded-lg" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={blindMode}
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-2 px-3 rounded-lg border border-slate-200">
            <Switch id="blind-mode" checked={blindMode} onCheckedChange={setBlindMode} className="data-[state=checked]:bg-blue-600" />
            <Label htmlFor="blind-mode" className="font-semibold text-sm cursor-pointer text-slate-700">Blind Mode</Label>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-candidate" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
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
                    <Button type="submit" className="w-full mt-2 bg-blue-600" disabled={createCandidate.isPending}>
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

      <Card className="shadow-sm border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Candidate</th>
                  <th className="px-6 py-4 font-semibold">Job Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Scores</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">Loading candidates...</p>
                    </td>
                  </tr>
                ) : filteredCandidates?.length ? (
                  filteredCandidates.map(candidate => {
                    const job = jobs?.find(j => j.id === candidate.jobId);
                    const displayName = blindMode ? `Candidate #${candidate.id}` : candidate.name;
                    const initial = blindMode ? 'C' : candidate.name.charAt(0);
                    
                    return (
                      <tr key={candidate.id} className="bg-white border-b border-slate-100 hover:bg-slate-50/80 transition-colors" data-testid={`row-cand-${candidate.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white shadow-sm">
                              <AvatarFallback className={`${getAvatarColor(candidate.name)} font-bold`}>
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/candidates/${candidate.id}`} className="font-bold text-slate-800 hover:text-blue-600 block">
                                {displayName}
                              </Link>
                              {!blindMode && candidate.verifiedProofOfWork && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 mt-0.5">
                                  <Award className="w-3 h-3" /> PoW Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {job?.title || "Unknown Role"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(candidate.status)}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div title="Overall Score">
                              <span className="text-slate-800 font-bold">{candidate.overallScore}</span>
                              <span className="text-slate-400 text-xs ml-1">/100</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
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
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No candidates found.</p>
                      <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
