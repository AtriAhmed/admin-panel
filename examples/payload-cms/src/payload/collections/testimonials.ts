import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    defaultColumns: ["author", "company", "rating", "featured", "updatedAt"],
    group: "Website Content",
    useAsTitle: "author",
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
    },
    {
      name: "author",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "text",
      required: true,
    },
    {
      name: "company",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      defaultValue: 5,
      max: 5,
      min: 1,
      required: true,
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};

