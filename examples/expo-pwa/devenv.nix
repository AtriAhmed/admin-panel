{ pkgs, config, ... }:

{
  env = {
    SERVICE_NAME = "expo-pwa-test";
    EXPO_NO_TELEMETRY = "1";
  };

  packages = [
    pkgs.python3
  ];

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run start";
    description = "Start the Expo PWA test app";
  };

  scripts.web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run web";
    description = "Start the Expo PWA test app for web";
  };

  scripts.export-web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run web:export";
    description = "Export the Expo PWA test app for web";
  };

  scripts.serve-web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run web:serve";
    description = "Serve the exported Expo PWA test app";
  };

  scripts.android = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run android";
    description = "Start the Expo PWA test app on Android";
  };

  scripts.ios = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run ios";
    description = "Start the Expo PWA test app on iOS";
  };

  scripts.lint = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run lint";
    description = "Lint the Expo PWA test app";
  };

  processes."expo-pwa-test".exec = "npm --prefix ${config.git.root} --workspace examples/expo-pwa run start";
}
