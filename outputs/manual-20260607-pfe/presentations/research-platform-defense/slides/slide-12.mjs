import { slides, style, addHeader, addBullets, addText, rect, addMetaNote } from "./common.mjs";

export async function slide12(presentation, ctx) {
  const slide = presentation.slides.add();
  const item = slides[11];
  addHeader(slide, ctx, item, 12);
  addBullets(slide, ctx, item.bullets, 60, 176, 520, 50);
  const areas = [["AI quality", "Full vector matching and chunked RAG"], ["Governance", "Conflict-of-interest controls"], ["Deployment", "Containerization and monitoring"], ["Analytics", "Decision-support dashboards"]];
  areas.forEach((a, i) => {
    const x = 630 + (i % 2) * 230;
    const y = 205 + Math.floor(i / 2) * 132;
    rect(slide, ctx, x, y, 190, 82, i === 0 ? style.dark : style.white, { lineColor: style.line, weight: 1 });
    addText(slide, ctx, a[0], x + 18, y + 16, 150, 20, { size: 16, face: style.serif, bold: true, color: i === 0 ? style.white : style.ink });
    addText(slide, ctx, a[1], x + 18, y + 46, 150, 28, { size: 10.5, color: i === 0 ? "#DDE8E3" : style.soft });
  });
  addMetaNote(slide, ctx, item);
  return slide;
}
