import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * بوت‌استرپ سامانه: seed در صورت خالی‌بودن + همه داده‌های پایه
 */
export async function GET() {
  try {
    await seedIfEmpty();

    const [project, questions, hypotheses, chapters, tasks, notes, references, datasets, weather, simModel, experimentRuns, scenarios, documents, audit] =
      await Promise.all([
        db.project.findFirst(),
        db.researchQuestion.findMany({ orderBy: { code: "asc" } }),
        db.hypothesis.findMany({ orderBy: { code: "asc" } }),
        db.chapter.findMany({ orderBy: { order: "asc" } }),
        db.task.findMany({ orderBy: { createdAt: "asc" } }),
        db.note.findMany({ orderBy: { createdAt: "desc" } }),
        db.reference.findMany({ orderBy: { createdAt: "asc" } }),
        db.dataset.findMany({ select: { id: true, name: true, kind: true, origin: true, source: true, license: true, scale: true, crs: true, units: true, timeRange: true, timeResolution: true, missingPolicy: true, qualityNote: true, uncertainty: true, enteredBy: true, version: true, rowCount: true, variables: true, createdAt: true, updatedAt: true } }),
        db.weatherFile.findFirst(),
        db.simulationModel.findFirst(),
        db.experimentRun.findMany({ orderBy: { createdAt: "desc" } }),
        db.scenario.findMany({ orderBy: { createdAt: "asc" } }),
        db.document.findMany({ orderBy: { title: "asc" } }),
        db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      ]);

    // آمار زنده برای داشبورد
    const [entityCount, indicatorCount, mlCount, validationCount] = await Promise.all([
      db.spatialEntity.count(),
      db.morphologyIndicator.count(),
      db.mLModel.count(),
      db.validationResult.count(),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        project,
        questions,
        hypotheses,
        chapters,
        tasks,
        notes,
        references,
        datasets,
        weather,
        simModel,
        experimentRuns,
        scenarios,
        documents,
        audit,
        stats: { entityCount, indicatorCount, mlCount, validationCount },
      },
    });
  } catch (err) {
    console.error("bootstrap error", err);
    return NextResponse.json({ ok: false, error: "خطا در بارگذاری داده‌های سامانه" }, { status: 500 });
  }
}
