# მეგი & უჩა — Wedding Invitation

[![CI](https://github.com/SetFodi/wedd/actions/workflows/ci.yml/badge.svg)](https://github.com/SetFodi/wedd/actions/workflows/ci.yml)

A mobile-first Georgian wedding invitation with a cinematic envelope-and-curtain entrance, personalized guest links, and a password-protected content editor.

## Features

- cinematic envelope, curtain, and ambient hero video flow
- personalized guest greeting through `?to=`
- editable copy, event details, schedule, fonts, and color palette
- hidden `/admin` editor protected by a signed HTTP-only session
- Cloudflare D1 persistence for the published invitation
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

The local D1 state is created under `.wrangler/` and is intentionally excluded from Git.

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

The project uses the Cloudflare Worker-compatible vinext runtime. Hosting must provide:

- a D1 binding named `DB`
- an `ADMIN_PASSWORD` secret
- an `ADMIN_SESSION_SECRET` secret

The D1 binding is declared in [`.openai/hosting.json`](.openai/hosting.json), and the initial schema is in [`drizzle/0000_sparkling_pet_avengers.sql`](drizzle/0000_sparkling_pet_avengers.sql). The application also creates the singleton settings table defensively on first use.

Do not commit `.dev.vars`, `.env*`, `.wrangler/`, `dist/`, or `.next/`.
