$ErrorActionPreference = "Stop"
$root = "C:\Users\narhen\Desktop\projet PFE\research-platform"
$outDir = Join-Path $root "outputs\manual-20260607-pfe\presentations\research-platform-defense\output"
$previewDir = Join-Path $root "outputs\manual-20260607-pfe\presentations\research-platform-defense\preview-com"
New-Item -ItemType Directory -Force -Path $outDir, $previewDir | Out-Null

$pptxPath = Join-Path $outDir "research-platform-defense.pptx"
$scriptPath = Join-Path $outDir "speaker-script-and-jury-qa.md"

$slides = @(
@{T="AI-Assisted Research Paper Submission and Review Platform"; S="Opening"; B=@("Final year engineering project","Web platform for submission, assignment, and review","Angular, Spring Boot, FastAPI, PostgreSQL, local AI","Human control with AI assistance"); V="Cover layout with a left thesis block and a right end-to-end workflow ribbon."; Tr="I will now give the structure of the presentation so the jury can follow the progression."; D=35; N="Good morning members of the jury. Today I am presenting my final year project: an AI-assisted web platform for managing scientific paper submission and review. The idea is to move from a manual email-based process to a structured workflow where researchers submit papers, administrators assign reviewers, and reviewers receive local AI support before giving their evaluation. The important point is that AI does not replace the human decision. It supports extraction, matching, summarization, similarity checking, and review preparation while the final validation remains human."},
@{T="Presentation Roadmap"; S="Opening"; B=@("Context and problem","Objectives and requirements","Architecture and data flow","Three Scrum sprints","Demo, perspectives, conclusion"); V="Six-step horizontal roadmap with the current section highlighted."; Tr="I will start with the context that motivated this project."; D=30; N="The presentation is organized in six parts. First, I will explain the context and the problem. Then I will present the objectives and the main requirements. After that, I will describe the technical architecture and the data flow. The implementation will be explained through exactly three Scrum sprints. Finally, I will present the demonstration scenario, the perspectives, and the conclusion."},
@{T="Scientific Review Still Depends on Fragmented Manual Work"; S="Context"; B=@("Papers are exchanged by email","Metadata is copied manually","Reviewer choice is informal","Status tracking lacks traceability"); V="Before-state flow: email inbox, spreadsheet, manual reviewer choice, unclear status."; Tr="From this context, the project problem becomes clear."; D=45; N="In many academic environments, the review process is still managed through email exchanges and informal tracking. A researcher sends a PDF, an administrator extracts or copies metadata, reviewers are selected manually, and the status of each paper may be followed in a spreadsheet or in separate messages. This works for a small number of papers, but it becomes slow, difficult to audit, and error-prone when the volume increases. The project therefore starts from a business need: make the review workflow structured and traceable."},
@{T="The Core Problem Is Not Only Uploading a PDF"; S="Context"; B=@("Manual metadata entry wastes time","Reviewer assignment lacks objective support","Similarity checks are not integrated","Reviewers lack preparation tools"); V="Problem stack with four linked bottlenecks from submission to final decision."; Tr="To answer this problem, I defined a solution centered on automation with human validation."; D=45; N="The problem is larger than simply uploading a PDF. The workflow must handle metadata quality, reviewer selection, originality checking, reviewer assistance, and final decision tracking. If these steps remain disconnected, the platform would only replace email with another file repository. The challenge is to connect the full lifecycle while keeping the process understandable and controllable by the administrator and the reviewers."},
@{T="The Proposed Solution Automates the Workflow, Not the Judgment"; S="Solution"; B=@("Upload PDF and extract metadata with GROBID","Researcher corrects metadata before submission","Local embeddings support search and matching","Reviewer receives summary, similarity report, chatbot","Admin validates assignment and final decision"); V="Main chain: upload -> GROBID -> correction -> submission -> embedding -> assignment -> review tools -> decision."; Tr="Before discussing the implementation, I will summarize the expected requirements."; D=60; N="The solution is a web platform that automates repetitive operations but keeps human validation at the important points. The researcher uploads a PDF. GROBID extracts the title, authors, abstract, and keywords. The researcher can correct these fields before submitting. After submission, the paper is indexed with local embeddings generated through Ollama. The administrator receives reviewer suggestions and confirms the assignment. The reviewer then has access to an AI summary, a similarity report, and a paper-grounded chatbot before submitting an evaluation. The administrator can then issue the final decision after the completed reviews."},
@{T="Requirements Balance Usability, Security, and Maintainability"; S="Solution"; B=@("Researcher: upload, correct, submit, track","CHECKER: expertise, assigned papers, review tools","Admin: users, assignments, statistics, final decision","JWT, BCrypt, role-based authorization","Layered backend for maintainability"); V="Three actor lanes plus a thin non-functional requirement rail."; Tr="These requirements are supported by the technical architecture."; D=55; N="The platform has three business roles. The researcher manages the submission lifecycle. The reviewer role is called CHECKER in the backend, and it covers expertise management, assigned papers, AI support tools, and review submission. The administrator manages users, validates reviewer assignment, monitors reviews and statistics, and issues the final decision. On the non-functional side, the system uses JWT authentication, BCrypt password hashing, role-based authorization, local storage for PDFs, and a layered backend structure to keep the code maintainable."},
@{T="The Architecture Separates UI, Core Workflow, and Local AI"; S="Architecture"; B=@("Angular frontend for role-specific interfaces","Spring Boot secures APIs and paper lifecycle","FastAPI isolates AI inference tasks","PostgreSQL stores relational data and vectors","Ollama keeps paper content local"); V="Four-layer architecture: Angular, Spring Boot, FastAPI/Ollama, PostgreSQL + local PDF storage."; Tr="I will now show how this architecture was implemented progressively through Scrum."; D=70; N="Technically, the platform separates responsibilities. Angular provides the user interface. Spring Boot is the core backend: it manages authentication, authorization, users, papers, assignments, reviews, notifications, and file access. The AI capabilities are isolated in a FastAPI service that calls Ollama locally. PostgreSQL stores the business data, and pgvector is used for embedding storage through the vector extension. PDF files are stored locally on the server file system. This separation is important because the AI layer can evolve without rewriting the core business workflow."},
@{T="Sprint 1 Built the Secure Foundation"; S="Implementation"; B=@("JWT authentication and protected routes","Roles: RESEARCHER, CHECKER, ADMIN","Profile management and expertise fields","PDF upload to local storage","Admin user activation and role management"); V="Sprint 1 timeline with proof screenshots: login, upload, user management."; Tr="With this foundation ready, Sprint 2 introduced the AI-assisted submission pipeline."; D=55; Img=@("report latex code\images\sprint1\login.jpeg","report latex code\images\sprint1\upload.jpeg","report latex code\images\sprint1\manage users.png"); N="Sprint 1 focused on the secure base of the platform. It delivered account registration, login, JWT-based authentication, and role-based access control for the three roles. It also added profile management, including reviewer expertise fields, and the first PDF upload workflow. On the administrator side, the platform supports user activation, suspension, and role changes. At the end of this sprint, users could access the system securely and researchers could create draft paper records with files stored locally."},
@{T="Sprint 2 Turned a Draft PDF into Structured, Indexed Data"; S="Implementation"; B=@("GROBID extracts title, authors, abstract, keywords","Researcher edits metadata before submission","AI keyword extraction improves metadata","Submission triggers asynchronous embedding","pgvector stores embeddings for later retrieval"); V="Data pipeline from PDF to editable metadata to vector storage, with metadata form screenshot."; Tr="Once papers are indexed, Sprint 3 can support assignment and review assistance."; D=65; Img=@("report latex code\images\sprint2\extract.jpeg","report latex code\images\sprint2\dashboard.jpeg"); N="Sprint 2 transformed the uploaded PDF into structured data. The backend sends the stored PDF to GROBID, receives TEI XML, and parses it into fields such as title, abstract, authors, and keywords. These fields are not blindly accepted: the researcher reviews and corrects them in an Angular form. The AI service can also extract technical keywords using Mistral through Ollama. When the researcher submits the paper, Spring Boot changes the status to submitted and triggers asynchronous embedding through the FastAPI service. The resulting vector is stored in PostgreSQL using pgvector."},
@{T="Sprint 3 Completed Assignment, Review, and Decision Support"; S="Implementation"; B=@("Admin receives ranked reviewer suggestions","Assignments are validated by the admin","CHECKER accepts, reviews, scores, and comments","Summary, similarity report, and chatbot assist review","Admin issues the final decision after reviews"); V="Review loop: suggestions -> assignment -> reviewer toolkit -> review submission -> final decision."; Tr="These three sprints produce a coherent scenario that I will use for the demonstration."; D=70; Img=@("report latex code\images\sprint3\assign 1.jpeg","report latex code\images\sprint3\Form.jpeg","report latex code\images\sprint3\chatbot.jpeg"); N="Sprint 3 completed the core review lifecycle. The administrator can request reviewer suggestions and then validate the assignment manually. In the implemented workflow, reviewer suggestions combine AI search with a fallback based on keyword and expertise matching plus reviewer workload. The assigned CHECKER receives an invitation, accepts it, and then accesses the review workspace. The reviewer can generate an AI summary, run a similarity or plagiarism check, ask questions through the chatbot, and submit scores, comments, and a decision. After exactly three completed reviews, the administrator can issue the final decision."},
@{T="The Demonstration Follows One Complete Paper Lifecycle"; S="Demonstration"; B=@("Researcher uploads and corrects metadata","Paper is submitted and indexed locally","Admin reviews suggestions and assigns CHECKERs","Reviewer uses summary, similarity, chatbot","Review and final decision close the loop"); V="Numbered demo storyboard with five screens and expected role changes."; Tr="After the demo scenario, I will present realistic future improvements."; D=45; N="For the demonstration, I will follow a single paper from upload to decision. I will start as a researcher, upload a PDF, extract and correct metadata, then submit it. Next, I will switch to the administrator view to show reviewer suggestions and assignment. Then I will use the reviewer workspace to accept the invitation, generate the AI summary, check similarity, ask the chatbot a question, and submit the review. Finally, I will return to the administrator view to show how the review results support the final decision."},
@{T="Perspectives Focus on Production-Grade Review Quality"; S="Closing"; B=@("Improve reviewer matching with direct vector comparison","Index full paper chunks for stronger RAG answers","Add reviewer conflict-of-interest checks","Dockerize deployment and monitoring","Extend analytics for admin decision support"); V="Future roadmap split into AI quality, governance, deployment, analytics."; Tr="I will now conclude by summarizing the value delivered by the project."; D=50; N="The current platform is functional, but several improvements can make it more production-ready. First, reviewer matching can be strengthened by comparing reviewer expertise embeddings and paper embeddings directly with pgvector. Second, the chatbot can be improved by indexing full paper chunks instead of relying mainly on metadata context. Third, the assignment process can include conflict-of-interest checks, for example affiliation or author-reviewer relations. Finally, deployment can be improved with full containerization, monitoring, and richer analytics for administrators."},
@{T="Thank You. I Am Ready for Your Questions."; S="Closing"; B=@("Structured lifecycle from upload to final decision","Local AI preserves confidentiality","Scrum increments align with architecture","Human validation remains central"); V="Clean closing slide with the full workflow reduced to one thin line and a Q&A marker."; Tr="I now welcome your questions and comments."; D=35; N="To conclude, this project delivers a structured platform for scientific paper submission and review. It replaces fragmented email-based management with a traceable workflow from PDF upload to final decision. The architecture combines Angular, Spring Boot, FastAPI, PostgreSQL with pgvector, local PDF storage, GROBID, and Ollama-based local AI. The three sprints are coherent: first the secure foundation, then the AI-assisted submission pipeline, and finally the review workflow. Thank you for your attention. I am ready to answer your questions."}
)

