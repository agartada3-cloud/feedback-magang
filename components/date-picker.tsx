"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Calendar + DatePicker modern (react-day-picker v10).
 * Minimal, clean, mengikuti design system (indigo primary, zinc, rounded-lg).
 * Format ISO yyyy-mm-dd untuk storage, tampil dd MMM yyyy.
 */

/* ---------- Calendar ---------- */

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: {
  selected?: Date;
  onSelect?: (d: Date | undefined) => void;
  disabled?: { before?: Date; after?: Date };
  className?: string;
}) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      locale={id}
      disabled={
        disabled?.before && disabled?.after
          ? [{ after: disabled.after }, { before: disabled.before }]
          : disabled?.before
            ? { before: disabled.before }
            : disabled?.after
              ? { after: disabled.after }
              : undefined
      }
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "flex items-center justify-between px-1",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center gap-1",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 flex-1 pb-2 text-center text-xs font-medium text-muted-foreground",
        week: "flex w-full",
        day: "flex-1 p-0 text-center text-sm",
        day_button:
          "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm text-foreground transition-colors hover:bg-muted",
        selected: "bg-primary text-primary-foreground hover:bg-primary-hover",
        today: "font-semibold text-primary",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground/30 hover:bg-transparent",
        range_start: "bg-primary text-primary-foreground",
        range_end: "bg-primary text-primary-foreground",
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ),
      }}
    />
  );
}

/* ---------- DatePicker (popover) ---------- */

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  min,
  max,
  id,
  "aria-label": ariaLabel,
}: {
  value?: string; // ISO yyyy-mm-dd
  onChange?: (v: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [selected, setSelected] = React.useState<Date | undefined>(
    value ? new Date(value + "T00:00:00") : undefined
  );

  React.useEffect(() => {
    setSelected(value ? new Date(value + "T00:00:00") : undefined);
  }, [value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const display = selected
    ? selected.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "";

  function handleSelect(d: Date | undefined) {
    setSelected(d);
    if (d) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      onChange?.(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange?.("");
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative" id={id}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel ?? "Pilih tanggal"}
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          open && "border-primary",
          display ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className={cn("truncate", !display && "font-normal")}>{display || placeholder}</span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-auto min-w-[280px] rounded-lg border border-border bg-card p-3 shadow-lg">
          <Calendar
            selected={selected}
            onSelect={handleSelect}
            disabled={{
              ...(min ? { before: new Date(min + "T00:00:00") } : {}),
              ...(max ? { after: new Date(max + "T00:00:00") } : {}),
            }}
          />
          {selected && (
            <div className="mt-2 border-t border-border pt-2 text-center">
              <button
                type="button"
                onClick={() => handleSelect(undefined)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-error"
              >
                Hapus tanggal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- MonthPicker (filter "tanggal/bulan") ---------- */

export function MonthPicker({
  value, // "YYYY-MM"
  onChange,
  placeholder = "Semua Bulan",
  ariaLabel = "Pilih bulan",
}: {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [viewYear, setViewYear] = React.useState(() => {
    const now = new Date();
    return value ? Number(value.slice(0, 4)) : now.getFullYear();
  });

  React.useEffect(() => {
    if (value) setViewYear(Number(value.slice(0, 4)));
  }, [value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const display = value ? `${months[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}` : "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          open && "border-primary",
          display ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="truncate">{display || placeholder}</span>
        <ChevronLeft className="hidden" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[260px] rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tahun sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-foreground">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tahun berikutnya"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((m, i) => {
              const val = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
              const active = value === val;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange?.(val);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {value && (
            <div className="mt-2 border-t border-border pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-error"
              >
                Semua bulan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
