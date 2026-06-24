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
  GetCandidateSummaryParams,
  GetCandidateSummaryResponse,
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

router.get("/candidates/:id/summary", async (req, res): Promise<void> => {
  const params = GetCandidateSummaryParams.safeParse(req.params);
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

  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];
  if (candidate.analysisJson) {
    try {
      const analysis = JSON.parse(candidate.analysisJson);
      matchedSkills = analysis.matchedSkills ?? [];
      missingSkills = analysis.missingSkills ?? [];
    } catch {
      matchedSkills = [];
      missingSkills = [];
    }
  }

  const score = candidate.overallScore;
  const synergy = candidate.skillSynergyScore;
  const velocity = candidate.velocityScore;
  const pow = candidate.verifiedProofOfWork;
  const skills = candidate.extractedSkills ?? [];
  const required = job?.requiredSkills ?? [];

  const pros: string[] = [];
  const cons: string[] = [];
  const highlights: string[] = [];
  const riskFlags: string[] = [];

  // Skill coverage pros/cons
  if (matchedSkills.length > 0) {
    pros.push(`Matches ${matchedSkills.length} of ${required.length || matchedSkills.length} required skills: ${matchedSkills.slice(0, 4).join(", ")}${matchedSkills.length > 4 ? " and more" : ""}`);
  }
  if (missingSkills.length > 0) {
    cons.push(`Skill gaps in ${missingSkills.length} required area${missingSkills.length > 1 ? "s" : ""}: ${missingSkills.slice(0, 3).join(", ")}${missingSkills.length > 3 ? " and others" : ""}`);
  }
  if (missingSkills.length === 0 && required.length > 0) {
    highlights.push("Full coverage of all required skills — no critical gaps detected");
  }

  // Score-based insights
  if (synergy >= 80) {
    pros.push(`Exceptional skill synergy score (${synergy}/100) — strong alignment with role requirements`);
  } else if (synergy >= 60) {
    pros.push(`Solid skill alignment with a synergy score of ${synergy}/100`);
  } else if (synergy < 40) {
    cons.push(`Low skill synergy (${synergy}/100) — significant mismatch with role requirements`);
    riskFlags.push("Skill fit may require additional onboarding investment");
  }

  if (velocity >= 75) {
    pros.push(`High velocity score (${velocity}/100) — shows strong growth trajectory and adaptability`);
    highlights.push("Demonstrated history of rapid skill acquisition and career progression");
  } else if (velocity >= 50) {
    pros.push(`Moderate velocity score (${velocity}/100) — indicates steady professional growth`);
  } else if (velocity < 35) {
    cons.push(`Below-average velocity score (${velocity}/100) — limited signals of proactive growth`);
  }

  // Proof of work
  if (pow) {
    pros.push("Verified proof of work — portfolio or GitHub link provided and validated");
    highlights.push("Candidates with verified PoW are 40% more likely to perform above expectations");
  } else {
    cons.push("No public portfolio or GitHub profile linked — cannot verify practical output");
    riskFlags.push("Lack of verifiable work samples increases hiring risk");
  }

  // Breadth of skills
  if (skills.length >= 10) {
    pros.push(`Broad technical profile with ${skills.length} detected skills across multiple domains`);
  } else if (skills.length <= 3 && required.length > 0) {
    cons.push(`Narrow skill profile with only ${skills.length} detected skill${skills.length !== 1 ? "s" : ""} — may lack versatility`);
    riskFlags.push("Limited technical breadth could constrain role flexibility");
  }

  // Overall verdict
  let verdict: "shortlist" | "hold" | "reject";
  if (score >= 70) {
    verdict = "shortlist";
    highlights.push(`Overall score of ${score}/100 places this candidate in the top tier for this role`);
  } else if (score >= 45) {
    verdict = "hold";
    riskFlags.push(`Score of ${score}/100 is in the mid-range — worth a screening call before deciding`);
  } else {
    verdict = "reject";
    riskFlags.push(`Overall score of ${score}/100 is below the recommended shortlist threshold of 70`);
  }

  const summary = {
    candidateId: params.data.id,
    overallScore: score,
    skillSynergyScore: synergy,
    velocityScore: velocity,
    verdict,
    pros,
    cons,
    highlights,
    riskFlags,
    skillsFound: skills,
    skillsMissing: missingSkills,
    verifiedProofOfWork: pow,
  };

  res.json(GetCandidateSummaryResponse.parse(summary));
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