$qa = @(
@("Why did you use local AI instead of cloud APIs?","Because submitted papers may contain confidential research. Ollama allows embeddings and text generation to run locally, reducing external data exposure and keeping the review workflow under institutional control."),
@("What is the role of Spring Boot in the architecture?","Spring Boot is the core workflow service. It handles authentication, authorization, users, paper lifecycle, file storage access, assignments, reviews, notifications, and calls to GROBID and the FastAPI AI service."),
@("Why use FastAPI as a separate AI service?","The AI tasks are Python-oriented and may evolve independently. Separating them keeps the Java backend focused on business rules and lets the AI layer change models or prompts without changing the core application."),
@("What does pgvector bring to PostgreSQL?","pgvector adds a vector column type and similarity-search capability to PostgreSQL, so semantic embeddings can be stored near relational data without adding a separate vector database."),
@("How are reviewers suggested?","The target design uses semantic similarity between paper content and reviewer expertise. In the implemented backend, the service first tries AI search and falls back to keyword-expertise matching and workload ordering, then the admin validates the final assignment."),
@("Does AI make the final decision?","No. AI helps with extraction, indexing, summary, similarity checking, and review preparation. Reviewer evaluations and the administrator's final decision remain human-controlled."),
@("How do you secure the application?","The backend uses Spring Security, JWT tokens, BCrypt password hashing, account status control, and role-based endpoint authorization for RESEARCHER, CHECKER, and ADMIN."),
@("What happens if GROBID or Ollama is unavailable?","The backend returns clear errors for extraction or AI tasks and keeps the business workflow protected. For indexing, submission can remain recorded while embedding can be retried or regenerated later."),
@("Why is metadata editable after GROBID extraction?","GROBID can make mistakes depending on PDF quality. Human correction ensures that downstream search, categorization, and matching use better-quality metadata."),
@("What are the main limitations?","The main limitations are that full paper chunk indexing should be strengthened for RAG, reviewer matching should move fully to vector comparison, and production deployment needs stronger monitoring and conflict-of-interest rules.")
)

