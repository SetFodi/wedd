Wedding Invitation

[![CI](https://github.com/SetFodi/wedd/actions/workflows/ci.yml/badge.svg)](https://github.com/SetFodi/wedd/actions/workflows/ci.yml)

A mobile-first Georgian wedding invitation with a cinematic envelope-and-curtain entrance, personalized guest links, and a password-protected content editor.

## Features

- cinematic envelope, curtain, and ambient hero video flow
- personalized guest greeting through `?to=`
- editable copy, event details, schedule, fonts, and color palette
- hidden `/admin` editor protected by a signed HTTP-only session
- private Vercel Blob persistence for the published invitation
- downloadable calendar event and responsive layout

## Local development

Requirements:

- Node.js `>=22.13.0`
- npm

Install dependencies:

```bash
npm install
```

Create local administrator credentials:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and choose private values for:

```dotenv
ADMIN_PASSWORD=your-password
ADMIN_SESSION_SECRET=a-long-random-secret
```

Start the site:

```bash
npm run dev
```

- invitation: [http://localhost:3000](http://localhost:3000)
- editor: [http://localhost:3000/admin](http://localhost:3000/admin)

The app reads administrator credentials from `.dev.vars`. To test saved content locally, run `vercel env pull .env.local` after linking the Vercel project. That file contains the Blob credentials and is excluded from Git.

## Guest links

Append a URL-encoded name to personalize both greetings:

```text
http://localhost:3000/?to=ნინო
```

The `?to=` value is display-only and never changes the published invitation.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm test
```

The test suite checks server rendering, admin authentication boundaries, client-bundle secret isolation, and the video handoff and loop seams.

## Deployment configuration

The GitHub repository is connected to the `wedd` project in Vercel's `Andromeda's projects` team. Vinext uses Nitro to emit Vercel Build Output API files during a Vercel build.

Production, preview, and development environments need:

- a private Vercel Blob store connected to the project
- an `ADMIN_PASSWORD` secret
- an `ADMIN_SESSION_SECRET` secret

Vercel adds the Blob credentials when the store is connected. The public invitation falls back to the checked-in defaults if storage is temporarily unavailable, while the editor reports the storage error instead of pretending that a change was saved.

Do not commit `.dev.vars`, `.env*`, `.vercel/`, `.output/`, `.wrangler/`, `dist/`, or `.next/`.
