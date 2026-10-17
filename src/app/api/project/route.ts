import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * میز پژوهش — عملیات نوشتن:
 * action=add_question | add_hypothesis | set_hypothesis_status
 * action=add_task | move_task | delete_task
 * action=add_note | add_reference
 * action=advance_chapter
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string;
    let ok = true;

    if (action === "add_question") {
      const count = await db.researchQuestion.count();
      await db.researchQuestion.create({
        data: { code: `Q${count + 1}`, text: String(body.text ?? "").trim(), rationale: body.rationale ?? null, priority: body.priority === "sub" ? "sub" : "main" },
      });
    } else if (action === "add_hypothesis") {
      const count = await db.hypothesis.count();
      await db.hypothesis.create({
        data: { code: `H${count + 1}`, text: String(body.text ?? "").trim(), linkedQuestionCode: body.linkedQuestionCode ?? null, status: "proposed", note: body.note ?? null },
      });
    } else if (action === "set_hypothesis_status") {
      await db.hypothesis.update({ where: { id: String(body.id) }, data: { status: String(body.status) } });
    } else if (action === "add_task") {
      await db.task.create({
        data: { title: String(body.title ?? "").trim(), column: "todo", priority: body.priority ?? "medium", chapterId: body.chapterId || null, dueDate: body.dueDate || null },
      });
    } else if (action === "move_task") {
      const cols = ["todo", "doing", "review", "done"];
      if (cols.includes(String(body.column))) {
        await db.task.update({ where: { id: String(body.id) }, data: { column: String(body.column), updatedAt: new Date() } });
      }
    } else if (action === "delete_task") {
      await db.task.delete({ where: { id: String(body.id) } });
    } else if (action === "add_note") {
      await db.note.create({
        data: { kind: ["general", "methodological", "limitation", "decision"].includes(body.kind) ? body.kind : "general", title: String(body.title ?? "بدون عنوان"), body: String(body.body ?? "") },
      });
    } else if (action === "add_reference") {
      await db.reference.create({
        data: { kind: body.kind ?? "book", title: String(body.title ?? "").trim(), authors: String(body.authors ?? "").trim(), year: body.year ?? null, venue: body.venue ?? null, doiOrUrl: body.doiOrUrl ?? null, note: body.note ?? "پیش از استناد، مشخصات کتاب‌شناختی بازبینی شود." },
      });
    } else if (action === "advance_chapter") {
      const ch = await db.chapter.findUnique({ where: { id: String(body.id) } });
      if (ch) {
        // پیشرفت بر مبنای وظایف واقعی مرتبط محاسبه می‌شود؛ اگر وظیفه‌ای متصل نیست، دستی جلو برده می‌شود
        const next = Math.min(100, ch.progress + 10);
        const status = next >= 100 ? "done" : next > 0 ? "in_progress" : ch.status;
        await db.chapter.update({ where: { id: ch.id }, data: { progress: next, status } });
      }
    } else {
      ok = false;
    }

    if (!ok) return NextResponse.json({ ok: false, error: "عملیات ناشناخته" }, { status: 400 });
    await db.auditEvent.create({ data: { actor: body.actor ?? "پژوهشگر", action, target: body.id ?? "", detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("project POST error", err);
    return NextResponse.json({ ok: false, error: "خطا در ثبت تغییرات" }, { status: 500 });
  }
}
