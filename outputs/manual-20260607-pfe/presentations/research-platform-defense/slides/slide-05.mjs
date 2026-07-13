import { slides, style, addHeader, addBullets, workflow, addText, rect, addMetaNote } from "./common.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[4];
  addHeader(slide, ctx, item, 5);
  addBullets(slide, ctx, item.bullets, 60, 178, 520, 49);
  workflow(slide, ctx, ["Upload PDF", "GROBID extraction", "Human correction", "Submit", "Embedding", "Admin assignment", "Reviewer tools", "Final decision"], 610, 188, 570);
  rect(slide, ctx, 650, 420, 430, 84, style.dark, { lineColor: style.dark, weight: 1 });
  addText(slide, ctx, "Core principle", 680, 438, 160, 18, { size: 11, color: "#AFC2BA", bold: true });
  addText(slide, ctx, "AI supports evidence and preparation; it does not replace the jury-like human decision.", 680, 462, 350, 28, { size: 16, face: style.serif, color: style.white });
  addMetaNote(slide, ctx, item);
  return slide;
}
