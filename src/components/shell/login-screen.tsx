"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type Role } from "@/lib/store";
import { Compass, Map, FlaskConical, LineChart, ShieldCheck, Sparkles, UserRound, Crown, Eye } from "lucide-react";

const ROLES: Array<{ role: Role; label: string; desc: string; icon: React.ReactNode }> = [
  { role: "admin", label: "مدیر", desc: "دسترسی کامل شامل تغییر تم سراسری و حذف داده", icon: <Crown className="h-3.5 w-3.5" /> },
  { role: "researcher", label: "پژوهشگر", desc: "ثبت داده، اجرای تحلیل، خروجی گزارش", icon: <UserRound className="h-3.5 w-3.5" /> },
  { role: "viewer", label: "مشاهده‌گر", desc: "دسترسی فقط‌خواندنی", icon: <Eye className="h-3.5 w-3.5" /> },
];

/** نقش girih زنده با رنگ هماهنگ تم */
function GirihOverlay() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.13] pointer-events-none" aria-hidden>
      <defs>
        <pattern id="girih-login" width="72" height="72" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M36 4 L50 18 L50 36 L36 50 L22 36 L22 18 Z" />
            <path d="M36 22 L44 30 L36 38 L28 30 Z" />
            <circle cx="36" cy="30" r="3" />
            <path d="M0 54 L18 54 M54 54 L72 54 M0 18 L18 18 M54 18 L72 18" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#girih-login)" />
    </svg>
  );
}

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [name, setName] = React.useState("دکتر سارا اسکندریه");
  const [role, setRole] = React.useState<Role>("researcher");

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* پس‌زمینه چندلایه: گرادیان + هاله‌های رنگی + girih */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 640px at 82% -6%, var(--glow-a), transparent 60%)," +
            "radial-gradient(820px 600px at 8% 108%, var(--glow-b), transparent 55%)," +
            "linear-gradient(165deg, var(--sidebar), var(--lapis-deep) 85%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 text-white" aria-hidden>
        <GirihOverlay />
      </div>
      {/* هاله‌های شناور */}
      <div className="app-orbs" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_1fr] gap-6 items-stretch">
          {/* پنل معرفی — شیشه‌ای */}
          <div className="relative rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl p-8 flex flex-col justify-between shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)] overflow-hidden">
            <div
              className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full opacity-70"
              style={{ background: "var(--glow-a)", filter: "blur(60px)" }}
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center gap-3.5">
                <div className="logo-glow h-13 w-13 rounded-2xl bg-gradient-to-br from-turquoise via-lapis to-copper grid place-items-center shadow-xl ring-1 ring-white/30">
                  <Compass className="h-6.5 w-6.5 text-white" aria-hidden />
                </div>
                <div>
                  <h1 className="text-[26px] font-extrabold leading-9 tracking-tight">شیراز</h1>
                  <p className="text-[13px] text-sidebar-primary/90 font-medium">اطلس هوشمند ریخت‌شناسی و انرژی</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                <Badge className="bg-white/10 border border-white/15 text-sidebar-foreground/90 text-[10px] font-medium hover:bg-white/10">پژوهش فضایی</Badge>
                <Badge className="bg-white/10 border border-white/15 text-sidebar-foreground/90 text-[10px] font-medium hover:bg-white/10">انرژی ساختمان</Badge>
                <Badge className="bg-white/10 border border-white/15 text-sidebar-foreground/90 text-[10px] font-medium hover:bg-white/10">علم داده</Badge>
              </div>

              <p className="mt-5 text-sm leading-7.5 text-[#e6e9ee]">
                محیط یکپارچه مدیریت پژوهش، تحلیل فضایی، شبیه‌سازی و ارزیابی مدل برای رساله دکتری معماری
                با موضوع «تبیین الگوهای ریخت‌شناسی در بافت تاریخی با تأکید بر کارایی انرژی — نمونه پژوهشی:
                بافت تاریخی شهر شیراز».
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-2.5">
                {[
                  { icon: <Map className="h-4 w-4" aria-hidden />, t: "اطلس مکانی", d: "شاخص‌های ریخت‌شناسی قابل محاسبه", c: "text-turquoise" },
                  { icon: <FlaskConical className="h-4 w-4" aria-hidden />, t: "آزمایشگاه داده", d: "تحلیل آماری و ML واقعی با seed", c: "text-sidebar-primary" },
                  { icon: <LineChart className="h-4 w-4" aria-hidden />, t: "شکل علمی", d: "خروجی استنادپذیر با منشأ و کپشن", c: "text-copper" },
                ].map((f) => (
                  <div key={f.t} className="rounded-2xl border border-white/12 bg-white/[0.06] p-3 transition-colors hover:bg-white/[0.1]">
                    <span className={`inline-grid h-8 w-8 place-items-center rounded-lg bg-white/10 ${f.c}`}>{f.icon}</span>
                    <p className="mt-2 text-xs font-bold">{f.t}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#c3cbd6]">{f.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-2 text-[11px] text-[#c3cbd6]">
                <ShieldCheck className="h-3.5 w-3.5 text-turquoise shrink-0" aria-hidden />
                زنجیره «ورود داده ← تحلیل ← ارزیابی ← نمودار ← گزارش» با اصل صداقت علمی
              </div>
            </div>

            <div className="relative mt-8 rounded-2xl bg-white/[0.06] border border-white/12 p-4 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sidebar-primary/25 to-transparent text-sidebar-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-bold text-sidebar-primary">طراح و مالک پژوهش</p>
                <p className="mt-0.5 text-[11px] leading-5 text-[#c3cbd6]">دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir</p>
              </div>
            </div>
          </div>

          {/* کارت ورود */}
          <Card className="relative bg-card/85 backdrop-blur-2xl border-white/25 dark:border-white/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.5)] rounded-3xl self-center">
            <CardContent className="p-8">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-turquoise/20 to-lapis/10 text-primary dark:text-turquoise">
                  <ShieldCheck className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">ورود به سامانه</h2>
                  <p className="text-[11px] text-muted-foreground">محیط پژوهشی با نقش‌های سه‌گانه</p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="uname">نام پژوهشگر</Label>
                  <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" className="h-11 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>نقش کاربری</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid gap-2">
                    {ROLES.map((r) => (
                      <label
                        key={r.role}
                        className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:bg-accent/60 hover:border-ring/50 has-[[data-state=checked]]:border-turquoise has-[[data-state=checked]]:bg-turquoise/8 has-[[data-state=checked]]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--turquoise)_15%,transparent)]"
                      >
                        <RadioGroupItem value={r.role} id={`role-${r.role}`} className="mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-1.5">
                            <span className="text-turquoise-deep dark:text-turquoise">{r.icon}</span>
                            {r.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-5">{r.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  className="btn-sheen w-full h-12 text-base font-bold rounded-xl bg-gradient-to-l from-turquoise to-lapis hover:opacity-95 text-white shadow-[0_10px_28px_-10px_color-mix(in_srgb,var(--lapis)_65%,transparent)]"
                  onClick={() => login(name.trim() || "پژوهشگر", role)}
                >
                  ورود به محیط پژوهش
                </Button>

                <p className="text-[11px] leading-5 text-muted-foreground text-center border-t border-dashed pt-3.5">
                  اصل بنیادین: موضوع اصلی سامانه معماری، ریخت‌شناسی و عملکرد انرژی است؛ هوش مصنوعی و علم داده
                  ابزار پشتیبان پژوهش‌اند. هیچ نتیجه یا داده‌ای جعل نمی‌شود.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="relative no-print text-center pb-4 text-[11px] text-[#9fb3c4]">
        دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir
      </footer>
    </div>
  );
}
