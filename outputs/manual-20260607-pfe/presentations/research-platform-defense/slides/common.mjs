export const TOTAL = 13;

export const style = {
  bg: "#F7F8F5",
  ink: "#16201E",
  soft: "#66736E",
  muted: "#D8DED9",
  line: "#C5CDC7",
  accent: "#147D64",
  accent2: "#315E8A",
  accent3: "#C9802A",
  dark: "#10231F",
  pale: "#EAF1EC",
  white: "#FFFFFF",
  serif: "Georgia",
  sans: "Aptos",
};

export const slides = [
  {
    section: "Opening",
    title: "AI-Assisted Research Paper Submission and Review Platform",
    goal: "Introduce the project and position it as an academic review workflow solution.",
    bullets: [
      "Final year engineering project",
      "Web platform for submission, assignment, and review",
      "Angular, Spring Boot, FastAPI, PostgreSQL, local AI",
      "Human control with AI assistance",
    ],
    visual: "Cover layout with a left thesis block and a right end-to-end workflow ribbon.",
    transition: "I will now give the structure of the presentation so the jury can follow the progression.",
    seconds: 35,
    speech: "Good morning members of the jury. Today I am presenting my final year project: an AI-assisted web platform for managing scientific paper submission and review. The idea is to move from a manual email-based process to a structured workflow where researchers submit papers, administrators assign reviewers, and reviewers receive local AI support before giving their evaluation. The important point is that AI does not replace the human decision. It supports extraction, matching, summarization, similarity checking, and review preparation while the final validation remains human.",
  },
  {
    section: "Opening",
    title: "Presentation Roadmap",
    goal: "Announce a simple six-section plan.",
    bullets: [
      "Context and problem",
      "Objectives and requirements",
      "Architecture and data flow",
      "Three Scrum sprints",
      "Demo, perspectives, conclusion",
    ],
    visual: "Six-step horizontal roadmap with the current section highlighted.",
    transition: "I will start with the context that motivated this project.",
    seconds: 30,
    speech: "The presentation is organized in six parts. First, I will explain the context and the problem. Then I will present the objectives and the main requirements. After that, I will describe the technical architecture and the data flow. The implementation will be explained through exactly three Scrum sprints. Finally, I will present the demonstration scenario, the perspectives, and the conclusion.",
  },
  {
    section: "Context",
    title: "Scientific Review Still Depends on Fragmented Manual Work",
    goal: "Show the business context before the technical solution.",
    bullets: [
      "Papers are exchanged by email",
      "Metadata is copied manually",
      "Reviewer choice is informal",
      "Status tracking lacks traceability",
    ],
    visual: "Before-state flow: Email inbox, spreadsheet, manual reviewer choice, unclear status.",
    transition: "From this context, the project problem becomes clear.",
    seconds: 45,
    speech: "In many academic environments, the review process is still managed through email exchanges and informal tracking. A researcher sends a PDF, an administrator extracts or copies metadata, reviewers are selected manually, and the status of each paper may be followed in a spreadsheet or in separate messages. This works for a small number of papers, but it becomes slow, difficult to audit, and error-prone when the volume increases. The project therefore starts from a business need: make the review workflow structured and traceable.",
  },
  {
    section: "Context",
    title: "The Core Problem Is Not Only Uploading a PDF",
    goal: "Define the exact problem to solve.",
    bullets: [
      "Manual metadata entry wastes time",
      "Reviewer assignment lacks objective support",
      "Similarity checks are not integrated",
      "Reviewers lack preparation tools",
    ],
    visual: "Problem stack with four linked bottlenecks from submission to final decision.",
    transition: "To answer this problem, I defined a solution centered on automation with human validation.",
    seconds: 45,
    speech: "The problem is larger than simply uploading a PDF. The workflow must handle metadata quality, reviewer selection, originality checking, reviewer assistance, and final decision tracking. If these steps remain disconnected, the platform would only replace email with another file repository. The challenge is to connect the full lifecycle while keeping the process understandable and controllable by the administrator and the reviewers.",
  },
  {
    section: "Solution",
    title: "The Proposed Solution Automates the Workflow, Not the Judgment",
    goal: "Present the value proposition and full target chain.",
    bullets: [
      "Upload PDF and extract metadata with GROBID",
      "Researcher corrects metadata before submission",
      "Local embeddings support search and matching",
      "Reviewer receives summary, similarity report, chatbot",
      "Admin validates assignment and final decision",
    ],
    visual: "Main chain: upload -> GROBID -> correction -> submission -> embedding -> assignment -> review tools -> decision.",
    transition: "Before discussing the implementation, I will summarize the expected requirements.",
    seconds: 60,
    speech: "The solution is a web platform that automates repetitive operations but keeps human validation at the important points. The researcher uploads a PDF. GROBID extracts the title, authors, abstract, and keywords. The researcher can correct these fields before submitting. After submission, the paper is indexed with local embeddings generated through Ollama. The administrator receives reviewer suggestions and confirms the assignment. The reviewer then has access to an AI summary, a similarity report, and a paper-grounded chatbot before submitting an evaluation. The administrator can then issue the final decision after the completed reviews.",
  },
  {
    section: "Solution",
    title: "Requirements Balance Usability, Security, and Maintainability",
    goal: "Show functional and non-functional scope without a dense table.",
    bullets: [
      "Researcher: upload, correct, submit, track",
      "CHECKER: expertise, assigned papers, review tools",
      "Admin: users, assignments, statistics, final decision",
      "JWT, BCrypt, role-based authorization",
      "Layered backend for maintainability",
    ],
    visual: "Three actor lanes plus a thin non-functional requirement rail.",
    transition: "These requirements are supported by the technical architecture.",
    seconds: 55,
    speech: "The platform has three business roles. The researcher manages the submission lifecycle. The reviewer role is called CHECKER in the backend, and it covers expertise management, assigned papers, AI support tools, and review submission. The administrator manages users, validates reviewer assignment, monitors reviews and statistics, and issues the final decision. On the non-functional side, the system uses JWT authentication, BCrypt password hashing, role-based authorization, local storage for PDFs, and a layered backend structure to keep the code maintainable.",
  },
  {
    section: "Architecture",
    title: "The Architecture Separates UI, Core Workflow, and Local AI",
    goal: "Explain architecture in a simplified oral diagram.",
    bullets: [
      "Angular frontend for role-specific interfaces",
      "Spring Boot secures APIs and paper lifecycle",
      "FastAPI isolates AI inference tasks",
      "PostgreSQL stores relational data and vectors",
      "Ollama keeps paper content local",
    ],
    visual: "Four-layer architecture: Angular, Spring Boot, FastAPI/Ollama, PostgreSQL + local PDF storage.",
    transition: "I will now show how this architecture was implemented progressively through Scrum.",
    seconds: 70,
    speech: "Technically, the platform separates responsibilities. Angular provides the user interface. Spring Boot is the core backend: it manages authentication, authorization, users, papers, assignments, reviews, notifications, and file access. The AI capabilities are isolated in a FastAPI service that calls Ollama locally. PostgreSQL stores the business data, and pgvector is used for embedding storage through the vector extension. PDF files are stored locally on the server file system. This separation is important because the AI layer can evolve without rewriting the core business workflow.",
  },
  {
    section: "Implementation",
    title: "Sprint 1 Built the Secure Foundation",
    goal: "Present the first Scrum increment and its concrete value.",
    bullets: [
      "JWT authentication and protected routes",
      "Roles: RESEARCHER, CHECKER, ADMIN",
      "Profile management and expertise fields",
      "PDF upload to local storage",
      "Admin user activation and role management",
    ],
    visual: "Sprint 1 timeline with three proof screenshots: login, upload, user management.",
    transition: "With this foundation ready, Sprint 2 introduced the AI-assisted submission pipeline.",
    seconds: 55,
    speech: "Sprint 1 focused on the secure base of the platform. It delivered account registration, login, JWT-based authentication, and role-based access control for the three roles. It also added profile management, including reviewer expertise fields, and the first PDF upload workflow. On the administrator side, the platform supports user activation, suspension, and role changes. At the end of this sprint, users could access the system securely and researchers could create draft paper records with files stored locally.",
    images: ["report latex code/images/sprint1/login.jpeg", "report latex code/images/sprint1/upload.jpeg", "report latex code/images/sprint1/manage users.png"],
  },
  {
    section: "Implementation",
    title: "Sprint 2 Turned a Draft PDF into Structured, Indexed Data",
    goal: "Show how submission becomes exploitable data.",
    bullets: [
      "GROBID extracts title, authors, abstract, keywords",
      "Researcher edits metadata before submission",
      "AI keyword extraction improves metadata",
      "Submission triggers asynchronous embedding",
      "pgvector stores embeddings for later retrieval",
    ],
    visual: "Data pipeline from PDF to editable metadata to vector storage, with metadata form screenshot.",
    transition: "Once papers are indexed, Sprint 3 can support assignment and review assistance.",
    seconds: 65,
    speech: "Sprint 2 transformed the uploaded PDF into structured data. The backend sends the stored PDF to GROBID, receives TEI XML, and parses it into fields such as title, abstract, authors, and keywords. These fields are not blindly accepted: the researcher reviews and corrects them in an Angular form. The AI service can also extract technical keywords using Mistral through Ollama. When the researcher submits the paper, Spring Boot changes the status to submitted and triggers asynchronous embedding through the FastAPI service. The resulting vector is stored in PostgreSQL using pgvector.",
    images: ["report latex code/images/sprint2/extract.jpeg", "report latex code/images/sprint2/dashboard.jpeg"],
  },
  {
    section: "Implementation",
    title: "Sprint 3 Completed Assignment, Review, and Decision Support",
    goal: "Show final workflow features and human validation.",
    bullets: [
      "Admin receives ranked reviewer suggestions",
      "Assignments are validated by the admin",
      "CHECKER accepts, reviews, scores, and comments",
      "Summary, similarity report, and chatbot assist review",
      "Admin issues the final decision after reviews",
    ],
    visual: "Review loop: suggestions -> assignment -> reviewer toolkit -> review submission -> final decision.",
    transition: "These three sprints produce a coherent scenario that I will use for the demonstration.",
    seconds: 70,
    speech: "Sprint 3 completed the core review lifecycle. The administrator can request reviewer suggestions and then validate the assignment manually. In the implemented workflow, reviewer suggestions combine AI search with a fallback based on keyword and expertise matching plus reviewer workload. The assigned CHECKER receives an invitation, accepts it, and then accesses the review workspace. The reviewer can generate an AI summary, run a similarity or plagiarism check, ask questions through the chatbot, and submit scores, comments, and a decision. After exactly three completed reviews, the administrator can issue the final decision.",
    images: ["report latex code/images/sprint3/assign 1.jpeg", "report latex code/images/sprint3/Form.jpeg", "report latex code/images/sprint3/chatbot.jpeg"],
  },
  {
    section: "Demonstration",
    title: "The Demonstration Follows One Complete Paper Lifecycle",
    goal: "Prepare the jury for the demo scenario.",
    bullets: [
      "Researcher uploads and corrects metadata",
      "Paper is submitted and indexed locally",
      "Admin reviews suggestions and assigns CHECKERs",
      "Reviewer uses summary, similarity, chatbot",
      "Review and final decision close the loop",
    ],
    visual: "Numbered demo storyboard with five screens and expected role changes.",
    transition: "After the demo scenario, I will present realistic future improvements.",
    seconds: 45,
    speech: "For the demonstration, I will follow a single paper from upload to decision. I will start as a researcher, upload a PDF, extract and correct metadata, then submit it. Next, I will switch to the administrator view to show reviewer suggestions and assignment. Then I will use the reviewer workspace to accept the invitation, generate the AI summary, check similarity, ask the chatbot a question, and submit the review. Finally, I will return to the administrator view to show how the review results support the final decision.",
  },
  {
    section: "Closing",
    title: "Perspectives Focus on Production-Grade Review Quality",
    goal: "Show mature understanding of limitations and future work.",
    bullets: [
      "Improve reviewer matching with direct vector comparison",
      "Index full paper chunks for stronger RAG answers",
      "Add reviewer conflict-of-interest checks",
      "Dockerize deployment and monitoring",
      "Extend analytics for admin decision support",
    ],
    visual: "Future roadmap split into AI quality, governance, deployment, analytics.",
    transition: "I will now conclude by summarizing the value delivered by the project.",
    seconds: 50,
    speech: "The current platform is functional, but several improvements can make it more production-ready. First, reviewer matching can be strengthened by comparing reviewer expertise embeddings and paper embeddings directly with pgvector. Second, the chatbot can be improved by indexing full paper chunks instead of relying mainly on metadata context. Third, the assignment process can include conflict-of-interest checks, for example affiliation or author-reviewer relations. Finally, deployment can be improved with full containerization, monitoring, and richer analytics for administrators.",
  },
  {
    section: "Closing",
    title: "Thank You. I Am Ready for Your Questions.",
    goal: "Close professionally and open the discussion.",
    bullets: [
      "Structured lifecycle from upload to final decision",
      "Local AI preserves confidentiality",
      "Scrum increments align with architecture",
      "Human validation remains central",
    ],
    visual: "Clean closing slide with the full workflow reduced to one thin line and a Q&A marker.",
    transition: "I now welcome your questions and comments.",
    seconds: 35,
    speech: "To conclude, this project delivers a structured platform for scientific paper submission and review. It replaces fragmented email-based management with a traceable workflow from PDF upload to final decision. The architecture combines Angular, Spring Boot, FastAPI, PostgreSQL with pgvector, local PDF storage, GROBID, and Ollama-based local AI. The three sprints are coherent: first the secure foundation, then the AI-assisted submission pipeline, and finally the review workflow. Thank you for your attention. I am ready to answer your questions.",
  },
];

