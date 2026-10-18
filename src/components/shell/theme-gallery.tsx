"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SKINS } from "@/lib/skins";
import { useSkin } from "./skin-provider";
import { useAppStore, ROLE_LABEL } from "@/lib/store";
import { Palette, Check, Loader2, ShieldCheck, Info } from "lucide-react";

/**
 * گالری تم سامانه — قابل دسترس برای همه کاربران در زمان اجرا.
 * انتخاب ادمین به‌صورت سراسری در پایگاه ذخیره می‌شود؛ سایر کاربران پیش‌نمایش محلی می‌بینند.
 */
export function ThemeGallery() {
  const { skin, applySkin, saving } = useSkin();
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const active = SKINS.find((s) => s.id === skin);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2.5 text-xs"
          aria-label="تغییر تم و رنگ‌بندی سامانه"
        >
          <Palette className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">تم: {active?.name ?? "شیراز کلاسیک"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[350px] rounded-2xl p-3.5" dir="rtl">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[13px] font-bold">تم و رنگ‌بندی سامانه</p>
          {isAdmin ? (
            <Badge variant="outline" className="gap-1 border-turquoise/40 bg-turquoise/10 text-turquoise-deep dark:text-turquoise text-[10px]">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              دسترسی مدیر
            </Badge>
          ) : null}
        </div>
        <p className="mb-3 text-[10.5px] leading-4.5 text-muted-foreground">
          {isAdmin
            ? "با انتخاب هر تم، تغییر فوراً برای همه کاربران سامانه ثبت می‌شود."
            : "پیش‌نمایش تم در همین مرورگر اعمال می‌شود؛ تغییر دائمی سامانه در اختیار مدیر است."}
        </p>

        <div className="grid max-h-[58vh] grid-cols-2 gap-2 overflow-y-auto pl-0.5">
          {SKINS.map((s) => {
            const isActive = s.id === skin;
            return (
              <button
                key={s.id}
                onClick={() => void applySkin(s.id)}
                disabled={saving}
                aria-pressed={isActive}
                className={`group relative flex flex-col gap-1.5 rounded-xl border p-2 text-right transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 ${
                  isActive
                    ? "border-ring/70 ring-2 ring-ring/40"
                    : "border-border hover:border-ring/50"
                }`}
              >
                {/* پیش‌نمایش رنگی */}
                <span
                  className="relative flex h-9 w-full overflow-hidden rounded-lg shadow-inner"
                  aria-hidden
                >
                  {s.isGlass ? (
                    <>
                      <span className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${s.swatch[0]}, ${s.swatch[1]} 55%, ${s.swatch[2]})` }} />
                      <span className="absolute inset-x-2 top-1.5 h-2.5 rounded-full bg-white/45 backdrop-blur-[1px]" />
                      <span className="absolute inset-x-4 bottom-1 h-2.5 rounded-full bg-white/30 backdrop-blur-[1px]" />
                    </>
                  ) : (
                    <>
                      <span className="h-full w-1/3" style={{ background: s.swatch[0] }} />
                      <span className="h-full w-1/3" style={{ background: s.swatch[1] }} />
                      <span className="h-full w-1/3" style={{ background: s.swatch[2] }} />
                    </>
                  )}
                </span>
                <span className="flex items-center justify-between gap-1">
                  <span className="text-[11.5px] font-semibold leading-4">{s.name}</span>
                  {isActive && (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" aria-hidden />
                    </span>
                  )}
                </span>
                <span className="text-[9.5px] leading-3.5 text-muted-foreground">{s.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">
          {saving ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
          ) : isAdmin ? (
            <ShieldCheck className="h-3 w-3 shrink-0 text-turquoise-deep dark:text-turquoise" aria-hidden />
          ) : (
            <Info className="h-3 w-3 shrink-0" aria-hidden />
          )}
          <span>
            {saving
              ? "در حال ثبت تم سراسری…"
              : isAdmin
                ? `نقش شما: ${ROLE_LABEL.admin} — انتخاب تم در رویدادهای ممیزی ثبت می‌شود.`
                : user
                  ? `نقش شما: ${ROLE_LABEL[user.role]} — پیش‌نمایش محلی.`
                  : "برای تغییر دائمی، با نقش مدیر وارد شوید."}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
