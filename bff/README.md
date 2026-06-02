# BFF

Hono backend-for-frontend for the mobile app.

The frontend calls this service, and this service will call ZITADEL.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

The server listens on `0.0.0.0:8787`, so the iPhone can reach it on the Mac LAN IP.

## ZITADEL

Set `ZITADEL_SERVICE_TOKEN` in `.env` to a ZITADEL API token with access to create, read, update, and delete sessions.

For native passkeys, set `ZITADEL_PASSKEY_DOMAIN` to the WebAuthn relying-party domain. This must be the same HTTPS domain configured for Apple Associated Domains and Android Digital Asset Links in the mobile app.

The login route creates a ZITADEL session with the login name, verifies the password on that session, reads the verified session state, then returns a BFF-owned session token to the mobile app.
