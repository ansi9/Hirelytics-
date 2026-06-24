import { db, jobsTable, candidatesTable } from "@workspace/db";
import { analyzeCandidate, extractSkills } from "../artifacts/api-server/src/lib/analyzer";

const jobs = [
  {
    title: "Senior Frontend Engineer",
    description: "Build fast, accessible web UIs for our SaaS product. Own the component library, lead frontend architecture decisions, and mentor junior devs.",
    requiredSkills: ["React", "TypeScript", "CSS", "JavaScript", "Git"],
    experienceYears: 4,
    status: "open" as const,
  },
  {
    title: "Machine Learning Engineer",
    description: "Design and ship production ML pipelines. Work across data ingestion, model training, evaluation, and deployment to cloud infrastructure.",
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "SQL"],
    experienceYears: 3,
    status: "open" as const,
  },
  {
    title: "Full Stack Engineer",
    description: "Own features end-to-end across our Node.js backend and React frontend. Database design, REST APIs, deployment, the works.",
    requiredSkills: ["Node.js", "React", "PostgreSQL", "TypeScript", "Docker"],
    experienceYears: 3,
    status: "open" as const,
  },
  {
    title: "UI/UX Designer",
    description: "Lead product design from wireframe to final pixel. Work closely with engineering to deliver delightful, accessible user experiences.",
    requiredSkills: ["Figma", "UI/UX", "Prototyping", "Design", "CSS"],
    experienceYears: 2,
    status: "open" as const,
  },
];

