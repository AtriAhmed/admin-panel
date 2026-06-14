"use client";

import { Button, ButtonGroup, Dropdown, Label, Tabs } from "@heroui/react";
import { ArrowsRotateLeft, Calendar, ChevronDown } from "@gravity-ui/icons";
import { IconButton } from "@/components/ui/icon-button";

export function DashboardToolbar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs defaultSelectedKey="overview">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Dashboard tabs">
            <Tabs.Tab id="overview">
              Overview
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sales">
              Sales
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="expenses">
              Expenses
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Refresh" size="sm" variant="tertiary">
          <ArrowsRotateLeft className="size-4" />
        </IconButton>
        <ButtonGroup size="sm" variant="tertiary">
          <Button>
            <Calendar className="size-4" />
            Monthly
          </Button>
          <Dropdown>
            <Button isIconOnly aria-label="Change period" size="sm" variant="tertiary">
              <ChevronDown className="size-4" />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu>
                {["Daily", "Weekly", "Monthly", "Yearly"].map((item) => (
                  <Dropdown.Item id={item.toLowerCase()} key={item} textValue={item}>
                    <Label>{item}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </ButtonGroup>
        <Button size="sm">Download</Button>
      </div>
    </div>
  );
}
