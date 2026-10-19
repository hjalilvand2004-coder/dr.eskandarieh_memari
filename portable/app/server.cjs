#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  Shiraz Smart Atlas — Resilient Portable Launcher (v1.2.1)
 *  لانچر مقاوم سامانه پرتابل
 * ═══════════════════════════════════════════════════════════════
 *  Fixes / رفع اشکالات:
 *   1) DATABASE_URL: چند استراتژی ساخت URL ساخته و با کوئری واقعی
 *      تست می‌شوند؛ اولینِ سالم انتخاب می‌شود — مقاوم در برابر
 *      فاصله، حروف فارسی و مسیرهای OneDrive در هر سه پلتفرم.
 *   2) Port conflict: اگر ۳۰۰۰ اشغال باشد (نمونه قبلی روشن!)،
 *      اولین پورت آزاد تا +۲۰ انتخاب می‌شود.
 *   3) پورت نهایی در app/port.txt نوشته می‌شود تا لانچر، مرورگر را
 *      روی URL درست باز کند.
 *   4) خطاها شفاف و دوزبانه گزارش می‌شوند (نه کرش خاموش).
 */
"use strict";

const path = require("path");
const fs = require("fs");
const net = require("net");
const { pathToFileURL } = require("url");

const APP_DIR = __dirname;
const DB_PATH = path.join(APP_DIR, "db", "custom.db");
const PORT_FILE = path.join(APP_DIR, "port.txt");
const BASE_PORT = parseInt(process.env.PORT || "3000", 10) || 3000;
const VERSION = "1.2.2";

function log(m) { console.log("[ShirazAtlas] " + m); }
function fail(m) {
  console.error("");
  console.error("[ShirazAtlas] ERROR ──────────────────────────────");
  console.error(m);
  console.error("──────────────────────────────────────────────────");
  process.exit(1);
}

/* ─── ۱) دیتابیس: چند استراتژی URL + تست واقعی ───
   Prisma روی پلتفرم‌ها رفتار یکسان ندارد (مثلاً URLهای
   percent-encoded روی برخی مسیرهای فارسی/فاصله‌دار باز نمی‌شوند). */
function dbUrlCandidates(real) {
  const fwd = real.replace(/\\/g, "/");
  const list = [
    { label: "raw-forward", url: "file:" + fwd },
    { label: "canonical", url: pathToFileURL(real).href },
    { label: "encoded-uri", url: "file:" + encodeURI(fwd) },
  ];
  const seen = new Set();
  return list.filter(({ url }) => (seen.has(url) ? false : (seen.add(url), true)));
}

async function pickDatabaseUrl(real) {
  let PrismaClient;
  try {
    ({ PrismaClient } = require("@prisma/client"));
  } catch (e) {
    fail("Failed to load @prisma/client: " + (e && e.message));
  }
  for (const { label, url } of dbUrlCandidates(real)) {
    const p = new PrismaClient({ datasourceUrl: url });
    try {
      await p.$queryRaw`SELECT 1`;
      await p.$disconnect().catch(() => {});
      log("Database URL strategy: " + label);
      return url;
    } catch (e) {
      await p.$disconnect().catch(() => {});
      log("DB URL failed [" + label + "]: " + String(e && e.message).split("\n")[0].slice(0, 90));
    }
  }
  fail(
    "Could not open the database file with any URL strategy:\n" +
    "             " + real +
    "\n           -> Move the package to a simple local folder (e.g. Desktop) and run again.\n" +
    "           (پوشه را در یک مسیر ساده محلی قرار دهید و دوباره اجرا کنید)"
  );
}

/* ─── ۲) انتخاب اولین پورت آزاد (از ۳۰۰۰ تا ۳۰۲۰) ─── */
function firstFreePort(from, to) {
  return new Promise((resolve) => {
    const probe = (p) => {
      if (p > to) { resolve(0); return; }
      const s = net.createServer();
      let settled = false;
      const finish = (free) => {
        if (settled) return;
        settled = true;
        s.removeAllListeners();
        const next = () => {
          /* توجه: probe مقدار برنمی‌گرداند؛ resolve نباید نتیجه آن را بپذیرد
             (باگ قبلی: resolve(probe(...)) → resolve(undefined) → شکست کاذب) */
          if (free) resolve(p);
          else probe(p + 1);
        };
        try { s.close(next); } catch { next(); }
      };
      s.once("error", () => finish(false));
      s.once("listening", () => finish(true));
      try { s.listen(p, "127.0.0.1"); } catch { finish(false); }
    };
    probe(from);
  });
}

