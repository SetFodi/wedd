import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
process.env.ADMIN_PASSWORD = "test-only-admin-password";
process.env.ADMIN_SESSION_SECRET = "test-only-session-secret-with-sufficient-length";

async function render(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "text/html");
  if (!headers.has("host")) headers.set("host", "invitation.test");

  return worker.fetch(
    new Request(`http://localhost${path}`, { ...init, headers }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete wedding invitation", async () => {
  const response = await render("/?to=%E1%83%9C%E1%83%98%E1%83%9C%E1%83%9D");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ka">/);
  assert.match(html, /მეგი/);
  assert.match(html, /უჩა/);
  assert.match(html, /aria-label="მოწვევის გახსნა"/);
  assert.match(html, /გახსენით მოსაწვევი/);
  assert.match(html, /click to open/);
  assert.match(html, /წინანდლის მამული/);
  assert.match(html, /კალენდარში დამატება/);
  assert.match(html, /ქორწილამდე დარჩენილი დრო/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("creates a signed, HTTP-only admin session without exposing the password to clients", async () => {
  const wrongPassword = await render("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "not-the-password" }),
  });
  assert.equal(wrongPassword.status, 401);

  const login = await render("/api/admin/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "test-only-admin-password" }),
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^wedd_admin_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.doesNotMatch(setCookie, /test-only-admin-password/);

  const sessionCookie = setCookie.split(";", 1)[0];
  const authorizedRead = await render("/api/admin/invitation", {
    headers: { cookie: sessionCookie },
  });
  assert.equal(
    authorizedRead.status,
    503,
    "a valid session must pass authentication before the test runtime reports its intentionally missing D1 binding",
  );

  const clientRoot = new URL("../dist/client/", import.meta.url);
  const clientFiles = (await readdir(clientRoot, { recursive: true }))
    .filter((file) => file.endsWith(".js"));
  const clientBundle = (
    await Promise.all(clientFiles.map((file) => readFile(new URL(file, clientRoot), "utf8")))
  ).join("\n");
  assert.doesNotMatch(clientBundle, /test-only-admin-password/);
});

test("keeps the admin editor private and unlinked from the invitation", async () => {
  const [adminResponse, apiResponse, invitationResponse] = await Promise.all([
    render("/admin"),
    render("/api/admin/invitation"),
    render("/"),
  ]);

  assert.equal(adminResponse.status, 200);
  const adminHtml = await adminResponse.text();
  assert.match(adminHtml, /მოსაწვევის მართვა/);
  assert.match(adminHtml, /type="password"/);

  assert.equal(apiResponse.status, 401);
  assert.deepEqual(await apiResponse.json(), { error: "ავტორიზაცია საჭიროა." });

  const invitationHtml = await invitationResponse.text();
  assert.doesNotMatch(invitationHtml, /href="\/admin"/);
});

test("emits a share card and removes all starter preview artifacts", async () => {
  const response = await render();
  const html = await response.text();
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.match(html, /<title>მეგი &amp; უჩა \| ქორწილის მოსაწვევი<\/title>/);
  assert.match(html, /https:\/\/invitation\.test\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/kakheti-arch.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
