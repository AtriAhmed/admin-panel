import type { CollectionConfig } from "payload";

export const CampaignBriefs: CollectionConfig = {
  slug: "campaign-briefs",
  admin: {
    defaultColumns: ["name", "channel", "status", "launchDate"],
    group: "Growth",
    useAsTitle: "name",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "channel",
      type: "select",
      options: [
        { label: "Email", value: "email" },
        { label: "Paid Search", value: "paid-search" },
        { label: "Social", value: "social" },
        { label: "Retail Media", value: "retail-media" },
      ],
      required: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "planned",
      options: [
        { label: "Planned", value: "planned" },
        { label: "Live", value: "live" },
        { label: "Paused", value: "paused" },
      ],
      required: true,
    },
    {
      name: "owner",
      type: "text",
      required: true,
    },
    {
      name: "budget",
      type: "number",
      min: 0,
      required: true,
    },
    {
      name: "launchDate",
      type: "date",
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
  ],
};
