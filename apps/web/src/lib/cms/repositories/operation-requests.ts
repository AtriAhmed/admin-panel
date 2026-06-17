import { getPayloadCms } from "@/lib/cms/payload";
import { seedOperationRequests } from "@/lib/cms/seed/operations";
import type {
  CreateOperationRequestRecord,
  OperationRequestRecord,
  PayloadOperationRequestDocument,
  UpdateOperationRequestRecord,
} from "@/lib/cms/types";

const collection = "operation-requests";

async function ensureSeeded() {
  const payload = await getPayloadCms();
  const existing = await payload.count({ collection });

  if (existing.totalDocs > 0) {
    return;
  }

  await Promise.all(
    seedOperationRequests.map((data) =>
      payload.create({
        collection,
        data,
      }),
    ),
  );
}

export async function listOperationRequests(): Promise<OperationRequestRecord[]> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const result = await payload.find({
    collection,
    limit: 20,
    sort: "-updatedAt",
  });

  return result.docs.map(normalizeOperationRequest);
}

export async function createOperationRequest(
  data: CreateOperationRequestRecord,
): Promise<OperationRequestRecord> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const page = await payload.create({
    collection,
    data: {
      ...data,
      status: "draft",
    },
  });

  return normalizeOperationRequest(page);
}

export async function updateOperationRequest(
  id: string,
  data: UpdateOperationRequestRecord,
): Promise<OperationRequestRecord> {
  await ensureSeeded();

  const payload = await getPayloadCms();
  const page = await payload.update({
    collection,
    data,
    id,
  });

  return normalizeOperationRequest(page);
}

export async function deleteOperationRequest(id: string): Promise<{ id: string }> {
  const payload = await getPayloadCms();

  await payload.delete({
    collection,
    id,
  });

  return { id };
}

function normalizeOperationRequest(doc: unknown): OperationRequestRecord {
  const page = doc as PayloadOperationRequestDocument;

  return {
    id: String(page.id),
    owner: page.owner,
    slug: page.slug,
    status: page.status,
    summary: page.summary,
    title: page.title,
    updatedAt: page.updatedAt ?? new Date().toISOString(),
  };
}