const candidateResumes: Record<string, { resumeText: string; githubUrl?: string; portfolioUrl?: string; yearsExperience: number; university?: string; location?: string }> = {
  "Alex Johnson": {
    githubUrl: "https://github.com/alexjohnson",
    yearsExperience: 5,
    university: "UC Berkeley",
    location: "San Francisco, CA",
    resumeText: `Alex Johnson — Senior Frontend Engineer
Email: alex@example.com | GitHub: github.com/alexjohnson

SUMMARY
Experienced frontend engineer with 5 years building production React applications. Deep expertise in TypeScript, CSS architecture, and component library design. Led frontend rewrite at two Series B startups.

EXPERIENCE
Senior Frontend Engineer — Stripe (2021–Present)
• Built and maintained React + TypeScript design system used across 8 product teams
• Shipped accessible component library (WCAG 2.1 AA) adopted by 40+ engineers
• Improved Core Web Vitals (LCP, CLS) by 35% through bundle splitting and lazy loading
• Mentored 3 junior engineers; led weekly frontend guild sessions

Frontend Engineer — Figma (2019–2021)
• Developed real-time collaboration features using React, TypeScript, and WebSockets
• Created CSS-in-JS migration playbook adopted company-wide
• Reduced bundle size by 40% via code-splitting and tree shaking

SKILLS
React, TypeScript, JavaScript, CSS, Tailwind CSS, Next.js, GraphQL, Git, Webpack, Vite, Jest, Playwright

EDUCATION
B.S. Computer Science — UC Berkeley (2019)`,
  },
  "Yuki Tanaka": {
    githubUrl: "https://github.com/yukitanaka",
    yearsExperience: 4,
    university: "Tokyo University",
    location: "Tokyo, Japan",
    resumeText: `Yuki Tanaka — Frontend Engineer
Email: yuki@example.com | GitHub: github.com/yukitanaka

SUMMARY
Frontend engineer with 4 years of experience building high-traffic consumer apps in React and TypeScript. Passionate about performance, accessibility, and clean UI engineering.

EXPERIENCE
Frontend Engineer — Mercari (2020–Present)
• Built React + TypeScript storefront serving 15M monthly users
• Led migration from class components to hooks, reducing bundle by 22%
• Implemented CSS design tokens system across 3 product lines
• Wrote extensive Jest + React Testing Library test coverage (85%)

Frontend Developer — Rakuten (2019–2020)
• Developed e-commerce checkout flow in React
• Collaborated with designers in Figma; translated designs to pixel-perfect CSS

SKILLS
React, TypeScript, JavaScript, CSS, Next.js, Jest, Git, HTML, Webpack, Tailwind CSS

EDUCATION
B.Eng. Information Engineering — Tokyo University (2019)`,
  },
  "Sarah Chen": {
    yearsExperience: 3,
    university: "Stanford University",
    location: "Seattle, WA",
    resumeText: `Sarah Chen — Machine Learning Engineer
Email: sarah@example.com

SUMMARY
ML engineer with 3 years building and shipping production recommendation systems and NLP pipelines. Strong Python background; experience deploying models to AWS.

EXPERIENCE
Machine Learning Engineer — Amazon (2021–Present)
• Built product recommendation system (Python, TensorFlow) serving 2M daily users
• Designed data ingestion pipelines using Apache Spark and SQL
• Trained and evaluated transformer-based NLP models for search relevance
• Deployed models to AWS SageMaker; monitored drift with CloudWatch dashboards

ML Research Intern — Microsoft Research (2020)
• Implemented PyTorch models for document summarization
• Wrote data preprocessing scripts in Python using Pandas and NumPy

SKILLS
Python, Machine Learning, TensorFlow, PyTorch, SQL, Pandas, NumPy, AWS, Docker, Scikit-learn, NLP

EDUCATION
M.S. Computer Science (Machine Learning) — Stanford University (2021)`,
  },
  "Marcus Williams": {
    githubUrl: "https://github.com/marcuswilliams",
    yearsExperience: 4,
    university: "Georgia Tech",
    location: "Atlanta, GA",
    resumeText: `Marcus Williams — Full Stack Engineer
Email: marcus@example.com | GitHub: github.com/marcuswilliams

SUMMARY
Full stack engineer with 4 years shipping features across Node.js backends and React frontends. Comfortable with PostgreSQL schema design, REST API architecture, and Docker-based deployments.

EXPERIENCE
Full Stack Engineer — Mailchimp (2020–Present)
• Built email campaign builder in React + TypeScript, used by 500K+ customers
• Designed and maintained Node.js + Express REST APIs with PostgreSQL
• Containerized services with Docker; deployed on Kubernetes (GKE)
• Wrote integration tests with Jest; maintained 80%+ coverage

Backend Engineer — Calendly (2019–2020)
• Developed scheduling engine in Node.js with PostgreSQL
• Built GraphQL API consumed by web and mobile clients

SKILLS
Node.js, React, PostgreSQL, TypeScript, Docker, Kubernetes, GraphQL, REST, Git, Express, Jest

EDUCATION
B.S. Computer Science — Georgia Tech (2019)`,
  },
  "Ananya Patel": {
    githubUrl: "https://github.com/ananyapatel",
    portfolioUrl: "https://ananyapatel.dev",
    yearsExperience: 3,
    university: "IIT Bombay",
    location: "Bangalore, India",
    resumeText: `Ananya Patel — Full Stack Engineer
Email: ananya@example.com | GitHub: github.com/ananyapatel | Portfolio: ananyapatel.dev

SUMMARY
Full stack engineer with 3 years building scalable web applications. Strong in React, Node.js, and PostgreSQL. Experience with Docker, CI/CD pipelines, and AWS.

EXPERIENCE
Full Stack Engineer — Razorpay (2021–Present)
• Shipped payment flow features in React + Node.js serving 100K daily transactions
• Designed PostgreSQL schemas for financial ledger data
• Dockerized microservices; set up GitHub Actions CI/CD pipelines
• Mentored 2 interns; led code reviews

Software Engineer Intern — Flipkart (2020)
• Built React components for seller dashboard
• Wrote Node.js scripts for data migration

SKILLS
React, Node.js, PostgreSQL, TypeScript, Docker, AWS, Git, Express, REST API, HTML, CSS

EDUCATION
B.Tech Computer Science — IIT Bombay (2021)`,
  },
  "Isabella Rossi": {
    portfolioUrl: "https://isabellarossi.design",
    yearsExperience: 2,
    university: "Politecnico di Milano",
    location: "Milan, Italy",
    resumeText: `Isabella Rossi — UI/UX Designer
Email: isabella@example.com | Portfolio: isabellarossi.design

SUMMARY
UI/UX designer with 2 years creating user-centered digital products. Skilled in Figma, prototyping, and design systems. Strong collaborator with engineering teams.

EXPERIENCE
UI/UX Designer — Bending Spoons (2022–Present)
• Designed onboarding flows and core UI for mobile app with 1M+ users
• Created Figma component library adopted by 5-person design team
• Ran usability testing sessions; synthesized findings into actionable design changes
• Collaborated with CSS developers to implement pixel-perfect designs

Junior Designer — Everli (2021–2022)
• Designed grocery delivery app screens in Figma
• Produced high-fidelity prototypes for user testing
• Created design documentation and handoff specs for developers

SKILLS
Figma, UI/UX, Prototyping, Design Systems, User Research, Wireframing, CSS, Adobe XD

EDUCATION
B.Des Interaction Design — Politecnico di Milano (2021)`,
  },
  "Priya Sharma": {
    githubUrl: "https://github.com/priyasharma",
    yearsExperience: 2,
    university: "NIT Trichy",
    location: "Pune, India",
    resumeText: `Priya Sharma — Frontend Developer
Email: priya@example.com | GitHub: github.com/priyasharma

SUMMARY
Frontend developer with 2 years experience. Familiar with React and basic JavaScript. Working towards stronger TypeScript skills.

EXPERIENCE
Junior Frontend Developer — TCS (2022–Present)
• Built UI components using HTML, CSS, and JavaScript
• Used React for internal dashboard project
• Participated in code reviews and sprint planning

SKILLS
HTML, CSS, JavaScript, React, Git, Bootstrap

EDUCATION
B.Tech Computer Science — NIT Trichy (2022)`,
  },
  "Rohan Mehta": {
    githubUrl: "https://github.com/rohanmehta",
    portfolioUrl: "https://rohanmehta.io",
    yearsExperience: 6,
    university: "IIT Delhi",
    location: "Mumbai, India",
    resumeText: `Rohan Mehta — Senior Frontend Engineer
Email: rohan@example.com | GitHub: github.com/rohanmehta | Portfolio: rohanmehta.io

SUMMARY
Senior frontend engineer with 6 years building large-scale React applications. Expert in TypeScript, CSS architecture, performance optimization, and frontend system design. Open source contributor.

EXPERIENCE
Staff Frontend Engineer — Zepto (2021–Present)
• Architected React + TypeScript frontend for ultra-fast delivery app (3M daily users)
• Built component design system with Storybook; reduced designer-developer handoff time by 50%
• Implemented code splitting and lazy loading; improved TTI by 2.5s
• Led team of 5 frontend engineers; drove quarterly OKRs

Senior Frontend Engineer — CRED (2018–2021)
• Built React Native and React web apps for fintech platform (10M users)
• Introduced TypeScript across frontend codebase; mentored team adoption
• Shipped CSS custom properties design token system

SKILLS
React, TypeScript, JavaScript, CSS, Next.js, React Native, Git, Webpack, Vite, GraphQL, Storybook, Jest, Playwright, Node.js

EDUCATION
B.Tech Computer Science — IIT Delhi (2018)`,
  },
};

