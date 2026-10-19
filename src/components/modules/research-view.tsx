"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionHeader, EmptyState, fa, DemoBadge } from "@/components/shared/ui-bits";
import { EChart, useBaseOption } from "@/components/charts/echart";
import { useAppStore, canWrite } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { fetchJson } from "@/lib/safe-json";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import {
  ClipboardList, Plus, HelpCircle, FlaskConical, BookMarked, StickyNote,
  KanbanSquare, Network, Upload, RefreshCw, ChevronLeft, Workflow, Loader2,
} from "lucide-react";

interface BootstrapShape {
  questions: Array<{ id: string; code: string; text: string; rationale?: string | null; priority: string }>;
  hypotheses: Array<{ id: string; code: string; text: string; status: string; linkedQuestionCode?: string | null; note?: string | null }>;
  chapters: Array<{ id: string; order: number; title: string; description?: string | null; status: string; progress: number }>;
  tasks: Array<{ id: string; title: string; column: string; priority: string; dueDate?: string | null }>;
  notes: Array<{ id: string; kind: string; title: string; body: string }>;
  references: Array<{ id: string; kind: string; title: string; authors: string; year?: string | null; venue?: string | null; doiOrUrl?: string | null; note?: string | null }>;
}

const KANBAN_COLS = [
  { key: "todo", label: "انجام‌نشده" },
  { key: "doing", label: "در حال انجام" },
  { key: "review", label: "بازبینی" },
  { key: "done", label: "انجام‌شده" },
];

const HYPO_STATUS: Record<string, string> = {
  proposed: "پیشنهادی", under_test: "در حال آزمون", supported: "پشتیبانی‌شده", rejected: "ردشده", inconclusive: "بی‌نتیجه",
};

