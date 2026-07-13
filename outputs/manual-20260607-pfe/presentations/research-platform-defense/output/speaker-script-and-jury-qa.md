# Speaker Script and Jury Q&A

## Slide 1/13 - AI-Assisted Research Paper Submission and Review Platform
Objective: AI-Assisted Research Paper Submission and Review Platform
Visual: Cover layout with a left thesis block and a right end-to-end workflow ribbon.
Transition: I will now give the structure of the presentation so the jury can follow the progression.
Duration: 35 seconds

Speech:
Good morning members of the jury. Today I am presenting my final year project: an AI-assisted web platform for managing scientific paper submission and review. The idea is to move from a manual email-based process to a structured workflow where researchers submit papers, administrators assign reviewers, and reviewers receive local AI support before giving their evaluation. The important point is that AI does not replace the human decision. It supports extraction, matching, summarization, similarity checking, and review preparation while the final validation remains human.

## Slide 2/13 - Presentation Roadmap
Objective: Presentation Roadmap
Visual: Six-step horizontal roadmap with the current section highlighted.
Transition: I will start with the context that motivated this project.
Duration: 30 seconds

Speech:
The presentation is organized in six parts. First, I will explain the context and the problem. Then I will present the objectives and the main requirements. After that, I will describe the technical architecture and the data flow. The implementation will be explained through exactly three Scrum sprints. Finally, I will present the demonstration scenario, the perspectives, and the conclusion.

## Slide 3/13 - Scientific Review Still Depends on Fragmented Manual Work
Objective: Scientific Review Still Depends on Fragmented Manual Work
Visual: Before-state flow: email inbox, spreadsheet, manual reviewer choice, unclear status.
Transition: From this context, the project problem becomes clear.
Duration: 45 seconds

Speech:
In many academic environments, the review process is still managed through email exchanges and informal tracking. A researcher sends a PDF, an administrator extracts or copies metadata, reviewers are selected manually, and the status of each paper may be followed in a spreadsheet or in separate messages. This works for a small number of papers, but it becomes slow, difficult to audit, and error-prone when the volume increases. The project therefore starts from a business need: make the review workflow structured and traceable.

## Slide 4/13 - The Core Problem Is Not Only Uploading a PDF
Objective: The Core Problem Is Not Only Uploading a PDF
Visual: Problem stack with four linked bottlenecks from submission to final decision.
Transition: To answer this problem, I defined a solution centered on automation with human validation.
Duration: 45 seconds

Speech:
The problem is larger than simply uploading a PDF. The workflow must handle metadata quality, reviewer selection, originality checking, reviewer assistance, and final decision tracking. If these steps remain disconnected, the platform would only replace email with another file repository. The challenge is to connect the full lifecycle while keeping the process understandable and controllable by the administrator and the reviewers.

## Slide 5/13 - The Proposed Solution Automates the Workflow, Not the Judgment
Objective: The Proposed Solution Automates the Workflow, Not the Judgment
Visual: Main chain: upload -> GROBID -> correction -> submission -> embedding -> assignment -> review tools -> decision.
Transition: Before discussing the implementation, I will summarize the expected requirements.
Duration: 60 seconds

Speech:
The solution is a web platform that automates repetitive operations but keeps human validation at the important points. The researcher uploads a PDF. GROBID extracts the title, authors, abstract, and keywords. The researcher can correct these fields before submitting. After submission, the paper is indexed with local embeddings generated through Ollama. The administrator receives reviewer suggestions and confirms the assignment. The reviewer then has access to an AI summary, a similarity report, and a paper-grounded chatbot before submitting an evaluation. The administrator can then issue the final decision after the completed reviews.

## Slide 6/13 - Requirements Balance Usability, Security, and Maintainability
Objective: Requirements Balance Usability, Security, and Maintainability
Visual: Three actor lanes plus a thin non-functional requirement rail.
Transition: These requirements are supported by the technical architecture.
Duration: 55 seconds

