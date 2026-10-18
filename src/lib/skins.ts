/**
 * تم‌های بصری سامانه (Skin System)
 * هر تم یک مجموعه کامل از متغیرهای CSS را در حالت روشن و تیره تعریف می‌کند.
 * - تم پیش‌فرض: shiraz (پالت میراثی شیراز)
 * - ادمین می‌تواند تم سراسری را در زمان اجرا تغییر دهد (ذخیره در SystemSetting)
 */

export type SkinId = "shiraz" | "turquoise" | "midnight" | "glass" | "saffron" | "emerald";

export const SKIN_IDS: SkinId[] = ["shiraz", "turquoise", "midnight", "glass", "saffron", "emerald"];

export interface SkinMeta {
  id: SkinId;
  name: string;
  desc: string;
  /** سه رنگ شاخص برای پیش‌نمایش در گالری تم */
  swatch: [string, string, string];
  /** تم شیشه‌ای جلوه‌های اضافی backdrop-blur دارد */
  isGlass?: boolean;
}

export const SKINS: SkinMeta[] = [
  {
    id: "shiraz",
    name: "شیراز کلاسیک",
    desc: "لاجورد، فیروزه و مس — پالت میراثی",
    swatch: ["#143954", "#17877d", "#b4693b"],
  },
  {
    id: "turquoise",
    name: "فیروزه‌ای",
    desc: "کاشی فیروزه‌ای بناها و گنبدها",
    swatch: ["#084d48", "#12a094", "#ffd88a"],
  },
  {
    id: "midnight",
    name: "آبی تیره",
    desc: "نیلی عمیق، رسمی و متمرکز",
    swatch: ["#0c2747", "#3d84c6", "#7cb8ec"],
  },
  {
    id: "glass",
    name: "شیشه‌ای مدرن",
    desc: "گلس‌مورفیسم؛ پنل‌های شفاف و نورانی",
    swatch: ["#6d5cf0", "#22c8d6", "#f06292"],
    isGlass: true,
  },
  {
    id: "saffron",
    name: "زعفرانی",
    desc: "طلایی گرم سنتی و قهوه‌ای عمیق",
    swatch: ["#3d2a10", "#cf9a2e", "#f2c14e"],
  },
  {
    id: "emerald",
    name: "زمردی",
    desc: "سبز زمردی آرام و خوانا",
    swatch: ["#0b3b26", "#27a56a", "#f2c063"],
  },
];

export function isSkinId(v: unknown): v is SkinId {
  return typeof v === "string" && (SKIN_IDS as string[]).includes(v);
}
