const serverUrl = process.env.CAPACITOR_SERVER_URL;
if (serverUrl && !serverUrl.startsWith("https://")) {
  throw new Error("CAPACITOR_SERVER_URL must use HTTPS");
}

const config = {
  appId: "com.studyandship.quizpet",
  appName: "QuizPet",
  webDir: ".next",
  server: serverUrl ? { url: serverUrl, cleartext: false } : undefined,
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: "#fff8e7" },
    StatusBar: { overlaysWebView: false },
  },
};
export default config;
