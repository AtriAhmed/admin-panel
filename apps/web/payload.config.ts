import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig } from "payload";

import { CmsPages } from "./src/payload/collections/cms-pages";

export default buildConfig({
  admin: {
    user: undefined,
  },
  collections: [CmsPages],
  db: sqliteAdapter({
    client: {
      url: process.env.PAYLOAD_DATABASE_URL ?? "file:./.payload/payload.db",
    },
  }),
  secret:
    process.env.PAYLOAD_SECRET ??
    "local-payload-secret-for-admin-panel-content-spike",
});
