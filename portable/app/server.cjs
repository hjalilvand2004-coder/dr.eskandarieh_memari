#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  Shiraz Smart Atlas — Resilient Portable Launcher (v1.3.0)
 *  لانچر مقاوم سامانهٔ پرتابل — نسخهٔ مرجع (master)
 *  سینک به portable/app/server.cjs توسط scripts/sync-portable-v130.sh
 * ═══════════════════════════════════════════════════════════════
 *  Fixes / رفع اشکالات:
 *   1) DATABASE_URL: چند استراتژی URL + تست واقعی با SELECT 1
 *   2) Port conflict: اولین پورت آزاد 3000..3020
 *   3) v1.2.3: بستن نمونه‌های کهنه با شناسهٔ HTTP
 *   4) v1.3.0: پاکسازی قطعی زامبی بر اساس مسیر پوشهٔ برنامه
 *      (حتی وقتی پروسهٔ قدیمی هنگ کرده و HTTP جواب نمی‌دهد)
 *   5) port.txt برای بازشدن مرورگر روی نشانی درست
 *   6) خودآزمایی + گزارش کامل app/diagnostic-report.txt
 *      + ثبت کرش‌های غیرمنتظره در app/crash-log.txt
 *   7) خطاها شفاف و دوزبانه
 */
"use strict";

const path = require("path");
const fs = require("fs");
const net = require("net");
const { execSync } = require("child_process");
const { pathToFileURL } = require("url");

const APP_DIR = __dirname;
const DB_PATH = path.join(APP_DIR, "db", "custom.db");
const PORT_FILE = path.join(APP_DIR, "port.txt");
const BASE_PORT = parseInt(process.env.PORT || "3000", 10) || 3000;
const PORT_MAX = BASE_PORT + 20;
const VERSION = "1.3.0";
const IS_WIN = process.platform === "win32";

const LAUNCH_LOG = [];
function log(m) { console.log("[ShirazAtlas] " + m); LAUNCH_LOG.push(String(m)); }
function fail(m) {
  console.error("");
  console.error("[ShirazAtlas] ERROR ──────────────────────────────");
  console.error(m);
  console.error("──────────────────────────────────────────────────");
  LAUNCH_LOG.push("ERROR: " + String(m));
  writeReport(BASE_PORT, LAUNCH_LOG);
  process.exit(1);
}

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

function tcpInUse(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" });
    const done = (v) => { try { s.destroy(); } catch {} resolve(v); };
    s.once("connect", () => done(true));
    s.once("error", () => done(false));
    setTimeout(() => done(false), 1200);
  });
}

async function isOurApp(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(2500) });
    const t = await r.text();
    if (t.includes("shiraz-smart-atlas")) return true;
  } catch { /* در نسخه‌های خیلی قدیمی health نیست */ }
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2500) });
    const t = await r.text();
    if (t.includes("اطلس هوشمند") || /Shiraz Smart Atlas/i.test(t)) return true;
  } catch { /* ignore */ }
  return false;
}

function pidsOnPort(port) {
  if (IS_WIN) {
    try {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique) -join ','"`,
        { timeout: 10000, windowsHide: true },
      ).toString().trim();
      const pids = out.split(",").map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n) && n > 0);
      if (pids.length) return pids;
    } catch { /* ویندوزهای قدیمی → netstat */ }
    try {
      const out = execSync("netstat -ano -p TCP", { timeout: 12000, windowsHide: true }).toString();
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!/LISTENING/i.test(line)) continue;
        const m = line.match(new RegExp(`:(${port})\\s`, "i"));
        if (m) {
          const pidM = line.trim().match(/(\d+)\s*$/);
          if (pidM) pids.add(parseInt(pidM[1], 10));
        }
      }
      return [...pids];
    } catch { /* ignore */ }
    return [];
  }
  try {
    return execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { timeout: 8000, shell: true })
      .toString().split("\n").map(Number).filter(Boolean);
  } catch { /* ignore */ }
  try {
    /* فیل‌بک ss (لینوکس): pid=NNN را از خروجی ss -tlnp بیرون می‌کشیم */
    const out = execSync(`ss -tlnp | grep ':${port} '`, { timeout: 8000, shell: true })
      .toString();
    const pids = new Set();
    for (const m of out.matchAll(/pid=(\d+)/g)) pids.add(parseInt(m[1], 10));
    if (pids.size) return [...pids];
  } catch { /* ignore */ }
  try {
    return execSync(`fuser ${port}/tcp 2>/dev/null`, { timeout: 8000, shell: true })
      .toString().split(/\s+/).map(Number).filter(Boolean);
  } catch { /* ignore */ }
  return [];
}

