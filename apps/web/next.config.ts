import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default withPayload(nextConfig);
