import configPromise from "@payload-config";
import { getPayload } from "payload";

export type Testimonial = {
  author: string;
  company: string;
  featured: boolean;
  id: string;
  quote: string;
  rating: number;
  role: string;
};

const seedTestimonials = [
  {
    author: "Maya Chen",
    company: "Northstar Studio",
    featured: true,
    quote:
      "The editorial team can publish client proof points without asking engineering to touch the landing page.",
    rating: 5,
    role: "Head of Marketing",
  },
  {
    author: "Jon Bell",
    company: "Harbor Retail",
    featured: false,
    quote:
      "Payload gives our content team a familiar review workflow while the website keeps a fast, custom front end.",
    rating: 5,
    role: "Commerce Director",
  },
  {
    author: "Nadia Flores",
    company: "Atlas Supply",
    featured: false,
    quote:
      "We update quotes, roles, and homepage placements in the CMS and the landing page reflects it immediately.",
    rating: 4,
    role: "Operations Lead",
  },
] satisfies Array<Omit<Testimonial, "id">>;

export async function listTestimonials(): Promise<Testimonial[]> {
  const payload = await getPayload({ config: configPromise });
  const existing = await payload.count({ collection: "testimonials" });

  if (existing.totalDocs === 0) {
    for (const testimonial of seedTestimonials) {
      await payload.create({
        collection: "testimonials",
        data: testimonial,
      });
    }
  }

  const result = await payload.find({
    collection: "testimonials",
    limit: 12,
    sort: "-featured,-updatedAt",
  });

  return result.docs.map((doc) => {
    const testimonial = doc as unknown as Testimonial;

    return {
      author: testimonial.author,
      company: testimonial.company,
      featured: Boolean(testimonial.featured),
      id: String(testimonial.id),
      quote: testimonial.quote,
      rating: Number(testimonial.rating),
      role: testimonial.role,
    };
  });
}

