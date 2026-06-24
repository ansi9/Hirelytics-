import React, { useState } from "react";
import {
  useListCandidates, useCreateCandidate, useListJobs,
  useGetCandidateSummary, getListCandidatesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Users, Plus, Loader2, Search, Award, Eye,
  LayoutList, LayoutGrid, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, Sparkles, Shield,
  TrendingUp, Star
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const candidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  jobId: z.coerce.number().min(1, "Job selection is required"),
  resumeText: z.string().min(10, "Resume text is required"),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
});

type ViewMode = "list" | "summaries";

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "shortlisted": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "rejected":    return "bg-red-500/15 text-red-400 border-red-500/20";
    case "analyzed":    return "bg-sky-500/15 text-sky-400 border-sky-500/20";
    default:            return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  }
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${(value / 100) * 88} 88`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryCard({ candidateId, name, jobTitle, status, overallScore, verifiedPoW, blindMode }:
  { candidateId: number; name: string; jobTitle: string; status: string; overallScore: number; verifiedPoW: boolean; blindMode: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { data: summary, isLoading, isFetching } = useGetCandidateSummary(candidateId, {
    query: { enabled: expanded },
  });

  const verdictStyle = {
    shortlist: { icon: CheckCircle2, label: "Shortlist", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    hold:      { icon: AlertCircle,  label: "Hold",      cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    reject:    { icon: XCircle,      label: "Reject",    cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  };

  const vd = summary?.verdict ? verdictStyle[summary.verdict as keyof typeof verdictStyle] : null;
  const displayName = blindMode ? `Candidate #${candidateId}` : name;

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
            {blindMode ? "?" : name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/candidates/${candidateId}`}>
              <span className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer">
                {displayName}
              </span>
            </Link>
            {!blindMode && verifiedPoW && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                <Award className="w-3 h-3" /> PoW
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusBadge(status)}`}>
            {status}
          </span>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-primary leading-none">{overallScore}</p>
            <p className="text-[10px] text-muted-foreground">score</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {expanded ? "Hide" : "AI Summary"}
          </button>
        </div>
      </div>

      {/* Expanded summary */}
      {expanded && (
        <div className="border-t border-border/50 bg-muted/20 px-5 py-4 space-y-4">
          {isLoading || isFetching ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : summary ? (
            <>
              {/* Scores + verdict */}
              <div className="flex items-center gap-5 flex-wrap">
                <ScoreRing value={summary.overallScore} label="Overall" color="hsl(var(--primary))" />
                <ScoreRing value={summary.skillSynergyScore} label="Synergy" color="#f59e0b" />
                <ScoreRing value={summary.velocityScore} label="Velocity" color="#8b5cf6" />
                {vd && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${vd.cls}`}>
                    <vd.icon className="w-4 h-4" />
                    Verdict: {vd.label}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Pros */}
                {summary.pros.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {summary.pros.map((p, i) => (
                        <li key={i} className="text-xs text-foreground/80 flex gap-2">
                          <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons */}
                {summary.cons.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Weaknesses
                    </p>
                    <ul className="space-y-1.5">
                      {summary.cons.map((c, i) => (
                        <li key={i} className="text-xs text-foreground/80 flex gap-2">
                          <span className="text-red-400 mt-0.5 shrink-0">−</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Highlights */}
              {summary.highlights.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Highlights
                  </p>
                  <ul className="space-y-1">
                    {summary.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-2">
                        <span className="text-sky-400 mt-0.5 shrink-0">★</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk flags */}
              {summary.riskFlags.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Risk Flags
                  </p>
                  <ul className="space-y-1">
                    {summary.riskFlags.map((r, i) => (
                      <li key={i} className="text-xs text-foreground/70 flex gap-2">
                        <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skill chips */}
              {summary.skillsFound.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Detected Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.skillsFound.map((s) => (
                      <span
                        key={s}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          summary.skillsMissing.includes(s)
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                    {summary.skillsMissing.map((s) => (
                      summary.skillsFound.includes(s) ? null : (
                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-red-500/10 text-red-400 border-red-500/20 line-through opacity-60">
                          {s}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Link href={`/candidates/${candidateId}`}>
                  <button className="text-[11px] text-primary hover:underline flex items-center gap-1">
                    Full candidate profile <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              This candidate hasn't been analyzed yet.{" "}
              <Link href="/analyze">
                <span className="text-primary hover:underline cursor-pointer">Run batch analysis first →</span>
              </Link>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export function Candidates() {
  const { data: candidates, isLoading } = useListCandidates();
  const { data: jobs } = useListJobs();
  const [open, setOpen] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("summaries");

  const queryClient = useQueryClient();
  const createCandidate = useCreateCandidate();

  const form = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { name: "", email: "", jobId: 0, resumeText: "", githubUrl: "", portfolioUrl: "" },
  });

  const onSubmit = (values: z.infer<typeof candidateSchema>) => {
    createCandidate.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
        setOpen(false);
        form.reset();
      },
    });
  };

  const filtered = candidates
    ?.filter((c) =>
      blindMode
        ? true
        : c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.overallScore - a.overallScore) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-candidates-title">
            Candidates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-candidates-subtitle">
            {filtered.length} total · sorted by score
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-9 h-8 w-48 text-sm rounded-lg bg-muted/40 border-transparent focus:border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={blindMode}
            />
          </div>

          {/* Blind mode */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/20">
            <Switch id="blind-mode" checked={blindMode} onCheckedChange={setBlindMode} />
            <Label htmlFor="blind-mode" className="text-xs font-medium cursor-pointer">Blind</Label>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setView("summaries")}
              className={`p-2 transition-colors ${view === "summaries" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="AI Summaries view"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 transition-colors ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          {/* Add candidate */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 text-xs" data-testid="button-add-candidate">
                <Plus className="w-3.5 h-3.5" /> Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Candidate Resume</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="jobId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : undefined}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a job…" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobs?.map((job) => (
                              <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="githubUrl" render={({ field }) => (
                      <FormItem><FormLabel>GitHub URL <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input placeholder="https://github.com/…" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="space-y-4">
                    <FormField control={form.control} name="resumeText" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resume Text</FormLabel>
                        <FormControl><Textarea {...field} className="h-52 font-mono text-xs resize-none" placeholder="Paste resume content here…" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createCandidate.isPending}>
                      {createCandidate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Submit
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No candidates yet</p>
            <p className="text-xs text-muted-foreground">Add a candidate above or post a job first</p>
            <Link href="/jobs">
              <span className="text-xs text-primary hover:underline cursor-pointer">Browse open roles →</span>
            </Link>
          </CardContent>
        </Card>
      ) : view === "summaries" ? (
        /* ── AI Summaries view ── */
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Click <span className="text-primary font-medium">AI Summary</span> on any row to expand pros, cons, and risk flags
          </div>
          {filtered.map((c) => {
            const job = jobs?.find((j) => j.id === c.jobId);
            return (
              <SummaryCard
                key={c.id}
                candidateId={c.id}
                name={c.name}
                jobTitle={job?.title ?? "Unknown Role"}
                status={c.status}
                overallScore={c.overallScore}
                verifiedPoW={c.verifiedProofOfWork}
                blindMode={blindMode}
              />
            );
          })}
        </div>
      ) : (
        /* ── Table view ── */
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Candidate</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Score</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const job = jobs?.find((j) => j.id === c.jobId);
                    const displayName = blindMode ? `Candidate #${c.id}` : c.name;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        data-testid={`row-cand-${c.id}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                                {blindMode ? "?" : c.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/candidates/${c.id}`}>
                                <span className="font-semibold hover:text-primary cursor-pointer transition-colors">
                                  {displayName}
                                </span>
                              </Link>
                              {!blindMode && c.verifiedProofOfWork && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                                  <Award className="w-2.5 h-2.5" /> PoW
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{job?.title ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums">{c.overallScore}</td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/candidates/${c.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
