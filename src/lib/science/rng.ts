/**
 * مولد اعداد شبه‌تصادفی با seed ثابت — برای بازتولیدپذیری کامل تحلیل‌ها
 * Mulberry32: PRNG سبک و کافی برای محاسبات علمی نسخه اول
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** نمونه‌گیری نرمال (Box-Muller) با RNG دارای seed */
export function gaussian(rng: () => number, mean = 0, std = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** انتخاب شاخص تصادفی */
export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** بازگشت عدد با seed از رشته (برای ثبات نام‌محور) */
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
