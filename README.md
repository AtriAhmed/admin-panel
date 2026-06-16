# Admin Panel Monorepo

This repository contains the web app, Expo mobile app, and edge API service.

## Apps

- `apps/web` - Next.js web app
- `apps/mobile` - Expo mobile app for ZITADEL custom auth

## Services

- `services/edge-api` - Hono edge API for auth flows

## Development

Run commands from the repository root:

```bash
npm run dev:web
npm run dev:mobile
npm run dev:edge-api
```

App-specific commands can also be run from each app directory.

## Devenv

Each project has its own devenv environment:

```bash
cd apps/web
devenv shell
dev
```

```bash
cd apps/mobile
devenv shell
dev-lan
```

```bash
cd services/edge-api
devenv shell
dev
```

Use `devenv up` inside a project directory to run that project's configured process.

## Deployment Notes

- Vercel should use `apps/web` as the project root.
- EAS/Expo commands should run from `apps/mobile`.
- The edge API should run from `services/edge-api`.
