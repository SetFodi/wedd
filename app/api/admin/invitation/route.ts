import { hasAdminSession } from "@/lib/admin-auth";
import {
  getEditableInvitation,
  publishInvitation,
} from "@/lib/invitation-store";

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function authorized(request: Request) {
  return hasAdminSession(request.headers.get("cookie"));
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return json({ error: "ავტორიზაცია საჭიროა." }, { status: 401 });
  }

  try {
    return json({ content: await getEditableInvitation() });
  } catch {
    return json(
      { error: "მონაცემთა საცავი ჯერ მზად არ არის. სცადეთ ხელახლა." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) {
    return json({ error: "მოთხოვნის წყარო დაუშვებელია." }, { status: 403 });
  }
  if (!(await authorized(request))) {
    return json({ error: "ავტორიზაცია საჭიროა." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) {
    return json({ error: "მოსაწვევის მონაცემები ზედმეტად დიდია." }, { status: 413 });
  }

  let body: { content?: unknown };
  try {
    body = (await request.json()) as { content?: unknown };
  } catch {
    return json({ error: "მონაცემები ვერ წავიკითხეთ." }, { status: 400 });
  }

  try {
    const content = await publishInvitation(body.content);
    return json({ content, savedAt: new Date().toISOString() });
  } catch {
    return json(
      { error: "ცვლილებების შენახვა ვერ მოხერხდა. სცადეთ ხელახლა." },
      { status: 503 },
    );
  }
}
