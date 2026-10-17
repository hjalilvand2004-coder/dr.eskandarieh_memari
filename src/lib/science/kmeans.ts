/**
 * خوشه‌بندی K-Means با مقداردهی k-means++ و الگوریتم Lloyd
 * - ورودی استانداردشده می‌شود (پیش‌پردازش فقط با داده آموزش)
 * - seed ثبت می‌شود تا نتیجه بازتولیدپذیر باشد
 * - امتیاز Silhouette برای ارزیابی داخلی خوشه‌ها محاسبه می‌شود
 */
import { mulberry32 } from "./rng";
import { fitScaler, transform, mean } from "./stats";

export interface KMeansResult {
  labels: number[];
  k: number;
  inertia: number; // WCSS در فضای استانداردشده
  silhouette: number;
  centroidsStd: number[][]; // مرکزها در فضای استانداردشده
  centroidsOriginal: number[][]; // مرکزها در واحد اصلی متغیرها
  scaler: { mean: number[]; std: number[] };
  iterations: number;
  converged: boolean;
  clusterSizes: number[];
}

function sqDist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

export function kmeans(Xraw: number[][], k: number, seed = 42, maxIter = 300): KMeansResult {
  const scaler = fitScaler(Xraw);
  const X = transform(Xraw, scaler);
  const n = X.length;
  const d = X[0].length;
  const rng = mulberry32(seed);

  // ── k-means++ seeding ──
  const centroids: number[][] = [X[Math.floor(rng() * n)].slice()];
  while (centroids.length < k) {
    const dists = X.map((x) => Math.min(...centroids.map((c) => sqDist(x, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    let target = rng() * total;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      target -= dists[i];
      if (target <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push(X[idx].slice());
  }

  const labels = new Array<number>(n).fill(0);
  let iterations = 0;
  let converged = false;
  for (iterations = 1; iterations <= maxIter; iterations++) {
    // assign
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dd = sqDist(X[i], centroids[c]);
        if (dd < bestD) {
          bestD = dd;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed = true;
      }
    }
    // update
    for (let c = 0; c < k; c++) {
      const members = X.filter((_, i) => labels[i] === c);
      if (members.length === 0) continue; // خوشه خالی حفظ می‌شود
      for (let j = 0; j < d; j++) {
        centroids[c][j] = mean(members.map((m) => m[j]));
      }
    }
    if (!changed && iterations > 1) {
      converged = true;
      break;
    }
  }

  const inertia = X.reduce((acc, x, i) => acc + sqDist(x, centroids[labels[i]]), 0);

  // ── Silhouette (شرات نمونه با seed برای n بزرگ؛ اینجا n کوچک است، کامل محاسبه می‌شود) ──
  let silhouette = 0;
  if (k > 1 && n > k) {
    const sil = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
      const own = X.filter((_, j) => j !== i && labels[j] === labels[i]);
      const a = own.length ? mean(own.map((o) => Math.sqrt(sqDist(X[i], o)))) : 0;
      let b = Infinity;
      for (let c = 0; c < k; c++) {
        if (c === labels[i]) continue;
        const others = X.filter((_, j) => labels[j] === c);
        if (others.length === 0) continue;
        const bb = mean(others.map((o) => Math.sqrt(sqDist(X[i], o))));
        if (bb < b) b = bb;
      }
      sil[i] = b === Infinity || (a === 0 && b === 0) ? 0 : (b - a) / Math.max(a, b);
    }
    silhouette = mean(sil);
  }

  const centroidsOriginal = centroids.map((c) => c.map((v, j) => v * scaler.std[j] + scaler.mean[j]));
  const clusterSizes = Array.from({ length: k }, (_, c) => labels.filter((l) => l === c).length);

  return {
    labels,
    k,
    inertia,
    silhouette,
    centroidsStd: centroids,
    centroidsOriginal,
    scaler,
    iterations,
    converged,
    clusterSizes,
  };
}