const candidateJobMap: Record<string, string> = {
  "Alex Johnson": "Senior Frontend Engineer",
  "Yuki Tanaka": "Senior Frontend Engineer",
  "Sarah Chen": "Machine Learning Engineer",
  "Marcus Williams": "Full Stack Engineer",
  "Ananya Patel": "Full Stack Engineer",
  "Isabella Rossi": "UI/UX Designer",
  "Priya Sharma": "Senior Frontend Engineer",
  "Rohan Mehta": "Senior Frontend Engineer",
};

const candidateEmails: Record<string, string> = {
  "Alex Johnson": "alex.johnson@example.com",
  "Yuki Tanaka": "yuki.tanaka@example.com",
  "Sarah Chen": "sarah.chen@example.com",
  "Marcus Williams": "marcus.williams@example.com",
  "Ananya Patel": "ananya.patel@example.com",
  "Isabella Rossi": "isabella.rossi@example.com",
  "Priya Sharma": "priya.sharma@example.com",
  "Rohan Mehta": "rohan.mehta@example.com",
};

async function seed() {
  console.log("Seeding jobs…");
  const insertedJobs = await db.insert(jobsTable).values(jobs).returning();
  const jobMap = Object.fromEntries(insertedJobs.map((j) => [j.title, j]));
  console.log(`✓ ${insertedJobs.length} jobs inserted`);

  console.log("Seeding candidates…");
  const candidateRows = Object.entries(candidateResumes).map(([name, data]) => {
    const jobTitle = candidateJobMap[name];
    const job = jobMap[jobTitle];
    const skills = extractSkills(data.resumeText);
    const verifiedPoW = !!(data.githubUrl || data.portfolioUrl);
    return {
      name,
      email: candidateEmails[name],
      resumeText: data.resumeText,
      jobId: job.id,
      githubUrl: data.githubUrl ?? null,
      portfolioUrl: data.portfolioUrl ?? null,
      yearsExperience: data.yearsExperience,
      university: data.university ?? null,
      location: data.location ?? null,
      extractedSkills: skills,
      verifiedProofOfWork: verifiedPoW,
    };
  });

  const insertedCandidates = await db.insert(candidatesTable).values(candidateRows).returning();
  console.log(`✓ ${insertedCandidates.length} candidates inserted`);

  console.log("Analyzing candidates…");
  for (const candidate of insertedCandidates) {
    const job = insertedJobs.find((j) => j.id === candidate.jobId);
    if (!job) continue;

    const analysis = analyzeCandidate(candidate.resumeText, job.requiredSkills, candidate.yearsExperience);
    let status: string;
    if (analysis.recommendation === "shortlist") status = "shortlisted";
    else if (analysis.recommendation === "reject") status = "rejected";
    else status = "analyzed";

    await db.update(candidatesTable).set({
      overallScore: analysis.overallScore,
      skillSynergyScore: analysis.skillSynergyScore,
      velocityScore: analysis.velocityScore,
      extractedSkills: analysis.extractedSkills,
      status,
      analysisJson: JSON.stringify(analysis),
    }).where(
      (await import("drizzle-orm")).eq(candidatesTable.id, candidate.id)
    );

    console.log(`  ${candidate.name}: score=${analysis.overallScore} status=${status}`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);
