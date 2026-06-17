"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";

import {
  ContentBoard,
  getContentRequestFormPayload,
  getContentRequestUpdatePayload,
} from "@/features/dashboard/widgets/content-board";
import { OperationsLayout } from "@/features/dashboard/components/operations-layout";
import { adminApi } from "@/lib/admin/client";

export function OperationsPage() {
  const pages = useSWR(
    "operations/publishing-queue",
    adminApi.operationRequests,
  );
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentErrorField, setContentErrorField] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateErrorField, setUpdateErrorField] = useState<string | null>(null);
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);

  const createContentRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContentError(null);
    setContentErrorField(null);
    setIsSubmittingContent(true);

    const form = event.currentTarget;

    try {
      await adminApi.createOperationRequest(getContentRequestFormPayload(form));
      form.reset();
      await pages.mutate();
      return true;
    } catch (error) {
      setContentError(
        error instanceof Error ? error.message : "Could not create content request.",
      );
      setContentErrorField(
        error instanceof Error && "field" in error
          ? (error as Error & { field?: string }).field ?? null
          : null,
      );
      return false;
    } finally {
      setIsSubmittingContent(false);
    }
  };

  const updateContentRequest = async (
    page: NonNullable<typeof pages.data>[number],
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setUpdateError(null);
    setUpdateErrorField(null);
    setIsUpdatingContent(true);

    try {
      await adminApi.updateOperationRequest(
        page.id,
        getContentRequestUpdatePayload(event.currentTarget, page.status),
      );
      await pages.mutate();
      return true;
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Could not update content request.",
      );
      setUpdateErrorField(
        error instanceof Error && "field" in error
          ? (error as Error & { field?: string }).field ?? null
          : null,
      );
      return false;
    } finally {
      setIsUpdatingContent(false);
    }
  };

  return (
    <OperationsLayout>
      <p className="text-muted text-sm">
        Coordinate publishing requests and review content ownership.
      </p>

      <ContentBoard
        createError={contentError}
        createErrorField={contentErrorField}
        description="Content requests backed by the local CMS collection."
        isCreating={isSubmittingContent}
        isLoading={pages.isLoading}
        isUpdating={isUpdatingContent}
        loadError={pages.error?.message ?? null}
        onCreate={createContentRequest}
        onUpdate={updateContentRequest}
        pages={pages.data ?? []}
        title="Publishing Queue"
        updateError={updateError}
        updateErrorField={updateErrorField}
      />
    </OperationsLayout>
  );
}
