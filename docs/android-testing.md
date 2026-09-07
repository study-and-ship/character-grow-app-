# Android internal device test

The internal-test architecture is a Capacitor WebView loading the deployed Vercel HTTPS application. It is network-required and is not the future Play Store local-bundle architecture.

## Generate and build

```bash
npm install @capacitor/core @capacitor/android @capacitor/app @capacitor/network @capacitor/status-bar @capacitor/splash-screen
npm install --save-dev @capacitor/cli
CAPACITOR_SERVER_URL=https://your-project.vercel.app npx cap add android
CAPACITOR_SERVER_URL=https://your-project.vercel.app npx cap sync android
cd android && ./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The URL must be HTTPS; `capacitor.config.ts` rejects cleartext URLs and mixed content.

Install with USB debugging enabled:

```bash
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

On a physical device verify login and cookie persistence, quiz resume after refresh/relaunch, background/foreground transitions, hardware back navigation, offline/reconnect behavior, external links, safe areas, status bar, and splash. Supabase Auth Site URL/redirect allow-list must include the Vercel origin because authentication happens there.

## Public release later

Before Play Store release, decide on the local web bundle/API-origin design; implement native back/external-link/network listeners; add adaptive icon and production splash assets; configure an Auth deep link; select the final application ID/versionCode/versionName; create a secret release keystore outside Git; build a signed AAB; complete Data Safety/privacy review; and prepare screenshots/descriptions and an internal testing track.
