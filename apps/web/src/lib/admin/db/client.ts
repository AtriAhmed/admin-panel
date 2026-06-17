import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databaseUrl =
  process.env.ADMIN_DATABASE_URL ?? "file:./.admin-data/admin.sqlite";

if (!process.env.ADMIN_DATABASE_URL) {
  mkdirSync(path.join(process.cwd(), ".admin-data"), { recursive: true });
} else if (databaseUrl.startsWith("file:./.admin-data/")) {
  mkdirSync(path.join(process.cwd(), ".admin-data"), { recursive: true });
} else if (databaseUrl.startsWith("file:/")) {
  const directory = path.dirname(databaseUrl.replace(/^file:/, ""));

  mkdirSync(directory, { recursive: true });
}

export const adminDb = createClient({
  url: databaseUrl,
});
