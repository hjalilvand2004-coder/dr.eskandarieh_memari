import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shell/theme-provider";

export const metadata: Metadata = {
  title: "شیراز | اطلس هوشمند ریخت‌شناسی و انرژی",
  description:
    "محیط یکپارچه مدیریت پژوهش، تحلیل فضایی، شبیه‌سازی و ارزیابی مدل — رساله دکتری معماری: تبیین الگوهای ریخت‌شناسی در بافت تاریخی با تأکید بر کارایی انرژی (نمونه پژوهشی: بافت تاریخی شیراز)",
  authors: [{ name: "دکتر سارا اسکندریه - شرکت ماه افزارهوشمندرسا MahAI.ir" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
