import config from "@payload-config";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { getPayload } from "payload";

type PayloadCmsPage = {
  id: number | string;
  owner: string;
  slug: string;
  status: "draft" | "published";
  summary: string;
  title: string;
  updatedAt?: string;
};

const seedPages = [
  {
    owner: "Content Operations",
    slug: "operations-home",
    status: "published" as const,
    summary: "Daily operating guidance for the commerce support desk.",
    title: "Operations home",
  },
  {
    owner: "Customer Experience",
    slug: "shipping-delay-banner",
    status: "draft" as const,
    summary: "Short alert copy for delayed regional shipments.",
    title: "Shipping delay banner",
  },
  {
    owner: "Policy Team",
    slug: "refund-policy",
    status: "published" as const,
    summary: "Current customer-facing refund policy content.",
    title: "Refund policy",
  },
];

export async function getPayloadCms() {
  mkdirSync(path.join(process.cwd(), ".payload"), { recursive: true });

  return getPayload({ config });
}

export async function seedPayloadCmsPages() {
  const payload = await getPayloadCms();
  const existing = await payload.count({
    collection: "cms-pages",
  });

  if (existing.totalDocs > 0) {
    return;
  }

  await Promise.all(
    seedPages.map((data) =>
      payload.create({
        collection: "cms-pages",
        data,
      }),
    ),
  );
}

export async function getPayloadCmsPages() {
  await seedPayloadCmsPages();

  const payload = await getPayloadCms();
  const result = await payload.find({
    collection: "cms-pages",
    limit: 20,
    sort: "-updatedAt",
  });

  return result.docs.map(normalizePayloadCmsPage);
}

export async function createPayloadCmsPage(data: {
  owner: string;
  slug: string;
  summary: string;
  title: string;
}) {
  await seedPayloadCmsPages();

  const payload = await getPayloadCms();
  const page = await payload.create({
    collection: "cms-pages",
    data: {
      ...data,
      status: "draft",
    },
  });

  return normalizePayloadCmsPage(page);
}

function normalizePayloadCmsPage(doc: unknown) {
  const page = doc as PayloadCmsPage;

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
