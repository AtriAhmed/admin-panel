import { randomUUID } from "node:crypto";

import { adminDb } from "@/lib/admin/db/client";
import type {
  CreateOperationRequestRecord,
  OperationRequestRecord,
  UpdateOperationRequestRecord,
} from "@/lib/admin/repositories/types";
import { seedOperationRequests } from "@/lib/admin/seed/operations";

type OperationRequestRow = {
  id: string;
  owner: string;
  slug: string;
  status: OperationRequestRecord["status"];
  summary: string;
  title: string;
  updated_at: string;
};

async function ensureSchema() {
  await adminDb.execute(`
    CREATE TABLE IF NOT EXISTS operation_requests (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
      summary TEXT NOT NULL,
      title TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

async function ensureSeeded() {
  await ensureSchema();

  const existing = await adminDb.execute(
    "SELECT COUNT(*) AS count FROM operation_requests",
  );
  const count = Number(existing.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  for (const request of seedOperationRequests) {
    const now = new Date().toISOString();

    await adminDb.execute({
      args: [randomUUID(), request.owner, request.slug, request.status, request.summary, request.title, now],
      sql: `
        INSERT INTO operation_requests
          (id, owner, slug, status, summary, title, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    });
  }
}

export async function listOperationRequests(): Promise<OperationRequestRecord[]> {
  await ensureSeeded();

  const result = await adminDb.execute(`
    SELECT id, owner, slug, status, summary, title, updated_at
    FROM operation_requests
    ORDER BY updated_at DESC
    LIMIT 20
  `);

  return result.rows.map(normalizeOperationRequest);
}

export async function createOperationRequest(
  data: CreateOperationRequestRecord,
): Promise<OperationRequestRecord> {
  await ensureSeeded();

  const id = randomUUID();
  const updatedAt = new Date().toISOString();

  await adminDb.execute({
    args: [id, data.owner, data.slug, "draft", data.summary, data.title, updatedAt],
    sql: `
      INSERT INTO operation_requests
        (id, owner, slug, status, summary, title, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  });

  return {
    ...data,
    id,
    status: "draft",
    updatedAt,
  };
}

export async function updateOperationRequest(
  id: string,
  data: UpdateOperationRequestRecord,
): Promise<OperationRequestRecord> {
  await ensureSeeded();

  const updatedAt = new Date().toISOString();
  const result = await adminDb.execute({
    args: [
      data.owner,
      data.slug,
      data.status,
      data.summary,
      data.title,
      updatedAt,
      id,
    ],
    sql: `
      UPDATE operation_requests
      SET owner = ?, slug = ?, status = ?, summary = ?, title = ?, updated_at = ?
      WHERE id = ?
      RETURNING id, owner, slug, status, summary, title, updated_at
    `,
  });

  if (!result.rows[0]) {
    throw new Error("Operation request not found.");
  }

  return normalizeOperationRequest(result.rows[0]);
}

export async function deleteOperationRequest(id: string): Promise<{ id: string }> {
  await ensureSeeded();

  const result = await adminDb.execute({
    args: [id],
    sql: "DELETE FROM operation_requests WHERE id = ?",
  });

  if (result.rowsAffected === 0) {
    throw new Error("Operation request not found.");
  }

  return { id };
}

function normalizeOperationRequest(row: unknown): OperationRequestRecord {
  const request = row as OperationRequestRow;

  return {
    id: request.id,
    owner: request.owner,
    slug: request.slug,
    status: request.status,
    summary: request.summary,
    title: request.title,
    updatedAt: request.updated_at,
  };
}

