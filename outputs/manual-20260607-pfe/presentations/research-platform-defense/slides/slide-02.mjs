import { slides, style, addHeader, addText, rect, line, addMetaNote } from "./common.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[1];
  addHeader(slide, ctx, item, 2);
  const sections = ["Context", "Problem", "Solution", "Architecture", "Sprints", "Demo & Closing"];
  sections.forEach((s, i) => {
    const x = 82 + i * 185;
    rect(slide, ctx, x, 260, 128, 128, i === 0 ? style.accent : style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, String(i + 1).padStart(2, "0"), x + 18, 282, 54, 32, { size: 24, face: style.serif, bold: true, color: i === 0 ? style.white : style.accent });
    addText(slide, ctx, s, x + 18, 328, 88, 34, { size: 13.5, bold: true, color: i === 0 ? style.white : style.ink });
    if (i < sections.length - 1) line(slide, ctx, x + 128, 324, 57, 2, style.accent3, 2);
  });
  addText(slide, ctx, "The plan intentionally stays simple: it moves from the business need to the technical choices, then to the implemented increments.", 92, 455, 760, 52, { size: 18, face: style.serif, color: style.ink });
  addText(slide, ctx, item.transition, 92, 548, 760, 30, { size: 14, color: style.soft });
  addMetaNote(slide, ctx, item);
  return slide;
}
