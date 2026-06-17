import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { buildConfig } from "payload";

import { Testimonials } from "./src/payload/collections/testimonials";
import { Users } from "./src/payload/collections/users";

mkdirSync(path.join(process.cwd(), ".payload"), { recursive: true });

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Testimonials],
  db: sqliteAdapter({
    client: {
      url:
        process.env.PAYLOAD_DATABASE_URL ??
        "file:./.payload/testimonials-example.db",
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
    "local-payload-secret-for-testimonials-example",
});
