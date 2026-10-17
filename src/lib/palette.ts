/**
 * پالت علمی — سازگار با کاربران دارای اختلال دید رنگ
 * - طبقه‌بندی: Okabe-Ito (کوررنگ‌پسند)
 * - پیوسته: Viridis (کوررنگ‌پسند)
 * - واگرا: مسی ↔ ماسه‌ای ↔ فیروزه‌ای (برند + تفکیک‌پذیر)
 */

export const OKABE_ITO = ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#CC79A7", "#56B4E9", "#F0E442", "#999999"];

export const VIRIDIS = ["#440154", "#46327e", "#365c8d", "#277f8e", "#1fa187", "#4ac16d", "#a0da39", "#fde725"];

/** مقیاس واگرای برند: مسی (کم) → ماسه‌ای (میانه) → فیروزه‌ای (زیاد) */
export const DIVERGING_COPPER_TURQ = ["#b4693b", "#d3a276", "#efe6d3", "#7cc0b7", "#17877d"];

/** رنگ‌بندی برند برای نمودارهای میله‌ای/خطی */
export const BRAND_SERIES = ["#1f4e6e", "#17877d", "#b4693b", "#d9a441", "#7a8c5c", "#8b5d76"];

/** نمونه‌گیری رنگ پیوسته viridis بین 0..1 */
export function viridisAt(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const pos = x * (VIRIDIS.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const c1 = VIRIDIS[i];
  const c2 = VIRIDIS[Math.min(i + 1, VIRIDIS.length - 1)];
  const hex = (c: string, shift: number) => parseInt(c.slice(shift, shift + 2), 16);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * f);
  const r = mix(hex(c1, 1), hex(c2, 1));
  const g = mix(hex(c1, 3), hex(c2, 3));
  const b = mix(hex(c1, 5), hex(c2, 5));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** طبقه‌بندی مقادیر به k طبقه با روش breakهای مساوی (quantile در نسخه بعد) */
export function classifyValues(values: number[], k = 5): { min: number; max: number; breaks: number[] } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const breaks: number[] = [];
  for (let i = 1; i < k; i++) breaks.push(min + ((max - min) * i) / k);
  return { min, max, breaks };
}

export function colorForValue(v: number, min: number, max: number, scale: "viridis" | "diverging" = "viridis"): string {
  const t = max > min ? (v - min) / (max - min) : 0.5;
  if (scale === "viridis") return viridisAt(t);
  const ramp = DIVERGING_COPPER_TURQ;
  const pos = t * (ramp.length - 1);
  const i = Math.floor(pos);
  return ramp[Math.min(i, ramp.length - 1)];
}
