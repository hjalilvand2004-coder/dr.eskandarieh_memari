/**
 * داده نمایشی — ⚠ فاقد اعتبار برای استناد علمی ⚠
 * بافت مصنوعی کوچک و سازگار برای نمایش مسیر «ورود داده → تحلیل → ارزیابی → نمودار».
 * این داده نباید به‌عنوان اندازه‌گیری واقعی بافت تاریخی شیراز معرفی یا استناد شود.
 */
import { mulberry32, gaussian, pick } from "./rng";
import type { Polygon } from "./morphology";

export interface DemoBlock {
  code: string;
  name: string;
  geometry: Polygon;
  passageWidthM: number;
  vegetationFraction: number; // نمایشی
  permeableFraction: number; // نمایشی
  avgPassageWidthM: number;
}

export interface DemoBuilding {
  code: string;
  blockCode: string;
  name: string;
  polygon: Polygon;
  courtyard: Polygon | null;
  heightM: number;
  floors: number;
  era: string;
  material: string;
  condition: string;
  wwrPct: number;
  envelopeQuality: number; // 1..5 — نمایشی
  protectiveStatus: string;
}

export interface DemoEnergyRow {
  buildingCode: string;
  heatingKwhM2a: number; // نمایشی — تقاضای گرمایش ویژه
  coolingKwhM2a: number; // نمایشی — تقاضای سرمایش ویژه
  totalKwhM2a: number;
  comfortHoursOut: number; // نمایشی — ساعات خارج از بازه آسایش
}

export interface DemoCalibrationRow {
  period: string;
  measuredKwh: number; // نمایشی — معادل «اندازه‌گیری»
  simulatedKwh: number; // نمایشی — معادل «خروجی شبیه‌سازی»
}

const ERAS = ["قاجار (نمایشی)", "پهلوی اول (نمایشی)", "معاصر (نمایشی)"];
const MATERIALS = ["آجر و ملات گچ (نمایشی)", "گلومان کاهگلی (نمایشی)", "آجر فشاری (نمایشی)"];
const CONDITIONS = ["سالم (نمایشی)", "نیازمند مرمت (نمایشی)", "بحرانی (نمایشی)"];
const PROTECT = ["بدون ثبت رسمی (نمایشی)", "در انتظار ارزیابی (نمایشی)"];

