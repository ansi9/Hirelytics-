import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, jobsTable, candidatesTable } from "@workspace/db";
import {
  ListJobsResponse,
  CreateJobBody,
  GetJobParams,
  GetJobResponse,
  UpdateJobParams,
  UpdateJobBody,
  UpdateJobResponse,
  DeleteJobParams,
  ListJobCandidatesParams,
  ListJobCandidatesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/jobs", async (req, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);

  const candidateCounts = await db
    .select({ jobId: candidatesTable.jobId, count: sql<number>`count(*)::int` })
    .from(candidatesTable)
    .groupBy(candidatesTable.jobId);

  const countMap = new Map(candidateCounts.map((r) => [r.jobId, r.count]));

  const result = jobs.map((j) => ({
    ...j,
    candidateCount: countMap.get(j.id) ?? 0,
    createdAt: j.createdAt.toISOString(),
  }));

  res.json(ListJobsResponse.parse(result));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status = "open", ...rest } = parsed.data;
  const [job] = await db.insert(jobsTable).values({ ...rest, status }).returning();

  res.status(201).json(GetJobResponse.parse({ ...job, candidateCount: 0, createdAt: job.createdAt.toISOString() }));
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(candidatesTable)
    .where(eq(candidatesTable.jobId, job.id));

  res.json(GetJobResponse.parse({ ...job, candidateCount: countRow?.count ?? 0, createdAt: job.createdAt.toISOString() }));
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db
    .update(jobsTable)
    .set(parsed.data)
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(candidatesTable)
    .where(eq(candidatesTable.jobId, job.id));

  res.json(UpdateJobResponse.parse({ ...job, candidateCount: countRow?.count ?? 0, createdAt: job.createdAt.toISOString() }));
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.delete(jobsTable).where(eq(jobsTable.id, params.data.id)).returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/jobs/:id/candidates", async (req, res): Promise<void> => {
  const params = ListJobCandidatesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.jobId, params.data.id))
    .orderBy(sql`${candidatesTable.overallScore} DESC`);

  const result = candidates.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  res.json(ListJobCandidatesResponse.parse(result));
});

export default router;
