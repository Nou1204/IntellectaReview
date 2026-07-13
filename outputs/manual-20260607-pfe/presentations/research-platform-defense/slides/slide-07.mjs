import { slides, addHeader, addBullets, architecture, addMetaNote } from "./common.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[6];
  addHeader(slide, ctx, item, 7);
  addBullets(slide, ctx, item.bullets, 60, 184, 500, 50);
  architecture(slide, ctx);
  addMetaNote(slide, ctx, item);
  return slide;
}
