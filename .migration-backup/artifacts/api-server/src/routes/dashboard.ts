import { Router, type IRouter } from "express";
import { sql, desc, eq } from "drizzle-orm";
import { db, candidatesTable, jobsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetTopCandidatesResponse,
  GetSkillGapsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      shortlisted: sql<number>`count(*) filter (where status = 'shortlisted')::int`,
      rejected: sql<number>`count(*) filter (where status = 'rejected')::int`,
      pending: sql<number>`count(*) filter (where status = 'pending' or status = 'analyzed')::int`,
      avgScore: sql<number>`coalesce(avg(overall_score), 0)::float`,
    })
    .from(candidatesTable);

  const [jobCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(jobsTable);

  const topJobRow = await db
    .select({ title: jobsTable.title, avgScore: sql<number>`coalesce(avg(${candidatesTable.overallScore}), 0)` })
    .from(candidatesTable)
    .innerJoin(jobsTable, eq(candidatesTable.jobId, jobsTable.id))
    .groupBy(jobsTable.title)
    .orderBy(sql`avg(${candidatesTable.overallScore}) DESC`)
    .limit(1);

  const summary = {
    totalJobs: jobCount?.total ?? 0,
    totalCandidates: counts?.total ?? 0,
    shortlisted: counts?.shortlisted ?? 0,
    rejected: counts?.rejected ?? 0,
    pending: counts?.pending ?? 0,
    averageScore: Math.round((counts?.avgScore ?? 0) * 10) / 10,
    topScoringJob: topJobRow[0]?.title ?? null,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/top-candidates", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      candidateId: candidatesTable.id,
      candidateName: candidatesTable.name,
      jobTitle: jobsTable.title,
      overallScore: candidatesTable.overallScore,
      skillSynergyScore: candidatesTable.skillSynergyScore,
      velocityScore: candidatesTable.velocityScore,
      status: candidatesTable.status,
    })
    .from(candidatesTable)
    .innerJoin(jobsTable, eq(candidatesTable.jobId, jobsTable.id))
    .orderBy(desc(candidatesTable.overallScore))
    .limit(10);

  res.json(GetTopCandidatesResponse.parse(rows));
});

router.get("/dashboard/skill-gaps", async (_req, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable);
  const candidates = await db
    .select({ jobId: candidatesTable.jobId, extractedSkills: candidatesTable.extractedSkills, overallScore: candidatesTable.overallScore })
    .from(candidatesTable);

  const gapMap = new Map<string, { jobTitle: string; frequency: number; totalScore: number; count: number }>();

  for (const job of jobs) {
    for (const requiredSkill of job.requiredSkills) {
      const jobCandidates = candidates.filter((c) => c.jobId === job.id);
      const missingCount = jobCandidates.filter(
        (c) => !c.extractedSkills.some((s: string) => s.toLowerCase() === requiredSkill.toLowerCase())
      ).length;

      if (missingCount > 0) {
        const key = `${requiredSkill}::${job.title}`;
        const existing = gapMap.get(key);
        const totalScore = jobCandidates.reduce((sum, c) => sum + c.overallScore, 0);
        const avgScore = jobCandidates.length > 0 ? totalScore / jobCandidates.length : 0;

        if (!existing) {
          gapMap.set(key, { jobTitle: job.title, frequency: missingCount, totalScore: avgScore, count: 1 });
        }
      }
    }
  }

  const gaps = Array.from(gapMap.entries()).map(([key, val]) => ({
    skill: key.split("::")[0],
    jobTitle: val.jobTitle,
    frequency: val.frequency,
    averageCandidateScore: Math.round(val.totalScore * 10) / 10,
  }));

  gaps.sort((a, b) => b.frequency - a.frequency);

  res.json(GetSkillGapsResponse.parse(gaps.slice(0, 20)));
});

export default router;
