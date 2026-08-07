"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui";

export default function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Ganti tema">
        <Sun className="h-4 w-4 opacity-0" aria-hidden />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Ganti tema">
      {dark ? <Sun className="h-4 w-4 text-amber-400" aria-hidden /> : <Moon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" aria-hidden />}
    </Button>
  );
}