function killPid(pid) {
  try {
    if (IS_WIN) {
      execSync(`taskkill /F /T /PID ${pid}`, { timeout: 10000, windowsHide: true });
    } else {
      process.kill(pid, "SIGKILL");
    }
    return true;
  } catch { return false; }
}

/**
 * v1.3.0 — پاکسازی قطعی زامبی‌ها بر اساس «مسیر پوشهٔ برنامه»
 *
 * سناریوی عامل تکرار «Internal Server Error»: پروسهٔ node از اجرای
 * قبل هنوز زنده است و از همین پوشه سرو می‌دهد؛ بعد از ارتقاء، همان
 * پروسهٔ قدیمی فایل‌های استاتیک «جدید» را از دیسک می‌خواند ولی کد
 * «قدیمی» را از حافظه اجرا می‌کند → همهٔ APIها 500 خام.
 *
 * این تابع هر پروسه‌ای را که به‌وضوح متعلق به همین برنامه است
 * می‌بندد، حتی اگر هنگ کرده و به درخواست HTTP جواب ندهد:
 *   ویندوز: CommandLine یا ExecutablePath شامل مسیر APP_DIR باشد،
 *           یا server.cjs را اجرا کرده باشد، یا node.exe همراه
 *           بسته (runtime\windows-x64) را اجرا کرده باشد.
 *   لینوکس/مک: pgrep -f روی مسیر APP_DIR / server.cjs
 * پروسهٔ خودِ لانچر هرگز بسته نمی‌شود.
 */