export const juryQuestions = [
  ["Why did you use local AI instead of cloud APIs?", "Because submitted papers may contain confidential research. Ollama allows embeddings and text generation to run locally, reducing external data exposure and keeping the review workflow under institutional control."],
  ["What is the role of Spring Boot in the architecture?", "Spring Boot is the core workflow service. It handles authentication, authorization, users, paper lifecycle, file storage access, assignments, reviews, notifications, and calls to GROBID and the FastAPI AI service."],
  ["Why use FastAPI as a separate AI service?", "The AI tasks are Python-oriented and may evolve independently. Separating them keeps the Java backend focused on business rules and lets the AI layer change models or prompts without changing the core application."],
  ["What does pgvector bring to PostgreSQL?", "pgvector adds a vector column type and similarity-search capability to PostgreSQL, so semantic embeddings can be stored near relational data without adding a separate vector database."],
  ["How are reviewers suggested?", "The target design uses semantic similarity between paper content and reviewer expertise. In the implemented backend, the service first tries AI search and falls back to keyword-expertise matching and workload ordering, then the admin validates the final assignment."],
  ["Does AI make the final decision?", "No. AI helps with extraction, indexing, summary, similarity checking, and review preparation. Reviewer evaluations and the administrator's final decision remain human-controlled."],
  ["How do you secure the application?", "The backend uses Spring Security, JWT tokens, BCrypt password hashing, account status control, and role-based endpoint authorization for RESEARCHER, CHECKER, and ADMIN."],
  ["What happens if GROBID or Ollama is unavailable?", "The backend returns clear errors for extraction or AI tasks and keeps the business workflow protected. For indexing, submission can remain recorded while embedding can be retried or regenerated later."],
  ["Why is metadata editable after GROBID extraction?", "GROBID can make mistakes depending on PDF quality. Human correction ensures that downstream search, categorization, and matching use better-quality metadata."],
  ["What are the main limitations?", "The main limitations are that full paper chunk indexing should be strengthened for RAG, reviewer matching should move fully to vector comparison, and production deployment needs stronger monitoring and conflict-of-interest rules."],
];

