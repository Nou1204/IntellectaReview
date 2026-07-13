import { slides, style, addHeader, addBullets, addText, rect, line, addMetaNote } from "./common.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[2];
  addHeader(slide, ctx, item, 3);
  addBullets(slide, ctx, item.bullets, 66, 198, 470, 58);
  const flow = [["Email", "PDFs arrive in inboxes"], ["Spreadsheet", "Status tracked manually"], ["Informal choice", "Reviewer selected by memory"], ["Unclear audit", "Decision trail is fragmented"]];
  flow.forEach((f, i) => {
    const y = 178 + i * 92;
    rect(slide, ctx, 630, y, 350, 58, style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, f[0], 655, y + 10, 120, 18, { size: 15, bold: true, color: i % 2 ? style.accent2 : style.accent });
    addText(slide, ctx, f[1], 795, y + 11, 160, 26, { size: 11.5, color: style.ink });
    if (i < flow.length - 1) line(slide, ctx, 805, y + 60, 2, 28, style.accent3, 2);
  });
  addText(slide, ctx, "Business value first: the platform must make the process traceable before it becomes technically impressive.", 630, 570, 410, 42, { size: 17, face: style.serif, color: style.ink });
  addMetaNote(slide, ctx, item);
  return slide;
}
