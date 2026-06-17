{ config, ... }:

{
  env = {
    SERVICE_NAME = "identity-camera";
    EXPO_NO_TELEMETRY = "1";
  };

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace examples/document-scanner run start";
    description = "Start the identity camera Expo app";
  };

  scripts.web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/document-scanner run web";
    description = "Start the identity camera Expo app for web";
  };

  scripts.android = {
    exec = "npm --prefix ${config.git.root} --workspace examples/document-scanner run android";
    description = "Run the identity camera app on Android";
  };

  scripts.ios = {
    exec = "npm --prefix ${config.git.root} --workspace examples/document-scanner run ios";
    description = "Run the identity camera app on iOS";
  };

  processes."identity-camera".exec = "npm --prefix ${config.git.root} --workspace examples/document-scanner run start";
}
