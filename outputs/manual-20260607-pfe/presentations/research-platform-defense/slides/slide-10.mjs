import { slides, style, addHeader, addBullets, addText, rect, line, imageStrip, addMetaNote } from "./common.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[9];
  addHeader(slide, ctx, item, 10);
  addBullets(slide, ctx, item.bullets, 60, 166, 500, 48);
  imageStrip(slide, ctx, item.images);
  ["Suggest", "Assign", "Assist", "Review", "Decide"].forEach((s, i) => {
    const x = 628 + i * 92;
    rect(slide, ctx, x, 520, 70, 38, i % 2 ? "#E7EEF6" : style.pale, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, s, x + 8, 532, 54, 12, { size: 9.5, color: style.ink, align: "center", bold: true });
    if (i < 4) line(slide, ctx, x + 70, 539, 22, 2, style.accent3, 2);
  });
  addMetaNote(slide, ctx, item);
  return slide;
}
