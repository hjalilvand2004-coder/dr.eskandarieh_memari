"use client";

import * as React from "react";
import { SKINS, isSkinId, type SkinId } from "@/lib/skins";
import { useAppStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";

const LS_KEY = "shiraz-atlas-skin";

interface SkinContextValue {
  /** تم فعلاً اعمال‌شده روی این مرورگر */
  skin: SkinId;
  /** تغییر تم در زمان اجرا؛ برای ادمین به‌صورت سراسری ذخیره می‌شود */
  applySkin: (id: SkinId) => Promise<void>;
  /** در حال ذخیره سراسری */
  saving: boolean;
}

const SkinContext = React.createContext<SkinContextValue>({
  skin: "shiraz",
  applySkin: async () => {},
  saving: false,
});

/** اعمال فوری ویژگی data-skin روی <html> با انتقال نرم رنگ‌ها */
function paintSkin(id: SkinId) {
  const root = document.documentElement;
  root.classList.add("skin-switching");
  root.dataset.skin = id;
  window.setTimeout(() => root.classList.remove("skin-switching"), 450);
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {
    /* حالت خصوصی مرورگر — بی‌اهمیت */
  }
}

export function SkinProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkin] = React.useState<SkinId>("shiraz");
  const [saving, setSaving] = React.useState(false);
  const role = useAppStore((s) => s.user?.role);
  const userName = useAppStore((s) => s.user?.name);
  const roleRef = React.useRef(role);
  const nameRef = React.useRef(userName);
  roleRef.current = role;
  nameRef.current = userName;

  // ۱) بازیابی سریع از حافظه محلی (جلوگیری از پرش رنگ)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (isSkinId(saved)) {
        document.documentElement.dataset.skin = saved;
        setSkin(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // ۲) همگام‌سازی با تنظیم سراسری سرور — مقدار سرور مرجع نهایی است
  React.useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j?.ok) return;
        if (isSkinId(j.skin)) {
          const current =
            document.documentElement.dataset.skin && isSkinId(document.documentElement.dataset.skin)
              ? (document.documentElement.dataset.skin as SkinId)
              : "shiraz";
          if (j.skin !== current) {
            paintSkin(j.skin);
            setSkin(j.skin);
          }
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const applySkin = React.useCallback(async (id: SkinId) => {
    paintSkin(id);
    setSkin(id);

    if (roleRef.current === "admin") {
      // ادمین: ذخیره سراسری + ثبت در ممیزی
      setSaving(true);
      try {
        const r = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skin: id, role: "admin", actor: nameRef.current ?? "admin" }),
        });
        const j = await r.json();
        if (j?.ok) {
          const label = SKINS.find((s) => s.id === id)?.name ?? id;
          toast({
            title: `تم «${label}» برای همه کاربران ثبت شد`,
            description: "تنظیم در پایگاه سامانه ذخیره و در رویدادهای ممیزی ثبت شد.",
          });
        } else {
          toast({
            title: "اعمال محلی انجام شد؛ ذخیره سراسری ناموفق بود",
            description: j?.error ?? "خطای ناشناخته",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "اعمال محلی انجام شد؛ اتصال به سرور برقرار نشد",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    } else {
      toast({
        title: "پیش‌نمایش تم اعمال شد",
        description: "این تغییر فقط در همین مرورگر دیده می‌شود؛ تغییر دائمی سامانه در اختیار مدیر است.",
      });
    }
  }, []);

  return (
    <SkinContext.Provider value={{ skin, applySkin, saving }}>
      {children}
    </SkinContext.Provider>
  );
}

export function useSkin() {
  return React.useContext(SkinContext);
}
