"use client";

import type { MockCmsPage } from "@/lib/mock/schemas";
import type { DataGridColumn } from "@heroui-pro/react";

import { Button, Chip, Dropdown, Label, Modal, SearchField } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { CirclePlus, Eye, Funnel, Pencil } from "@gravity-ui/icons";
import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";

import { IconButton } from "@/components/ui/icon-button";
import { mockApi } from "@/lib/mock/client";

import { MockLabLayout } from "../mock-lab-layout";
import { OperationsEmptyState } from "../mock-lab-shared";

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const statusColors = {
  draft: "warning",
  published: "success",
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", dateFormatOptions);
}

function createSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function MockLabOverviewRoute() {
  const user = useSWR("operations/current-user", mockApi.currentUser);
  const analytics = useSWR("operations/analytics-summary", mockApi.analyticsSummary);
  const pages = useSWR("operations/publishing-queue", mockApi.cmsPages);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MockCmsPage["status"]>(
    "all",
  );

  const filteredPages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return (pages.data ?? []).filter((page) => {
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesSearch =
        !term ||
        [page.title, page.owner, page.slug, page.summary]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [pages.data, searchTerm, statusFilter]);

  const columns = useMemo<DataGridColumn<MockCmsPage>[]>(
    () => [
      {
        accessorKey: "title",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-muted truncate text-xs">/{item.slug}</span>
          </div>
        ),
        header: "Content",
        id: "title",
        isRowHeader: true,
        minWidth: 240,
      },
      {
        accessorKey: "owner",
        allowsSorting: true,
        cell: (item) => <span className="text-sm">{item.owner}</span>,
        header: "Owner",
        id: "owner",
        minWidth: 180,
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
        accessorKey: "summary",
        cell: (item) => (
          <span className="text-muted line-clamp-2 text-sm">{item.summary}</span>
        ),
        header: "Summary",
        id: "summary",
        minWidth: 260,
      },
      {
        accessorKey: "updatedAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDate(item.updatedAt)}</span>
        ),
        header: "Updated",
        id: "updatedAt",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) => <ContentRowActions pageId={item.id} />,
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [],
  );

  const createContentRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContentError(null);
    setIsSubmittingContent(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const owner = String(formData.get("owner") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim() || createSlug(title);

    try {
      await mockApi.createCmsPage({
        owner,
        slug,
        summary,
        title,
      });
      form.reset();
      setIsCreateOpen(false);
      await pages.mutate();
    } catch (error) {
      setContentError(
        error instanceof Error ? error.message : "Could not create content request.",
      );
    } finally {
      setIsSubmittingContent(false);
    }
  };

  return (
    <MockLabLayout>
      <p className="text-muted text-sm">
        Review operating metrics, coordinate ownership, and manage content requests.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          loading={analytics.isLoading}
          value={
            analytics.data
              ? new Intl.NumberFormat("en-US", {
                  currency: "USD",
                  style: "currency",
                }).format(analytics.data.revenue)
              : null
          }
        />
        <MetricCard
          label="Orders"
          loading={analytics.isLoading}
          value={analytics.data?.orders.toLocaleString("en-US") ?? null}
        />
        <MetricCard
          label="Conversion"
          loading={analytics.isLoading}
          value={analytics.data ? `${analytics.data.conversionRate}%` : null}
        />
        <MetricCard
          label="Shift lead"
          loading={user.isLoading}
          value={user.data?.displayName ?? null}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Publishing Queue</h2>
            <p className="text-muted text-sm">
              Content requests backed by the local CMS collection.
            </p>
          </div>
          <Button onPress={() => setIsCreateOpen(true)} size="sm">
            <CirclePlus className="size-4" />
            New request
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            className="w-full sm:w-[280px]"
            name="content-search"
            onChange={setSearchTerm}
            value={searchTerm}
            variant="secondary"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search content..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Dropdown>
            <Button size="sm" variant="secondary">
              <Funnel className="size-4" />
              Status
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => setStatusFilter(String(key) as typeof statusFilter)}
                selectedKeys={[statusFilter]}
                selectionMode="single"
              >
                {[
                  { id: "all", label: "All" },
                  { id: "draft", label: "Draft" },
                  { id: "published", label: "Published" },
                ].map((item) => (
                  <Dropdown.Item id={item.id} key={item.id} textValue={item.label}>
                    <Label>{item.label}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {pages.error ? (
          <OperationsEmptyState message={pages.error.message} />
        ) : pages.isLoading ? (
          <OperationsEmptyState message="Loading content queue..." />
        ) : (
          <DataGrid
            aria-label="Publishing queue"
            columns={columns}
            contentClassName="min-w-[960px]"
            data={filteredPages}
            getRowId={(item) => item.id}
          />
        )}
      </section>

      <CreateContentModal
        error={contentError}
        isBusy={isSubmittingContent}
        isOpen={isCreateOpen}
        onOpenChange={(nextOpen) => {
          if (isSubmittingContent) return;
          setContentError(null);
          setIsCreateOpen(nextOpen);
        }}
        onSubmit={createContentRequest}
      />
    </MockLabLayout>
  );
}

function MetricCard({
  label,
  loading,
  value,
}: {
  label: string;
  loading: boolean;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-divider bg-content1 p-4">
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums">
        {loading ? "..." : value ?? "-"}
      </p>
    </div>
  );
}

function ContentRowActions({ pageId }: { pageId: string }) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-page-id={pageId}>
      <IconButton label="Preview content" size="sm" variant="tertiary">
        <Eye className="size-4" />
      </IconButton>
      <IconButton label="Edit content" size="sm" variant="tertiary">
        <Pencil className="size-4" />
      </IconButton>
    </div>
  );
}

function CreateContentModal({
  error,
  isBusy,
  isOpen,
  onOpenChange,
  onSubmit,
}: {
  error: string | null;
  isBusy: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={!isBusy}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <form onSubmit={onSubmit}>
              <Modal.Header>
                <Modal.Icon>
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CirclePlus className="size-5" />
                  </div>
                </Modal.Icon>
                <Modal.Heading>New content request</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Title</span>
                      <input
                        className="rounded-md border border-divider bg-content1 px-3 py-2"
                        name="title"
                        placeholder="Holiday returns update"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Owner</span>
                      <input
                        className="rounded-md border border-divider bg-content1 px-3 py-2"
                        name="owner"
                        placeholder="Content Operations"
                        required
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Slug</span>
                    <input
                      className="rounded-md border border-divider bg-content1 px-3 py-2"
                      name="slug"
                      placeholder="holiday-returns-update"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Summary</span>
                    <textarea
                      className="min-h-24 rounded-md border border-divider bg-content1 px-3 py-2"
                      name="summary"
                      placeholder="Internal request summary for the publishing queue."
                      required
                    />
                  </label>
                  {error ? <p className="text-danger text-sm">{error}</p> : null}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isBusy}
                  onPress={() => onOpenChange(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button isDisabled={isBusy} type="submit">
                  {isBusy ? "Creating..." : "Create request"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
