import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { buildConfig } from "payload";

import { CampaignBriefs } from "./src/payload/collections/campaign-briefs";
import { OperationRequests } from "./src/payload/collections/operation-requests";
import { Users } from "./src/payload/collections/users";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, OperationRequests, CampaignBriefs],
  db: sqliteAdapter({
    client: {
      url: process.env.PAYLOAD_DATABASE_URL ?? "file:./.payload/admin-demo.db",
    },
  }),
  routes: {
    admin: "/cms",
    api: "/payload-api",
    graphQL: "/payload-graphql",
    graphQLPlayground: "/payload-graphql-playground",
  },
  secret:
    process.env.PAYLOAD_SECRET ??
    "local-payload-secret-for-admin-panel-content-spike",
});
