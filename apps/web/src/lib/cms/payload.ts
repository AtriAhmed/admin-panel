import config from "@payload-config";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { getPayload } from "payload";

export async function getPayloadCms() {
  mkdirSync(path.join(process.cwd(), ".payload"), { recursive: true });

  return getPayload({ config });
}
