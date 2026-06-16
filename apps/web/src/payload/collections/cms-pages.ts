import type { CollectionConfig } from "payload";

export const CmsPages: CollectionConfig = {
  slug: "cms-pages",
  admin: {
    defaultColumns: ["title", "slug", "status", "updatedAt"],
    group: "Content",
    useAsTitle: "title",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "owner",
      type: "text",
      required: true,
    },
  ],
};
