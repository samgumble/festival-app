import type { CapacitorConfig } from "@capacitor/cli";

// Native shell config (D-023). webDir is the same production build the web app ships;
// native builds always use BASE_PATH=/ (see the cap:sync script).
const config: CapacitorConfig = {
  appId: "com.sbgproductions.bluesandbrews",
  appName: "Telluride Blues & Brews",
  webDir: "dist",
  ios: { contentInset: "automatic" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: "#EBD5B3", showSpinner: false, androidScaleType: "CENTER_CROP" },
    LocalNotifications: { smallIcon: "ic_stat_sun", iconColor: "#F0C41C" },
    StatusBar: { overlaysWebView: true, style: "DEFAULT" },
  },
};

export default config;
