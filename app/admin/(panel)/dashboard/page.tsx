"use client";

import * as React from "react";
import { FileText, Gauge, Inbox, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BagianDonut, RatingDonut, SubmissionBarChart } from "@/components/charts";
import { AnimatedNumber, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getStats } from "@/lib/store";
import type { Stats } from "@/lib/types";

const EMPTY: Stats = {
  total: 0,
  avgRating: 0,
  thisMonth: 0,
  belumProses: 0,
  perBulan: [],
  perRating: [],
  perBagian: [],
};

export default function DashboardPage() {
  const [stats, setStats] = React.useState<Stats>(EMPTY);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  const kpis = [
    { label: "Total Submission", value: stats.total, icon: FileText, tone: "text-primary" },
    { label: "Rata-rata Rating", value: stats.avgRating, suffix: " / 4", icon: Star, tone: "text-warning" },
    { label: "Bulan Ini", value: stats.thisMonth, icon: Inbox, tone: "text-success" },
    { label: "Sertifikat Belum", value: stats.belumProses, icon: Gauge, tone: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Ringkasan feedback program magang / penelitian / PKL.</p>
        </div>
      </Reveal>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex animate-pulse items-center gap-4 pt-4">
                <span className="h-10 w-10 rounded-lg bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-5 w-16 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPI cards — stagger masuk */}
          <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <StaggerItem key={k.label}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 pt-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${k.tone}`}>
                      <k.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold leading-tight text-foreground">
                        <AnimatedNumber value={k.value} />
                        {k.suffix ?? ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          {/* Charts — grid 3 kolom di xl biar ngga melebar */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal delay={0.05} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Submission per Bulan</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionBarChart data={stats.perBulan} />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.12}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Distribusi Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <RatingDonut data={stats.perRating} />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={0.18} className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Submission per Bagian</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* donut dibatesin biar ngga melebar full width */}
                  <div className="mx-auto max-w-xl">
                    <BagianDonut data={stats.perBagian} />
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}
