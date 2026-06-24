import { logger } from "./logger";

interface SkillCluster {
  primary: string;
  related: string[];
}

const SKILL_CLUSTERS: SkillCluster[] = [
  { primary: "React", related: ["Vue", "Angular", "Next.js", "Svelte", "Frontend", "UI", "JSX", "TypeScript", "JavaScript"] },
  { primary: "Node.js", related: ["Express", "Fastify", "NestJS", "Koa", "Backend", "JavaScript", "TypeScript"] },
  { primary: "Python", related: ["Django", "Flask", "FastAPI", "Machine Learning", "ML", "Data Science", "TensorFlow", "PyTorch", "Pandas", "NumPy"] },
  { primary: "Figma", related: ["Canva", "Sketch", "Adobe XD", "UI/UX", "Prototyping", "Design", "Wireframe"] },
  { primary: "AWS", related: ["Azure", "GCP", "Cloud", "DevOps", "Infrastructure", "Kubernetes", "Docker", "Terraform"] },
  { primary: "SQL", related: ["PostgreSQL", "MySQL", "SQLite", "Database", "NoSQL", "MongoDB", "Redis"] },
  { primary: "Machine Learning", related: ["AI", "Deep Learning", "Neural Network", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Scikit-learn"] },
  { primary: "Java", related: ["Spring", "Kotlin", "Maven", "Gradle", "JVM", "Microservices"] },
  { primary: "iOS", related: ["Swift", "Objective-C", "Xcode", "Mobile", "App Development"] },
  { primary: "Android", related: ["Kotlin", "Java", "Mobile", "App Development"] },
];

export function extractSkills(text: string): string[] {
  const skillKeywords = [
    "JavaScript", "TypeScript", "Python", "Java", "Kotlin", "Swift", "C++", "C#", "Go", "Rust", "PHP", "Ruby",
    "React", "Vue", "Angular", "Next.js", "Svelte", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "DevOps",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST", "API",
    "Machine Learning", "AI", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Git", "Linux", "Figma", "Canva", "UI/UX", "Design", "Agile", "Scrum",
    "React Native", "Flutter", "iOS", "Android", "Mobile",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SCSS",
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }

  return [...new Set(found)];
}

export function computeSkillSynergyScore(candidateSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 50;

  let totalScore = 0;

  for (const required of requiredSkills) {
    const exactMatch = candidateSkills.some(
      (s) => s.toLowerCase() === required.toLowerCase()
    );

    if (exactMatch) {
      totalScore += 100;
      continue;
    }

    let clusterScore = 0;
    for (const cluster of SKILL_CLUSTERS) {
      const requiredInCluster =
        cluster.primary.toLowerCase() === required.toLowerCase() ||
        cluster.related.some((r) => r.toLowerCase() === required.toLowerCase());

      if (requiredInCluster) {
        const candidateClusterMatch = candidateSkills.some(
          (s) =>
            cluster.primary.toLowerCase() === s.toLowerCase() ||
            cluster.related.some((r) => r.toLowerCase() === s.toLowerCase())
        );
        if (candidateClusterMatch) {
          clusterScore = 65;
          break;
        }
      }
    }

    totalScore += clusterScore;
  }

  return Math.round(totalScore / requiredSkills.length);
}

export function computeVelocityScore(resumeText: string, yearsExperience: number | null): number {
  const lowerText = resumeText.toLowerCase();

  let score = 50;

  const highVelocitySignals = [
    "founded", "co-founded", "built from scratch", "launched", "shipped",
    "open source", "github", "published", "patent",
    "first year", "freshman", "sophomore", "intern",
    "hackathon", "won", "award", "prize", "competition",
    "self-taught", "freelance", "side project", "personal project",
    "100k users", "million users", "10k stars", "trending",
  ];

  const lowVelocitySignals = [
    "maintained", "assisted", "supported", "helped",
  ];

  let velocityBoost = 0;
  for (const signal of highVelocitySignals) {
    if (lowerText.includes(signal)) velocityBoost += 8;
  }

  let velocityDrag = 0;
  for (const signal of lowVelocitySignals) {
    if (lowerText.includes(signal)) velocityDrag += 3;
  }

  score = Math.min(100, score + velocityBoost - velocityDrag);

  if (yearsExperience !== null && yearsExperience < 3 && velocityBoost > 20) {
    score = Math.min(100, score + 15);
  }

  return Math.round(score);
}

export function analyzeCandidate(
  resumeText: string,
  requiredSkills: string[],
  yearsExperience: number | null,
): {
  overallScore: number;
  skillSynergyScore: number;
  velocityScore: number;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendation: "shortlist" | "reject" | "hold";
} {
  const extractedSkills = extractSkills(resumeText);
  const skillSynergyScore = computeSkillSynergyScore(extractedSkills, requiredSkills);
  const velocityScore = computeVelocityScore(resumeText, yearsExperience);

  const matchedSkills = requiredSkills.filter((r) =>
    extractedSkills.some((s) => s.toLowerCase() === r.toLowerCase())
  );
  const missingSkills = requiredSkills.filter(
    (r) => !extractedSkills.some((s) => s.toLowerCase() === r.toLowerCase())
  );

  const overallScore = Math.round(skillSynergyScore * 0.6 + velocityScore * 0.4);

  let recommendation: "shortlist" | "reject" | "hold";
  if (overallScore >= 70) recommendation = "shortlist";
  else if (overallScore >= 45) recommendation = "hold";
  else recommendation = "reject";

  const summary =
    overallScore >= 70
      ? `Strong candidate with a ${skillSynergyScore}% skill synergy match. ${matchedSkills.length > 0 ? `Confirmed skills: ${matchedSkills.join(", ")}.` : ""} Velocity score of ${velocityScore} indicates ${velocityScore >= 70 ? "high growth potential" : "solid progression"}.`
      : overallScore >= 45
      ? `Moderate candidate with some relevant skills. ${missingSkills.length > 0 ? `Missing key skills: ${missingSkills.slice(0, 3).join(", ")}.` : ""} May benefit from additional screening.`
      : `Below-threshold match. Skill synergy score of ${skillSynergyScore}% suggests limited alignment with the role requirements. ${missingSkills.length > 0 ? `Key gaps: ${missingSkills.slice(0, 3).join(", ")}.` : ""}`;

  return { overallScore, skillSynergyScore, velocityScore, extractedSkills, matchedSkills, missingSkills, summary, recommendation };
}

export function generateRejectionFeedback(
  candidateName: string,
  jobTitle: string,
  missingSkills: string[],
  extractedSkills: string[],
): {
  emailSubject: string;
  emailBody: string;
  improvementAreas: string[];
} {
  const emailSubject = `Your application for ${jobTitle} — Next steps`;

  const improvementAreas: string[] = [];
  if (missingSkills.length > 0) {
    improvementAreas.push(...missingSkills.slice(0, 3).map((s) => `Deepen your knowledge in ${s}`));
  }
  improvementAreas.push("Build and ship more personal projects to demonstrate initiative");
  if (!extractedSkills.includes("GitHub")) {
    improvementAreas.push("Create a strong public GitHub portfolio with real-world projects");
  }

  const emailBody = `Hi ${candidateName},

Thank you for taking the time to apply for the ${jobTitle} role. We genuinely appreciate your interest and the effort you put into your application.

After careful review, we've decided to move forward with other candidates whose experience more closely aligns with our current needs. This was a competitive process and we want to be transparent about how you can strengthen future applications.

Here are some specific areas we'd encourage you to develop:
${improvementAreas.map((a) => `• ${a}`).join("\n")}

${extractedSkills.length > 0 ? `Your demonstrated skills in ${extractedSkills.slice(0, 4).join(", ")} are genuinely valuable — we'd encourage you to keep building on them.` : ""}

We'd encourage you to reapply in the future as you continue to grow. The talent pool is competitive, and a few targeted improvements could make a significant difference.

Wishing you the very best in your career journey.

Warm regards,
The Hiring Team`;

  return { emailSubject, emailBody, improvementAreas };
}

logger.info("Analyzer module loaded");
