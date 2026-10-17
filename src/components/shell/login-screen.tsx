"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore, type Role } from "@/lib/store";
import { Compass, Map, Sun } from "lucide-react";

const ROLES: Array<{ role: Role; label: string; desc: string }> = [
  { role: "admin", label: "مدیر", desc: "دسترسی کامل شامل حذف داده" },
  { role: "researcher", label: "پژوهشگر", desc: "ثبت داده، اجرای تحلیل، خروجی گزارش" },
  { role: "viewer", label: "مشاهده‌گر", desc: "دسترسی فقط‌خواندنی" },
];

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [name, setName] = React.useState("دکتر سارا اسکندریه");
  const [role, setRole] = React.useState<Role>("researcher");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#143954] via-[#1d4a68] to-[#143954] dark:from-[#0b1520] dark:via-[#12283a] dark:to-[#0b1520]">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 items-stretch">
          {/* معرفی */}
          <div className="girih-bg rounded-3xl border border-white/10 p-8 flex flex-col justify-between text-[#f3efe4] shadow-2xl">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-turquoise to-lapis grid place-items-center shadow-lg">
                  <Compass className="h-6 w-6 text-white" aria-hidden />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold leading-8">شیراز</h1>
                  <p className="text-sm text-[#e9d9b8]">اطلس هوشمند ریخت‌شناسی و انرژی</p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-[#dfe6ec]">
                محیط یکپارچه مدیریت پژوهش، تحلیل فضایی، شبیه‌سازی و ارزیابی مدل برای رساله دکتری معماری
                با موضوع «تبیین الگوهای ریخت‌شناسی در بافت تاریخی با تأکید بر کارایی انرژی — نمونه پژوهشی:
                بافت تاریخی شهر شیراز».
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[#cfe3df]">
                  <Map className="h-4 w-4 text-turquoise shrink-0" aria-hidden />
                  اطلس مکانی و شاخص‌های ریخت‌شناسی قابل محاسبه
                </div>
                <div className="flex items-center gap-2 text-[#cfe3df]">
                  <Sun className="h-4 w-4 text-[#f2c063] shrink-0" aria-hidden />
                  آزمایشگاه علم داده و ارزیابی مدل با محاسبات واقعی
                </div>
                <div className="flex items-center gap-2 text-[#cfe3df]">
                  <Compass className="h-4 w-4 text-[#d98d5f] shrink-0" aria-hidden />
                  زنجیره «ورود داده ← تحلیل ← ارزیابی ← نمودار ← گزارش»
                </div>
              </div>
            </div>
            <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-4 text-xs leading-6 text-[#d8dee5]">
              <p className="font-semibold text-[#f2c063]">طراح و مالک پژوهش</p>
              <p className="mt-1">دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir</p>
            </div>
          </div>

          {/* ورود */}
          <Card className="bg-card/95 backdrop-blur border-border/60 shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold">ورود به سامانه</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-6">
                نسخه پژوهشی با نقش‌های سه‌گانه؛ سوابق دسترسی در رویدادهای ممیزی ثبت می‌شود.
              </p>

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="uname">نام پژوهشگر</Label>
                  <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" />
                </div>

                <div className="space-y-2">
                  <Label>نقش کاربری</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid gap-2">
                    {ROLES.map((r) => (
                      <label
                        key={r.role}
                        className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-accent/50 transition-colors has-[[data-state=checked]]:border-turquoise has-[[data-state=checked]]:bg-turquoise/5"
                      >
                        <RadioGroupItem value={r.role} id={`role-${r.role}`} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <Button
                  className="w-full h-11 text-base font-bold bg-gradient-to-l from-turquoise to-lapis hover:opacity-90 text-white"
                  onClick={() => login(name.trim() || "پژوهشگر", role)}
                >
                  ورود به محیط پژوهش
                </Button>

                <p className="text-[11px] leading-5 text-muted-foreground text-center">
                  اصل بنیادین: موضوع اصلی سامانه معماری، ریخت‌شناسی و عملکرد انرژی است؛ هوش مصنوعی و علم داده
                  ابزار پشتیبان پژوهش‌اند. هیچ نتیجه یا داده‌ای جعل نمی‌شود.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="no-print text-center pb-4 text-[11px] text-[#9fb3c4]">
        دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir
      </footer>
    </div>
  );
}