Speech:
The platform has three business roles. The researcher manages the submission lifecycle. The reviewer role is called CHECKER in the backend, and it covers expertise management, assigned papers, AI support tools, and review submission. The administrator manages users, validates reviewer assignment, monitors reviews and statistics, and issues the final decision. On the non-functional side, the system uses JWT authentication, BCrypt password hashing, role-based authorization, local storage for PDFs, and a layered backend structure to keep the code maintainable.

## Slide 7/13 - The Architecture Separates UI, Core Workflow, and Local AI
Objective: The Architecture Separates UI, Core Workflow, and Local AI
Visual: Four-layer architecture: Angular, Spring Boot, FastAPI/Ollama, PostgreSQL + local PDF storage.
Transition: I will now show how this architecture was implemented progressively through Scrum.
Duration: 70 seconds

Speech:
Technically, the platform separates responsibilities. Angular provides the user interface. Spring Boot is the core backend: it manages authentication, authorization, users, papers, assignments, reviews, notifications, and file access. The AI capabilities are isolated in a FastAPI service that calls Ollama locally. PostgreSQL stores the business data, and pgvector is used for embedding storage through the vector extension. PDF files are stored locally on the server file system. This separation is important because the AI layer can evolve without rewriting the core business workflow.

## Slide 8/13 - Sprint 1 Built the Secure Foundation
Objective: Sprint 1 Built the Secure Foundation
Visual: Sprint 1 timeline with proof screenshots: login, upload, user management.
Transition: With this foundation ready, Sprint 2 introduced the AI-assisted submission pipeline.
Duration: 55 seconds

Speech:
Sprint 1 focused on the secure base of the platform. It delivered account registration, login, JWT-based authentication, and role-based access control for the three roles. It also added profile management, including reviewer expertise fields, and the first PDF upload workflow. On the administrator side, the platform supports user activation, suspension, and role changes. At the end of this sprint, users could access the system securely and researchers could create draft paper records with files stored locally.

## Slide 9/13 - Sprint 2 Turned a Draft PDF into Structured, Indexed Data
Objective: Sprint 2 Turned a Draft PDF into Structured, Indexed Data
Visual: Data pipeline from PDF to editable metadata to vector storage, with metadata form screenshot.
Transition: Once papers are indexed, Sprint 3 can support assignment and review assistance.
Duration: 65 seconds

Speech:
Sprint 2 transformed the uploaded PDF into structured data. The backend sends the stored PDF to GROBID, receives TEI XML, and parses it into fields such as title, abstract, authors, and keywords. These fields are not blindly accepted: the researcher reviews and corrects them in an Angular form. The AI service can also extract technical keywords using Mistral through Ollama. When the researcher submits the paper, Spring Boot changes the status to submitted and triggers asynchronous embedding through the FastAPI service. The resulting vector is stored in PostgreSQL using pgvector.

## Slide 10/13 - Sprint 3 Completed Assignment, Review, and Decision Support
Objective: Sprint 3 Completed Assignment, Review, and Decision Support
Visual: Review loop: suggestions -> assignment -> reviewer toolkit -> review submission -> final decision.
Transition: These three sprints produce a coherent scenario that I will use for the demonstration.
Duration: 70 seconds

Speech:
Sprint 3 completed the core review lifecycle. The administrator can request reviewer suggestions and then validate the assignment manually. In the implemented workflow, reviewer suggestions combine AI search with a fallback based on keyword and expertise matching plus reviewer workload. The assigned CHECKER receives an invitation, accepts it, and then accesses the review workspace. The reviewer can generate an AI summary, run a similarity or plagiarism check, ask questions through the chatbot, and submit scores, comments, and a decision. After exactly three completed reviews, the administrator can issue the final decision.

## Slide 11/13 - The Demonstration Follows One Complete Paper Lifecycle
Objective: The Demonstration Follows One Complete Paper Lifecycle
Visual: Numbered demo storyboard with five screens and expected role changes.
Transition: After the demo scenario, I will present realistic future improvements.
Duration: 45 seconds

