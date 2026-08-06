"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    // halaman login tidak perlu sesi
    if (pathname === "/admin/login") {
      setChecked(true);
      return;
    }
    if (!isAdminLoggedIn()) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [router, pathname]);

  if (!checked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Memeriksa sesi…
      </div>
    );
  }
  return <>{children}</>;
}