export function addText(slide, ctx, text, x, y, w, h, opts = {}) {
  return ctx.addText(slide, {
    text,
    left: x,
    top: y,
    width: w,
    height: h,
    fontSize: opts.size ?? 18,
    color: opts.color ?? style.ink,
    bold: opts.bold ?? false,
    typeface: opts.face ?? style.sans,
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    fill: opts.fill ?? "#00000000",
    line: opts.line ?? ctx.line(),
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
    name: opts.name,
  });
}

export function rect(slide, ctx, x, y, w, h, fill, opts = {}) {
  return ctx.addShape(slide, {
    left: x,
    top: y,
    width: w,
    height: h,
    geometry: opts.geometry ?? "rect",
    fill,
    line: opts.line ?? ctx.line(opts.lineColor || "#00000000", opts.weight ?? 0),
    radius: opts.radius ?? 0,
    name: opts.name,
  });
}

export function line(slide, ctx, x, y, w, h, color = style.line, weight = 1) {
  return rect(slide, ctx, x, y, w, h, color, { weight });
}

export function base(slide, ctx, idx, section) {
  rect(slide, ctx, 0, 0, 1280, 720, style.bg);
  const progressW = 1280 * (idx / TOTAL);
  rect(slide, ctx, 0, 0, 1280, 5, "#E1E7E2");
  rect(slide, ctx, 0, 0, progressW, 5, style.accent);
  addText(slide, ctx, section.toUpperCase(), 64, 30, 360, 18, { size: 9, color: style.soft, bold: true, name: `kicker-${idx}-label` });
  rect(slide, ctx, 48, 34, 8, 8, style.accent, { name: `kicker-${idx}-marker` });
  line(slide, ctx, 48, 675, 1080, 1, style.line);
  addText(slide, ctx, `${idx}/${TOTAL}`, 1160, 662, 70, 24, { size: 12, color: style.soft, align: "right", bold: true });
}

