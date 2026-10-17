"use client";

import * as React from "react";
import * as echarts from "echarts";
import { useTheme } from "next-themes";

/**
 * Wrapper سبک Apache ECharts برای React
 * - بارگذاری کامل کتابخانه (بدون SSR) و dispose هنگام تخریب
 * - تم‌آگاهی از روشن/تیره
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
  const { theme } = useTheme();

  React.useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    onReady?.(chart);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(option, notMerge);
  }, [option, notMerge]);

  return <div ref={ref} className={className} style={{ width: "100%", height, direction: "ltr" }} />;
}

/** آپشن پایه مشترک نمودارهای علمی — هماهنگ با تم و RTL */
export function useBaseOption() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return React.useMemo(
    () => ({
      textStyle: { fontFamily: "Vazirmatn, Tahoma, sans-serif" },
      color: ["#1f4e6e", "#17877d", "#b4693b", "#d9a441", "#7a8c5c", "#8b5d76", "#56B4E9", "#E69F00"],
      backgroundColor: "transparent",
      title: { textStyle: { color: isDark ? "#e8e3d7" : "#1b2a38", fontFamily: "Vazirmatn" } },
      legend: { textStyle: { color: isDark ? "#c9d3dc" : "#41525f", fontFamily: "Vazirmatn" } },
      tooltip: {
        backgroundColor: isDark ? "#142838" : "#fffdf8",
        borderColor: isDark ? "#24425a" : "#e0d9c8",
        textStyle: { color: isDark ? "#e8e3d7" : "#1b2a38", fontFamily: "Vazirmatn" },
      },
      axis: {
        labelColor: isDark ? "#9db0be" : "#5d6b77",
        splitLineColor: isDark ? "#24425a" : "#e8e2d2",
      },
      isDark,
    }),
    [isDark]
  );
}

/** دریافت خروجی PNG با وضوح چاپ از نمودار جاری */
export function exportChartPNG(chart: echarts.ECharts, filename: string, pixelRatio = 3) {
  const url = chart.getDataURL({ type: "png", pixelRatio, backgroundColor: "#ffffff" });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
}
