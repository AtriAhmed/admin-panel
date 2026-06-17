import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig } from "payload";

import { CampaignBriefs } from "./src/payload/collections/campaign-briefs";
import { OperationRequests } from "./src/payload/collections/operation-requests";

export default buildConfig({
  admin: {
    user: undefined,
  },
  collections: [OperationRequests, CampaignBriefs],
  db: sqliteAdapter({
    client: {
      url: process.env.PAYLOAD_DATABASE_URL ?? "file:./.payload/admin-demo.db",
    },
  }),
  secret:
    process.env.PAYLOAD_SECRET ??
    "local-payload-secret-for-admin-panel-content-spike",
});