export function addHeader(slide, ctx, item, idx) {
  base(slide, ctx, idx, item.section);
  addText(slide, ctx, item.title, 48, 66, 790, 92, { size: 31, face: style.serif, bold: true, color: style.ink });
}

export function addBullets(slide, ctx, bullets, x = 66, y = 205, w = 500, rowH = 56) {
  bullets.forEach((b, i) => {
    const yy = y + i * rowH;
    rect(slide, ctx, x, yy + 8, 7, 7, i % 2 ? style.accent2 : style.accent);
    addText(slide, ctx, b, x + 24, yy, w, 34, { size: 16.5, color: style.ink });
  });
}

export function addMetaNote(slide, ctx, item) {
  addText(slide, ctx, `Goal: ${item.goal}`, 48, 626, 800, 18, { size: 8.5, color: style.soft });
  addText(slide, ctx, `${item.seconds}s`, 1060, 626, 80, 18, { size: 8.5, color: style.soft, align: "right" });
}

export function workflow(slide, ctx, labels, x = 610, y = 230, w = 560) {
  const stepW = w / labels.length;
  labels.forEach((label, i) => {
    const xx = x + i * stepW;
    rect(slide, ctx, xx, y, stepW - 18, 66, i % 2 ? "#E7EEF6" : style.pale, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, String(i + 1).padStart(2, "0"), xx + 12, y + 12, 36, 18, { size: 12, color: i % 2 ? style.accent2 : style.accent, bold: true });
    addText(slide, ctx, label, xx + 12, y + 34, stepW - 42, 28, { size: 10.5, color: style.ink });
    if (i < labels.length - 1) {
      line(slide, ctx, xx + stepW - 18, y + 33, 18, 2, style.accent3, 2);
    }
  });
}

