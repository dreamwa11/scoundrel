# Scoundrel for iPhone

An offline iPhone version of **Scoundrel**, the solo dungeon-crawl card game by Zach Gage and Kurt Bieg (2011).
Plays with a fixed set of house rules (see How to play in the game).

- `Scoundrel/Web/` – the game (HTML/CSS/JS, fonts, backgrounds). It runs on its own in any browser too.
- `Scoundrel/*.swift` – a small native app that runs the game full-screen, offline, with real iPhone haptics and save/resume.
- `project.yml` – XcodeGen spec; the Xcode project is generated in the cloud.
- `.github/workflows/build.yml` – builds the app on GitHub's Macs. No Mac needed.

## 1. Build in the cloud

1. Push this folder to a GitHub repository (private is fine).
2. On GitHub, open **Actions → Build Scoundrel iOS app**. It runs on every push to `main`, or start it with **Run workflow**.
3. When it's green, download **Scoundrel-unsigned-ipa** from the run's *Artifacts* section and unzip it to get `Scoundrel.ipa`.

GitHub's macOS minutes are free for public repos. Private repos get a monthly free allowance; one build is a few minutes.

## 2. Install on your iPhone

### Option A – free Apple ID + Windows PC (Sideloadly)

1. Install iTunes (the Apple website version, not the Microsoft Store one) and [Sideloadly](https://sideloadly.io) on the PC.
2. Connect the iPhone by cable and trust the computer.
3. Drag `Scoundrel.ipa` into Sideloadly, enter your Apple ID and click **Start**.
4. On the iPhone:
   - Turn on Developer Mode: **Settings → Privacy & Security → Developer Mode**, then restart.
   - Trust your Apple ID: **Settings → General → VPN & Device Management**.

With a free Apple ID the app stops opening after **7 days**. Re-sign it in Sideloadly to fix this; Sideloadly can also refresh it automatically over Wi-Fi. Your saved game is kept as long as you don't delete the app. AltStore works the same way if you prefer it.

### Option B – paid Apple Developer account → TestFlight (no computer needed)

1. In [App Store Connect](https://appstoreconnect.apple.com), create an app with bundle ID `com.dreamwa11.scoundrel`. If you use another ID, change it in `project.yml`.
2. Create an API key under **Users and Access → Integrations → App Store Connect API** with the *App Manager* role. Download the `.p8` file.
3. In the GitHub repo, go to **Settings → Secrets and variables → Actions** and add:
   - `ASC_KEY_ID` – the key ID
   - `ASC_ISSUER_ID` – the issuer ID
   - `ASC_KEY_P8` – the full text of the `.p8` file
   - `APPLE_TEAM_ID` – your 10-character team ID
4. Push or re-run the workflow. The `testflight` job uploads a build. Install it from the TestFlight app on your iPhone. TestFlight builds last 90 days.

## Playing in a browser

Serve `Scoundrel/Web` with any static server, e.g. `python3 -m http.server`, and open `index.html`.
Haptics only work in the app; browsers fall back to vibration where supported, which iPhone Safari doesn't support.

## Credits

- Scoundrel © 2011 Zach Gage and Kurt Bieg.
- Fonts: Astloch, Germania One and Space Grotesk, SIL Open Font License.
