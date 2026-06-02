# Client Setup

This project has two apps:

- `bff`: Hono backend-for-frontend that talks to ZITADEL.
- `frontend`: Expo mobile app that talks to the BFF.

Run the BFF first, then run the Expo app.

## Requirements

- Node.js 22
- npm
- Xcode for iOS simulator or iPhone development builds
- A configured ZITADEL instance

## 1. Start The BFF

```bash
cd bff
npm install
cp .env.example .env
npm run dev
```

Edit `bff/.env` before starting if needed:

```env
PORT=8787
HOST=0.0.0.0
ZITADEL_API_BASE=https://your-instance.zitadel.cloud
ZITADEL_SERVICE_TOKEN=your-service-token
ZITADEL_GOOGLE_IDP_ID=your-google-idp-id
ZITADEL_APPLE_IDP_ID=your-apple-idp-id
```

`HOST=0.0.0.0` is important when testing on a real iPhone, because the phone must reach the BFF over the network.

Check the BFF from the Mac:

```bash
curl http://localhost:8787/health
```

For a real iPhone, find the Mac IP address from macOS Network settings, then test from iPhone Safari:

```text
http://YOUR_MAC_IP:8787/health
```

## 2. Configure The Frontend BFF URL

```bash
cd frontend
npm install
cp .env.example .env.local
```

For iOS simulator or web, this can usually be:

```env
EXPO_PUBLIC_BFF_URL=http://localhost:8787
```

For a real iPhone, use the Mac network IP:

```env
EXPO_PUBLIC_BFF_URL=http://YOUR_MAC_IP:8787
```

Example:

```env
EXPO_PUBLIC_BFF_URL=http://172.31.159.58:8787
```

Expo reads `EXPO_PUBLIC_*` variables into the app bundle. After changing `.env.local`, restart Expo with `--clear`. For an installed development build or EAS build, rebuild the app if the value needs to be baked into the bundle.

## 3. Start Expo

```bash
cd frontend
WATCHMAN_DISABLE=1 npx expo start --dev-client --host lan --clear
```

Open the development build on the simulator or iPhone.

If Expo says no development build is installed, install one:

```bash
npx expo run:ios
```

For EAS development builds:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Common Issues

### Network Request Timed Out

The app probably cannot reach the BFF.

Check:

- `bff/.env` has `HOST=0.0.0.0`.
- The BFF is running.
- `frontend/.env.local` uses the correct Mac IP.
- iPhone Safari can open `http://YOUR_MAC_IP:8787/health`.
- Expo was restarted with `--clear` after changing `.env.local`.

### Environment Variable Did Not Change

Restart Expo:

```bash
WATCHMAN_DISABLE=1 npx expo start --dev-client --host lan --clear
```

If the app was built before the env change, rebuild it.

### Physical iPhone Cannot Use `localhost`

`localhost` on the iPhone means the iPhone itself, not the Mac. Use the Mac IP address in `EXPO_PUBLIC_BFF_URL`.

### Production

Do not use a laptop IP in production. Deploy the BFF to a public HTTPS URL and set:

```env
EXPO_PUBLIC_BFF_URL=https://your-bff-domain.example.com
```
