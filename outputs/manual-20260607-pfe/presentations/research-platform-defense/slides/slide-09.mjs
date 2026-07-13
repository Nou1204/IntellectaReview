import { slides, style, addHeader, addBullets, addText, rect, line, imageStrip, addMetaNote } from "./common.mjs";

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[8];
  addHeader(slide, ctx, item, 9);
  addBullets(slide, ctx, item.bullets, 60, 170, 500, 48);
  imageStrip(slide, ctx, item.images);
  rect(slide, ctx, 625, 502, 460, 48, style.dark, { lineColor: style.dark, weight: 1 });
  addText(slide, ctx, "PDF -> editable metadata -> submitted paper -> embedding stored with pgvector", 650, 516, 410, 16, { size: 12, color: style.white, align: "center" });
  line(slide, ctx, 690, 492, 320, 2, style.accent3, 2);
  addMetaNote(slide, ctx, item);
  return slide;
}
