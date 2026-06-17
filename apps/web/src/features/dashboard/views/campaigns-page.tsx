"use client";

import type {
  Campaign,
  CampaignChannel,
  CreateCampaign,
  UpdateCampaign,
} from "@/lib/admin/schemas";
import type { DataGridColumn } from "@heroui-pro/react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Chip, Dropdown, Label, Modal, SearchField } from "@heroui/react";
import { DataGrid, NumberValue } from "@heroui-pro/react";
import { CirclePlus, Eye, Funnel, Pencil } from "@gravity-ui/icons";
import { FormEvent, useMemo, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { EmptyState } from "@/components/ui/empty-state";
import { adminApi } from "@/lib/admin/client";
import { adminQueryKeys } from "@/lib/admin/query-keys";

const channelLabels: Record<CampaignChannel, string> = {
  email: "Email",
  "paid-search": "Paid Search",
  "retail-media": "Retail Media",
  social: "Social",
};

const statusColors = {
  live: "success",
  paused: "danger",
  planned: "warning",
} as const;

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", dateFormatOptions);
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function getCampaignFormPayload(form: HTMLFormElement): CreateCampaign {
  const formData = new FormData(form);

  return {
    budget: Number(formData.get("budget") ?? 0),
    channel: String(formData.get("channel") ?? "email") as CampaignChannel,
    launchDate: String(formData.get("launchDate") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    owner: String(formData.get("owner") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
  };
}

function getCampaignUpdatePayload(
  form: HTMLFormElement,
  fallbackStatus: Campaign["status"],
): UpdateCampaign {
  const formData = new FormData(form);

  return {
    ...getCampaignFormPayload(form),
    status: String(formData.get("status") ?? fallbackStatus) as Campaign["status"],
  };
}

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const campaigns = useQuery({
    queryFn: adminApi.campaigns,
    queryKey: adminQueryKeys.campaigns,
  });
  const createCampaign = useMutation({
    mutationFn: adminApi.createCampaign,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.campaigns });
    },
  });
  const updateCampaign = useMutation({
    mutationFn: ({
      data,
      id,
    }: {
      data: Parameters<typeof adminApi.updateCampaign>[1];
      id: string;
    }) => adminApi.updateCampaign(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.campaigns });
    },
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrorField, setCreateErrorField] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateErrorField, setUpdateErrorField] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | CampaignChannel>("all");

  const filteredCampaigns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return (campaigns.data ?? []).filter((campaign) => {
      const matchesChannel = channelFilter === "all" || campaign.channel === channelFilter;
      const matchesSearch =
        !term ||
        [campaign.name, campaign.owner, campaign.summary, channelLabels[campaign.channel]]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesChannel && matchesSearch;
    });
  }, [campaigns.data, channelFilter, searchTerm]);

  const columns = useMemo<DataGridColumn<Campaign>[]>(
    () => [
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted line-clamp-1 text-xs">{item.summary}</span>
          </div>
        ),
        header: "Campaign",
        id: "name",
        isRowHeader: true,
        minWidth: 280,
      },
      {
        accessorKey: "channel",
        allowsSorting: true,
        cell: (item) => <span>{channelLabels[item.channel]}</span>,
        header: "Channel",
        id: "channel",
        minWidth: 150,
      },
      {
        accessorKey: "owner",
        allowsSorting: true,
        cell: (item) => <span>{item.owner}</span>,
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
        accessorKey: "budget",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="tabular-nums"
            currency="USD"
            maximumFractionDigits={0}
            style="currency"
            value={item.budget}
          />
        ),
        header: "Budget",
        id: "budget",
        minWidth: 120,
      },
      {
        accessorKey: "launchDate",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDate(item.launchDate)}</span>
        ),
        header: "Launch",
        id: "launchDate",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) => (
          <CampaignRowActions
            campaignId={item.id}
            onEdit={() => setEditingCampaign(item)}
          />
        ),
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [],
  );

  const submitCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreateErrorField(null);

    const form = event.currentTarget;

    try {
      await createCampaign.mutateAsync(getCampaignFormPayload(form));
      form.reset();
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Could not create campaign.",
      );
      setCreateErrorField(
        error instanceof Error && "field" in error
          ? (error as Error & { field?: string }).field ?? null
          : null,
      );
    }
  };

  const submitCampaignUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingCampaign) {
      return;
    }

    setUpdateError(null);
    setUpdateErrorField(null);

    try {
      await updateCampaign.mutateAsync({
        data: getCampaignUpdatePayload(event.currentTarget, editingCampaign.status),
        id: editingCampaign.id,
      });
      setEditingCampaign(null);
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Could not update campaign.",
      );
      setUpdateErrorField(
        error instanceof Error && "field" in error
          ? (error as Error & { field?: string }).field ?? null
          : null,
      );
    }
  };

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">
        Plan growth campaigns, track launch readiness, and coordinate channel owners.
      </p>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Campaign Planner</h2>
            <p className="text-muted text-sm">
              Campaign briefs stored in a separate Payload collection.
            </p>
          </div>
          <Button onPress={() => setIsCreateOpen(true)} size="sm">
            <CirclePlus className="size-4" />
            New campaign
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            className="w-full sm:w-[280px]"
            name="campaign-search"
            onChange={setSearchTerm}
            value={searchTerm}
            variant="secondary"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search campaigns..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <Dropdown>
            <Button size="sm" variant="secondary">
              <Funnel className="size-4" />
              Channel
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => setChannelFilter(String(key) as typeof channelFilter)}
                selectedKeys={[channelFilter]}
                selectionMode="single"
              >
                {[
                  { id: "all", label: "All" },
                  { id: "email", label: "Email" },
                  { id: "paid-search", label: "Paid Search" },
                  { id: "social", label: "Social" },
                  { id: "retail-media", label: "Retail Media" },
                ].map((item) => (
                  <Dropdown.Item id={item.id} key={item.id} textValue={item.label}>
                    <Label>{item.label}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        {campaigns.error ? (
          <EmptyState message={campaigns.error.message} />
        ) : campaigns.isLoading ? (
          <EmptyState message="Loading campaigns..." />
        ) : (
          <DataGrid
            aria-label="Campaign planner"
            columns={columns}
            contentClassName="min-w-[1040px]"
            data={filteredCampaigns}
            getRowId={(item) => item.id}
          />
        )}
      </section>

      <CreateCampaignModal
        error={createError}
        errorField={createErrorField}
        isBusy={createCampaign.isPending}
        isOpen={isCreateOpen}
        onOpenChange={(nextOpen) => {
          if (createCampaign.isPending) return;
          if (!nextOpen) {
            setCreateError(null);
            setCreateErrorField(null);
          }
          setIsCreateOpen(nextOpen);
        }}
        onSubmit={submitCampaign}
      />

      <EditCampaignModal
        campaign={editingCampaign}
        error={updateError}
        errorField={updateErrorField}
        isBusy={updateCampaign.isPending}
        onOpenChange={(nextOpen) => {
          if (updateCampaign.isPending) return;
          if (!nextOpen) {
            setUpdateError(null);
            setUpdateErrorField(null);
            setEditingCampaign(null);
          }
        }}
        onSubmit={submitCampaignUpdate}
      />
    </main>
  );
}

function CampaignRowActions({
  campaignId,
  onEdit,
}: {
  campaignId: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-campaign-id={campaignId}>
      <IconButton label="Preview campaign" size="sm" variant="tertiary">
        <Eye className="size-4" />
      </IconButton>
      <IconButton
        label="Edit campaign"
        onPress={onEdit}
        size="sm"
        variant="tertiary"
      >
        <Pencil className="size-4" />
      </IconButton>
    </div>
  );
}

function CreateCampaignModal({
  error,
  errorField,
  isBusy,
  isOpen,
  onOpenChange,
  onSubmit,
}: {
  error: string | null;
  errorField?: string | null;
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
                <Modal.Heading>New campaign</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Name</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "name"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        name="name"
                        placeholder="Fall launch sequence"
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
                        name="owner"
                        placeholder="Growth Marketing"
                        required
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Channel</span>
                      <select
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "channel"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        name="channel"
                        required
                      >
                        {Object.entries(channelLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Budget</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "budget"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        min="0"
                        name="budget"
                        placeholder="25000"
                        required
                        type="number"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Launch date</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "launchDate"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        name="launchDate"
                        required
                        type="date"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Summary</span>
                    <textarea
                      className={`min-h-24 rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                        errorField === "summary"
                          ? "border border-danger text-foreground ring-1 ring-danger/20"
                          : "border border-divider"
                      }`}
                      name="summary"
                      placeholder="Campaign objective, target audience, and launch notes."
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
                  {isBusy ? "Creating..." : "Create campaign"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function EditCampaignModal({
  campaign,
  error,
  errorField,
  isBusy,
  onOpenChange,
  onSubmit,
}: {
  campaign: Campaign | null;
  error: string | null;
  errorField?: string | null;
  isBusy: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Modal isOpen={Boolean(campaign)} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={!isBusy}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <form key={campaign?.id ?? "edit-campaign"} onSubmit={onSubmit}>
              <Modal.Header>
                <Modal.Heading>Edit campaign</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Name</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "name"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={campaign?.name ?? ""}
                        name="name"
                        placeholder="Fall launch sequence"
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
                        defaultValue={campaign?.owner ?? ""}
                        name="owner"
                        placeholder="Growth Marketing"
                        required
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Channel</span>
                      <select
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "channel"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={campaign?.channel ?? "email"}
                        name="channel"
                        required
                      >
                        {Object.entries(channelLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Status</span>
                      <select
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "status"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={campaign?.status ?? "planned"}
                        name="status"
                        required
                      >
                        <option value="planned">Planned</option>
                        <option value="live">Live</option>
                        <option value="paused">Paused</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Budget</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "budget"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={campaign?.budget ?? 0}
                        min="0"
                        name="budget"
                        placeholder="25000"
                        required
                        type="number"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium">Launch date</span>
                      <input
                        className={`rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                          errorField === "launchDate"
                            ? "border border-danger text-foreground ring-1 ring-danger/20"
                            : "border border-divider"
                        }`}
                        defaultValue={
                          campaign ? toDateInputValue(campaign.launchDate) : ""
                        }
                        name="launchDate"
                        required
                        type="date"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">Summary</span>
                    <textarea
                      className={`min-h-24 rounded-md bg-content1 px-3 py-2 transition-colors duration-150 ${
                        errorField === "summary"
                          ? "border border-danger text-foreground ring-1 ring-danger/20"
                          : "border border-divider"
                      }`}
                      defaultValue={campaign?.summary ?? ""}
                      name="summary"
                      placeholder="Campaign objective, target audience, and launch notes."
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
                  {isBusy ? "Saving..." : "Save changes"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
