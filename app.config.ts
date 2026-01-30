import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Karaoke Queue",
  slug: "karaoke-queue",
  extra: {
    eas: {
      projectId: "a153f8cd-6d2d-472f-bde6-3c00512ee243",
    },
  },
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0F0F11",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.elia97.karaoke",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F0F11",
    },
    package: "com.elia97.karaoke",
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: ["expo-secure-store"],
});
