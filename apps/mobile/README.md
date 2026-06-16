# Frontend

Expo app with the custom authentication UI.

## Run

Use Node 22 before running Expo.

```bash
npm install
npx expo start --dev-client --host lan --clear
```

The app currently expects the BFF at:

```text
http://192.168.1.100:8787
```

Update `app/(tabs)/index.tsx` if the Mac IP changes.
