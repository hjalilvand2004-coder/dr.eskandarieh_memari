/**
 * آمار توصیفی، همبستگی و معیارهای ارزیابی مدل
 * همه توابع خالص و قابل تست هستند.
 */

export interface DescribeResult {
  n: number;
  missing: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  outliers: number; // تعداد داده پرت بر پایه قانون 1.5×IQR
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function std(xs: number[], ddof = 1): number {
  if (xs.length <= ddof) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - ddof));
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (s[base + 1] !== undefined) return s[base] + rest * (s[base + 1] - s[base]);
  return s[base];
}

export function describe(values: (number | null | undefined)[]): DescribeResult {
  const clean = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  const n = clean.length;
  if (n === 0) {
    return { n: 0, missing: values.length, mean: NaN, median: NaN, std: NaN, min: NaN, max: NaN, q1: NaN, q3: NaN, iqr: NaN, outliers: 0 };
  }
  const m = mean(clean);
  const q1 = quantile(clean, 0.25);
  const q3 = quantile(clean, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const outliers = clean.filter((v) => v < lo || v > hi).length;
  return {
    n,
    missing: values.length - n,
    mean: m,
    median: median(clean),
    std: n > 1 ? std(clean) : 0,
    min: Math.min(...clean),
    max: Math.max(...clean),
    q1,
    q3,
    iqr,
    outliers,
  };
}

/** همبستگی پیرسون با کنترل طول و واریانس صفر */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return NaN;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

// ─────────────── معیارهای ارزیابی مدل (بخش ۷ پرامپت) ───────────────

export interface MetricsResult {
  n: number;
  MAE: number;
  RMSE: number;
  R2: number | null;
  NMBE: number | null;   // درصد — با قرارداد علامت مستندشده
  CVRMSE: number | null; // درصد
  MAPE: number | null;   // درصد — فقط در نبود مقادیر نزدیک صفر
  mapeExcluded?: string; // دلیل حذف MAPE
  meanObserved: number;
}

/**
 * معیارهای خطا بین مشاهده (y) و پیش‌بینی (ŷ).
 * قرارداد علامت NMBE: NMBE = Σ(y_i − ŷ_i) / Σ(y_i) × 100
 * → مقدار مثبت یعنی مدل کم‌برآورد است (میانگین مشاهده‌شده بیش از پیش‌بینی).
 * این قرارداد باید در گزارش رساله صریحاً ذکر شود.
 */
export function computeMetrics(y: number[], yhat: number[]): MetricsResult {
  const n = Math.min(y.length, yhat.length);
  if (n === 0) return { n: 0, MAE: NaN, RMSE: NaN, R2: null, NMBE: null, CVRMSE: null, MAPE: null, meanObserved: NaN };
  const yi = y.slice(0, n);
  const pi = yhat.slice(0, n);
  const errs = yi.map((v, i) => v - pi[i]);
  const MAE = mean(errs.map(Math.abs));
  const RMSE = Math.sqrt(mean(errs.map((e) => e * e)));
  const my = mean(yi);
  const sst = yi.reduce((a, b) => a + (b - my) ** 2, 0);
  const ssr = errs.reduce((a, e) => a + e * e, 0);
  const R2 = sst > 0 ? 1 - ssr / sst : null;
  const sumY = yi.reduce((a, b) => a + b, 0);
  const NMBE = sumY !== 0 ? (errs.reduce((a, b) => a + b, 0) / sumY) * 100 : null;
  const CVRMSE = my !== 0 ? (RMSE / Math.abs(my)) * 100 : null;
  let MAPE: number | null = null;
  let mapeExcluded: string | undefined;
  const nearZero = yi.filter((v) => Math.abs(v) < 0.1 * Math.abs(my || 1) || Math.abs(v) < 1e-9).length;
  if (nearZero > 0) {
    mapeExcluded = `MAPE محاسبه نشد: ${nearZero} مقدار مشاهده‌شده صفر یا نزدیک صفر است و نسبت خطا بی‌معنا می‌شود.`;
  } else {
    MAPE = (mean(yi.map((v, i) => Math.abs((v - pi[i]) / v))) * 100);
  }
  return { n, MAE, RMSE, R2, NMBE, CVRMSE, MAPE, mapeExcluded, meanObserved: my };
}

/** استانداردسازی z-score با ذخیره میانگین/انحراف معیار (پیش‌پردازش فقط با داده آموزش) */
export function fitScaler(X: number[][]): { mean: number[]; std: number[] } {
  const d = X[0]?.length ?? 0;
  const mu: number[] = [];
  const sd: number[] = [];
  for (let j = 0; j < d; j++) {
    const col = X.map((r) => r[j]);
    const m = mean(col);
    mu.push(m);
    sd.push(std(col) || 1);
  }
  return { mean: mu, std: sd };
}

export function transform(X: number[][], scaler: { mean: number[]; std: number[] }): number[][] {
  return X.map((r) => r.map((v, j) => (v - scaler.mean[j]) / scaler.std[j]));
}

/** تبدیل عدد فارسی/لاتین به عدد JS — برای پارس CSV */
export function parseNumeric(v: string): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim()
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٬,\s]/g, "")
    .replace(/[٫]/g, ".");
  if (s === "" || s === "-" || s === "NA" || s === "nan" || s === "null") return null;
  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}
