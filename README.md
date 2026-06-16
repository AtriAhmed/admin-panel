# Admin Panel Monorepo

This repository contains the admin web app, Expo mobile app, and auth BFF.

## Apps

- `apps/admin` - Next.js admin panel
- `apps/mobile` - Expo mobile app for ZITADEL custom auth
- `apps/auth-bff` - Hono BFF for auth flows

## Development

Run commands from the repository root:

```bash
npm run dev:admin
npm run dev:mobile
npm run dev:bff
```

App-specific commands can also be run from each app directory.

## Deployment Notes

- Vercel should use `apps/admin` as the project root.
- EAS/Expo commands should run from `apps/mobile`.
- The BFF should run from `apps/auth-bff`.
