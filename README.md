# IntellectaReview — Research Paper Management & Review Platform

IntellectaReview is a full-stack web application designed to streamline the academic submission, management, and peer-review process for research papers. Developed as a graduation project (PFE) at ISITCom, the platform features a highly decoupled, modular architecture designed for high scalability and intelligent paper analysis.

## Key Features
* **Role-Based Access Control:** Secure, customized workflows for Authors, Reviewers, and Editors.
* **Paper Submission & Versioning:** Smooth document management lifecycle for academic articles.
* **Intelligent AI Assistance:** Integrated background service for smart analysis and metadata extraction.
* **Interactive Review Dashboard:** Real-time grading, feedback tracking, and editorial oversight.

## System Architecture & Tech Stack

The platform is engineered using a three-tier architectural approach:

* **Frontend:** Built with **Angular**, structured cleanly using TypeScript, HTML5, and SCSS for a highly responsive, intuitive user interface.
* **Backend Core:** A robust **Spring Boot (Java)** application handling business logic, enterprise security, and database orchestrations.
* **AI Engine:** A dedicated microservice built with **Python**, handling automated paper analysis tasks.

## 📂 Repository Structure
```text
research-platform/
├── backend/            # Spring Boot application
├── frontend/           # Angular application
├── ai-service/         # Python AI engine
├── scripts/            # Setup and automated tooling
└── db/                 # Database configurations and schemas