export function architecture(slide, ctx) {
  const layers = [
    ["Angular", "Role-specific UI", style.accent],
    ["Spring Boot", "Security, lifecycle, authorizations", style.accent2],
    ["FastAPI + Ollama", "Embeddings, summary, keywords, chatbot", style.accent3],
    ["PostgreSQL + pgvector", "Relational data and vectors", style.dark],
  ];
  layers.forEach((l, i) => {
    const y = 190 + i * 86;
    rect(slide, ctx, 625, y, 455, 58, i === 3 ? style.dark : style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, l[0], 650, y + 11, 170, 18, { size: 15, bold: true, color: i === 3 ? style.white : l[2] });
    addText(slide, ctx, l[1], 830, y + 12, 220, 28, { size: 11.5, color: i === 3 ? "#DDE8E3" : style.ink });
    if (i < layers.length - 1) line(slide, ctx, 852, y + 60, 2, 24, style.accent, 2);
  });
  rect(slide, ctx, 1098, 318, 90, 84, "#F1E4D2", { lineColor: style.line, weight: 1 });
  addText(slide, ctx, "Local PDF\nstorage", 1110, 345, 68, 35, { size: 11, align: "center", color: style.ink });
}

export function imageStrip(slide, ctx, images = []) {
  images.slice(0, 3).forEach((src, i) => {
    const x = 610 + i * 190;
    rect(slide, ctx, x, 215, 170, 255, style.white, { lineColor: style.line, weight: 1 });
    slide.images.add({ path: src, left: x + 8, top: 223, width: 154, height: 220, fit: "contain" });
  });
}

export function qaText() {
  return juryQuestions.map((q, i) => `${i + 1}. ${q[0]}\nAnswer: ${q[1]}`).join("\n\n");
}
