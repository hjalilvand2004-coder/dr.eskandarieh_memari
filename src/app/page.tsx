"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { AppShell } from "@/components/shell/app-shell";
import { LoginScreen } from "@/components/shell/login-screen";

export default function Home() {
  const user = useAppStore((s) => s.user);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // انتظار برای hydration استور persist شده (جلوگیری از پرش صفحه ورود)
    const t = setTimeout(() => setHydrated(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3" aria-busy="true">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-turquoise to-lapis animate-pulse" />
          <p className="text-sm text-muted-foreground">در حال آماده‌سازی محیط پژوهش…</p>
        </div>
      </div>
    );
  }

  return user ? <AppShell /> : <LoginScreen />;
}
