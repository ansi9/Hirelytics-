import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  resumeText: text("resume_text").notNull(),
  jobId: integer("job_id").notNull(),
  overallScore: real("overall_score").notNull().default(0),
  skillSynergyScore: real("skill_synergy_score").notNull().default(0),
  velocityScore: real("velocity_score").notNull().default(0),
  status: text("status").notNull().default("pending"),
  verifiedProofOfWork: boolean("verified_proof_of_work").notNull().default(false),
  githubUrl: text("github_url"),
  portfolioUrl: text("portfolio_url"),
  location: text("location"),
  university: text("university"),
  yearsExperience: integer("years_experience"),
  extractedSkills: text("extracted_skills").array().notNull().default([]),
  analysisJson: text("analysis_json"),
  feedbackJson: text("feedback_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
