{ pkgs, config, ... }:

{
  env.SERVICE_NAME = "mobile";

  packages = [
    pkgs.watchman
  ];

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace apps/mobile run start";
    description = "Start the Expo mobile app";
  };

  scripts.dev-lan = {
    exec = "npm --prefix ${config.git.root} --workspace apps/mobile run start -- --dev-client --host lan --clear";
    description = "Start Expo for a development client on the LAN";
  };

  scripts.lint = {
    exec = "npm --prefix ${config.git.root} --workspace apps/mobile run lint";
    description = "Lint the Expo mobile app";
  };

  processes.mobile.exec = "npm --prefix ${config.git.root} --workspace apps/mobile run start";
}
