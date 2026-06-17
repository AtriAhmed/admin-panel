{ ... }:

{
  env = {
    SERVICE_NAME = "payload-cms";
    PORT = "3001";
    PAYLOAD_DATABASE_URL = "file:./.payload/testimonials-example.db";
    PAYLOAD_SECRET = "local-payload-secret-for-testimonials-example";
  };

  scripts.dev = {
    exec = "npm run dev";
    description = "Start the Payload CMS testimonial example";
  };

  scripts.build = {
    exec = "npm run build";
    description = "Build the Payload CMS testimonial example";
  };

  scripts.start = {
    exec = "npm run start";
    description = "Start the built Payload CMS testimonial example";
  };

  processes."payload-cms".exec = "npm run dev";
}
