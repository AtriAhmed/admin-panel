{ config, ... }:

{
  env = {
    SERVICE_NAME = "web";
    PORT = "3000";
  };

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace apps/web run dev";
    description = "Start the Next.js web app";
  };

  scripts.build = {
    exec = "npm --prefix ${config.git.root} --workspace apps/web run build";
    description = "Build the Next.js web app";
  };

  processes.web.exec = "npm --prefix ${config.git.root} --workspace apps/web run dev";
}
