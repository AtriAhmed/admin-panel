"use client";

import type {
  CreateOperationRequest,
  OperationRequest,
  UpdateOperationRequest,
} from "@/lib/admin/schemas";
import type { DataGridColumn } from "@heroui-pro/react";
import type { FormEvent } from "react";

import { Button, Chip, Dropdown, Label, Modal, SearchField } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { CirclePlus, Eye, Funnel, Pencil } from "@gravity-ui/icons";
import { useMemo, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { EmptyState } from "@/components/ui/empty-state";
import { createContentSlug } from "@/lib/admin/slug";

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const statusColors = {
  draft: "warning",
  published: "success",
} as const;

export function getContentRequestFormPayload(
  form: HTMLFormElement,
): CreateOperationRequest {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();

  return {
    owner: String(formData.get("owner") ?? "").trim(),
    slug: createContentSlug(String(formData.get("slug") ?? "").trim() || title),
    summary: String(formData.get("summary") ?? "").trim(),
    title,
  };
}

export function getContentRequestUpdatePayload(
  form: HTMLFormElement,
  fallbackStatus: OperationRequest["status"],
): UpdateOperationRequest {
  const status =
    String(new FormData(form).get("status") ?? fallbackStatus) === "published"
      ? "published"
      : "draft";

  return {
    ...getContentRequestFormPayload(form),
    status,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", dateFormatOptions);
}

export function ContentBoard({
  createError,
  createErrorField,
  description,
  isCreating,
  isLoading,
  isUpdating = false,
  loadError,
  onCreate,
  onUpdate,
  pages,
  title,
  updateError,
  updateErrorField,
}: {
  createError?: string | null;
  createErrorField?: string | null;
  description: string;
  isCreating: boolean;
  isLoading: boolean;
  isUpdating?: boolean;
  loadError?: string | null;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onUpdate?: (page: OperationRequest, event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  pages: OperationRequest[];
  title: string;
  updateError?: string | null;
  updateErrorField?: string | null;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<OperationRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | OperationRequest["status"]
  >("all");

  const filteredPages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return pages.filter((page) => {
      const matchesStatus = statusFilter === "all" || page.status === statusFilter;
      const matchesSearch =
        !term ||
        [page.title, page.owner, page.slug, page.summary]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [pages, searchTerm, statusFilter]);

  const columns = useMemo<DataGridColumn<OperationRequest>[]>(
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
        cell: (item) => (
          <ContentRowActions
            onEdit={onUpdate ? () => setEditingPage(item) : undefined}
            pageId={item.id}
          />
        ),
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [onUpdate],
  );

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    const result = await onCreate(event);

    if (result) {
      setIsCreateOpen(false);
    }
  };

  const submitUpdate = async (event: FormEvent<HTMLFormElement>) => {
    if (!editingPage || !onUpdate) {
      return;
    }

    const result = await onUpdate(editingPage, event);

    if (result) {
      setEditingPage(null);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-lg font-semibold">{title}</h2>
          <p className="text-muted text-sm">{description}</p>
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

      {loadError ? (
        <EmptyState message={loadError} />
      ) : isLoading ? (
        <EmptyState message="Loading content queue..." />
      ) : (
        <DataGrid
          aria-label={title}
          columns={columns}
          contentClassName="min-w-[960px]"
          data={filteredPages}
          getRowId={(item) => item.id}
        />
      )}

      <ContentRequestModal
        error={createError ?? null}
        errorField={createErrorField}
        isBusy={isCreating}
        isOpen={isCreateOpen}
        onOpenChange={(nextOpen) => {
          if (isCreating) return;
          setIsCreateOpen(nextOpen);
        }}
        onSubmit={submitCreate}
      />

      {onUpdate ? (
        <ContentRequestModal
          error={updateError ?? null}
          errorField={updateErrorField}
          isBusy={isUpdating}
          isOpen={Boolean(editingPage)}
          onOpenChange={(nextOpen) => {
            if (isUpdating) return;
            if (!nextOpen) setEditingPage(null);
          }}
          onSubmit={submitUpdate}
          page={editingPage}
        />
      ) : null}
    </section>
  );
}

function ContentRowActions({
  onEdit,
  pageId,
}: {
  onEdit?: () => void;
  pageId: string;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-page-id={pageId}>
      <IconButton label="Preview content" size="sm" variant="tertiary">
        <Eye className="size-4" />
      </IconButton>
      {onEdit ? (
        <IconButton
          label="Edit content"
          onPress={onEdit}
          size="sm"
          variant="tertiary"
        >
          <Pencil className="size-4" />
        </IconButton>
      ) : null}
    </div>
  );
}

function ContentRequestModal({
  error,
  errorField,
  isBusy,
  isOpen,
  onOpenChange,
  onSubmit,
  page,
}: {
  error: string | null;
  errorField?: string | null;
  isBusy: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  page?: OperationRequest | null;
}) {
  const isEditing = Boolean(page);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={!isBusy}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <form key={page?.id ?? "new-content-request"} onSubmit={onSubmit}>
              <Modal.Header>
                <Modal.Heading>
                  {isEditing ? "Edit content request" : "New content request"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Title</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "title"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={page?.title ?? ""}
                        name="title"
                        placeholder="Holiday returns update"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Owner</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "owner"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={page?.owner ?? ""}
                        name="owner"
                        placeholder="Content Operations"
                        required
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Slug</span>
                    <input
                      className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                        errorField === "slug"
                          ? "border border-danger text-foreground ring-1 ring-danger/20"
                          : "border border-divider"
                      }`}
                      defaultValue={page?.slug ?? ""}
                      name="slug"
                      placeholder="holiday-returns-update"
                    />
                  </label>
                  {isEditing ? (
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Status</span>
                      <select
                        className="rounded-md border border-divider bg-content1 px-3 py-2"
                        defaultValue={page?.status ?? "draft"}
                        name="status"
                        required
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </label>
                  ) : null}
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Summary</span>
                    <textarea
                      className={`min-h-24 rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                        errorField === "summary"
                          ? "border border-danger text-foreground ring-1 ring-danger/20"
                          : "border border-divider"
                      }`}
                      defaultValue={page?.summary ?? ""}
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
                  {isBusy
                    ? isEditing
                      ? "Saving..."
                      : "Creating..."
                    : isEditing
                      ? "Save changes"
                      : "Create request"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
