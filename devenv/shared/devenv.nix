{ pkgs, config, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    npm.enable = true;
    npm.install.enable = false;
  };

  packages = [
    pkgs.curl
    pkgs.git
    pkgs.jq
  ];

  env.NODE_ENV = "development";

  scripts.install = {
    exec = "npm --prefix ${config.git.root} install";
    description = "Install monorepo npm dependencies from the repository root";
  };
}
