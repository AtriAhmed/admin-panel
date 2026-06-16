"use client";

import type { Order } from "../data/orders";
import type { DataGridColumn } from "@heroui-pro/react";

import { Avatar, Button, Chip, Dropdown, Label, SearchField } from "@heroui/react";
import { DataGrid, NumberValue } from "@heroui-pro/react";
import { Calendar, Funnel } from "@gravity-ui/icons";
import { useMemo } from "react";

import { orders, statusColors } from "../data/orders";
import { OrdersRowActions } from "../widgets/orders-row-actions";

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", dateFormatOptions);
}

export function OrdersPage() {
  const columns = useMemo<DataGridColumn<Order>[]>(
    () => [
      {
        accessorKey: "orderId",
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.orderId}</span>,
        header: "Order ID",
        id: "orderId",
        isRowHeader: true,
        minWidth: 140,
      },
      {
        accessorKey: "customer",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <Avatar.Image alt={item.customer.name} src={item.customer.avatar} />
              <Avatar.Fallback>
                {item.customer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium">{item.customer.name}</span>
              <span className="text-muted text-xs">{item.customer.email}</span>
            </div>
          </div>
        ),
        header: "Customer",
        id: "customer",
        minWidth: 220,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={statusColors[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        accessorKey: "total",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="tabular-nums"
            currency={item.currency}
            maximumFractionDigits={2}
            style="currency"
            value={item.total}
          />
        ),
        header: "Total",
        id: "total",
        minWidth: 120,
      },
      {
        accessorKey: "date",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDate(item.date)}</span>
        ),
        header: "Date",
        id: "date",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) => <OrdersRowActions orderId={item.id} />,
        header: "Actions",
        id: "actions",
        minWidth: 140,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">Manage and track customer orders.</p>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField className="w-full sm:w-[240px]" name="orders-search" variant="secondary">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search orders..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Dropdown>
          <Button size="sm" variant="secondary">
            <Funnel className="size-4" />
            Status
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              {["All", "Paid", "Pending", "Refunded", "Failed"].map((item) => (
                <Dropdown.Item id={item.toLowerCase()} key={item} textValue={item}>
                  <Label>{item}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown>
          <Button size="sm" variant="secondary">
            <Calendar className="size-4" />
            Date range
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              {["Last 7 days", "Last 30 days", "Last 90 days"].map((item) => (
                <Dropdown.Item id={item} key={item} textValue={item}>
                  <Label>{item}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <DataGrid
        aria-label="Orders"
        columns={columns}
        contentClassName="min-w-[820px]"
        data={[...orders]}
        getRowId={(item) => item.id}
      />
    </div>
  );
}
