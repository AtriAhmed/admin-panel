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

For web passkeys on another domain, keep `ZITADEL_PASSKEY_DOMAIN` as the default/native domain and add allowed web relying-party domains with `ZITADEL_PASSKEY_ALLOWED_DOMAINS`, for example:

```bash
ZITADEL_PASSKEY_DOMAIN=auth.example.com
ZITADEL_PASSKEY_ALLOWED_DOMAINS=localhost,admin.example.com
```

The web app passes its current hostname when starting a passkey challenge. The BFF rejects domains that are not in the default domain or allowed-domain list.

The login route creates a ZITADEL session with the login name, verifies the password on that session, reads the verified session state, then returns a BFF-owned session token to the mobile app.
