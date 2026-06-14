"use client";

import type { SparklinePoint } from "../data/analytics";
import type { ComponentProps } from "react";

import { KPI } from "@heroui-pro/react";

import {
  bounceSparkline,
  durationSparkline,
  sessionsSparkline,
  usersSparkline,
} from "../data/analytics";

type TrendDir = ComponentProps<typeof KPI.Trend>["trend"];

type AnalyticsKpi = {
  chartColor: string;
  chartData: readonly SparklinePoint[];
  label: string;
  numberProps: Omit<ComponentProps<typeof KPI.Value>, "children">;
  trend: TrendDir;
  trendValue: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const analyticsKpis: readonly AnalyticsKpi[] = [
  {
    chartColor: "var(--color-accent)",
    chartData: sessionsSparkline,
    label: "Sessions",
    numberProps: { maximumFractionDigits: 0, value: 84210 },
    trend: "up",
    trendValue: "14%",
  },
  {
    chartColor: "var(--color-success)",
    chartData: usersSparkline,
    label: "Unique users",
    numberProps: { maximumFractionDigits: 0, value: 47382 },
    trend: "up",
    trendValue: "6%",
  },
  {
    chartColor: "var(--color-muted)",
    chartData: bounceSparkline,
    label: "Bounce rate",
    numberProps: { maximumFractionDigits: 1, style: "percent", value: 0.413 },
    trend: "neutral",
    trendValue: "-2.1%",
  },
];

export function AnalyticsKpiRow() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {analyticsKpis.map((kpi) => (
        <KPI key={kpi.label}>
          <KPI.Header>
            <KPI.Title>{kpi.label}</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value {...kpi.numberProps} />
            <KPI.Trend trend={kpi.trend}>{kpi.trendValue}</KPI.Trend>
          </KPI.Content>
          <KPI.Chart
            color={kpi.chartColor}
            data={[...kpi.chartData]}
            height={60}
            strokeWidth={1.5}
          />
        </KPI>
      ))}
      <KPI>
        <KPI.Header>
          <KPI.Title>Avg. session</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <span className="text-foreground text-2xl font-semibold tabular-nums">
            {formatDuration(222)}
          </span>
          <KPI.Trend trend="up">12%</KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-warning)"
          data={[...durationSparkline]}
          height={60}
          strokeWidth={1.5}
        />
      </KPI>
    </div>
  );
}
