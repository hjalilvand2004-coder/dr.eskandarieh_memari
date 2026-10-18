import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface DocRow {
  id: string;
  title: string;
  section: string | null;
  content: string;
  kind: string;
}

const STOPWORDS = new Set([
  "و", "در", "به", "از", "که", "این", "با", "برای", "است", "های", "می", "را", "یک", "تا", "کردن", "شود",
  "the", "a", "an", "of", "in", "to", "and", "is", "for", "on", "with",
]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[،؛,.:؟?!()«»\[\]{}"'`]/g, " ")
    .replace(/\u200c/g, " ") // نیم‌فاصله → فاصله برای تطبیق واژه‌ای دقیق
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** شمارش تطبیق دقیق واژه‌ای (نه زیررشته) */
function countWord(haystack: string, token: string): number {
  const words = haystack
    .toLowerCase()
    .replace(/[،؛,.:؟?!()«»\[\]{}"'`]/g, " ")
    .replace(/\u200c/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.filter((w) => w === token).length;
}

/**
 * دستیار پژوهشی — دو حالت:
 * mode=retrieve : بازیابی مستندات با امتیازدهی واژگانی (همیشه فعال)
 * mode=ai       : بازیابی + تولید پاسخ با مدل زبانی (در صورت فراهم بودن سرویس؛ در خطا به بازیابی برمی‌گردد)
 * پاسخ‌ها ارجاع سند دارند و «کافی نبودن اطلاعات» صریح اعلام می‌شود.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = String(body.question ?? "").trim();
    const mode = String(body.mode ?? "retrieve");
    if (!question) return NextResponse.json({ ok: false, error: "پرسش خالی است." }, { status: 400 });

    const docs = (await db.document.findMany()) as DocRow[];
    const tokens = tokenize(question);
    const scored = docs
      .map((d) => {
        const titleWords = d.title.toLowerCase();
        const textWords = `${d.section ?? ""} ${d.content}`;
        let score = 0;
        tokens.forEach((t) => {
          if (countWord(titleWords, t) > 0) score += 3;
          score += Math.min(countWord(textWords, t), 4);
        });
        return { doc: d, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const citations = scored.map((s) => ({ title: s.doc.title, section: s.doc.section, excerpt: s.doc.content.slice(0, 400) }));

    if (mode !== "ai") {
      if (citations.length === 0) {
        return NextResponse.json({
          ok: true,
          data: {
            mode: "retrieve",
            answer: "در اسناد پروژه، پاسخ روشنی برای این پرسش یافت نشد. می‌توانید پرسش را با واژه‌های دیگری بپرسید یا سند مربوط را در میز پژوهش افزوده و دوباره بپرسید.",
            citations: [],
            honesty: "سامانه منبع جعل نمی‌کند.",
          },
        });
      }
      const answer =
        "بر اساس جست‌وجو در اسناد پروژه، این بخش‌ها به پرسش شما نزدیک‌ترین‌اند:\n\n" +
        citations
          .map((c, i) => `${i + 1}. «${c.title}»${c.section ? ` (${c.section})` : ""}:\n${c.excerpt}${c.excerpt.length >= 400 ? "…" : ""}`)
          .join("\n\n") +
        "\n\n— تفکیک: متن‌های بالا «نقل از سند پروژه» هستند. استنباط و پیشنهاد تحلیلی، در حالت هوشمند در دسترس است.";
      return NextResponse.json({ ok: true, data: { mode: "retrieve", answer, citations } });
    }

    // حالت هوشمند: بازیابی + تولید با مدل زبانی (سرور-side) با بازگشت ایمن
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const context = citations
        .map((c, i) => `[سند ${i + 1}: ${c.title}${c.section ? " — " + c.section : ""}]\n${c.excerpt}`)
        .join("\n\n");
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "تو دستیار پژوهشی یک رساله دکتری معماری درباره ریخت‌شناسی بافت تاریخی شیراز و کارایی انرژی هستی. فقط بر اساس «اسناد ارائه‌شده» پاسخ بده. سه بخش جدا بنویس: «نقل از اسناد پروژه»، «استنباط تحلیلی»، «پیشنهاد گام بعدی». اگر اطلاعات کافی در اسناد نبود، صریحاً بنویس «اطلاعات کافی موجود نیست». هیچ منبع، DOI یا عددی جعل نکن. پیشنهادهای معماری، گزینه پژوهشی‌اند نه مجوز مداخله میراثی. پاسخ فارسی و فشرده باشد.",
          },
          {
            role: "user",
            content: `پرسش پژوهشگر: ${question}\n\nاسناد بازیابی‌شده از پروژه:\n${context || "(سند مرتبطی یافت نشد)"}`,
          },
        ],
      });
      const aiText = completion?.choices?.[0]?.message?.content;
      if (!aiText) throw new Error("پاسخ خالی");
      return NextResponse.json({
        ok: true,
        data: { mode: "ai", answer: aiText, citations, honesty: "پاسخ هوشمند فقط بر اسناد بازیابی‌شده متکی است؛ سامانه منبع جعل نمی‌کند." },
      });
    } catch (aiErr) {
      console.error("assistant ai fallback", aiErr);
      const fallback =
        "سرویس تولید پاسخ هوشمند اکنون در دسترس نیست (اتصال مدل زبانی پیکربندی‌شده نیست). نتیجه جست‌وجوی مستندات:\n\n" +
        (citations.length
          ? citations.map((c, i) => `${i + 1}. «${c.title}»${c.section ? ` (${c.section})` : ""}: ${c.excerpt.slice(0, 200)}…`).join("\n")
          : "سند مرتبطی یافت نشد.");
      return NextResponse.json({
        ok: true,
        data: { mode: "fallback", answer: fallback, citations, honesty: "در نبود سرویس، پاسخ واقعیِ حالت سقوط نمایش داده شد و پاسخ ساختگی تولید نشد." },
      });
    }
  } catch (err) {
    console.error("assistant error", err);
    return NextResponse.json({ ok: false, error: "خطای دستیار پژوهشی" }, { status: 500 });
  }
}
