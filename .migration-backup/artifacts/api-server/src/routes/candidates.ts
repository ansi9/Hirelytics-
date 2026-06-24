import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, candidatesTable, jobsTable } from "@workspace/db";
import {
  ListCandidatesResponse,
  CreateCandidateBody,
  GetCandidateParams,
  GetCandidateResponse,
  UpdateCandidateParams,
  UpdateCandidateBody,
  UpdateCandidateResponse,
  DeleteCandidateParams,
  AnalyzeCandidateParams,
  AnalyzeCandidateBody,
  AnalyzeCandidateResponse,
  GetCandidateFeedbackParams,
  GetCandidateFeedbackResponse,
  GetCandidateBlindParams,
  GetCandidateBlindResponse,
} from "@workspace/api-zod";
import { analyzeCandidate, generateRejectionFeedback, extractSkills } from "../lib/analyzer";

const router: IRouter = Router();

function formatCandidate(c: typeof candidatesTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/candidates", async (_req, res): Promise<void> => {
  const candidates = await db
    .select()
    .from(candidatesTable)
    .orderBy(desc(candidatesTable.overallScore));
  res.json(ListCandidatesResponse.parse(candidates.map(formatCandidate)));
});

router.post("/candidates", async (req, res): Promise<void> => {
  const parsed = CreateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { githubUrl, portfolioUrl, location, university, yearsExperience, ...rest } = parsed.data;
  const extractedSkills = extractSkills(rest.resumeText);
  const verifiedProofOfWork = !!(githubUrl || portfolioUrl);

  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      ...rest,
      githubUrl: githubUrl ?? null,
      portfolioUrl: portfolioUrl ?? null,
      location: location ?? null,
      university: university ?? null,
      yearsExperience: yearsExperience ?? null,
      extractedSkills,
      verifiedProofOfWork,
    })
    .returning();

  res.status(201).json(GetCandidateResponse.parse(formatCandidate(candidate)));
});

router.get("/candidates/:id", async (req, res): Promise<void> => {
  const params = GetCandidateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.json(GetCandidateResponse.parse(formatCandidate(candidate)));
});

router.patch("/candidates/:id", async (req, res): Promise<void> => {
  const params = UpdateCandidateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [candidate] = await db
    .update(candidatesTable)
    .set(parsed.data)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.json(UpdateCandidateResponse.parse(formatCandidate(candidate)));
});

router.delete("/candidates/:id", async (req, res): Promise<void> => {
  const params = DeleteCandidateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db
    .delete(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/candidates/:id/analyze", async (req, res): Promise<void> => {
  const params = AnalyzeCandidateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AnalyzeCandidateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.id, body.data.jobId));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const analysis = analyzeCandidate(
    candidate.resumeText,
    job.requiredSkills,
    candidate.yearsExperience
  );

  await db
    .update(candidatesTable)
    .set({
      overallScore: analysis.overallScore,
      skillSynergyScore: analysis.skillSynergyScore,
      velocityScore: analysis.velocityScore,
      extractedSkills: analysis.extractedSkills,
      status: analysis.recommendation === "shortlist" ? "shortlisted" : analysis.recommendation === "reject" ? "rejected" : "analyzed",
      analysisJson: JSON.stringify(analysis),
    })
    .where(eq(candidatesTable.id, params.data.id));

  const result = {
    candidateId: params.data.id,
    overallScore: analysis.overallScore,
    skillSynergyScore: analysis.skillSynergyScore,
    velocityScore: analysis.velocityScore,
    matchedSkills: analysis.matchedSkills,
    missingSkills: analysis.missingSkills,
    summary: analysis.summary,
    recommendation: analysis.recommendation,
  };

  res.json(AnalyzeCandidateResponse.parse(result));
});

router.get("/candidates/:id/feedback", async (req, res): Promise<void> => {
  const params = GetCandidateFeedbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.id, candidate.jobId));

  let missingSkills: string[] = [];
  if (candidate.analysisJson) {
    try {
      const analysis = JSON.parse(candidate.analysisJson);
      missingSkills = analysis.missingSkills ?? [];
    } catch {
      missingSkills = [];
    }
  }

  const feedback = generateRejectionFeedback(
    candidate.name,
    job?.title ?? "the role",
    missingSkills,
    candidate.extractedSkills
  );

  res.json(
    GetCandidateFeedbackResponse.parse({
      candidateId: params.data.id,
      ...feedback,
    })
  );
});

router.get("/candidates/:id/blind", async (req, res): Promise<void> => {
  const params = GetCandidateBlindParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const blindCandidate = {
    id: candidate.id,
    resumeText: candidate.resumeText
      .replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, "[Name Redacted]")
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, "[Email Redacted]")
      .replace(/\b(IIT|IIM|MIT|Harvard|Stanford|Oxford|Cambridge|NIT|BITS)\b/gi, "[University Redacted]"),
    jobId: candidate.jobId,
    overallScore: candidate.overallScore,
    skillSynergyScore: candidate.skillSynergyScore,
    velocityScore: candidate.velocityScore,
    status: candidate.status,
    verifiedProofOfWork: candidate.verifiedProofOfWork,
    extractedSkills: candidate.extractedSkills,
  };

  res.json(GetCandidateBlindResponse.parse(blindCandidate));
});

export default router;
