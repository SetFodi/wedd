import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

const projectRoot = new URL("../", import.meta.url);
process.env.ADMIN_PASSWORD = "test-only-admin-password";
process.env.ADMIN_SESSION_SECRET = "test-only-session-secret-with-sufficient-length";

let serverProcess;
let serverOrigin;
let serverOutput = "";

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!port) throw new Error("Could not reserve a test server port.");
  return port;
}

before(async () => {
  const port = await availablePort();
  serverOrigin = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
  };
  delete env.BLOB_READ_WRITE_TOKEN;
  delete env.BLOB_STORE_ID;
  delete env.VERCEL_OIDC_TOKEN;

  serverProcess = spawn(process.execPath, [".output/server/index.mjs"], {
    cwd: fileURLToPath(projectRoot),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (chunk) => { serverOutput += chunk; });
  serverProcess.stderr.on("data", (chunk) => { serverOutput += chunk; });

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Test server exited early.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${serverOrigin}/`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Test server did not become ready.\n${serverOutput}`);
});

after(async () => {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  serverProcess.kill("SIGTERM");
  await new Promise((resolve) => {
    serverProcess.once("exit", resolve);
    setTimeout(resolve, 2_000).unref();
  });
});

async function render(path = "/", init = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "text/html");
  if (!headers.has("x-forwarded-host")) headers.set("x-forwarded-host", "invitation.test");
  if (!headers.has("x-forwarded-proto")) headers.set("x-forwarded-proto", "https");

  return fetch(`${serverOrigin}${path}`, { ...init, headers });
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
  assert.match(html, /ნინო/);
  assert.match(html, /შერატონ ბათუმი/);
  assert.match(html, /რუსთაველის ქ\. 28, ბათუმი/);
  assert.match(html, /კალენდარში დამატება/);
  assert.match(html, /ქორწილამდე დარჩენილი დრო/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);

  const generalHtml = await (await render("/")).text();
  assert.match(generalHtml, /ძვირფასო სტუმარო/);
  assert.doesNotMatch(generalHtml, /ნინო/);
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
    "a valid session must pass authentication before the test runtime reports its intentionally missing Blob credentials",
  );

  const clientRoot = new URL("../.output/public/", import.meta.url);
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
  await access(new URL("../public/sheraton-batumi-venue.webp", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("app/_sites-preview", projectRoot)));
});
