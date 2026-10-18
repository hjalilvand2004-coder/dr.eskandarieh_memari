"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SectionHeader, EmptyState } from "@/components/shared/ui-bits";
import { toast } from "@/hooks/use-toast";
import { Bot, Send, Loader2, ShieldCheck, Quote, Lightbulb, BrainCog, ScrollText } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  text: string;
  mode?: string;
  citations?: Array<{ title: string; section: string | null; excerpt: string }>;
  honesty?: string;
}

const SUGGESTED = [
  "شاخص نسبت بازشو به دیوار چگونه تعریف می‌شود؟",
  "وضعیت موتور شبیه‌سازی چیست؟",
  "نشت داده چگونه کنترل می‌شود؟",
  "قرارداد علامت NMBE چیست؟",
  "چارچوب حفاظت میراثی سامانه چیست؟",
];

export function AssistantView() {
  const [messages, setMessages] = React.useState<Msg[]>([
    {
      role: "assistant",
      text:
        "سلام! دستیار پژوهشی سامانه هستم. بر اساس «اسناد پروژه» پاسخ می‌دهم و منبع هر پاسخ را اعلام می‌کنم. " +
        "اگر اطلاعات کافی نباشد، صریحاً می‌گویم؛ منبع جعل نمی‌کنم. پرسش خود را بنویسید یا از پرسش‌های پیشنهادی استفاده کنید.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [aiMode, setAiMode] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, mode: aiMode ? "ai" : "retrieve" }) });
      const j = await r.json();
      if (j.ok) {
        setMessages((m) => [...m, { role: "assistant", text: j.data.answer, mode: j.data.mode, citations: j.data.citations, honesty: j.data.honesty }]);
      } else {
        toast({ title: j.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "خطای شبکه", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="دستیار پژوهشی هوشمند"
        subtitle="پرسش از اسناد پروژه با ارجاع؛ تفکیک «نقل از منبع»، «استنباط» و «پیشنهاد». عدم جعل منبع و اعلام صریح نبود اطلاعات."
        icon={<Bot />}
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        <Card className="flex flex-col h-[560px]">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">گفت‌وگوی پژوهشی</CardTitle>
              <div className="flex items-center gap-2">
                <Switch id="ai-mode" checked={aiMode} onCheckedChange={setAiMode} className="scale-90" />
                <Label htmlFor="ai-mode" className="text-[11px] cursor-pointer">حالت هوشمند (تولید پاسخ با مدل زبانی)</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/70 border rounded-tl-sm"
                  }`}>
                    {m.mode && m.mode !== "retrieve" && (
                      <Badge variant="outline" className="text-[9px] mb-1.5">
                        {m.mode === "ai" ? "پاسخ هوشمند بر اسناد" : "حالت سقوط — سرویس هوشمند در دسترس نیست"}
                      </Badge>
                    )}
                    <div dir="auto">{m.text}</div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t space-y-1.5">
                        {m.citations.map((c, k) => (
                          <div key={k} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <ScrollText className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>«{c.title}»{c.section ? ` — ${c.section}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.honesty && <p className="text-[9px] text-turquoise-deep dark:text-turquoise mt-2">{m.honesty}</p>}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-end">
                  <div className="bg-muted/70 border rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> در حال جست‌وجوی اسناد…
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="پرسش پژوهشی خود را بنویسید…"
                className="h-10"
                aria-label="پرسش"
              />
              <Button onClick={() => send()} disabled={busy || !input.trim()} className="gap-1.5 px-4">
                <Send className="h-4 w-4" /> ارسال
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">پرسش‌های پیشنهادی</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => send(s)} className="w-full text-right text-xs rounded-lg border px-3 py-2 hover:border-turquoise/60 hover:bg-turquoise/5 transition-colors leading-5">
                  {s}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-turquoise" /> الزامات دستیار</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 text-[11px] leading-5 text-muted-foreground">
              <p className="flex gap-1.5"><Quote className="h-3.5 w-3.5 shrink-0 text-primary" /> پاسخ با ارجاع به سند پروژه؛ تفکیک نقل/استنباط/پیشنهاد</p>
              <p className="flex gap-1.5"><Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#d9a441]" /> پیشنهادهای معماری «گزینه پژوهشی» هستند، نه مجوز مداخله میراثی</p>
              <p className="flex gap-1.5"><BrainCog className="h-3.5 w-3.5 shrink-0 text-copper" /> در نبود شواهد: «اطلاعات کافی موجود نیست» — بدون ساخت منبع یا DOI</p>
              <p className="flex gap-1.5"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-turquoise" /> حالت هوشمند فقط با اسناد بازیابی‌شده کار می‌کند و در نبود سرویس، صادقانه اعلام می‌شود</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
