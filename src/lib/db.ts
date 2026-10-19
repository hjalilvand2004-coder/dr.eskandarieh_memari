import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

/**
 * ── تشخیص خودکار نشانی دیتابیس (v1.2.2) ──
 *
 * مشکل ریشه‌ای نسخه‌های قبل: اگر متغیر محیطی DATABASE_URL به هر دلیلی
 * در محیط اجرا معتبر نبود (فایل `.env` باقی‌مانده از بسته‌بندی، مسیر
 * OneDrive، BAT قدیمی، مسیر فارسی/فاصله‌دار)، کلاینت Prisma در لحظهٔ
 * «بارگذاری ماژول» کرش می‌کرد و همهٔ APIها پاسخ خام 500
 * (Internal Server Error) می‌دادند.
 *
 * راه‌حل: نشانی در زمان اجرا ساخته و با «وجود واقعی فایل» اعتبارسنجی
 * می‌شود؛ در صورت نامعتبر بودن، به `db/custom.db` کنار server.js
 * برمی‌گردیم. هیچ‌گاه در زمان بارگذاری ماژول خطا پرتاب نمی‌شود.
 */

function fileFromUrl(url: string): string | null {
  try {
    if (url.startsWith('file://')) return decodeURIComponent(url.slice(7))
    if (url.startsWith('file:')) return decodeURIComponent(url.slice(5))
    return url
  } catch {
    return null
  }
}

function urlFromFile(p: string): string {
  return 'file:' + p.replace(/\\/g, '/')
}

function computeDatabaseUrl(): string {
  const candidates: Array<{ label: string; url: string }> = []

  // ۱) متغیر محیطی (از server.cjs یا BAT) — فقط اگر فایل واقعاً وجود دارد
  const envUrl = process.env.DATABASE_URL?.trim()
  if (envUrl) {
    const f = fileFromUrl(envUrl)
    // مسیرهای ویژه مثل :memory: را می‌پذیریم
    if (f === null || f === '' || f === ':memory:') {
      candidates.push({ label: 'env-as-is', url: envUrl })
    } else if (fs.existsSync(f)) {
      candidates.push({ label: 'env', url: envUrl })
    } else {
      console.warn(
        `[db] DATABASE_URL points to a missing file, ignoring -> ${f}`,
      )
    }
  }

  // ۲) دیتابیس کنار اجرا (پرتابل: BAT به پوشه app می‌رود؛ توسعه: ریشه پروژه)
  try {
    const cwdDb = path.join(process.cwd(), 'db', 'custom.db')
    if (fs.existsSync(cwdDb)) candidates.push({ label: 'cwd', url: urlFromFile(cwdDb) })
  } catch {
    /* ignore */
  }

  // ۳) فال‌بک نهایی — همان مسیر محیطی یا مسیر نسبی استاندارد؛ هیچ‌گاه throw نمی‌کنیم
  if (candidates.length === 0) {
    const fallback = envUrl || urlFromFile(path.join(process.cwd(), 'db', 'custom.db'))
    console.warn(`[db] falling back to (file may be created on first use): ${fallback}`)
    candidates.push({ label: 'fallback', url: fallback })
  }

  const chosen = candidates[0]
  if (process.env.NODE_ENV !== 'production' || chosen.label !== 'env') {
    // در پروداکشن فقط وقتی از حالت عادی خارج شده‌ایم لاگ می‌کنیم
    console.log(`[db] database resolved via "${chosen.label}"`)
  }
  return chosen.url
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// datasourceUrl صریح ← کلاینت هرگز به دنبال envهای گمشده نمی‌گردد و کرش نمی‌کند
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: computeDatabaseUrl(),
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
