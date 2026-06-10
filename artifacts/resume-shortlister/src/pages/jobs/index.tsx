import React, { useState } from "react";
import { useListJobs, useCreateJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Briefcase, Plus, Users, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-jobs-title">Active Requisitions</h1>
          <p className="text-muted-foreground" data-testid="text-jobs-subtitle">Manage job postings and view candidate pipelines.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-job">
              <Plus className="w-4 h-4 mr-2" /> New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Requisition</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl><Input {...field} data-testid="input-job-title" /></FormControl>
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
                      <FormControl><Textarea {...field} className="h-24" data-testid="input-job-desc" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="React, Node.js, TypeScript" data-testid="input-job-skills" /></FormControl>
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
                      <FormControl><Input type="number" {...field} data-testid="input-job-exp" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createJob.isPending} data-testid="button-submit-job">
                  {createJob.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Requisition
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Card key={i} className="h-48"><CardContent className="p-6 h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted" /></CardContent></Card>)}
        </div>
      ) : jobs?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow" data-testid={`card-job-${job.id}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                    {job.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{job.title}</CardTitle>
                <CardDescription className="line-clamp-2">{job.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center border-t pt-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{job.candidateCount} candidates</span>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-primary hover:underline" data-testid={`link-job-${job.id}`}>
                    View Pipeline
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">No open requisitions</h3>
            <p className="text-muted-foreground text-sm">Create a new job posting to start gathering candidates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
