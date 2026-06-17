import { listTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const testimonials = await listTestimonials();
  const featured = testimonials.find((testimonial) => testimonial.featured);

  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Payload CMS example</p>
          <h1>Customer proof managed by the content team.</h1>
          <p className="hero__copy">
            This landing page reads testimonial entries from Payload CMS and
            renders them in a custom Next.js front end.
          </p>
          <div className="hero__actions">
            <a href="/cms/collections/testimonials">Manage testimonials</a>
            <span>{testimonials.length} CMS records published locally</span>
          </div>
        </div>
        <div className="hero__media" aria-label="Customer success workspace">
          <img
            alt="Modern workspace for reviewing customer stories"
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
          />
          {featured ? (
            <blockquote>
              <p>&ldquo;{featured.quote}&rdquo;</p>
              <footer>
                {featured.author}, {featured.company}
              </footer>
            </blockquote>
          ) : null}
        </div>
      </section>

      <section className="testimonials">
        <div className="section-heading">
          <p className="eyebrow">Live CMS content</p>
          <h2>Testimonials</h2>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.id}>
              <div className="testimonial-card__rating">
                {"★".repeat(testimonial.rating)}
              </div>
              <p>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer>
                <span>{testimonial.author}</span>
                <small>
                  {testimonial.role}, {testimonial.company}
                </small>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
