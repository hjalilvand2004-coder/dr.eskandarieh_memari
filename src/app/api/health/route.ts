import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APP_SERVICE, APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * نقطهٔ بررسی سلامت — سبک و بدون وابستگی به داده‌ها.
 * برای خودآزمایی لانچر، چیپ شناسنامهٔ سرور در رابط کاربری و عیب‌یابی
 * سریع استفاده می‌شود. نسخه از lib/version خوانده می‌شود تا هرگز با
 * نسخهٔ رابط کاربری ناهم‌خوان نشود.
 */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  let projectCount: number | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    try {
      projectCount = await db.project.count();
    } catch {
      projectCount = null; // فایل هست ولی جداول ندارند (دیتابیس تازه)
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message.split("\n")[0] : String(err);
  }

  return NextResponse.json({
    ok: true,
    service: APP_SERVICE,
    version: APP_VERSION,
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    db: {
      ok: dbOk,
      error: dbError,
      projectCount,
      file: process.env.DATABASE_URL?.replace(/^file:/, "").split(/[\\/]/).pop() ?? "custom.db",
    },
    latencyMs: Date.now() - started,
  });
}
