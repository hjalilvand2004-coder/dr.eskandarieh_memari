/**
 * رگرسیون خطی چندمتغیره (OLS) با حل معادلات نرمال + منظم‌ساز خیلی کوچک برای پایداری عددی
 * - پیش‌پردازش (استانداردسازی) فقط با داده آموزش برازش می‌شود → کنترل نشت داده
 * - تفکیک گروهی بر پایه بلوک/محله برای کنترل خودهمبستگی فضایی
 */
import { fitScaler, transform, mean } from "./stats";

export interface OLSResult {
  intercept: number; // در فضای استانداردشده ویژگی‌ها
  coefStd: number[]; // ضرایب در فضای استانداردشده (بتاهای استاندارد)
  coefOriginal: number[]; // ضرایب در واحد اصلی متغیرها
  scaler: { mean: number[]; std: number[] };
  r2Train: number;
  nTrain: number;
  nTest: number;
}

/** حل دستگاه خطی با حذف گاوسی (با انتخاب محور بزرگ) */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const pv = M[col][col];
    if (Math.abs(pv) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / pv;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return Array.from({ length: n }, (_, i) => {
    const pv = M[i][i];
    return Math.abs(pv) < 1e-12 ? 0 : M[i][n] / pv;
  });
}

export function olsFit(Xraw: number[][], y: number[], ridge = 1e-8): OLSResult {
  const scaler = fitScaler(Xraw);
  const X = transform(Xraw, scaler);
  const n = X.length;
  const d = X[0].length;

  // X'X + λI و X'y
  const A: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
  const b = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      b[j] += X[i][j] * y[i];
      for (let k = 0; k < d; k++) A[j][k] += X[i][j] * X[i][k];
    }
  }
  for (let j = 0; j < d; j++) A[j][j] += ridge;

  const coefStd = solve(A, b);
  const intercept = mean(y) - mean(coefStd.map((c) => c)) * 0; // intercept جداگانه:
  // در فضای استانداردشده، میانگین ویژگی‌ها صفر است → intercept = mean(y)
  const b0 = mean(y);
  const preds = X.map((x) => b0 + x.reduce((a, v, j) => a + v * coefStd[j], 0));
  const my = mean(y);
  const sst = y.reduce((a, v) => a + (v - my) ** 2, 0);
  const ssr = y.reduce((a, v, i) => a + (v - preds[i]) ** 2, 0);
  const r2Train = sst > 0 ? 1 - ssr / sst : NaN;

  // بازگشت ضرایب به واحد اصلی: beta_j^orig = beta_j^std * sd_y / sd_x  → چون y استاندارد نشده:
  // y = b0 + Σ β_j^std (x_j - μ_j)/σ_j  →  ∂y/∂x_j = β_j^std / σ_j
  const coefOriginal = coefStd.map((c, j) => c / scaler.std[j]);

  void intercept;
  return {
    intercept: b0,
    coefStd,
    coefOriginal,
    scaler,
    r2Train,
    nTrain: n,
    nTest: 0,
  };
}

export function olsPredict(model: OLSResult, Xraw: number[][]): number[] {
  const X = transform(Xraw, model.scaler);
  return X.map((x) => model.intercept + x.reduce((a, v, j) => a + v * model.coefStd[j], 0));
}

/**
 * تفکیک گروهی (Group Split) بر پایه کلید گروه (بلوک/محله) — کنترل نشت داده فضایی
 * گروه‌ها به‌صورت کامل به آموزش یا آزمون می‌روند.
 */
export function groupSplit(
  groups: string[],
  testFraction: number,
  seed = 42
): { trainIdx: number[]; testIdx: number[] } {
  const unique = Array.from(new Set(groups));
  // تعیین جنس PRNG به روش mulberry32 (مطابق rng.ts)
  let a = seed >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...unique].sort(() => rand() - 0.5);
  const nTestGroups = Math.max(1, Math.round(shuffled.length * testFraction));
  const testGroups = new Set(shuffled.slice(0, nTestGroups));
  const trainIdx: number[] = [];
  const testIdx: number[] = [];
  groups.forEach((g, i) => {
    if (testGroups.has(g)) testIdx.push(i);
    else trainIdx.push(i);
  });
  return { trainIdx, testIdx };
}
