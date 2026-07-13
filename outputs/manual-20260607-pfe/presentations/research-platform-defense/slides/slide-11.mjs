import { slides, style, addHeader, addBullets, addText, rect, line, addMetaNote } from "./common.mjs";

export async function slide11(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[10];
  addHeader(slide, ctx, item, 11);
  addBullets(slide, ctx, item.bullets, 60, 176, 500, 50);
  const steps = ["Researcher", "System", "Admin", "CHECKER", "Admin"];
  const notes = ["Upload + correction", "Index locally", "Assign reviewers", "Use review toolkit", "Final decision"];
  steps.forEach((s, i) => {
    const y = 180 + i * 72;
    rect(slide, ctx, 640, y, 360, 46, style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, `${i + 1}`, 660, y + 12, 24, 16, { size: 13, color: style.accent, bold: true });
    addText(slide, ctx, s, 705, y + 9, 90, 18, { size: 14, bold: true, color: style.ink });
    addText(slide, ctx, notes[i], 820, y + 10, 150, 16, { size: 11.5, color: style.soft });
    if (i < 4) line(slide, ctx, 820, y + 48, 2, 24, style.accent3, 2);
  });
  addText(slide, ctx, "The demo is organized by role changes so the jury can see the complete lifecycle, not isolated screens.", 640, 565, 400, 42, { size: 16, face: style.serif, color: style.ink });
  addMetaNote(slide, ctx, item);
  return slide;
}