Speech:
For the demonstration, I will follow a single paper from upload to decision. I will start as a researcher, upload a PDF, extract and correct metadata, then submit it. Next, I will switch to the administrator view to show reviewer suggestions and assignment. Then I will use the reviewer workspace to accept the invitation, generate the AI summary, check similarity, ask the chatbot a question, and submit the review. Finally, I will return to the administrator view to show how the review results support the final decision.

## Slide 12/13 - Perspectives Focus on Production-Grade Review Quality
Objective: Perspectives Focus on Production-Grade Review Quality
Visual: Future roadmap split into AI quality, governance, deployment, analytics.
Transition: I will now conclude by summarizing the value delivered by the project.
Duration: 50 seconds

Speech:
The current platform is functional, but several improvements can make it more production-ready. First, reviewer matching can be strengthened by comparing reviewer expertise embeddings and paper embeddings directly with pgvector. Second, the chatbot can be improved by indexing full paper chunks instead of relying mainly on metadata context. Third, the assignment process can include conflict-of-interest checks, for example affiliation or author-reviewer relations. Finally, deployment can be improved with full containerization, monitoring, and richer analytics for administrators.

## Slide 13/13 - Thank You. I Am Ready for Your Questions.
Objective: Thank You. I Am Ready for Your Questions.
Visual: Clean closing slide with the full workflow reduced to one thin line and a Q&A marker.
Transition: I now welcome your questions and comments.
Duration: 35 seconds

Speech:
To conclude, this project delivers a structured platform for scientific paper submission and review. It replaces fragmented email-based management with a traceable workflow from PDF upload to final decision. The architecture combines Angular, Spring Boot, FastAPI, PostgreSQL with pgvector, local PDF storage, GROBID, and Ollama-based local AI. The three sprints are coherent: first the secure foundation, then the AI-assisted submission pipeline, and finally the review workflow. Thank you for your attention. I am ready to answer your questions.

## Likely Jury Questions

1. Why did you use local AI instead of cloud APIs?
Answer: Because submitted papers may contain confidential research. Ollama allows embeddings and text generation to run locally, reducing external data exposure and keeping the review workflow under institutional control.

2. What is the role of Spring Boot in the architecture?
Answer: Spring Boot is the core workflow service. It handles authentication, authorization, users, paper lifecycle, file storage access, assignments, reviews, notifications, and calls to GROBID and the FastAPI AI service.

3. Why use FastAPI as a separate AI service?
Answer: The AI tasks are Python-oriented and may evolve independently. Separating them keeps the Java backend focused on business rules and lets the AI layer change models or prompts without changing the core application.

4. What does pgvector bring to PostgreSQL?
Answer: pgvector adds a vector column type and similarity-search capability to PostgreSQL, so semantic embeddings can be stored near relational data without adding a separate vector database.

5. How are reviewers suggested?
Answer: The target design uses semantic similarity between paper content and reviewer expertise. In the implemented backend, the service first tries AI search and falls back to keyword-expertise matching and workload ordering, then the admin validates the final assignment.

6. Does AI make the final decision?
Answer: No. AI helps with extraction, indexing, summary, similarity checking, and review preparation. Reviewer evaluations and the administrator's final decision remain human-controlled.

7. How do you secure the application?
Answer: The backend uses Spring Security, JWT tokens, BCrypt password hashing, account status control, and role-based endpoint authorization for RESEARCHER, CHECKER, and ADMIN.

8. What happens if GROBID or Ollama is unavailable?
Answer: The backend returns clear errors for extraction or AI tasks and keeps the business workflow protected. For indexing, submission can remain recorded while embedding can be retried or regenerated later.

9. Why is metadata editable after GROBID extraction?
Answer: GROBID can make mistakes depending on PDF quality. Human correction ensures that downstream search, categorization, and matching use better-quality metadata.

10. What are the main limitations?
Answer: The main limitations are that full paper chunk indexing should be strengthened for RAG, reviewer matching should move fully to vector comparison, and production deployment needs stronger monitoring and conflict-of-interest rules.