/* ─── اجرای اصلی ─── */
(async () => {
  /* دیتابیس */
  let real;
  try {
    real = fs.realpathSync(DB_PATH); // اگر فایل نباشد خطا می‌دهد
    log("Database : " + DB_PATH);
  } catch {
    fail(
      "Database file not found:\n" +
      "             " + DB_PATH +
      "\n           -> Re-extract the FULL ZIP and keep the folder structure.\n" +
      "           (بسته را کامل استخراج کنید و ساختار پوشه‌ها حفظ شود)"
    );
  }
  process.env.DATABASE_URL = await pickDatabaseUrl(real);

  /* پورت */
  const port = await firstFreePort(BASE_PORT, BASE_PORT + 20);
  if (!port) {
    fail("No free TCP port in range " + BASE_PORT + "-" + (BASE_PORT + 20) +
         ".\n           Close other running instances and try again.");
  }
  if (port !== BASE_PORT) {
    log("Port " + BASE_PORT + " is busy (previous instance?) -> using port " + port);
  }
  process.env.PORT = String(port);
  process.env.HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  try { fs.writeFileSync(PORT_FILE, String(port)); } catch { /* best effort */ }

  log("Version  : " + VERSION);
  log("URL      : http://localhost:" + port);
  log("Starting server ... (keep this window open / این پنجره را باز نگه دارید)");
  require("./server.js");

  /* ─── ۳) خودآزمایی پس از استارت (v1.2.2) ───
     تا سلامت واقعی APIها را با یک درخواست واقعی می‌سنجیم و
     در صورت خطا، گزارش دقیق در app/diagnostic-report.txt ثبت می‌شود. */
  selfTest(port);
})().catch((e) => {
  fail("Startup failed:\n" + ((e && e.stack) || e));
});

/* ─── خودآزمایی v1.2.2: سلامت /api/health و /api/bootstrap ─── */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function selfTest(port) {
  const base = "http://127.0.0.1:" + port;
  const reportLines = [];
  const add = (m) => { reportLines.push(m); log(m); };

  // صبر تا آماده‌شدن سرور (حداکثر ۳۰ ثانیه)
  let health = null;
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    try {
      const r = await fetch(base + "/api/health", { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j && j.ok) { health = j; break; }
    } catch { /* هنوز آماده نیست */ }
  }

  if (!health) {
    add("SELFTEST FAIL / خودآزمایی ناموفق: /api/health did not answer within 30s");
    writeReport(port, reportLines);
    return;
  }
  add("SELFTEST health ..... PASS (db.ok=" + (health.db && health.db.ok) +
      ", projects=" + (health.db && health.db.projectCount) + ")");

  let bootOk = false;
  try {
    const r = await fetch(base + "/api/bootstrap", { signal: AbortSignal.timeout(60000) });
    const j = await r.json();
    bootOk = !!(j && j.ok);
    if (!bootOk && j && j.error) reportLines.push("bootstrap error: " + j.error);
  } catch (e) {
    reportLines.push("bootstrap exception: " + ((e && e.message) || e));
  }
  add(bootOk ? "SELFTEST bootstrap ... PASS — سامانه آماده است ✓"
             : "SELFTEST bootstrap ... FAIL — داده‌ها بارگذاری نشد ✗");

  if (bootOk) {
    log("All checks passed. Open: " + base + "  (report: app/diagnostic-report.txt)");
  } else {
    console.error("");
    console.error("[ShirazAtlas] TROUBLESHOOTING / رفع اشکال:");
    console.error("  1) Keep the app folder on a LOCAL simple path (not OneDrive). / پوشه را در مسیر محلی ساده قرار دهید.");
    console.error("  2) Re-extract the FULL ZIP into a NEW empty folder. / بسته را در پوشه‌ای جدید کامل استخراج کنید.");
    console.error("  3) See app/diagnostic-report.txt / گزارش کامل در فایل diagnostic-report.txt");
  }
  writeReport(port, reportLines);
}

function writeReport(port, lines) {
  try {
    const stamp = new Date().toISOString();
    fs.writeFileSync(
      path.join(APP_DIR, "diagnostic-report.txt"),
      "Shiraz Smart Atlas — diagnostic report / گزارش عیب\u200cیابی\n" +
      "Date: " + stamp + "\nPort: " + port + "\nVersion: " + VERSION + "\n\n" +
      lines.join("\n") + "\n"
    );
  } catch { /* best effort */ }
}

/* ─── خطاها شفاف گزارش می‌شوند ─── */
process.on("uncaughtException", (e) => {
  console.error("[ShirazAtlas] Unexpected error:", (e && e.stack) || e);
});
process.on("unhandledRejection", (e) => {
  console.error("[ShirazAtlas] Async error:", (e && (e.stack || e.message)) || e);
});