function listZombiePids() {
  const me = process.pid;
  const pids = new Set();
  const addIfOk = (p) => { if (Number.isFinite(p) && p > 0 && p !== me) pids.add(p); };

  if (IS_WIN) {
    const appDirPs = APP_DIR.replace(/'/g, "''");
    const ps =
      `$ErrorActionPreference='SilentlyContinue';` +
      `Get-CimInstance Win32_Process -Filter "Name like 'node%.exe'" | ` +
      `Where-Object { $_.ProcessId -ne ${me} } | ` +
      `Where-Object { ` +
      `$_.CommandLine -like '*${appDirPs}*' -or ` +
      `$_.ExecutablePath -like '*${appDirPs}*' -or ` +
      `$_.CommandLine -like '*server.cjs*' -or ` +
      `$_.ExecutablePath -like '*\\runtime\\windows-x64\\node.exe' ` +
      `} | ForEach-Object { $_.ProcessId }`;
    try {
      const out = execSync(
        `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
        { timeout: 15000, windowsHide: true },
      ).toString();
      for (const m of out.matchAll(/\d+/g)) addIfOk(parseInt(m[0], 10));
    } catch (e) {
      log("zombie scan (powershell) failed: " + String((e && e.message) || e).slice(0, 80));
    }
    return [...pids];
  }

  // لینوکس/مک — الگوها فقط پروسه‌های همین برنامه را می‌گیرند
  try {
    const out = execSync(
      `pgrep -f 'server\\.cjs' | grep -v '^${me}$' || true`,
      { timeout: 8000, shell: true },
    ).toString();
    for (const m of out.matchAll(/\d+/g)) addIfOk(parseInt(m[0], 10));
  } catch { /* ignore */ }
  return [...pids];
}

function killZombiesByPath() {
  const pids = listZombiePids();
  if (pids.length === 0) {
    log("Zombie scan: no stale processes of this app found. ✓");
    return 0;
  }
  let closed = 0;
  for (const pid of pids) {
    if (killPid(pid)) { closed++; log(`Closed stale process of this app (PID ${pid}) ✓`); }
    else { log(`Could not close stale PID ${pid} — will try again via port check.`); }
  }
  return closed;
}

async function takeOverStaleInstances() {
  let closed = 0;
  for (let p = BASE_PORT; p <= PORT_MAX; p++) {
    try {
      if (!(await tcpInUse(p))) continue;
      if (!(await isOurApp(p))) {
        log(`Port ${p} is occupied by another (unknown) program — skipped.`);
        continue;
      }
      const pids = pidsOnPort(p);
      if (pids.length === 0) {
        log(`Port ${p}: stale instance detected but PID not found — skipped.`);
        continue;
      }
      for (const pid of pids) {
        if (pid === process.pid) continue; /* هرگز خود را نکش */
        if (killPid(pid)) { closed++; log(`Closed stale instance of this app (port ${p}, PID ${pid}) ✓`); }
        else { log(`Could not close PID ${pid} on port ${p} — skipped.`); }
      }
    } catch (e) {
      log(`Port ${p} check failed: ${String((e && e.message) || e).slice(0, 80)}`);
    }
  }
  if (closed > 0) {
    await new Promise((r) => setTimeout(r, 1200));
    log(`Stale instances closed: ${closed} — the fresh version will use these ports. ✓`);
  }
  return closed;
}

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

function probeRouteModules(reportLines) {
  const routes = [
    ["bootstrap", ".next/server/app/api/bootstrap/route.js"],
    ["health", ".next/server/app/api/health/route.js"],
    ["settings", ".next/server/app/api/settings/route.js"],
  ];
  for (const [name, rel] of routes) {
    const abs = path.join(APP_DIR, rel);
    try {
      if (!fs.existsSync(abs)) {
        reportLines.push(`route-module ${name}: MISSING FILE -> ${rel} (incomplete extraction?)`);
        continue;
      }
      require(abs);
      reportLines.push(`route-module ${name}: LOAD OK`);
    } catch (e) {
      const stack = String((e && e.stack) || e);
      reportLines.push(`route-module ${name}: LOAD FAILED ⛔`);
      reportLines.push(stack.split("\n").slice(0, 12).join("\n"));
      console.error(`[ShirazAtlas] route-module ${name} failed to load:\n` + stack);
    }
  }
}

(async () => {
  let real;
  try {
    real = fs.realpathSync(DB_PATH);
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

  /* v1.3.0: اول زامبی‌های همین برنامه (حتی هنگ‌کرده) بسته شوند */
  killZombiesByPath();

  await takeOverStaleInstances();

  const port = await firstFreePort(BASE_PORT, PORT_MAX);
  if (!port) {
    fail("No free TCP port in range " + BASE_PORT + "-" + PORT_MAX +
         ".\n           Close other running instances and try again.");
  }
  if (port !== BASE_PORT) {
    log(`Port ${BASE_PORT} is busy (another program) -> using port ${port}`);
  }
  process.env.PORT = String(port);
  process.env.HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  try { fs.writeFileSync(PORT_FILE, String(port)); } catch { /* best effort */ }

  log("Version  : " + VERSION);
  log("Starting server ... (keep this window open / این پنجره را باز نگه دارید)");
  require("./server.js");

  log("============================================================");
  log("  ✓ سامانه آماده است — نشانی معتبر:");
  log("  ✓ READY — the ONLY valid address:");
  log("      >>>  http://localhost:" + port + "  <<<");
  log("============================================================");

  selfTest(port);
})().catch((e) => {
  fail("Startup failed:\n" + ((e && e.stack) || e));
});

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function selfTest(port) {
  const base = "http://127.0.0.1:" + port;
  const reportLines = [];
  const add = (m) => { reportLines.push(m); log(m); };

  reportLines.push("── Environment ──");
  reportLines.push("node: " + process.version + " | platform: " + process.platform + "-" + process.arch);
  reportLines.push("cwd: " + process.cwd());
  reportLines.push("DATABASE_URL: " + String(process.env.DATABASE_URL || "").replace(/^file:/, ""));
  reportLines.push("");

  let health = null;
  let healthRaw = "";
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    try {
      const r = await fetch(base + "/api/health", { signal: AbortSignal.timeout(5000) });
      const t = await r.text();
      try {
        const j = JSON.parse(t);
        if (j && j.ok) { health = j; healthRaw = t; break; }
        healthRaw = t;
      } catch {
        healthRaw = `HTTP ${r.status} | body: ${t.slice(0, 300)}`;
      }
    } catch { /* هنوز آماده نیست */ }
  }

  if (!health) {
    add("SELFTEST FAIL / خودآزمایی ناموفق: /api/health did not answer within 30s");
    if (healthRaw) add("last /api/health response -> " + healthRaw);
    probeRouteModules(reportLines);
    writeReport(port, reportLines);
    return;
  }

  let identityOk = true;
  if (health.service && health.service !== "shiraz-smart-atlas") {
    identityOk = false;
    add("IDENTITY MISMATCH: port is served by an unknown service: " + health.service);
  }
  if (health.version && health.version !== VERSION) {
    identityOk = false;
    add("VERSION MISMATCH / نسخهٔ پاسخ‌دهنده متفاوت است:");
    add("  port " + port + " is served by app version " + health.version +
        " but this launcher is v" + VERSION);
    add("  -> AN OLD COPY OF THE APP IS STILL RUNNING. / یک نسخهٔ قدیمی از سامانه هنوز در حال اجراست.");
    add("  -> Close all old copies (windows + node processes) and run this launcher again.");
    add("     (همهٔ پنجره‌های قدیمی را ببندید یا در Task Manager پروسه‌های node را ببندید و دوباره اجرا کنید)");
  }
  add("SELFTEST health ..... PASS (db.ok=" + (health.db && health.db.ok) +
      ", projects=" + (health.db && health.db.projectCount) + ", app=" + (health.version || "?") + ")");

  let bootOk = false;
  try {
    const r = await fetch(base + "/api/bootstrap", { signal: AbortSignal.timeout(60000) });
    const raw = await r.text();
    let j = null;
    try { j = JSON.parse(raw); } catch {
      reportLines.push(`bootstrap RAW -> HTTP ${r.status} | body: ${raw.slice(0, 300)}`);
    }
    bootOk = !!(j && j.ok);
    if (!bootOk && j && j.error) reportLines.push("bootstrap error: " + j.error);
  } catch (e) {
    reportLines.push("bootstrap exception: " + ((e && e.message) || e));
  }
  add(bootOk && identityOk ? "SELFTEST bootstrap ... PASS — سامانه آماده است ✓"
             : "SELFTEST bootstrap ... " + (identityOk ? "FAIL — داده‌ها بارگذاری نشد ✗" : "SKIPPED — نسخهٔ پاسخ‌دهنده مطابق نیست ✗"));

  probeRouteModules(reportLines);

  if (bootOk && identityOk) {
    log("All checks passed. Open: " + base + "  (report: app/diagnostic-report.txt)");
  } else if (!identityOk) {
    console.error("");
    console.error("[ShirazAtlas] IDENTITY CHECK FAILED / هویت سرور تأیید نشد:");
    console.error("  The address above is NOT served by this launcher.");
    console.error("  نشانی بالا توسط این لانچر سرو نمی‌شود — یک نسخهٔ قدیمی روی پورت است.");
    console.error("  1) Close ALL old app windows / همهٔ پنجره‌های قدیمی را ببندید");
    console.error("  2) Or close node.exe processes in Task Manager / یا در Task Manager پروسه‌های node را ببندید");
    console.error("  3) Run this launcher again / دوباره اجرا کنید");
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
      "── Launcher log ──\n" + LAUNCH_LOG.join("\n") + "\n\n" +
      lines.join("\n") + "\n"
    );
  } catch { /* best effort */ }
}

function appendCrashLog(kind, e) {
  try {
    const stamp = new Date().toISOString();
    fs.appendFileSync(
      path.join(APP_DIR, "crash-log.txt"),
      "[" + stamp + "] " + kind + " v" + VERSION + "\n" +
      String((e && e.stack) || e) + "\n\n",
    );
  } catch { /* best effort */ }
}

process.on("uncaughtException", (e) => {
  console.error("[ShirazAtlas] Unexpected error:", (e && e.stack) || e);
  appendCrashLog("uncaughtException", e);
});
process.on("unhandledRejection", (e) => {
  console.error("[ShirazAtlas] Async error:", (e && (e.stack || e.message)) || e);
  appendCrashLog("unhandledRejection", e);
});
