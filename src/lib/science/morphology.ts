/**
 * هندسه و شاخص‌های ریخت‌شناسی — محاسبه واقعی از داده هندسی
 * هندسه: چندضلعی در مختصات متر محلی (نمایشی؛ جایگزین‌شدنی با GeoJSON واقعی)
 */

export type Point = [number, number];
export type Polygon = Point[];

/** مساحت چندضلعی (فرمول کفشی — shoelace) */
export function polygonArea(poly: Polygon): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

/** محیط چندضلعی */
export function polygonPerimeter(poly: Polygon): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += Math.hypot(x2 - x1, y2 - y1);
  }
  return s;
}

/** مرکز هندسی (centroid) چندضلعی */
export function polygonCentroid(poly: Polygon): Point {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a /= 2;
  if (Math.abs(a) < 1e-12) {
    // خطی/نقطه‌ای: میانگین ساده
    return [mean(poly.map((p) => p[0])), mean(poly.map((p) => p[1]))];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** جعبه محیطی */
export function bbox(poly: Polygon): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** فشردگی (compactness) = 4πA / P² */
export function compactness(area: number, perimeter: number): number {
  if (perimeter <= 0) return NaN;
  return (4 * Math.PI * area) / (perimeter * perimeter);
}

/** فاصله کمینه بین دو چندضلعی (تقریب: کمینه فاصله رئوس — برای دیوار مشترک/مجاورت) */
export function minDistanceBetween(p1: Polygon, p2: Polygon): number {
  let min = Infinity;
  for (const a of p1) {
    for (const b of p2) {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < min) min = d;
    }
  }
  return min;
}

/** طول دیوار مشترک تقریبی بین دو چندضلعی مجاور (هم‌پوشانی لبه‌ها با تلورانس) */
export function sharedWallLength(p1: Polygon, p2: Polygon, tol = 0.75): number {
  let total = 0;
  const edges = (p: Polygon): [Point, Point][] =>
    p.map((pt, i) => [pt, p[(i + 1) % p.length]] as [Point, Point]);
  for (const [a1, a2] of edges(p1)) {
    for (const [b1, b2] of edges(p2)) {
      const seg = overlappingSegment(a1, a2, b1, b2, tol);
      if (seg) total += seg;
    }
  }
  return total;
}

function overlappingSegment(a1: Point, a2: Point, b1: Point, b2: Point, tol: number): number | null {
  // افقی
  const aHoriz = Math.abs(a1[1] - a2[1]) < tol;
  const bHoriz = Math.abs(b1[1] - b2[1]) < tol;
  const aVert = Math.abs(a1[0] - a2[0]) < tol;
  const bVert = Math.abs(b1[0] - b2[0]) < tol;
  if (aHoriz && bHoriz && Math.abs(a1[1] - b1[1]) < tol) {
    const lo = Math.max(Math.min(a1[0], a2[0]), Math.min(b1[0], b2[0]));
    const hi = Math.min(Math.max(a1[0], a2[0]), Math.max(b1[0], b2[0]));
    return hi > lo ? hi - lo : null;
  }
  if (aVert && bVert && Math.abs(a1[0] - b1[0]) < tol) {
    const lo = Math.max(Math.min(a1[1], a2[1]), Math.min(b1[1], b2[1]));
    const hi = Math.min(Math.max(a1[1], a2[1]), Math.max(b1[1], b2[1]));
    return hi > lo ? hi - lo : null;
  }
  return null;
}

/** جهت‌گیری اصلی بنا (زاویه لبه بلندتر جعبه محیطی نسبت به جنوب−شمال، درجه) */
export function orientationDeg(poly: Polygon): number {
  const bb = bbox(poly);
  const longEdge = bb.w >= bb.h ? bb.w : bb.h;
  const shortEdge = bb.w >= bb.h ? bb.h : bb.w;
  void longEdge;
  void shortEdge;
  // زاویه نسبت به محور شرق‌به‌غرب؛ 0 = راستای شرقی−غربی، 90 = شمالی−جنوبی
  const angle = Math.abs((Math.atan2(bb.h, bb.w) * 180) / Math.PI);
  return angle <= 90 ? angle : 180 - angle;
}

// ─────────────── خواص بنا برای محاسبه شاخص‌ها ───────────────

export interface BuildingProps {
  heightM: number;
  floors: number;
  footprintM2: number;
  courtyardM2: number;
  wwrPct: number; // نسبت بازشو به دیوار
  era: string;
  material: string;
  condition: string;
  sharedWallsM: number;
  adjacentCount: number;
  envelopeQuality: number; // 1..5 (نمایشی)
}

export interface BuildingIndicators {
  footprintM2: number;
  volumeM3: number;
  svRatio: number; // نسبت سطح پوسته به حجم (تقریب: محیط×ارتفاع + سقف / حجم)
  compactness: number;
  courtyardShare: number; // نسبت حیاط به کل قطعه
  orientationDeg: number;
  wwrPct: number;
  heightM: number;
}

export function buildingIndicators(poly: Polygon, courtyard: Polygon | null, props: BuildingProps): BuildingIndicators {
  const area = polygonArea(poly);
  const per = polygonPerimeter(poly);
  const vol = area * props.heightM;
  // سطح پوسته ≈ محیط × ارتفاع + مساحت سقف − سهم دیوارهای مشترک
  const envelope = per * props.heightM + area - props.sharedWallsM * props.heightM;
  const sv = vol > 0 ? envelope / vol : NaN;
  const courtyardArea = courtyard ? polygonArea(courtyard) : 0;
  const total = area + courtyardArea;
  return {
    footprintM2: area,
    volumeM3: vol,
    svRatio: sv,
    compactness: compactness(area, per),
    courtyardShare: total > 0 ? courtyardArea / total : 0,
    orientationDeg: orientationDeg(poly),
    wwrPct: props.wwrPct,
    heightM: props.heightM,
  };
}

/** ناهمگونی خط آسمان در یک گروه: ضریب تغییرات ارتفاع */
export function skylineHeterogeneity(heights: number[]): { cv: number; mean: number; min: number; max: number } {
  const m = mean(heights);
  const s = m > 0 ? Math.sqrt(heights.reduce((a, b) => a + (b - m) ** 2, 0) / (heights.length - 1 || 1)) : 0;
  return { cv: m > 0 ? s / m : NaN, mean: m, min: Math.min(...heights), max: Math.max(...heights) };
}

/** نسبت ارتفاع به عرض گذر (H/W) در مقیاس بلوک */
export function hwRatio(avgHeightM: number, avgPassageWidthM: number): number {
  if (avgPassageWidthM <= 0) return NaN;
  return avgHeightM / avgPassageWidthM;
}

/** سطح اشغال (coverage) در مقیاس بلوک */
export function coverageRatio(footprintSumM2: number, blockAreaM2: number): number {
  if (blockAreaM2 <= 0) return NaN;
  return footprintSumM2 / blockAreaM2;
}
