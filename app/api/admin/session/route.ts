import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return json({ error: "პაროლი ვერ წავიკითხეთ." }, { status: 400 });
  }

  const candidate = typeof body.password === "string" ? body.password : "";
  if (!candidate || candidate.length > 200 || !(await verifyAdminPassword(candidate))) {
    return json({ error: "პაროლი არასწორია." }, { status: 401 });
  }

  return json(
    { ok: true },
    { headers: { "Set-Cookie": await createAdminSessionCookie(request.url) } },
  );
}

export async function DELETE(request: Request) {
  return json(
    { ok: true },
    { headers: { "Set-Cookie": clearAdminSessionCookie(request.url) } },
  );
}