$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = 1
$pres = $pp.Presentations.Add()
$pres.PageSetup.SlideWidth = 960
$pres.PageSetup.SlideHeight = 540

$blank = 12
$msoFalse = 0
$msoTrue = -1
$bg = 16382453
$ink = 1974294
$soft = 7230310
$lineCol = 13159872
$accent = 6585620
$accent2 = 9068081
$accent3 = 2785474
$dark = 2048784
$white = 16777215

function RGBInt($hex) {
  $h = $hex.TrimStart("#")
  return [Convert]::ToInt32($h.Substring(4,2)+$h.Substring(2,2)+$h.Substring(0,2),16)
}

function Rect($slide,$x,$y,$w,$h,$fill,$line=$null) {
  $s = $slide.Shapes.AddShape(1,$x,$y,$w,$h)
  $s.Fill.ForeColor.RGB = $fill
  $s.Line.ForeColor.RGB = $(if ($line -eq $null) { $fill } else { $line })
  $s.Line.Weight = 0.75
  return $s
}

function TextBox($slide,$text,$x,$y,$w,$h,$size=14,$color=$ink,$bold=$false,$font="Aptos",$align=1) {
  $t = $slide.Shapes.AddTextbox(1,$x,$y,$w,$h)
  $r = $t.TextFrame.TextRange
  $r.Text = [string]$text
  $r.Font.Name = $font
  try { $fontSize = [single]$size } catch { $fontSize = 12 }
  try { $fontColor = [int]$color } catch { $fontColor = $ink }
  $r.Font.Size = $fontSize
  $r.Font.Color.RGB = $fontColor
  $r.Font.Bold = $(if ($bold) { -1 } else { 0 })
  $r.ParagraphFormat.Alignment = $align
  $t.TextFrame.MarginLeft = 0
  $t.TextFrame.MarginRight = 0
  $t.TextFrame.MarginTop = 0
  $t.TextFrame.MarginBottom = 0
  return $t
}

