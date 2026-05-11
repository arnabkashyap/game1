# Android APK Build via GitHub

A fully automated CI pipeline that wraps the game in a WebView and produces a signed APK using GitHub Actions + Capacitor.

## How It Works

1. **Capacitor** wraps the static web app (HTML/JS/CSS) into a native Android shell.
2. **GitHub Actions** runs the build on every push (or manually), producing a signed APK as a downloadable artifact.

## Prerequisites

- A GitHub repository containing the `game1/` folder at the root (or as the repo root).
- An Android keystore for signing (optional — for dev builds you can use a debug keystore).

## Setup

### 1. Initialize Capacitor (run locally once)

```bash
# From the game1/ directory
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Escape Road 3D" com.escaperoad.game --webDir=.
npx cap add android
```

Commit the generated `android/` folder and `capacitor.config.json` to the repo.

### 2. Configure `capacitor.config.json`

```json
{
  "appId": "com.escaperoad.game",
  "appName": "Escape Road 3D",
  "webDir": ".",
  "server": {
    "androidScheme": "https",
    "hostname": "localhost"
  },
  "android": {
    "buildOptions": {
      "keystorePath": "android-keystore.jks",
      "keystoreAlias": "key0"
    }
  }
}
```

## GitHub Actions Workflow

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          npm install
          npm install @capacitor/core @capacitor/android

      - name: Sync web assets
        run: npx cap sync android

      - name: Build APK (debug)
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: EscapeRoad3D-debug
          path: android/app/build/outputs/apk/debug/*.apk
```

### For a Release (Signed) Build

1. **Generate a keystore** and base64-encode it:
   ```bash
   keytool -genkey -v -keystore android-keystore.jks -alias key0 -keyalg RSA -keysize 2048 -validity 10000
   base64 android-keystore.jks > keystore.b64  # Linux/macOS
   ```

2. **Add secrets to GitHub** → Settings → Secrets and variables → Actions:
   - `KEYSTORE_BASE64` — the base64-encoded keystore
   - `KEYSTORE_PASSWORD` — keystore password
   - `KEY_ALIAS` — alias name (e.g. `key0`)
   - `KEY_PASSWORD` — key password

3. **Update the workflow** to produce a signed release APK:

```yaml
      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android-keystore.jks

      - name: Build APK (release)
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=${{ github.workspace }}/android-keystore.jks \
            -Pandroid.injected.signing.store.password=${{ secrets.KEYSTORE_PASSWORD }} \
            -Pandroid.injected.signing.key.alias=${{ secrets.KEY_ALIAS }} \
            -Pandroid.injected.signing.key.password=${{ secrets.KEY_PASSWORD }}
```

## Result

- The `EscapeRoad3D-debug` artifact is available from the **Actions** tab → click a run → **Artifacts** section.
- Download the APK and sideload it to any Android device (Settings → Security → Install unknown apps).

## Notes

- The game's `three.min.js` and all assets are bundled **inside** the APK — no internet required after install.
- Multiplayer (Socket.IO) will connect only if the device has network access and the server is reachable; the game works fully offline otherwise.
- On first run, Android may show "Play Protect" warning for an unsigned debug APK — tap **Install anyway**.
- For Play Store distribution, follow [Capacitor's publishing guide](https://capacitorjs.com/docs/android/deploying-to-google-play).
