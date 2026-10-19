"use client";

import * as React from "react";
import { APP_VERSION, faDigits } from "@/lib/version";
import { ShieldCheck, ShieldAlert, HelpCircle } from "lucide-react";

/**
 * شناسنامهٔ زندهٔ سرور در نوار بالا (v1.3.0)
 *
 * چرا؟ علت تکرار خطای «Internal Server Error» پس از ارتقاء، اتصال
 * مرورگر به یک نمونهٔ کهنه (زامبی node.exe) از نسخهٔ قبل بود که
 * فایل‌های استاتیک جدید را از دیسک می‌خواند ولی کد قدیمی را اجرا
 * می‌کرد. با این چیپ کاربر در یک نگاه می‌بیند:
 *   ۱) سرور واقعاً پاسخ می‌دهد؟
 *   ۲) نسخهٔ سرور با نسخهٔ همین صفحه یکی است؟
 * اگر نسخه نمایش‌داده‌شده با «۱.۳.۰» فرق داشت، یعنی نمونهٔ قدیمی در
 * حال سرو است و باید پنجره‌های قدیمی بسته شوند.
 */
type HealthState =
  | { status: "checking" }
  | { status: "ok"; version: string; uptimeSec: number }
  | { status: "fail"; detail: string };

export function ServerIdentity() {
  const [st, setSt] = React.useState<HealthState>({ status: "checking" });
  const [dismissed, setDismissed] = React.useState(false);

  const probe = React.useCallback(async () => {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const text = await r.text();
      try {
        const j = JSON.parse(text) as { ok?: boolean; version?: string; uptimeSec?: number };
        if (j && j.ok) {
          setSt({ status: "ok", version: j.version ?? "?", uptimeSec: j.uptimeSec ?? 0 });
        } else {
          setSt({ status: "fail", detail: `HTTP ${r.status}` });
        }
      } catch {
        setSt({ status: "fail", detail: `پاسخ غیر-JSON (HTTP ${r.status})` });
      }
    } catch {
      setSt({ status: "fail", detail: "اتصال برقرار نشد" });
    }
  }, []);

  React.useEffect(() => {
    probe();
  }, [probe]);

  const mismatch = st.status === "ok" && st.version !== APP_VERSION;
  const showBanner =
    !dismissed && (st.status === "fail" || mismatch);

  return (
    <>
      <span
        className={`hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
          st.status === "ok" && !mismatch
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : st.status === "checking"
              ? "border-border text-muted-foreground"
              : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        }`}
        title="نسخهٔ واقعی سروری که به آن متصل هستید"
      >
        {st.status === "ok" && !mismatch && <ShieldCheck className="h-3 w-3" aria-hidden />}
        {(st.status === "fail" || mismatch) && <ShieldAlert className="h-3 w-3" aria-hidden />}
        {st.status === "checking" && <HelpCircle className="h-3 w-3" aria-hidden />}
        {st.status === "checking" && "بررسی سرور…"}
        {st.status === "ok" && `سرور نسخهٔ ${faDigits(st.version)}`}
        {st.status === "fail" && "سرور بی‌پاسخ"}
      </span>

      {showBanner && (
        <div
          role="alert"
          className="no-print border-b border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        >
          <div className="mx-auto max-w-[1400px] px-4 py-2 text-[11.5px] leading-5 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <div className="space-y-0.5">
              {st.status === "fail" ? (
                <>
                  <p className="font-bold">
                    صفحهٔ سامانه بارگذاری شده ولی سرور پاسخ نمی‌دهد ({st.detail}).
                  </p>
                  <p>
                    احتمالاً یک نمونهٔ قدیمی/خراب از سامانه هنوز روی این نشانی فعال است. پنجرهٔ سرور
                    را ببینید، همهٔ پنجره‌های قدیمی را ببندید و لانچر را دوباره اجرا کنید؛ سپس فقط از
                    نشانی‌ای استفاده کنید که در پنجرهٔ سرور با علامت «&gt;&gt;&gt;» نمایش داده می‌شود.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">
                    ناسازگاری نسخه: صفحه شما «{faDigits(APP_VERSION)}» است ولی سرورِ پاسخ‌گو نسخهٔ{" "}
                    {faDigits(st.version)} را سرو می‌کند.
                  </p>
                  <p>
                    یک نسخهٔ قدیمی از سامانه هنوز در حال اجراست. همهٔ پنجره‌های سرور قدیمی را ببندید
                    (یا در Task Manager پروسه‌های node را پایان دهید) و لانچر نسخهٔ{" "}
                    {faDigits(APP_VERSION)} را دوباره اجرا کنید. گزارش عیب‌یابی:
                    app\diagnostic-report.txt
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  setDismissed(true);
                  probe();
                }}
                className="underline underline-offset-2 hover:opacity-80"
              >
                بررسی دوباره و بستن این هشدار
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
