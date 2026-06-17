# Client Setup Guide

This is an Expo React Native app that uses a native document scanner:

- Expo SDK 54
- React Native
- TypeScript
- `react-native-document-scanner-plugin`
- `expo-dev-client`

Important: this app does not run in Expo Go because the document scanner uses native iOS/Android code. Use a development build or a production/internal EAS build.

## Requirements

- Node.js 22 or Node.js 20.19+
- npm
- Expo account
- EAS CLI 16+
- For iPhone testing: Apple Developer account access
- For Android local testing: Android Studio + Android Emulator

Install or update EAS CLI:

```sh
npm install -g eas-cli
```

Check versions:

```sh
node -v
npm -v
eas --version
```

## Install Project Dependencies

From the project folder:

```sh
npm install
```

## Run TypeScript Check

```sh
npx tsc --noEmit
```

## Development Build: iPhone

Log in to Expo:

```sh
eas login
```

Register the iPhone for internal development builds:

```sh
eas device:create
```

Choose the website option, open the generated URL on the iPhone, and install the device registration profile.

Build the iOS development app:

```sh
eas build --platform ios --profile development
```

When the build finishes, open the EAS build link on the iPhone and install the app.

Start the local dev server:

```sh
npx expo start --dev-client --lan --port 8081
```

Open the installed development app on the iPhone. If the app cannot find the development server, use tunnel mode:

```sh
npx expo start --dev-client --tunnel
```

## Development Build: Android

For an Android emulator or connected Android device:

```sh
npm run android
```

Or build an Android development APK with EAS:

```sh
eas build --platform android --profile development
```

After installing the APK, start the dev server:

```sh
npx expo start --dev-client --lan --port 8081
```

Use tunnel mode if the device is not on the same local network:

```sh
npx expo start --dev-client --tunnel
```

## Testing Flow

1. Open the installed development app.
2. Tap `Scan ID`.
3. The native document scanner opens.
4. Scan an ID card or document.
5. Confirm that the app shows the cropped document preview.
6. Tap `Retake` to scan again.
7. Tap `Use Photo`.
8. Check Metro logs for the scanned local file URI.

## Common Issues

### Expo Go does not work

This is expected. The app uses a native document scanner and must run through a development build or production build.

### No development servers found

Start the dev server:

```sh
npx expo start --dev-client --lan --port 8081
```

Make sure the phone and laptop are on the same Wi-Fi. If they are not, use tunnel mode:

```sh
npx expo start --dev-client --tunnel
```

### iOS asks for Apple Developer login

This is expected for installing development builds on a physical iPhone. Apple requires the app to be signed.

### Camera permission is requested

This is expected. The scanner needs camera access to scan the document.

## Build Profiles

The project includes `eas.json` with these profiles:

- `development`: development client build for testing with Metro
- `preview`: internal distribution build
- `production`: production build

