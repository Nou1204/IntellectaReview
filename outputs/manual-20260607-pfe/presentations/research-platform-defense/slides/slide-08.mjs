import { slides, addHeader, addBullets, imageStrip, addMetaNote } from "./common.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[7];
  addHeader(slide, ctx, item, 8);
  addBullets(slide, ctx, item.bullets, 60, 178, 500, 49);
  imageStrip(slide, ctx, item.images);
  addMetaNote(slide, ctx, item);
  return slide;
}