function Footer($slide,$i,$section) {
  Rect $slide 0 0 960 4 (RGBInt "#E1E7E2") | Out-Null
  Rect $slide 0 0 ([math]::Round(960*$i/13)) 4 $accent | Out-Null
  Rect $slide 36 25 6 6 $accent | Out-Null
  TextBox $slide $section.ToUpper() 50 22 240 14 7.5 $soft $true | Out-Null
  Rect $slide 36 506 810 1 $lineCol | Out-Null
  TextBox $slide "$i/13" 858 495 60 16 9 $soft $true "Aptos" 3 | Out-Null
}

function Bullets($slide,$items,$x,$y,$w) {
  for ($i=0; $i -lt $items.Count; $i++) {
    $yy = $y + $i*37
    Rect $slide $x ($yy+7) 5 5 $(if($i%2){$accent2}else{$accent}) | Out-Null
    TextBox $slide $items[$i] ($x+18) $yy $w 24 12.5 $ink $false | Out-Null
  }
}

function AddNotes($slide,$item,$qaText="") {
  $note = "Exact speech:`r`n$($item.N)`r`n`r`nSlide goal: $($item.T)`r`nVisual suggestion: $($item.V)`r`nTransition: $($item.Tr)`r`nEstimated duration: $($item.D) seconds"
  if ($qaText) { $note += "`r`n`r`nLikely jury questions:`r`n$qaText" }
  try { $slide.NotesPage.Shapes.Placeholders(2).TextFrame.TextRange.Text = $note } catch {}
}

