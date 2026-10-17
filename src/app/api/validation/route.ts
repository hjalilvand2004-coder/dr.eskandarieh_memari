import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { computeMetrics } from "@/lib/science/stats";

export const dynamic = "force-dynamic";

/**
 * ارزیابی و اعتبارسنجی — سه مسیر تفکیک‌شده:
 * path=a : ارزیابی مدل شبیه‌سازی در برابر اندازه‌گیری (داده نمایشی معادل‌سازی‌شده)
 * path=b : آخرین ارزیابی مدل یادگیری ماشین در برابر داده آزمون مستقل
 * path=c : سازگاری مدل جانشین با خروجی مبنای ساخت داده (فقط بر داده نمایشی معنا دارد)
 */
export async function GET() {
  try {
    await seedIfEmpty();
    const results = await db.validationResult.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    const models = await db.mLModel.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
    return NextResponse.json({ ok: true, data: { results, models } });
  } catch (err) {
    console.error("validation GET error", err);
    return NextResponse.json({ ok: false, error: "خطا در بارگذاری نتایج اعتبارسنجی" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const path = body.path as "a" | "b" | "c";

    if (path === "a") {
      // سری کالیبراسیون نمایشی: اندازه‌گیری ↔ شبیه‌سازی
      const ds = await db.dataset.findFirst({ where: { name: { contains: "کالیبراسیون" } } });
      if (!ds?.data) return NextResponse.json({ ok: false, error: "داده کالیبراسیون یافت نشد" }, { status: 404 });
      const rows = JSON.parse(ds.data) as Array<{ period: string; measuredKwh: number; simulatedKwh: number }>;
      const y = rows.map((r) => r.measuredKwh);
      const yhat = rows.map((r) => r.simulatedKwh);
      const metrics = computeMetrics(y, yhat);

      // آستانه‌های رایج Guideline 14 (ماهانه): CV(RMSE) ≤ 30٪ و NMBE ≤ ±10٪ — صرفاً یادآوری متدولوژیک
      const thresholds = {
        source: "ASHRAE Guideline 14 (نسخه رایج) — داده ماهانه",
        cvrmse: 30,
        nmbeAbs: 10,
        caveat: "آستانه‌ها وابسته به گام زمانی و نوع داده‌اند و معیار قطعی مطلق نیستند؛ نسخه استاندارد و بند دقیق باید مستند شود.",
      };
      const verdict =
        metrics.CVRMSE !== null && metrics.NMBE !== null
          ? metrics.CVRMSE <= thresholds.cvrmse && Math.abs(metrics.NMBE) <= thresholds.nmbeAbs
            ? "در بازه آستانه رایج (با احتیاط)"
            : "خارج از بازه آستانه رایج"
          : "—";

      const saved = await db.validationResult.create({
        data: {
          path: "a_simulation_vs_measurement",
          metrics: JSON.stringify(metrics),
          criteriaVersion: "Guideline 14-رایج (ماهانه)",
          timeBasis: "۱۶ دوره نمایشی",
          dataType: "نمایشی — معادل‌سازی مفهومی، نه اندازه‌گیری واقعی",
          thresholds: JSON.stringify(thresholds),
          verdict,
          note: "⚠ داده نمایشی است؛ این ارزیابی صرفاً نمایش سازوکار محاسبه و گزارش است، نه اعتبارسنجی واقعی.",
        },
      });

      return NextResponse.json({
        ok: true,
        data: {
          metrics,
          thresholds,
          verdict,
          series: rows.map((r, i) => ({ idx: i + 1, period: r.period, observed: r.measuredKwh, predicted: r.simulatedKwh })),
          statusLabel: "ارزیابی بر داده نمایشی",
          id: saved.id,
        },
      });
    }

    if (path === "b") {
      const latest = await db.validationResult.findFirst({
        where: { path: "b_ml_vs_test" },
        orderBy: { createdAt: "desc" },
      });
      if (!latest) {
        return NextResponse.json({
          ok: true,
          data: { empty: true, message: "هنوز مدل رگرسیونی ارزیابی نشده است. ابتدا در آزمایشگاه علم داده مدل را آموزش دهید." },
        });
      }
      return NextResponse.json({ ok: true, data: { empty: false, result: latest } });
    }

    if (path === "c") {
      return NextResponse.json({
        ok: true,
        data: {
          empty: true,
          message:
            "ارزیابی سازگاری مدل جانشین پس از آموزش مدل در آزمایشگاه علم داده فعال می‌شود. توجه: سازگاری جانشین با داده مبنای نمایشی، اعتبار در برابر واقعیت نیست.",
        },
      });
    }

    return NextResponse.json({ ok: false, error: "مسیر ناشناخته" }, { status: 400 });
  } catch (err) {
    console.error("validation POST error", err);
    return NextResponse.json({ ok: false, error: "خطا در محاسبه اعتبارسنجی" }, { status: 500 });
  }
}
