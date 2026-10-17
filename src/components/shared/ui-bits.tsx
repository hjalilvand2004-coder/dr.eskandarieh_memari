"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";

/** برچسب اجباری داده نمایشی — در همه صفحات مرتبط درج می‌شود */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <Badge variant="outline" className={`gap-1 border-copper/60 bg-copper/10 text-copper dark:text-[#d98d5f] text-[11px] ${className}`} title="این داده صوری است و نباید در رساله استناد شود">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      داده نمایشی ـ فاقد اعتبار برای استناد علمی
    </Badge>
  );
}

export function UnconfiguredBadge({ text = "نیازمند اتصال خارجی" }: { text?: string }) {
  return (
    <Badge variant="outline" className="gap-1 border-dashed text-[11px] text-muted-foreground">
      <Info className="h-3 w-3" aria-hidden />
      {text}
    </Badge>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</div>}
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl leading-6">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "turquoise" | "copper" | "lapis";
}) {
  const toneCls =
    tone === "turquoise"
      ? "text-turquoise-deep dark:text-turquoise"
      : tone === "copper"
        ? "text-copper dark:text-[#d98d5f]"
        : tone === "lapis"
          ? "text-lapis dark:text-lapis"
          : "text-foreground";
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-turquoise/60 via-primary/50 to-copper/50" aria-hidden />
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
        </div>
        <div className={`mt-1.5 flex items-baseline gap-1 ${toneCls}`}>
          <span className="text-2xl font-bold num">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground leading-4">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/** فرمول/عبارت لاتین — در محیط RTL با isolate صحیح نمایش داده می‌شود */
export function Ltr({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={`inline-block font-mono text-[13px] ${className}`} style={{ unicodeBidi: "isolate" }}>
      {children}
    </span>
  );
}

export function FormulaBox({ formula, note }: { formula: string; note?: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 flex flex-col gap-1">
      <Ltr className="text-primary dark:text-turquoise font-semibold">{formula}</Ltr>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-dashed last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{k}</span>
      <span className="text-xs font-medium text-left" dir="auto">{v}</span>
    </div>
  );
}

/** وضعیت اعتبارسنجی — بخش ۷ پرامپت */
export function ValidationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    unvalidated: { label: "اعتبارسنجی‌نشده", cls: "border-destructive/40 text-destructive bg-destructive/5" },
    internal_eval: { label: "ارزیابی داخلی", cls: "border-d9a441/50 text-[#8a6a1c] dark:text-[#e5bc6b] bg-[#d9a441]/10" },
    independent_test: { label: "آزمون مستقل", cls: "border-turquoise/50 text-turquoise-deep dark:text-turquoise bg-turquoise/10" },
    external_validation: { label: "اعتبارسنجی خارجی", cls: "border-primary/40 text-primary bg-primary/10" },
  };
  const item = map[status] ?? map.unvalidated;
  return <Badge variant="outline" className={`text-[11px] ${item.cls}`}>{item.label}</Badge>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground leading-5">{hint}</p>}
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}

/** قالب اعداد فارسی */
export function fa(n: number | string, digits = 0): string {
  const num = typeof n === "string" ? Number(n) : n;
  if (typeof num !== "number" || !Number.isFinite(num)) return String(n);
  return num.toLocaleString("fa-IR", { maximumFractionDigits: digits });
}
