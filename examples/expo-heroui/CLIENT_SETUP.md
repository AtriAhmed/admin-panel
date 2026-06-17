# Client Setup

This project is an Expo SDK 54 app using HeroUI Native. The home screen contains the custom learning examples first, with the original HeroUI Native example screens available from the smaller reference link.

## Requirements

- Node.js 22 is recommended. This project has been tested with `v22.22.3`.
- npm
- Expo Go on the iPhone

If using `nvm`:

```bash
nvm install 22.22.3
nvm use 22.22.3
node -v
```

Expected:

```bash
v22.22.3
```

## Install

```bash
npm install
```

If npm reports peer dependency conflicts, use:

```bash
npm install --legacy-peer-deps
```

## Run On iPhone With Expo Go

Make sure the Mac and iPhone are on the same Wi-Fi network.

```bash
npm run start -- --lan
```

Then open Expo Go on the iPhone and scan the QR code.

If the phone cannot connect, test this URL in iPhone Safari:

```text
http://YOUR_MAC_IP:8081/status
```

It should show:

```text
packager-status:running
```

If it does not load, check:

- Mac and iPhone are on the same network.
- VPN is off on both devices.
- macOS Firewall allows `node`, or temporarily disable Firewall.
- Expo Go has Local Network permission enabled in iOS Settings.

## Useful Commands

Start Expo with a clean cache:

```bash
npm run start -- --lan
```

Run Expo export check:

```bash
npx expo export --platform ios --output-dir /tmp/expo-heroui-export-test
```

Run lint:

```bash
npm run lint
```

## Project Notes

- This app uses Expo SDK 54 so it can run in Expo Go.
- `metro.config.js` disables Watchman for this project because Watchman caused Metro bundle requests to hang on the development machine.
- The custom examples live in:

```text
src/app/(home)/examples
src/components/examples
```

- The original HeroUI Native example screens are still available from the home screen through **Open original HeroUI example project**.
