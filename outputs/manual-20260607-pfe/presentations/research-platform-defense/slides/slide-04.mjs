import { slides, style, addHeader, addBullets, addText, rect, line, addMetaNote } from "./common.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[3];
  addHeader(slide, ctx, item, 4);
  addBullets(slide, ctx, item.bullets, 66, 196, 470, 58);
  ["Metadata quality", "Reviewer relevance", "Originality signal", "Review preparation"].forEach((p, i) => {
    const x = 625 + (i % 2) * 255;
    const y = 210 + Math.floor(i / 2) * 150;
    rect(slide, ctx, x, y, 210, 104, i === 0 ? style.pale : style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, p, x + 20, y + 18, 160, 24, { size: 17, face: style.serif, bold: true, color: style.ink });
    addText(slide, ctx, "Manual step becomes a bottleneck without structured support.", x + 20, y + 56, 160, 34, { size: 10.5, color: style.soft });
  });
  line(slide, ctx, 835, 262, 45, 2, style.accent3, 2);
  line(slide, ctx, 835, 412, 45, 2, style.accent3, 2);
  addText(slide, ctx, "Problem statement: create a controlled workflow where automation reduces repetitive work while humans keep validation authority.", 625, 548, 468, 48, { size: 17, face: style.serif, color: style.ink });
  addMetaNote(slide, ctx, item);
  return slide;
}
