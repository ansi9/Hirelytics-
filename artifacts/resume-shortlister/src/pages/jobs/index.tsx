import React, { useState } from "react";
import { useListJobs, useCreateJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { Briefcase, Plus, Users, Clock, Loader2, MapPin, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requiredSkills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  experienceYears: z.coerce.number().min(0),
});

export function Jobs() {
  const { data: jobs, isLoading } = useListJobs();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const createJob = useCreateJob();
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      requiredSkills: "" as any,
      experienceYears: 0,
    }
  });

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    createJob.mutate({ data: { ...values, status: 'open' } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setOpen(false);
        form.reset();
      }
    });
  };

  const getCompanyColor = (id: number) => {
    const colors = ['bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500'];
    return colors[id % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800" data-testid="text-jobs-title">Job Posted</h1>
          <p className="text-slate-500 text-sm mt-1" data-testid="text-jobs-subtitle">Manage all active and closed job requisitions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-job" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6">
              <Plus className="w-4 h-4 mr-2" /> Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Post New Job</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl><Input {...field} data-testid="input-job-title" className="bg-slate-50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} className="h-24 bg-slate-50" data-testid="input-job-desc" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiredSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills (comma separated)</FormLabel>
                      <FormControl><Input {...field} placeholder="React, Node.js, TypeScript" data-testid="input-job-skills" className="bg-slate-50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experienceYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-job-exp" className="bg-slate-50" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-4" disabled={createJob.isPending} data-testid="button-submit-job">
                  {createJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Publish Job
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i} className="h-64 shadow-sm border-0"><CardContent className="p-6 h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></CardContent></Card>)}
        </div>
      ) : jobs?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {jobs.map(job => (
            <Card key={job.id} className="shadow-sm border-0 hover:shadow-md transition-shadow duration-200" data-testid={`card-job-${job.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-12 w-12 rounded-xl">
                    <AvatarFallback className={`${getCompanyColor(job.id)} text-white font-bold rounded-xl`}>
                      {job.title.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="outline" className={`border-0 uppercase text-[10px] font-bold tracking-wide ${job.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {job.status}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">{job.title}</h3>
                
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Remote
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Full-time
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-5">
                  {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-semibold">
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 3 && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-semibold">+{job.requiredSkills.length - 3}</span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-700">{job.candidateCount} <span className="text-slate-400 font-normal">Applied</span></span>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 h-8 text-xs font-semibold" data-testid={`link-job-${job.id}`}>
                      View Pipeline
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No active jobs</h3>
            <p className="text-slate-500 text-sm max-w-sm text-center mb-6">Create a new job posting to start building your candidate pipeline and find great talent.</p>
            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">Post New Job</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