function rectPolygon(x: number, y: number, w: number, h: number): Polygon {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

/** تولید یک بلوک حیاط‌مرکز با حلقه بناهای پیرامون حیاط (الگوی سنتی ساده‌شده) */
function generateBlock(
  rng: () => number,
  ox: number,
  oy: number,
  W: number,
  H: number,
  code: string,
  blockName: string,
  passageWidthM: number,
  vegetationFraction: number
): { block: DemoBlock; buildings: DemoBuilding[] } {
  const cw = Math.round(W * 0.26); // عرض حیاط
  const ch = Math.round(H * 0.28); // طول حیاط
  const cx = ox + (W - cw) / 2;
  const cy = oy + (H - ch) / 2;
  const courtyard = rectPolygon(cx, cy, cw, ch);
  const wingDepth = 9 + rng() * 3; // 9 تا 12 متر

  const buildings: DemoBuilding[] = [];
  let idx = 1;
  const addBuilding = (poly: Polygon, hasCourtyard: boolean, courtyardPoly: Polygon | null) => {
    const heightBase = pick(rng, [3.4, 3.6, 3.8, 6.4, 6.8, 7.2]);
    const heightM = Math.round((heightBase + gaussian(rng, 0, 0.3)) * 10) / 10;
    const floors = heightM > 5 ? 2 : 1;
    const envQ = Math.max(1, Math.min(5, Math.round(2 + gaussian(rng, 0.6, 1))));
    buildings.push({
      code: `${code}-${String(idx).padStart(2, "0")}`,
      blockCode: code,
      name: `بنای نمایشی ${code}-${String(idx).padStart(2, "0")}`,
      polygon: poly,
      courtyard: courtyardPoly,
      heightM,
      floors,
      era: pick(rng, ERAS),
      material: pick(rng, MATERIALS),
      condition: pick(rng, CONDITIONS),
      wwrPct: Math.round((8 + rng() * 16) * 10) / 10, // ۸ تا ۲۴٪ — بازشوی سنتی محدود
      envelopeQuality: envQ,
      protectiveStatus: pick(rng, PROTECT),
    });
    idx++;
  };

  // بال شمالی و جنوبی حیاط
  const nNorth = 3;
  const northW = cw / nNorth;
  for (let i = 0; i < nNorth; i++) {
    const poly = rectPolygon(cx + i * northW, cy + ch, northW, wingDepth);
    const cyPoly = i === 1 ? rectPolygon(cx + i * northW + 1.2, cy + ch + 0.8, northW - 2.4, wingDepth - 1.6) : null;
    addBuilding(poly, i === 1, cyPoly);
  }
  const nSouth = 3;
  const southW = cw / nSouth;
  for (let i = 0; i < nSouth; i++) {
    const poly = rectPolygon(cx + i * southW, cy - wingDepth, southW, wingDepth);
    const cyPoly = i === 1 ? rectPolygon(cx + i * southW + 1.2, cy - wingDepth + 0.8, southW - 2.4, wingDepth - 1.6) : null;
    addBuilding(poly, i === 1, cyPoly);
  }
  // بال شرقی و غربی
  const sideH = ch + 2 * wingDepth;
  const nSide = 3;
  const sideSeg = sideH / nSide;
  const sideDepth = Math.min(11, (W - cw) / 2 - 2);
  for (let i = 0; i < nSide; i++) {
    const poly = rectPolygon(cx + cw, cy - wingDepth + i * sideSeg, sideDepth, sideSeg);
    addBuilding(poly, false, null);
    const polyW = rectPolygon(cx - sideDepth, cy - wingDepth + i * sideSeg, sideDepth, sideSeg);
    addBuilding(polyW, false, null);
  }
  // ردیف بیرونی جنوبی (نما به گذر اصلی)
  const outerW = W / 5;
  for (let i = 0; i < 5; i++) {
    const depth = 8 + rng() * 2;
    const poly = rectPolygon(ox + i * outerW, oy + H - depth, outerW - 0.8, depth);
    addBuilding(poly, false, null);
  }

  const block: DemoBlock = {
    code,
    name: blockName,
    geometry: rectPolygon(ox, oy, W, H),
    passageWidthM,
    vegetationFraction,
    permeableFraction: Math.round((0.15 + rng() * 0.2) * 100) / 100,
    avgPassageWidthM: passageWidthM,
  };
  return { block, buildings };
}

export interface DemoFabric {
  blocks: DemoBlock[];
  buildings: DemoBuilding[];
  energy: DemoEnergyRow[];
  calibration: DemoCalibrationRow[];
}

/** تولید کل بافت نمایشی با seed ثابت — بازتولیدپذیر */
export function generateDemoFabric(seed = 1403): DemoFabric {
  const rng = mulberry32(seed);

  const blocksSpec: Array<[string, string, number, number, number, number, number]> = [
    // [کد, نام, ox, oy, W, H, عرض گذر]
    ["A", "بلوک نمایشی الف (محدوده مصنوعی)", 0, 0, 96, 74, 5.5],
    ["B", "بلوک نمایشی ب (محدوده مصنوعی)", 102, 0, 88, 74, 4.5],
    ["C", "بلوک نمایشی پ (محدوده مصنوعی)", 196, 0, 104, 74, 6.5],
  ];

  const blocks: DemoBlock[] = [];
  const buildings: DemoBuilding[] = [];
  for (const [code, name, ox, oy, W, H, pw] of blocksSpec) {
    const veg = Math.round((0.05 + rng() * 0.15) * 100) / 100;
    const { block, buildings: bld } = generateBlock(rng, ox, oy, W, H, code, name, pw, veg);
    blocks.push(block);
    buildings.push(...bld);
  }

  // ── انرژی نمایشی: تابعی صوری از کیفیت پوسته، بازشو و تراکم + نوفه (فقط برای نمایش مسیر) ──
  const energy: DemoEnergyRow[] = buildings.map((b) => {
    const wwrNorm = b.wwrPct / 24;
    const envInv = 5 - b.envelopeQuality;
    const areaApprox = b.polygon.reduce((acc, p, i) => {
      const [x1, y1] = b.polygon[i];
      const [x2, y2] = b.polygon[(i + 1) % b.polygon.length];
      return acc + x1 * y2 - x2 * y1;
    }, 0);
    const footprint = Math.abs(areaApprox) / 2;
    const compact = footprint > 160 ? -6 : footprint < 90 ? 6 : 0; // بناهای بزرگ‌تر معمولاً بهینه‌تر (فرض صوری)
    const heating = Math.max(12, Math.round((22 + 7 * envInv + compact + gaussian(rng, 0, 4)) * 10) / 10);
    const cooling = Math.max(30, Math.round((52 + 34 * wwrNorm + 9 * envInv + compact + gaussian(rng, 0, 8)) * 10) / 10);
    const comfortHoursOut = Math.max(0, Math.round(280 + 55 * wwrNorm + 42 * envInv + gaussian(rng, 0, 60)));
    return {
      buildingCode: b.code,
      heatingKwhM2a: heating,
      coolingKwhM2a: cooling,
      totalKwhM2a: Math.round((heating + cooling) * 10) / 10,
      comfortHoursOut,
    };
  });

  // ── سری کالیبراسیون نمایشی (معادل «اندازه‌گیری» و «شبیه‌سازی») — فصلی، ۱۶ نقطه ──
  const seasons = ["زمستان", "زمستان", "بهار", "بهار", "تابستان", "تابستان", "پاییز", "پاییز"];
  const calibration: DemoCalibrationRow[] = [];
  const rng2 = mulberry32(seed + 7);
  let base = 5200;
  for (let y = 0; y < 2; y++) {
    for (let m = 0; m < 8; m++) {
      base = 5200 + gaussian(rng2, 0, 260) + (seasons[m] === "تابستان" ? 2100 : seasons[m] === "زمستان" ? 1500 : 0);
      const measured = Math.round(base + gaussian(rng2, 0, 180));
      const simulated = Math.round(measured * (1 + gaussian(rng2, 0.035, 0.07)));
      calibration.push({
        period: `دوره نمایشی ${y + 1}-${m + 1} (${seasons[m]})`,
        measuredKwh: measured,
        simulatedKwh: simulated,
      });
    }
  }

  return { blocks, buildings, energy, calibration };
}

/** داده ترکیبی بنا + انرژی برای تحلیل آماری (همه مقادیر نمایشی) */
export function demoAnalysisRows(fabric: DemoFabric) {
  const energyByCode = new Map(fabric.energy.map((e) => [e.buildingCode, e]));
  return fabric.buildings.map((b) => {
    const e = energyByCode.get(b.code)!;
    return {
      code: b.code,
      block: b.blockCode,
      heightM: b.heightM,
      floors: b.floors,
      wwrPct: b.wwrPct,
      envelopeQuality: b.envelopeQuality,
      footprintM2: Math.round(
        Math.abs(
          b.polygon.reduce((acc, p, i) => {
            const [x1, y1] = b.polygon[i];
            const [x2, y2] = b.polygon[(i + 1) % b.polygon.length];
            return acc + x1 * y2 - x2 * y1;
          }, 0)
        ) / 2
      ),
      courtyardShare: b.courtyard ? 1 : 0,
      heating: e.heatingKwhM2a,
      cooling: e.coolingKwhM2a,
      total: e.totalKwhM2a,
      comfortHoursOut: e.comfortHoursOut,
    };
  });
}
