# IslandPad Web App

A no-Mac, no-jailbreak PWA prototype for iPad.

## Install on iPad
1. Host this folder on an HTTPS static host (GitHub Pages, Netlify, or Vercel).
2. Open the deployed URL in Safari on the iPad.
3. Tap Share → Add to Home Screen → Add.
4. Launch IslandPad from the Home Screen.

For local testing, use a local web server; service workers require HTTPS or localhost.

## Features
- Dynamic Island-inspired expandable in-app hub.
- Local audio file playback, playlist, seek, previous/next and visualizer.
- Countdown timer with presets/custom duration, pause/resume/reset.
- Stopwatch.
- Weather lookup using Open-Meteo after explicit location permission.
- PWA manifest, app icons, offline shell cache.

## Limitations
This is a web app, not a system modification. It cannot replace iPadOS status bar,
create native iPad Lock Screen Live Activities, intercept calls, reliably read
battery/AirPods status, or overlay other apps. Background timer/audio behavior
depends on Safari/iPadOS and may pause when the app is suspended. Audio files are
selected locally and are not uploaded by this app.

## Turning it into a regular app later
The UI and business logic can be reused in a native SwiftUI app or wrapped with
a WebView-based app framework. Native-only features (ActivityKit, system media
integration, background modes, notifications) would need native Swift code and
Apple's platform permissions/entitlements.
