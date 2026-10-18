"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "researcher" | "viewer";
export type ModuleKey =
  | "dashboard"
  | "research"
  | "data"
  | "atlas"
  | "simulation"
  | "lab"
  | "validation"
  | "charts"
  | "scenarios"
  | "assistant"
  | "about";

export interface AtlasSelection {
  buildingCode: string | null;
  blockCode: string | null;
}

interface AppState {
  // احراز هویت نمایشی سه‌نقشی
  user: { name: string; role: Role } | null;
  login: (name: string, role: Role) => void;
  logout: () => void;

  // ناوبری ماژول‌ها
  activeModule: ModuleKey;
  setModule: (m: ModuleKey) => void;

  // انتخاب هماهنگ اطلس ↔ نمودارها
  atlasSelection: AtlasSelection;
  setAtlasSelection: (s: AtlasSelection) => void;

  // انیمیشن‌ها (قابل غیرفعال‌سازی)
  reduceMotion: boolean;
  toggleReduceMotion: () => void;

  // آخرین نسخه تحلیل ثبت‌شده (برای نمایش وضعیت ذخیره)
  lastSavedAt: string | null;
  setLastSavedAt: (t: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      login: (name, role) => set({ user: { name, role } }),
      logout: () => set({ user: null }),

      activeModule: "dashboard",
      setModule: (m) => set({ activeModule: m }),

      atlasSelection: { buildingCode: null, blockCode: null },
      setAtlasSelection: (s) => set({ atlasSelection: s }),

      reduceMotion: false,
      toggleReduceMotion: () => set((st) => ({ reduceMotion: !st.reduceMotion })),

      lastSavedAt: null,
      setLastSavedAt: (t) => set({ lastSavedAt: t }),
    }),
    { name: "shiraz-atlas-store" }
  )
);

export const ROLE_LABEL: Record<Role, string> = {
  admin: "مدیر",
  researcher: "پژوهشگر",
  viewer: "مشاهده‌گر",
};

export const canWrite = (role: Role | undefined) => role === "admin" || role === "researcher";
