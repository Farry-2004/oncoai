# OncoAI Mobile App — Build Guide

## Prerequisites

1. **Android Studio** — Download from https://developer.android.com/studio
2. **Node.js** — Already installed (v22)
3. **Java JDK 17+** — Comes with Android Studio

## Build the App

### Method 1: Android Studio (Recommended)

```bash
# From the mobile directory
cd /home/farry/hospital-system/mobile

# Sync web assets
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish
2. Connect your Android phone via USB (enable USB debugging in Developer Options)
3. Click **Run** (green play button)
4. The app installs on your phone

### Method 2: Command Line Build

```bash
cd /home/farry/hospital-system/mobile/android

# Build debug APK
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: Build Release APK (for Play Store)

```bash
# Generate signing key (one time only)
keytool -genkey -v -keystore oncoai-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias oncoai \
  -storepass oncoai2026 \
  -dname "CN=OncoAI, OU=Health, O=OncoAI, L=Dar es Salaam, ST=Dar es Salaam, C=TZ"

# Build release AAB (for Play Store)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Test on Your Phone

### Quick Test (No Android Studio)

1. Build the debug APK:
   ```bash
   cd mobile/android && ./gradlew assembleDebug
   ```

2. Transfer `app/build/outputs/apk/debug/app-debug.apk` to your phone

3. Open the APK file on your phone and install
   - You may need to enable "Install from unknown sources" in Settings

### Live Reload (Development)

```bash
# Run with live reload pointing to your local server
npx cap run android --livereload --external
```

## App Features (Native)

The Capacitor wrapper gives you these native capabilities:

| Feature | Plugin | Use in OncoAI |
|---|---|---|
| **Camera** | @capacitor/camera | Upload imaging/pathology photos directly |
| **Push Notifications** | @capacitor/push-notifications | Critical lab alerts, TB meeting reminders |
| **Share** | @capacitor/share | Share patient passports, referral docs |
| **Haptics** | @capacitor/haptics | Vibrate on critical alerts |
| **Status Bar** | @capacitor/status-bar | OncoAI teal theme bar |
| **Splash Screen** | @capacitor/splash-screen | OncoAI branded loading screen |
| **Browser** | @capacitor/browser | Open Jitsi video calls in-app |

## Update the App

When you make changes to the web app:

```bash
cd mobile
npx cap sync android    # Sync web changes to Android
npx cap open android    # Open in Android Studio
# Then rebuild
```

Or if using the live server URL (current config), the app auto-updates when you deploy to Render — no rebuild needed!
