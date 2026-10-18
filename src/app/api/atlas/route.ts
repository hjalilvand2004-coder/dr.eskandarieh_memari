import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import { computeAtlas } from "@/lib/science/atlas-compute";
import { INDICATOR_CATALOG } from "@/lib/indicators";

export const dynamic = "force-dynamic";

/**
 * اطلس مکانی: موجودیت‌های فضایی + محاسبه واقعی شاخص‌های ریخت‌شناسی
 * انرژی نمایشی از مجموعه داده نمایشی به بناها متصل می‌شود (با برچسب واضح).
 */
export async function GET() {
  try {
    await seedIfEmpty();
    const entities = await db.spatialEntity.findMany();

    // اتصال داده انرژی نمایشی (برچسب‌دار)
    const energyDs = await db.dataset.findFirst({
      where: { name: { contains: "ریخت‌شناسی و انرژی" } },
    });
    const energyByCode = new Map<
      string,
      { heatingKwhM2a: number; coolingKwhM2a: number; totalKwhM2a: number; comfortHoursOut: number }
    >();
    if (energyDs?.data) {
      const rows = JSON.parse(energyDs.data) as Array<{
        code: string;
        heating: number;
        cooling: number;
        total: number;
        comfortHoursOut: number;
      }>;
      rows.forEach((r) =>
        energyByCode.set(r.code, {
          heatingKwhM2a: r.heating,
          coolingKwhM2a: r.cooling,
          totalKwhM2a: r.total,
          comfortHoursOut: r.comfortHoursOut,
        })
      );
    }

    const atlas = computeAtlas(
      entities.map((e) => ({
        code: e.code,
        kind: e.kind,
        name: e.name,
        parentId: e.parentId,
        blockName: e.blockName,
        geometry: e.geometry,
        props: e.props,
      })),
      energyByCode
    );

    return NextResponse.json({
      ok: true,
      data: {
        ...atlas,
        catalog: INDICATOR_CATALOG,
        demoLabel: "داده نمایشی ـ فاقد اعتبار برای استناد علمی",
      },
    });
  } catch (err) {
    console.error("atlas error", err);
    return NextResponse.json({ ok: false, error: "خطا در محاسبه اطلس مکانی" }, { status: 500 });
  }
}
