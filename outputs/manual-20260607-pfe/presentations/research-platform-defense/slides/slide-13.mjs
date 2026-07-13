import { slides, style, addText, rect, line, workflow } from "./common.mjs";

export async function slide13(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[12];
  rect(slide, ctx, 0, 0, 1280, 720, style.dark);
  rect(slide, ctx, 0, 0, 1280, 5, style.accent);
  addText(slide, ctx, "CONCLUSION", 58, 54, 300, 18, { size: 10, color: "#AFC2BA", bold: true });
  addText(slide, ctx, item.title, 58, 142, 760, 96, { size: 44, face: style.serif, bold: true, color: style.white });
  item.bullets.forEach((b, i) => {
    rect(slide, ctx, 82, 310 + i * 52, 7, 7, i % 2 ? style.accent3 : style.accent);
    addText(slide, ctx, b, 106, 299 + i * 52, 560, 28, { size: 17, color: "#EAF1EC" });
  });
  workflow(slide, ctx, ["Upload", "Extract", "Correct", "Index", "Assign", "Review", "Decide"], 110, 548, 780);
  line(slide, ctx, 930, 140, 1, 380, "#42645D", 1);
  addText(slide, ctx, "Thank you for your attention.", 970, 220, 190, 56, { size: 25, face: style.serif, bold: true, color: style.white, align: "center" });
  addText(slide, ctx, "Questions and discussion", 970, 320, 190, 26, { size: 15, color: "#AFC2BA", align: "center", bold: true });
  addText(slide, ctx, "13/13", 1158, 662, 70, 24, { size: 12, color: "#AFC2BA", align: "right", bold: true });
  return slide;
}
