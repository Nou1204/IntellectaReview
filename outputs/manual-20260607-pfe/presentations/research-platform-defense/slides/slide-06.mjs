import { slides, style, addHeader, addBullets, addText, rect, line, addMetaNote } from "./common.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[5];
  addHeader(slide, ctx, item, 6);
  addBullets(slide, ctx, item.bullets, 60, 184, 500, 50);
  const actors = [["Researcher", "Upload, correct, submit, track"], ["CHECKER", "Expertise, assigned papers, evaluation"], ["Admin", "Users, assignment, statistics, final decision"]];
  actors.forEach((a, i) => {
    const y = 198 + i * 98;
    rect(slide, ctx, 638, y, 418, 62, style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, a[0], 662, y + 14, 112, 22, { size: 16, color: i === 1 ? style.accent2 : style.accent, bold: true });
    line(slide, ctx, 790, y + 14, 1, 34, style.line, 1);
    addText(slide, ctx, a[1], 812, y + 14, 210, 28, { size: 12, color: style.ink });
  });
  rect(slide, ctx, 638, 520, 418, 50, "#EEF1F0", { lineColor: style.line, weight: 1 });
  addText(slide, ctx, "Non-functional baseline: JWT, BCrypt, RBAC, clear error handling, layered backend.", 662, 535, 360, 20, { size: 12, color: style.ink });
  addMetaNote(slide, ctx, item);
  return slide;
}
