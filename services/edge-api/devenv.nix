{ config, ... }:

{
  env = {
    SERVICE_NAME = "edge-api";
    PORT = "8787";
    HOST = "0.0.0.0";
  };

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace services/edge-api run dev";
    description = "Start the edge API service";
  };

  scripts.build = {
    exec = "npm --prefix ${config.git.root} --workspace services/edge-api run build";
    description = "Build/typecheck the edge API service";
  };

  scripts.typecheck = {
    exec = "npm --prefix ${config.git.root} --workspace services/edge-api run typecheck";
    description = "Typecheck the edge API service";
  };

  processes.edge-api.exec = "npm --prefix ${config.git.root} --workspace services/edge-api run dev";
}
