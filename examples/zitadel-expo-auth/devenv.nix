{ config, ... }:

{
  env = {
    SERVICE_NAME = "zitadel-expo-auth";
    EXPO_NO_TELEMETRY = "1";
  };

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run start";
    description = "Start the ZITADEL Expo auth example";
  };

  scripts.web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run web";
    description = "Start the ZITADEL Expo auth example for web";
  };

  scripts.android = {
    exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run android";
    description = "Start the ZITADEL Expo auth example on Android";
  };

  scripts.ios = {
    exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run ios";
    description = "Start the ZITADEL Expo auth example on iOS";
  };

  scripts.lint = {
    exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run lint";
    description = "Lint the ZITADEL Expo auth example";
  };

  processes."zitadel-expo-auth".exec = "npm --prefix ${config.git.root} --workspace examples/zitadel-expo-auth run start";
}