function AddWorkflow($slide,$labels,$x,$y,$w) {
  $step = $w / $labels.Count
  for ($i=0; $i -lt $labels.Count; $i++) {
    $xx = $x + $i*$step
    Rect $slide $xx $y ($step-12) 50 $(if($i%2){RGBInt "#E7EEF6"}else{RGBInt "#EAF1EC"}) $lineCol | Out-Null
    TextBox $slide ("{0:D2}" -f ($i+1)) ($xx+8) ($y+8) 28 12 8.5 $(if($i%2){$accent2}else{$accent}) $true | Out-Null
    TextBox $slide $labels[$i] ($xx+8) ($y+24) ($step-28) 18 7.7 $ink $false | Out-Null
    if($i -lt $labels.Count-1){ Rect $slide ($xx+$step-12) ($y+24) 12 2 $accent3 | Out-Null }
  }
}

$script = "# Speaker Script and Jury Q&A`r`n`r`n"

for ($idx=0; $idx -lt $slides.Count; $idx++) {
  $i = $idx + 1
  $item = $slides[$idx]
  $slide = $pres.Slides.Add($i,$blank)
  Footer $slide $i $item.S
  TextBox $slide $item.T 36 50 610 70 23 $ink $true "Georgia" | Out-Null
  Bullets $slide $item.B 50 145 390

  if ($i -eq 1) {
    Rect $slide 0 4 960 536 $dark | Out-Null
    Rect $slide 0 0 74 4 $accent | Out-Null
    TextBox $slide "FINAL YEAR PROJECT DEFENSE" 44 38 280 14 8 (RGBInt "#AFC2BA") $true | Out-Null
    TextBox $slide $item.T 44 108 560 115 34 $white $true "Georgia" | Out-Null
    TextBox $slide "A secure web platform that structures submission, reviewer assignment, AI-assisted evaluation, and final decision." 46 248 500 42 14 (RGBInt "#DDE8E3") $false "Georgia" | Out-Null
    AddWorkflow $slide @("PDF upload","GROBID","Human correction","Embedding","Review tools","Decision") 68 354 585
    TextBox $slide "Angular + Spring Boot + FastAPI + PostgreSQL/pgvector + Ollama" 46 454 600 18 9.8 (RGBInt "#AFC2BA") | Out-Null
    Rect $slide 660 90 230 300 (RGBInt "#18352F") (RGBInt "#42645D") | Out-Null
    TextBox $slide "Value Delivered" 684 118 170 20 15 $white $true "Georgia" | Out-Null
    Bullets $slide @("Traceable paper lifecycle","Local AI for confidentiality","Reviewer support before evaluation","Admin-controlled assignment") 690 165 150
    TextBox $slide "1/13" 858 495 60 16 9 (RGBInt "#AFC2BA") $true "Aptos" 3 | Out-Null
  } elseif ($i -eq 2) {
    $sections=@("Context","Problem","Solution","Architecture","Sprints","Demo & Closing")
    for($j=0;$j -lt $sections.Count;$j++){
      $x=62+$j*138
      Rect $slide $x 195 95 95 $(if($j -eq 0){$accent}else{$white}) $lineCol | Out-Null
      TextBox $slide ("{0:D2}" -f ($j+1)) ($x+14) 211 40 24 18 $(if($j -eq 0){$white}else{$accent}) $true "Georgia" | Out-Null
      TextBox $slide $sections[$j] ($x+14) 252 68 28 10.5 $(if($j -eq 0){$white}else{$ink}) $true | Out-Null
      if($j -lt 5){ Rect $slide ($x+95) 242 43 2 $accent3 | Out-Null }
    }
    TextBox $slide "The plan moves from the business need to the technical choices, then to the implemented increments." 70 350 620 38 14 "1974294" $false "Georgia" | Out-Null
  } elseif ($i -eq 3 -or $i -eq 4) {
    $labels = $(if($i -eq 3){@("Email","Spreadsheet","Informal choice","Unclear audit")}else{@("Metadata quality","Reviewer relevance","Originality signal","Review preparation")})
    for($j=0;$j -lt $labels.Count;$j++){
      $y=142+$j*68
      Rect $slide 500 $y 300 45 $white $lineCol | Out-Null
      TextBox $slide $labels[$j] 522 ($y+10) 130 16 12 $accent $true | Out-Null
      TextBox $slide $(if($i -eq 3){"Manual tracking creates delay and weak traceability."}else{"This bottleneck must be supported in the platform."}) 665 ($y+10) 110 20 8.5 $soft | Out-Null
    }
  } elseif ($i -eq 5) {
    AddWorkflow $slide @("Upload PDF","GROBID","Correction","Submit","Embedding","Assignment","Review tools","Decision") 465 145 425
    Rect $slide 495 315 320 62 $dark | Out-Null
    TextBox $slide "Core principle" 520 328 120 14 8.5 (RGBInt "#AFC2BA") $true | Out-Null
    TextBox $slide "AI supports evidence and preparation; it does not replace the final human decision." 520 348 260 22 12 $white $false "Georgia" | Out-Null
  } elseif ($i -eq 6) {
    $actors=@(@("Researcher","Upload, correct, submit, track"),@("CHECKER","Expertise, assigned papers, evaluation"),@("Admin","Users, assignment, statistics, decision"))
    for($j=0;$j -lt $actors.Count;$j++){
      $y=158+$j*76
      Rect $slide 505 $y 315 46 $white $lineCol | Out-Null
      TextBox $slide $actors[$j][0] 525 ($y+11) 90 16 12 $(if($j -eq 1){$accent2}else{$accent}) $true | Out-Null
      TextBox $slide $actors[$j][1] 630 ($y+11) 160 20 9.5 $ink | Out-Null
    }
    Rect $slide 505 410 315 40 (RGBInt "#EEF1F0") $lineCol | Out-Null
    TextBox $slide "Non-functional baseline: JWT, BCrypt, RBAC, clear errors, layered backend." 525 424 270 12 9 $ink | Out-Null
  } elseif ($i -eq 7) {
    $layers=@(@("Angular","Role-specific UI",$accent),@("Spring Boot","Security, lifecycle, authorizations",$accent2),@("FastAPI + Ollama","Embeddings, summary, keywords, chatbot",$accent3),@("PostgreSQL + pgvector","Relational data and vectors",$dark))
    for($j=0;$j -lt $layers.Count;$j++){
      $y=148+$j*64
      Rect $slide 500 $y 350 43 $(if($j -eq 3){$dark}else{$white}) $lineCol | Out-Null
      TextBox $slide $layers[$j][0] 520 ($y+9) 120 14 11.5 $(if($j -eq 3){$white}else{$layers[$j][2]}) $true | Out-Null
      TextBox $slide $layers[$j][1] 650 ($y+9) 170 18 8.8 $(if($j -eq 3){RGBInt "#DDE8E3"}else{$ink}) | Out-Null
      if($j -lt 3){ Rect $slide 665 ($y+45) 2 18 $accent | Out-Null }
    }
    Rect $slide 865 245 62 60 (RGBInt "#F1E4D2") $lineCol | Out-Null
    TextBox $slide "Local PDF`r`nstorage" 872 265 48 24 8.5 $ink $false "Aptos" 2 | Out-Null
  } elseif ($item.ContainsKey("Img")) {
    for($j=0;$j -lt $item.Img.Count;$j++){
      $img = Join-Path $root $item.Img[$j]
      if(Test-Path $img){
        $x=470+$j*145
        Rect $slide $x 160 126 190 $white $lineCol | Out-Null
        $slide.Shapes.AddPicture($img,$msoFalse,$msoTrue,($x+6),166,114,165) | Out-Null
      }
    }
    if($i -eq 9){ AddWorkflow $slide @("PDF","Metadata","Submit","Vector") 495 393 310 }
    if($i -eq 10){ AddWorkflow $slide @("Suggest","Assign","Assist","Review","Decide") 475 393 360 }
  } elseif ($i -eq 11) {
    $roles=@("Researcher","System","Admin","CHECKER","Admin")
    $notes=@("Upload + correction","Index locally","Assign reviewers","Use review toolkit","Final decision")
    for($j=0;$j -lt 5;$j++){
      $y=145+$j*54
      Rect $slide 500 $y 300 34 $white $lineCol | Out-Null
      TextBox $slide ($j+1) 518 ($y+9) 18 12 10 $accent $true | Out-Null
      TextBox $slide $roles[$j] 552 ($y+7) 80 14 10.5 $ink $true | Out-Null
      TextBox $slide $notes[$j] 645 ($y+8) 120 12 8.7 $soft | Out-Null
    }
  } elseif ($i -eq 12) {
    $areas=@(@("AI quality","Full vector matching and chunked RAG"),@("Governance","Conflict-of-interest controls"),@("Deployment","Containerization and monitoring"),@("Analytics","Decision-support dashboards"))
    for($j=0;$j -lt 4;$j++){
      $x=500+($j%2)*170; $y=165+[math]::Floor($j/2)*100
      Rect $slide $x $y 140 65 $(if($j -eq 0){$dark}else{$white}) $lineCol | Out-Null
      TextBox $slide $areas[$j][0] ($x+12) ($y+12) 110 16 12 $(if($j -eq 0){$white}else{$ink}) $true "Georgia" | Out-Null
      TextBox $slide $areas[$j][1] ($x+12) ($y+36) 110 18 8.2 $(if($j -eq 0){RGBInt "#DDE8E3"}else{$soft}) | Out-Null
    }
  } elseif ($i -eq 13) {
    Rect $slide 0 0 960 540 $dark | Out-Null
    Rect $slide 0 0 960 4 $accent | Out-Null
    TextBox $slide "CONCLUSION" 44 40 240 14 8 (RGBInt "#AFC2BA") $true | Out-Null
    TextBox $slide $item.T 44 105 570 75 32 $white $true "Georgia" | Out-Null
    Bullets $slide $item.B 65 230 420
    AddWorkflow $slide @("Upload","Extract","Correct","Index","Assign","Review","Decide") 80 410 580
    Rect $slide 710 105 1 300 (RGBInt "#42645D") | Out-Null
    TextBox $slide "Thank you for your attention." 740 170 145 55 21 $white $true "Georgia" 2 | Out-Null
    TextBox $slide "Questions and discussion" 740 245 145 20 11 (RGBInt "#AFC2BA") $true "Aptos" 2 | Out-Null
    TextBox $slide "13/13" 858 495 60 16 9 (RGBInt "#AFC2BA") $true "Aptos" 3 | Out-Null
  }

  $qaText = ""
  if($i -eq 13){ $qaText = (($qa | ForEach-Object { "Q: $($_[0])`r`nA: $($_[1])" }) -join "`r`n`r`n") }
  AddNotes $slide $item $qaText

  $script += "## Slide $i/13 - $($item.T)`r`n"
  $script += "Objective: $($item.T)`r`n"
  $script += "Visual: $($item.V)`r`n"
  $script += "Transition: $($item.Tr)`r`n"
  $script += "Duration: $($item.D) seconds`r`n`r`n"
  $script += "Speech:`r`n$($item.N)`r`n`r`n"
}

$script += "## Likely Jury Questions`r`n`r`n"
for($i=0;$i -lt $qa.Count;$i++){
  $script += "$($i+1). $($qa[$i][0])`r`nAnswer: $($qa[$i][1])`r`n`r`n"
}

Set-Content -Path $scriptPath -Value $script -Encoding UTF8
$pres.SaveAs($pptxPath)
$pres.Export($previewDir, "PNG", 1280, 720)
$pres.Close()
$pp.Quit()

Write-Output $pptxPath
Write-Output $scriptPath
Write-Output $previewDir
