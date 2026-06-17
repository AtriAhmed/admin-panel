{ config, ... }:

{
  env = {
    SERVICE_NAME = "expo-heroui";
    EXPO_NO_TELEMETRY = "1";
  };

  scripts.dev = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run start";
    description = "Start the HeroUI Expo example";
  };

  scripts.web = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run web";
    description = "Start the HeroUI Expo example for web";
  };

  scripts.android = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run android";
    description = "Start the HeroUI Expo example on Android";
  };

  scripts.ios = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run ios";
    description = "Start the HeroUI Expo example on iOS";
  };

  scripts.lint = {
    exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run lint";
    description = "Lint the HeroUI Expo example";
  };

  processes."expo-heroui".exec = "npm --prefix ${config.git.root} --workspace examples/expo-heroui run start";
}
