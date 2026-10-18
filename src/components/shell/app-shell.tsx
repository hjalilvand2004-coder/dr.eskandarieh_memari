"use client";

import * as React from "react";
import { useAppStore, ROLE_LABEL, type ModuleKey } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { toast } from "@/hooks/use-toast";
import { DemoBadge } from "@/components/shared/ui-bits";
import { ThemeGallery } from "./theme-gallery";
import {
  LayoutDashboard, ClipboardList, Database, Map, FlaskConical, BrainCircuit,
  ShieldCheck, LineChart, Target, Bot, Info, Moon, Sun, Menu, X, Compass,
  LogOut, RefreshCw, Activity,
} from "lucide-react";
import { DashboardView } from "@/components/modules/dashboard-view";
import { ResearchView } from "@/components/modules/research-view";
import { DataView } from "@/components/modules/data-view";
import { AtlasView } from "@/components/modules/atlas-view";
import { SimulationView } from "@/components/modules/simulation-view";
import { LabView } from "@/components/modules/lab-view";
import { ValidationView } from "@/components/modules/validation-view";
import { ChartsView } from "@/components/modules/charts-view";
import { ScenariosView } from "@/components/modules/scenarios-view";
import { AssistantView } from "@/components/modules/assistant-view";
import { AboutView } from "@/components/modules/about-view";

const MODULES: Array<{ key: ModuleKey; label: string; icon: React.ReactNode; desc: string }> = [
  { key: "dashboard", label: "داشبورد پژوهش", icon: <LayoutDashboard />, desc: "نمای کلی پیشرفت و وضعیت" },
  { key: "research", label: "میز پژوهش", icon: <ClipboardList />, desc: "پرسش‌ها، فصل‌ها، کانبان و منابع" },
  { key: "data", label: "پایگاه داده و کیفیت", icon: <Database />, desc: "مجموعه داده‌ها، فرهنگ داده، ورود فایل" },
  { key: "atlas", label: "اطلس مکانی و ریخت‌شناسی", icon: <Map />, desc: "نقشه تعاملی و شاخص‌ها" },
  { key: "simulation", label: "آزمایشگاه شبیه‌سازی", icon: <FlaskConical />, desc: "مدل‌ها، سناریوی آزمایش، صف اجرا" },
  { key: "lab", label: "آزمایشگاه علم داده", icon: <BrainCircuit />, desc: "EDA، خوشه‌بندی، رگرسیون" },
  { key: "validation", label: "ارزیابی و اعتبارسنجی", icon: <ShieldCheck />, desc: "MAE، RMSE، R²، NMBE، CV(RMSE)" },
  { key: "charts", label: "استودیو نمودار", icon: <LineChart />, desc: "ساخت شکل علمی با منشأ و کپشن" },
  { key: "scenarios", label: "سناریوسازی و تصمیم", icon: <Target />, desc: "مداخلات کم‌مداخله و مقایسه" },
  { key: "assistant", label: "دستیار پژوهشی", icon: <Bot />, desc: "پرسش از اسناد پروژه" },
  { key: "about", label: "درباره سامانه", icon: <Info />, desc: "معماری، محدودیت‌ها و راهنما" },
];

