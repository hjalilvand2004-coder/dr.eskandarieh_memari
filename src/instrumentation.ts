/**
 * هوک استارتاپ سرور Next.js (v1.3.0)
 *
 * هدف: ثبت هر استثنای غیرمنتظره در سطح پروسهٔ سرور داخل فایل
 * `crash-log.txt` کنار server.js (در بستهٔ پرتابل: app/crash-log.txt)
 * تا اگر روی هر ماشین خطایی رخ داد، کاربر بتواند فایل را برای
 * عیب‌یابی ارسال کند — به‌جای «Internal Server Error» بی‌اثر.
 *
 * هیچ‌چیز این ماژول نباید استارت سرور را متوقف کند؛ همه‌چیز در
 * try/catch است و فقط «ثبت» می‌کند.
 */
export async function register() {
  try {
    // فقط در ران‌تایم Node (نه Edge)
    if (typeof process === "undefined" || process.release?.name !== "node") return;
    const fs = await import("node:fs");
    const path = await import("node:path");

    const logFile = path.join(process.cwd(), "crash-log.txt");
    const append = (kind: string, e: unknown) => {
      try {
        const stamp = new Date().toISOString();
        const body = e instanceof Error ? (e.stack ?? e.message) : String(e);
        fs.appendFileSync(logFile, `[${stamp}] ${kind}\n${body}\n\n`);
      } catch {
        /* best effort */
      }
    };

    // جلوگیری از ثبت تکراری در صورت reload
    const g = globalThis as unknown as { __shirazCrashHooked?: boolean };
    if (g.__shirazCrashHooked) return;
    g.__shirazCrashHooked = true;

    process.on("uncaughtException", (e) => append("uncaughtException (next server)", e));
    process.on("unhandledRejection", (e) => append("unhandledRejection (next server)", e));
  } catch {
    /* هرگز استارت را خراب نکن */
  }
}
