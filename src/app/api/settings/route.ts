import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSkinId } from "@/lib/skins";

export const dynamic = "force-dynamic";

const SETTING_KEY = "theme.skin";

/** خواندن تم سراسری سامانه (عمومی — برای همه کاربران حتی قبل از ورود) */
export async function GET() {
  try {
    const row = await db.systemSetting.findUnique({ where: { key: SETTING_KEY } });
    const skin = row && isSkinId(row.value) ? row.value : "shiraz";
    return NextResponse.json({ ok: true, skin });
  } catch {
    return NextResponse.json(
      { ok: false, error: "خواندن تنظیمات سامانه ناموفق بود." },
      { status: 500 }
    );
  }
}

/**
 * ثبت تم سراسری — فقط نقش مدیر سامانه.
 * تغییر در رویداد ممیزی ثبت می‌شود تا زنجیره پاسخ‌گویی حفظ شود.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { skin, role, actor } = body ?? {};

    if (!isSkinId(skin)) {
      return NextResponse.json({ ok: false, error: "تم درخواستی نامعتبر است." }, { status: 400 });
    }
    if (role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "تنها مدیر سامانه مجاز به تغییر تم سراسری است." },
        { status: 403 }
      );
    }

    const saved = await db.systemSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: skin, updatedBy: typeof actor === "string" ? actor : null },
      update: { value: skin, updatedBy: typeof actor === "string" ? actor : null },
    });

    await db.auditEvent.create({
      data: {
        actor: typeof actor === "string" && actor ? actor : "admin",
        action: "theme.set",
        target: skin,
        detail: "تغییر تم سراسری سامانه در زمان اجرا",
      },
    });

    return NextResponse.json({ ok: true, skin: saved.value });
  } catch {
    return NextResponse.json(
      { ok: false, error: "ثبت تم سراسری ناموفق بود." },
      { status: 500 }
    );
  }
}
