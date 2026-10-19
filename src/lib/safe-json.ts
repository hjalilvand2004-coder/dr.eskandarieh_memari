/**
 * fetchJson — واکشی امن JSON برای کلاینت (v1.2.3)
 *
 * مشکل قبلی: زنجیره‌های `fetch(...).then(r => r.json())` بدون catch،
 * وقتی سرور پاسخ متنی خام (مثل «Internal Server Error») می‌داد،
 * خطای «Uncaught (in promise) SyntaxError» در کنسول می‌ساختند.
 * این هلپر هرگز throw نمی‌کند؛ همیشه یک شیء نتیجه برمی‌گرداند.
 */
export type JsonResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export async function fetchJson<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<JsonResult<T>> {
  try {
    const r = await fetch(input, init);
    const text = await r.text();
    let j: { ok?: boolean; data?: T; error?: string } | null = null;
    try {
      j = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: r.status,
        error:
          r.ok && !text
            ? `HTTP ${r.status}`
            : `سرور پاسخ غیر-JSON داد (HTTP ${r.status}): ${text.slice(0, 120)}`,
      };
    }
    return {
      ok: !!(j && j.ok),
      status: r.status,
      data: j?.data,
      error: j?.error ?? (j && j.ok ? undefined : `HTTP ${r.status}`),
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
