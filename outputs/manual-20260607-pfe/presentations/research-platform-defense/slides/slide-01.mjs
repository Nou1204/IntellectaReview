import { slides, style, addText, rect, line, base, workflow } from "./common.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[0];
  base(slide, ctx, 1, item.section);
  rect(slide, ctx, 0, 5, 1280, 715, style.dark);
  rect(slide, ctx, 0, 0, 1280 / 13, 5, style.accent);
  addText(slide, ctx, "FINAL YEAR PROJECT DEFENSE", 58, 50, 350, 18, { size: 10, color: "#AFC2BA", bold: true });
  addText(slide, ctx, item.title, 58, 150, 720, 148, { size: 45, face: style.serif, color: style.white, bold: true });
  addText(slide, ctx, "A secure web platform that structures submission, reviewer assignment, AI-assisted evaluation, and final decision.", 62, 328, 620, 58, { size: 18, color: "#DDE8E3", face: style.serif });
  workflow(slide, ctx, ["PDF upload", "GROBID", "Human correction", "Embedding", "Review tools", "Decision"], 92, 472, 780);
  addText(slide, ctx, "Angular + Spring Boot + FastAPI + PostgreSQL/pgvector + Ollama", 62, 605, 720, 22, { size: 13, color: "#AFC2BA" });
  rect(slide, ctx, 860, 120, 300, 385, "#18352F", { lineColor: "#42645D", weight: 1 });
  addText(slide, ctx, "Value Delivered", 892, 154, 220, 24, { size: 19, color: style.white, face: style.serif, bold: true });
  ["Traceable paper lifecycle", "Local AI for confidentiality", "Reviewer support before evaluation", "Admin-controlled assignment"].forEach((b, i) => {
    rect(slide, ctx, 900, 215 + i * 58, 7, 7, i % 2 ? style.accent3 : style.accent);
    addText(slide, ctx, b, 920, 204 + i * 58, 190, 26, { size: 14, color: "#EAF1EC" });
  });
  addText(slide, ctx, "1/13", 1158, 662, 70, 24, { size: 12, color: "#AFC2BA", align: "right", bold: true });
  return slide;
}