export function AppShell() {
  const { user, activeModule, setModule, logout, reduceMotion, toggleReduceMotion, lastSavedAt } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [booting, setBooting] = React.useState(true);

  // بوت‌استرپ: seed و اطمینان از آماده بودن پایگاه
  React.useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          useAppStore.getState().setLastSavedAt(new Date().toLocaleTimeString("fa-IR"));
        } else {
          toast({ title: "خطا در بوت‌استرپ سامانه", description: j.error, variant: "destructive" });
        }
      })
      .catch(() => toast({ title: "اتصال برقرار نشد", variant: "destructive" }))
      .finally(() => setBooting(false));
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  const current = MODULES.find((m) => m.key === activeModule)!;
  const role = user?.role;

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardView />;
      case "research": return <ResearchView />;
      case "data": return <DataView />;
      case "atlas": return <AtlasView />;
      case "simulation": return <SimulationView />;
      case "lab": return <LabView />;
      case "validation": return <ValidationView />;
      case "charts": return <ChartsView />;
      case "scenarios": return <ScenariosView />;
      case "assistant": return <AssistantView />;
      case "about": return <AboutView />;
      default: return null;
    }
  };

  const sidebarBody = (
    <div data-glass="sidebar" className="flex flex-col h-full bg-sidebar text-sidebar-foreground relative overflow-hidden">
      {/* هاله تزئینی بالای سایدبار */}
      <div
        className="pointer-events-none absolute -top-24 inset-x-0 h-48 opacity-60"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, var(--glow-a), transparent 75%)" }}
        aria-hidden
      />
      {/* برند */}
      <div className="relative p-4 flex items-center gap-3">
        <div className="logo-glow h-11 w-11 rounded-2xl bg-gradient-to-br from-turquoise via-lapis to-copper grid place-items-center shrink-0 ring-1 ring-white/25 shadow-lg">
          <Compass className="h-5.5 w-5.5 text-white" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-[15px] leading-5 tracking-tight">شیراز</p>
          <p className="text-[10.5px] text-sidebar-foreground/70 leading-4">اطلس هوشمند ریخت‌شناسی و انرژی</p>
        </div>
        <button className="lg:hidden mr-auto p-1" onClick={() => setMobileOpen(false)} aria-label="بستن نوار کناری">
          <X className="h-5 w-5" />
        </button>
      </div>
      <Separator className="bg-sidebar-border/70" />
      <nav className="relative flex-1 overflow-y-auto p-2.5 space-y-1" aria-label="ماژول‌های سامانه">
        {MODULES.map((m) => {
          const isActive = activeModule === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setModule(m.key);
                setMobileOpen(false);
              }}
              className={`group relative w-full text-right flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[0_4px_16px_-6px_rgba(0,0,0,0.45)]"
                  : "hover:bg-white/6 text-sidebar-foreground/85 hover:text-sidebar-accent-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* نشانگر فعال — لبه راست (RTL) */}
              <span
                className={`absolute inset-y-1.5 right-0 w-[3px] rounded-full bg-sidebar-primary transition-all duration-300 ${
                  isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                }`}
                aria-hidden
              />
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors duration-200 [&>svg]:h-4 [&>svg]:w-4 ${
                  isActive
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "bg-white/5 text-sidebar-foreground/75 group-hover:text-sidebar-accent-foreground"
                }`}
              >
                {m.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] leading-5 truncate">{m.label}</span>
                <span className="block text-[10px] leading-4 text-sidebar-foreground/55 truncate">{m.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <Separator className="bg-sidebar-border/70" />
      <div className="relative p-3 space-y-2">
        <div className="rounded-xl bg-white/6 border border-white/10 p-3">
          <p className="text-xs font-semibold">{user?.name}</p>
          <p className="text-[10px] text-sidebar-foreground/70 mt-0.5">نقش: {user ? ROLE_LABEL[user.role] : "—"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/10 h-8 text-[11px]"
            onClick={toggleReduceMotion}
          >
            <Activity className="h-3.5 w-3.5 ml-1" aria-hidden />
            انیمیشن: {reduceMotion ? "خاموش" : "روشن"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/80 hover:bg-white/10 h-8"
            onClick={logout}
            aria-label="خروج از حساب"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[9px] leading-3.5 text-sidebar-foreground/45 text-center">
          دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir
        </p>
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-background" dir="rtl">
        {/* هاله‌های شناور پس‌زمینه */}
        <div className="app-orbs" aria-hidden>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* نوار کناری دسکتاپ */}
        <aside className="hidden lg:block w-66 shrink-0 sticky top-0 h-screen border-l border-sidebar-border shadow-[inset_-12px_0_24px_-18px_rgba(0,0,0,0.4)] no-print">
          {sidebarBody}
        </aside>

        {/* نوار کناری موبایل */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex no-print" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
            <div className="relative w-72 h-full shadow-2xl">{sidebarBody}</div>
          </div>
        )}

        {/* بدنه اصلی */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* نوار بالا */}
          <header data-glass="header" className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b no-print">
            <div className="px-4 h-15 flex items-center gap-2.5">
              <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setMobileOpen(true)} aria-label="باز کردن نوار کناری">
                <Menu className="h-5 w-5" />
              </button>
              <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="مسیر پیمایش">
                <span className="text-muted-foreground hidden sm:inline">اطلس هوشمند شیراز</span>
                <span className="text-muted-foreground/60 hidden sm:inline">/</span>
                <span className="font-bold truncate bg-gradient-to-l from-foreground to-foreground/70 bg-clip-text">{current.label}</span>
              </nav>
              <div className="mr-auto flex items-center gap-1.5">
                <Badge variant="outline" className="hidden xl:flex gap-1.5 text-[10px] text-muted-foreground">
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  ذخیره خودکار {lastSavedAt ? `• ${lastSavedAt}` : ""}
                </Badge>
                <ThemeGallery />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "تم روشن" : "تم تیره"}>
                      {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>تعویض حالت روشن/تیره</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {booting && (
              <div className="h-0.5 bg-gradient-to-l from-turquoise via-primary to-copper animate-pulse" aria-hidden />
            )}
          </header>

          {/* محتوا */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1400px]">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <DemoBadge />
                <span className="text-[11px] text-muted-foreground">
                  نسخه تحلیل پایه: demo-morph-energy-v1 • تمام نتایج نمایشی قابل جایگزینی با داده واقعی‌اند
                </span>
              </div>
              <div key={activeModule} className="module-fade">
                {renderModule()}
              </div>
            </div>
          </main>

          {/* پانویس چسبیده */}
          <footer className="mt-auto border-t py-4 px-6 text-center text-[11px] text-muted-foreground no-print">
            دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir • محیط پژوهشی رساله دکتری معماری
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