export function ResearchView() {
  const [data, setData] = React.useState<BootstrapShape | null>(null);
  const [tab, setTab] = React.useState("qa");
  const role = useAppStore((s) => s.user?.role);
  const writable = canWrite(role);

  const reload = React.useCallback(() => {
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((j) => j.ok && setData(j.data));
  }, []);
  React.useEffect(reload, [reload]);

  const act = React.useCallback(
    async (payload: Record<string, unknown>, successMsg: string) => {
      const j = await fetchJson("/api/project", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (j.ok) {
        toast({ title: successMsg });
        reload();
      } else {
        toast({ title: j.error ?? "خطا", variant: "destructive" });
      }
    },
    [reload]
  );

  if (!data) return <EmptyState title="در حال بارگذاری میز پژوهش…" />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="میز پژوهش"
        subtitle="مدیریت پرسش‌ها، فرضیه‌ها، فصل‌های رساله، فعالیت‌ها، یادداشت‌ها و منابع — با زنجیره ردیابی پرسش تا نتیجه."
        icon={<ClipboardList />}
      />
      {!writable && <p className="text-xs text-destructive">نقش مشاهده‌گر: امکان تغییر داده‌ها وجود ندارد.</p>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="qa" className="gap-1.5 text-xs"><HelpCircle className="h-3.5 w-3.5" /> پرسش‌ها و فرضیه‌ها</TabsTrigger>
          <TabsTrigger value="chapters" className="gap-1.5 text-xs"><BookMarked className="h-3.5 w-3.5" /> فصل‌ها</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5 text-xs"><KanbanSquare className="h-3.5 w-3.5" /> کانبان فعالیت‌ها</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 text-xs"><StickyNote className="h-3.5 w-3.5" /> یادداشت‌ها و تصمیم‌ها</TabsTrigger>
          <TabsTrigger value="refs" className="gap-1.5 text-xs"><Upload className="h-3.5 w-3.5" /> منابع</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5 text-xs"><Network className="h-3.5 w-3.5" /> نقشه ارتباطات پژوهش</TabsTrigger>
        </TabsList>

        {/* ── پرسش‌ها و فرضیه‌ها ── */}
        <TabsContent value="qa" className="mt-4 grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                پرسش‌های پژوهش
                {writable && <AddQuestionDialog onAdd={(text, priority) => act({ action: "add_question", text, priority }, "پرسش افزوده شد")} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.questions.map((q) => (
                <div key={q.id} className="rounded-xl border p-3 hover:border-turquoise/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-bold text-[11px] ${q.priority === "main" ? "border-lapis/40 text-lapis dark:text-[#6ca6c9]" : ""}`}>{q.code}</Badge>
                    {q.priority === "sub" && <Badge variant="secondary" className="text-[10px]">زیرپرسش</Badge>}
                  </div>
                  <p className="text-sm mt-2 leading-6">{q.text}</p>
                  {q.rationale && <p className="text-[11px] text-muted-foreground mt-1.5 leading-5">{q.rationale}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                فرضیه‌ها و وضعیت آزمون
                {writable && <AddHypothesisDialog questions={data.questions} onAdd={(text, linked) => act({ action: "add_hypothesis", text, linkedQuestionCode: linked }, "فرضیه افزوده شد")} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.hypotheses.map((h) => (
                <div key={h.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-bold text-[11px] border-copper/40 text-copper">{h.code}</Badge>
                    {writable ? (
                      <Select value={h.status} onValueChange={(v) => act({ action: "set_hypothesis_status", id: h.id, status: v }, "وضعیت فرضیه به‌روزرسانی شد")}>
                        <SelectTrigger className="h-7 w-32 text-[11px]" aria-label="وضعیت فرضیه">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(HYPO_STATUS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">{HYPO_STATUS[h.status]}</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-2 leading-6">{h.text}</p>
                  {h.linkedQuestionCode && <p className="text-[10px] text-muted-foreground mt-1">مربوط به {h.linkedQuestionCode}</p>}
                  {h.note && <p className="text-[11px] text-muted-foreground mt-1 leading-5">{h.note}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── فصل‌ها ── */}
        <TabsContent value="chapters" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">فصل‌های رساله — پیشرفت بر مبنای وظایف و تأیید پژوهشگر</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {data.chapters.map((ch) => (
                <div key={ch.id} className="rounded-xl border p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">فصل {fa(ch.order, 0)} — {ch.title}</p>
                    <Badge variant={ch.status === "done" ? "default" : "secondary"} className={`text-[10px] ${ch.status === "done" ? "bg-turquoise text-white" : ""}`}>
                      {ch.status === "done" ? "تکمیل" : ch.status === "in_progress" ? "در جریان" : "پیش‌نویس"}
                    </Badge>
                  </div>
                  {ch.description && <p className="text-xs text-muted-foreground">{ch.description}</p>}
                  <Progress value={ch.progress} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground num">{fa(ch.progress, 0)}٪</span>
                    {writable && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => act({ action: "advance_chapter", id: ch.id }, "پیشرفت فصل ثبت شد")}>
                        ثبت گام پیشرفت <ChevronLeft className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── کانبان ── */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard tasks={data.tasks} writable={writable} act={act} />
        </TabsContent>

        {/* ── یادداشت‌ها ── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                یادداشت‌ها، تصمیم‌های روش‌شناختی و محدودیت‌ها
                {writable && <AddNoteDialog onAdd={(title, body, kind) => act({ action: "add_note", title, body, kind }, "یادداشت ثبت شد")} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {data.notes.map((n) => (
                <div key={n.id} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {n.kind === "decision" ? "تصمیم روش‌شناختی" : n.kind === "limitation" ? "محدودیت" : n.kind === "methodological" ? "روش‌شناختی" : "عمومی"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs leading-6 text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── منابع ── */}
        <TabsContent value="refs" className="mt-4">
          <ReferencesTab refs={data.references} writable={writable} act={act} />
        </TabsContent>

        {/* ── نقشه ارتباطات ── */}
        <TabsContent value="map" className="mt-4">
          <ResearchMapCard data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────── کانبان ───────────────

function KanbanBoard({ tasks, writable, act }: { tasks: BootstrapShape["tasks"]; writable: boolean; act: (p: Record<string, unknown>, m: string) => Promise<void> }) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState("");
  const [newPriority, setNewPriority] = React.useState("medium");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">برد کانبان فعالیت‌های پژوهش</CardTitle>
      </CardHeader>
      <CardContent>
        {writable && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="عنوان فعالیت جدید…" className="flex-1 min-w-56 h-9" />
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">اولویت بالا</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">کم</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-9 px-4" onClick={() => { if (newTitle.trim()) { act({ action: "add_task", title: newTitle, priority: newPriority }, "فعالیت افزوده شد"); setNewTitle(""); } }}>
              <Plus className="h-4 w-4 ml-1" /> افزودن
            </Button>
          </div>
        )}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLS.map((col) => (
            <div
              key={col.key}
              className="rounded-xl bg-muted/40 p-3 min-h-48"
              onDragOver={(e) => writable && e.preventDefault()}
              onDrop={() => { if (writable && dragId) { act({ action: "move_task", id: dragId, column: col.key }, "کارت منتقل شد"); setDragId(null); } }}
            >
              <p className="text-xs font-bold mb-3 flex items-center gap-2">
                {col.label}
                <Badge variant="secondary" className="text-[10px]">{fa(tasks.filter((t) => t.column === col.key).length, 0)}</Badge>
              </p>
              <div className="space-y-2">
                {tasks.filter((t) => t.column === col.key).map((t) => (
                  <div
                    key={t.id}
                    draggable={writable}
                    onDragStart={() => setDragId(t.id)}
                    className={`rounded-lg border bg-card p-2.5 text-xs space-y-1.5 ${writable ? "cursor-grab active:cursor-grabbing hover:border-turquoise/60" : ""}`}
                  >
                    <p className="leading-5">{t.title}</p>
                    <div className="flex items-center justify-between gap-1">
                      <Badge variant="outline" className={`text-[9px] ${t.priority === "high" ? "border-destructive/40 text-destructive" : t.priority === "low" ? "" : "border-d9a441/50"}`}>
                        {t.priority === "high" ? "بالا" : t.priority === "low" ? "کم" : "متوسط"}
                      </Badge>
                      {writable && (
                        <div className="flex gap-0.5">
                          {KANBAN_COLS.filter((c) => c.key !== col.key).map((c) => (
                            <button
                              key={c.key}
                              title={`انتقال به ${c.label}`}
                              className="px-1 rounded hover:bg-accent text-[10px] text-muted-foreground"
                              onClick={() => act({ action: "move_task", id: t.id, column: c.key }, "کارت منتقل شد")}
                            >
                              {c.key === "todo" ? "۱" : c.key === "doing" ? "۲" : c.key === "review" ? "۳" : "۴"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {t.dueDate && <p className="text-[10px] text-muted-foreground">مهلت: {t.dueDate}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────── منابع + BibTeX/RIS ───────────────

function ReferencesTab({ refs, writable, act }: { refs: BootstrapShape["references"]; writable: boolean; act: (p: Record<string, unknown>, m: string) => Promise<void> }) {
  const [importText, setImportText] = React.useState("");

  const parseAndImport = async () => {
    const text = importText.trim();
    if (!text) return;
    const isBibtex = text.includes("@");
    const parsed: Array<{ title: string; authors: string; year?: string; venue?: string; kind: string }> = [];
    if (isBibtex) {
      const entries = text.split(/@\w+\{/).slice(1);
      for (const e of entries) {
        const getType = text.split(/@(\w+)\{/);
        const title = e.match(/title\s*=\s*[{"'](.+?)[}"']\s*,?\s*\n/i)?.[1] ?? "";
        const author = e.match(/author\s*=\s*[{"'](.+?)[}"']\s*,?\s*\n/i)?.[1] ?? "";
        const year = e.match(/year\s*=\s*[{"']?(\d{4})[{"']?/i)?.[1] ?? "";
        const journal = e.match(/(journal|booktitle)\s*=\s*[{"'](.+?)[}"']/i)?.[2] ?? "";
        if (title) parsed.push({ title, authors: author.replace(/ and /g, "؛ "), year, venue: journal, kind: journal ? "article" : "book" });
      }
    } else {
      // RIS
      const blocks = text.split(/ER\s*-\s*$/m).filter((b) => b.trim());
      for (const b of blocks) {
        const get = (tag: string) => b.match(new RegExp(`${tag}\\s+-\\s+(.+)`, "i"))?.[1]?.trim() ?? "";
        const title = get("TI") || get("T1");
        if (!title) continue;
        const authors = [...b.matchAll(/AU\s+-\s+(.+)/gi)].map((m) => m[1].trim()).join("؛ ");
        parsed.push({ title, authors, year: get("PY") || get("Y1")?.slice(0, 4), venue: get("JO") || get("JF") || get("T2"), kind: get("TY")?.startsWith("JOUR") ? "article" : "book" });
      }
    }
    if (parsed.length === 0) {
      toast({ title: "هیچ مدخلی شناسایی نشد", description: "قالب BibTeX یا RIS معتبر وارد کنید.", variant: "destructive" });
      return;
    }
    for (const p of parsed) {
      await act({ action: "add_reference", ...p, note: "ورود از BibTeX/RIS — مشخصات پیش از استناد بازبینی شود." }, `مدخل «${p.title.slice(0, 30)}…» افزوده شد`);
    }
    setImportText("");
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">ورود کتاب‌شناختی از BibTeX یا RIS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"مثال BibTeX:\n@article{ratti2005,\n  title={Energy consumption and urban texture},\n  author={Ratti, C. and Baker, N.},\n  journal={Energy and Buildings},\n  year={2005}\n}\n\nیا قالب RIS با TI/AU/PY"}
            className="min-h-40 text-xs font-mono ltr-block"
          />
          {writable && <Button size="sm" onClick={parseAndImport}>تجزیه و افزودن مدخل‌ها</Button>}
          <p className="text-[11px] text-muted-foreground leading-5">
            سامانه فقط مدخل‌های شناسایی‌شده را اضافه می‌کند؛ هیچ منبعی جعل نمی‌شود. مشخصات هر مدخل پیش از استناد نهایی باید بازبینی شود.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">کتابخانه منابع ({fa(refs.length, 0)} مدخل)</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pe-2">
            <div className="space-y-3">
              {refs.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px]">
                      {r.kind === "article" ? "مقاله" : r.kind === "book" ? "کتاب" : r.kind === "standard" ? "استاندارد" : r.kind === "tool" ? "ابزار" : r.kind}
                    </Badge>
                    {r.year && r.year !== "—" && <span className="text-[10px] text-muted-foreground num" dir="ltr">{r.year}</span>}
                  </div>
                  <p className="text-sm font-semibold leading-6">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.authors}</p>
                  {r.venue && <p className="text-[11px] text-muted-foreground mt-0.5" dir="auto">{r.venue}</p>}
                  {r.doiOrUrl && <p className="text-[10px] text-turquoise-deep dark:text-turquoise mt-1 ltr-block">{r.doiOrUrl}</p>}
                  {r.note && <p className="text-[10px] text-copper mt-1.5 leading-4">یادآوری: {r.note}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────── نقشه ارتباطات پژوهش (انتخاب نمایش) ───────────────

const ResearchFlowDiagram = dynamic(() => import("./research-flow"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] rounded-lg border grid place-items-center bg-muted/30">
      <span className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> بارگذاری دیاگرام…</span>
    </div>
  ),
});

function ResearchMapCard({ data }: { data: BootstrapShape }) {
  const [mode, setMode] = React.useState<"flow" | "force">("flow");
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">نقشه ارتباطات پژوهش — پرسش ← فرضیه ← متغیر ← داده ← روش ← آزمایش ← نتیجه ← فصل</CardTitle>
          <div className="flex rounded-lg border p-0.5 bg-muted/40" role="tablist" aria-label="نوع دیاگرام">
            <Button variant={mode === "flow" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => setMode("flow")} role="tab" aria-selected={mode === "flow"}><Workflow className="h-3.5 w-3.5" /> دیاگرام ساختاری</Button>
            <Button variant={mode === "force" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-[11px] gap-1" onClick={() => setMode("force")} role="tab" aria-selected={mode === "force"}><Network className="h-3.5 w-3.5" /> گراف نیرویی</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {mode === "flow" ? <ResearchFlowDiagram data={data} /> : <ResearchMapGraph data={data} />}
        <p className="text-[11px] text-muted-foreground mt-2 leading-5">
          {mode === "flow"
            ? "دیاگرام ساختاری تعاملی (React Flow): لایه‌بندی قطعی زنجیره ردیابی؛ هر نتیجه تحلیل باید در این زنجیره قابل ردیابی به داده، روش و نسخه باشد."
            : "گراف تعاملی است (جابه‌جایی و بزرگ‌نمایی ممکن است). هر نتیجه تحلیل باید در این زنجیره قابل ردیابی به داده، روش و نسخه باشد."}
        </p>
      </CardContent>
    </Card>
  );
}

function ResearchMapGraph({ data }: { data: BootstrapShape }) {
  const base = useBaseOption();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const nodes: Array<{ id: string; name: string; category: number; symbolSize: number; value?: string }> = [];
  const links: Array<{ source: string; target: string }> = [];

  // لایه‌ها: پرسش(0) ← متغیر(1) ← داده(2) ← روش(3) ← آزمایش(4) ← نتیجه(5) ← فصل(6)
  const layerNames = ["پرسش پژوهش", "متغیر", "داده", "روش", "آزمایش", "نتیجه", "فصل رساله"];
  data.questions.forEach((q) => nodes.push({ id: `q-${q.id}`, name: q.code, category: 0, symbolSize: 34, value: q.text }));
  ["ارتفاع بنا", "WWR", "کیفیت پوسته", "سطح اشغال", "حیاط مرکزی"].forEach((v, i) => nodes.push({ id: `v-${i}`, name: v, category: 1, symbolSize: 22 }));
  nodes.push({ id: "d-1", name: "داده نمایشی ریخت‌انرژی", category: 2, symbolSize: 28, value: "۵۱ رکورد نمایشی" });
  nodes.push({ id: "m-1", name: "آمار توصیفی و همبستگی", category: 3, symbolSize: 24 });
  nodes.push({ id: "m-2", name: "K-Means", category: 3, symbolSize: 24 });
  nodes.push({ id: "m-3", name: "رگرسیون OLS (تفکیک گروهی)", category: 3, symbolSize: 24 });
  nodes.push({ id: "e-1", name: "اجرای تحلیل آزمایشگاه", category: 4, symbolSize: 26 });
  nodes.push({ id: "r-1", name: "پروفایل تیپ‌ها", category: 5, symbolSize: 24 });
  nodes.push({ id: "r-2", name: "معیارهای آزمون (MAE/RMSE/R²)", category: 5, symbolSize: 24 });
  data.chapters.forEach((c) => nodes.push({ id: `c-${c.id}`, name: `فصل ${c.order}`, category: 6, symbolSize: 28, value: c.title }));

  data.questions.forEach((q) => {
    for (let i = 0; i < 5; i++) links.push({ source: `q-${q.id}`, target: `v-${i}` });
  });
  for (let i = 0; i < 5; i++) links.push({ source: `v-${i}`, target: "d-1" });
  links.push({ source: "d-1", target: "m-1" }, { source: "d-1", target: "m-2" }, { source: "d-1", target: "m-3" });
  links.push({ source: "m-1", target: "e-1" }, { source: "m-2", target: "e-1" }, { source: "m-3", target: "e-1" });
  links.push({ source: "e-1", target: "r-1" }, { source: "e-1", target: "r-2" });
  data.chapters.forEach((c) => links.push({ source: "r-1", target: `c-${c.id}` }, { source: "r-2", target: `c-${c.id}` }));

  const option: React.ComponentProps<typeof EChart>["option"] = {
    ...base,
    tooltip: { ...base.tooltip, formatter: (p: { data?: { value?: string; name?: string } }) => p.data?.value || p.data?.name || "" },
    legend: { ...base.legend, data: layerNames, top: 8, textStyle: { ...base.legend.textStyle, fontSize: 11 } },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        draggable: true,
        categories: layerNames.map((n, i) => ({ name: n, itemStyle: { color: ["#1f4e6e", "#17877d", "#b4693b", "#d9a441", "#7a8c5c", "#8b5d76", "#56B4E9"][i] } })),
        force: { repulsion: 220, edgeLength: 60 },
        label: { show: true, color: isDark ? "#e8e3d7" : "#1b2a38", fontSize: 10, fontFamily: "Vazirmatn" },
        edgeSymbol: ["none", "arrow"],
        edgeSymbolSize: 7,
        lineStyle: { color: isDark ? "#3e5d78" : "#b9c4ce", curveness: 0.12 },
        data: nodes,
        links,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">نقشه ارتباطات پژوهش — پرسش ← متغیر ← داده ← روش ← آزمایش ← نتیجه ← فصل</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <EChart option={option} height={460} />
        <p className="text-[11px] text-muted-foreground mt-2 leading-5">
          گراف تعاملی است (جابه‌جایی و بزرگ‌نمایی ممکن است). هر نتیجه تحلیل باید در این زنجیره قابل ردیابی به داده، روش و نسخه باشد.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────── دیالوگ‌های افزودن ───────────────

function AddQuestionDialog({ onAdd }: { onAdd: (text: string, priority: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [priority, setPriority] = React.useState("main");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[11px]"><Plus className="h-3 w-3 ml-1" /> افزودن پرسش</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>پرسش پژوهش جدید</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="متن پرسش…" className="min-h-20" />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="main">پرسش اصلی</SelectItem>
              <SelectItem value="sub">زیرپرسش</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { if (text.trim()) { onAdd(text.trim(), priority); setText(""); setOpen(false); } }}>ثبت پرسش</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddHypothesisDialog({ questions, onAdd }: { questions: BootstrapShape["questions"]; onAdd: (text: string, linked: string | null) => void }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [linked, setLinked] = React.useState<string>("none");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[11px]"><Plus className="h-3 w-3 ml-1" /> افزودن فرضیه</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>فرضیه جدید</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="متن فرضیه…" className="min-h-20" />
          <Select value={linked} onValueChange={setLinked}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون اتصال</SelectItem>
              {questions.map((q) => <SelectItem key={q.id} value={q.code}>{q.code} — {q.text.slice(0, 40)}…</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { if (text.trim()) { onAdd(text.trim(), linked === "none" ? null : linked); setText(""); setOpen(false); } }}>ثبت فرضیه</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddNoteDialog({ onAdd }: { onAdd: (title: string, body: string, kind: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [kind, setKind] = React.useState("general");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[11px]"><Plus className="h-3 w-3 ml-1" /> یادداشت جدید</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>یادداشت / تصمیم / محدودیت</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="شرح کامل…" className="min-h-24" />
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">عمومی</SelectItem>
              <SelectItem value="methodological">روش‌شناختی</SelectItem>
              <SelectItem value="decision">تصمیم روش‌شناختی</SelectItem>
              <SelectItem value="limitation">محدودیت</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { if (title.trim()) { onAdd(title.trim(), body, kind); setTitle(""); setBody(""); setOpen(false); } }}>ثبت</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
