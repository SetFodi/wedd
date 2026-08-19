# Wedding invitation domain

## Glossary

- **Published invitation** — the single public configuration rendered at `/`. It contains all editable copy, event details, schedule entries, font choices, and theme colors.
- **Guest personalization** — the optional `?to=` URL value. It replaces the generic guest greeting for that visit without changing the published invitation.
- **Entrance** — the envelope and curtain film shown before the invitation. Its visible opening labels are editable; the media files and timing remain part of the site presentation.
- **Administrator** — a person who has entered the private `/admin` password and holds a short-lived, signed, HTTP-only session cookie.
- **Publish** — replace the current published invitation with the validated editor values. The next public page load reads the new version.

## Invariants

- Public guests never need an administrator session.
- Only an authenticated administrator can read from or write through the editor API.
- Guest personalization never persists to the published invitation.
- Invalid or unavailable stored content falls back to the complete default invitation, so the public page remains usable.
