"use client";

import * as React from "react";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { useSkin } from "@/components/shell/skin-provider";

/**
 * Wrapper سبک Apache ECharts برای React
 * - بارگذاری کامل کتابخانه (بدون SSR) و dispose هنگام تخریب
 * - تم‌آگاهی از روشن/تیره و از تم‌های رنگی سامانه (data-skin)
 * - فارسی‌سازی داخلی با فونت Vazirmatn
 */
export interface EChartProps {
  option: echarts.EChartsOption;
  height?: number | string;
  className?: string;
  onReady?: (chart: echarts.ECharts) => void;
  notMerge?: boolean;
}

export function EChart({ option, height = 320, className, onReady, notMerge = true }: EChartProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<echarts.ECharts | null>(null);
  const lastOptionRef = React.useRef<echarts.EChartsOption | null>(null);
  const onReadyRef = React.useRef(onReady);
  React.useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const boot = React.useCallback(() => {
    if (!ref.current) return;
    if (chartRef.current) {
      chartRef.current.dispose();
      chartRef.current = null;
    }
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    onReadyRef.current?.(chart);
    if (lastOptionRef.current) chart.setOption(lastOptionRef.current, true);
  }, []);

  React.useEffect(() => {
    boot();
    const el = ref.current;
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    if (el) observer.observe(el);
    return () => {
      observer.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [boot]);

  React.useEffect(() => {
    lastOptionRef.current = option;
    chartRef.current?.setOption(option, notMerge);
  }, [option, notMerge]);

  // تغییر تم رنگی سامانه → بازسازی کامل نمودار با پالت جدید
  React.useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => boot());
    obs.observe(el, { attributes: true, attributeFilter: ["data-skin"] });
    return () => obs.disconnect();
  }, [boot]);

  return <div ref={ref} className={className} style={{ width: "100%", height, direction: "ltr" }} />;
}

/** آپشن پایه مشترک نمودارهای علمی — هماهنگ با تم روشن/تیره و تم رنگی سامانه */
export function useBaseOption() {
  const { theme } = useTheme();
  const { skin } = useSkin();
  const isDark = theme === "dark";
  return React.useMemo(() => {
    // پالت هر تم از متغیرهای CSS خوانده می‌شود تا نمودارها با رنگ‌بندی سامانه هماهنگ بمانند
    const cs = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const v = (name: string, fallback: string) => (cs ? cs.getPropertyValue(name).trim() || fallback : fallback);
    return {
      textStyle: { fontFamily: "Vazirmatn, Tahoma, sans-serif" },
      color: [
        v("--chart-1", "#1f4e6e"),
        v("--chart-2", "#17877d"),
        v("--chart-3", "#b4693b"),
        v("--chart-4", "#d9a441"),
        v("--chart-5", "#7a8c5c"),
      ],
      backgroundColor: "transparent",
      title: { textStyle: { color: v("--foreground", isDark ? "#e8e3d7" : "#1b2a38"), fontFamily: "Vazirmatn" } },
      legend: { textStyle: { color: v("--muted-foreground", isDark ? "#c9d3dc" : "#41525f"), fontFamily: "Vazirmatn" } },
      tooltip: {
        backgroundColor: v("--popover", isDark ? "#142838" : "#fffdf8"),
        borderColor: v("--border", isDark ? "#24425a" : "#e0d9c8"),
        textStyle: { color: v("--foreground", isDark ? "#e8e3d7" : "#1b2a38"), fontFamily: "Vazirmatn" },
      },
      axis: {
        labelColor: v("--muted-foreground", isDark ? "#9db0be" : "#5d6b77"),
        splitLineColor: isDark ? "#24425a" : "#e8e2d2",
      },
      isDark,
      skin,
    };
  }, [isDark, skin]);
}

/** دریافت خروجی PNG با وضوح چاپ از نمودار جاری */
export function exportChartPNG(chart: echarts.ECharts, filename: string, pixelRatio = 3) {
  const url = chart.getDataURL({ type: "png", pixelRatio, backgroundColor: "#ffffff" });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
}
