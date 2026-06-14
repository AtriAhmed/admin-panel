"use client";

import { Card, ListBox, Select } from "@heroui/react";
import { BarChart, NumberValue, TrendChip } from "@heroui-pro/react";

import { salesChartData, salesMiniKpis } from "../data/sales";

export function SalesPerformanceCard() {
  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Sales Performance</Card.Title>
        <Select className="w-[140px]" defaultValue="last-2-weeks" variant="secondary">
          <Select.Trigger className="h-auto min-h-0 px-3 py-1.5 text-xs font-medium">
            <Select.Value />
            <Select.Indicator className="size-3.5" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {[
                ["last-week", "Last week"],
                ["last-2-weeks", "Last 2 weeks"],
                ["last-month", "Last month"],
                ["last-3-months", "Last 3 months"],
              ].map(([id, label]) => (
                <ListBox.Item id={id} key={id} textValue={label}>
                  {label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {salesMiniKpis.map((kpi) => (
            <div className="flex flex-col" key={kpi.label}>
              <div className="flex items-center gap-1.5">
                <NumberValue
                  className="text-foreground text-lg font-semibold tabular-nums"
                  currency={kpi.currency}
                  maximumFractionDigits={0}
                  style={kpi.currency ? "currency" : "decimal"}
                  value={kpi.value}
                />
                <TrendChip className="bg-transparent" trend="up">
                  3.3%
                </TrendChip>
              </div>
              <span className="text-muted text-xs">{kpi.label}</span>
            </div>
          ))}
        </div>
        <BarChart data={[...salesChartData]} height={180}>
          <BarChart.Grid vertical={false} />
          <BarChart.XAxis dataKey="month" tickMargin={8} />
          <BarChart.YAxis domain={[0, 60]} ticks={[0, 20, 40, 60]} width={30} />
          <BarChart.Bar
            barSize={16}
            dataKey="sales"
            fill="var(--chart-3)"
            radius={[24, 24, 24, 24]}
          />
          <BarChart.Tooltip content={<BarChart.TooltipContent />} />
        </BarChart>
      </Card.Content>
    </Card>
  );
}
