import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function durationOf(path) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    new URL(path, import.meta.url).pathname,
  ]);
  return Number(stdout.trim());
}

async function frameCountOf(path) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=nb_frames",
    "-of", "default=noprint_wrappers=1:nokey=1",
    new URL(path, import.meta.url).pathname,
  ]);
  return Number(stdout.trim());
}

async function loopSeamSimilarity(path) {
  const videoPath = new URL(path, import.meta.url).pathname;
  const frameCount = await frameCountOf(path);
  const framesDirectory = await mkdtemp(join(tmpdir(), "wedding-loop-seam-"));
  const firstFrame = join(framesDirectory, "first.png");
  const lastFrame = join(framesDirectory, "last.png");

  try {
    await execFileAsync("ffmpeg", [
      "-v", "error", "-y", "-i", videoPath,
      "-vf", "select=eq(n\\,0)",
      "-frames:v", "1", firstFrame,
    ]);
    await execFileAsync("ffmpeg", [
      "-v", "error", "-y", "-i", videoPath,
      "-vf", `select=eq(n\\,${frameCount - 1})`,
      "-frames:v", "1", lastFrame,
    ]);
    const { stderr } = await execFileAsync("ffmpeg", [
      "-i", firstFrame, "-i", lastFrame,
      "-lavfi", "ssim", "-f", "null", "-",
    ]);
    const match = stderr.match(/All:([0-9.]+)/);
    assert.ok(match, "ffmpeg must report an SSIM score for the hero loop seam");
    return Number(match[1]);
  } finally {
    await rm(framesDirectory, { recursive: true, force: true });
  }
}

async function maximumLowerPoolBlueLevel(path) {
  const { stdout, stderr } = await execFileAsync("ffmpeg", [
    "-v", "error",
    "-i", new URL(path, import.meta.url).pathname,
    "-vf", "fps=4,scale=1080:1920,crop=360:540:360:1260,signalstats,metadata=print:file=-",
    "-f", "null", "-",
  ]);
  const samples = [...`${stdout}\n${stderr}`.matchAll(/lavfi\.signalstats\.UAVG=([0-9.]+)/g)]
    .map((match) => Number(match[1]));
  assert.ok(samples.length > 0, "ffmpeg must sample the lower pool area");
  return Math.max(...samples);
}

test("hero film loops without a visible endpoint jump", async () => {
  const similarity = await loopSeamSimilarity("../public/videos/hero-loop.mp4");
  assert.ok(
    similarity > 0.95,
    `hero loop seam must be visually continuous, got SSIM ${similarity}`,
  );
});

test("hero film keeps the pool behind the stone terrace", async () => {
  const blueLevel = await maximumLowerPoolBlueLevel("../public/videos/hero-loop.mp4");
  assert.ok(
    blueLevel < 127,
    `pool must not stretch into the lower terrace, got blue-channel level ${blueLevel}`,
  );
});

test("hero ambient motion uses the clean first four seconds before resetting", async () => {
  const duration = await durationOf("../public/videos/hero-loop.mp4");
  assert.ok(
    duration > 3.8 && duration < 4.2,
    `hero ambient loop must reset after the clean first four seconds, got ${duration}s`,
  );
});

test("curtain opening hands off to the hero film without a flash", async () => {
  const entrancePath = new URL("../public/videos/entrance-opening.mp4", import.meta.url).pathname;
  const heroPath = new URL("../public/videos/hero-loop.mp4", import.meta.url).pathname;
  const entranceFrames = await frameCountOf("../public/videos/entrance-opening.mp4");
  const framesDirectory = await mkdtemp(join(tmpdir(), "wedding-hero-handoff-"));
  const entranceLastFrame = join(framesDirectory, "entrance-last.png");
  const heroFirstFrame = join(framesDirectory, "hero-first.png");

  try {
    await execFileAsync("ffmpeg", [
      "-v", "error", "-y", "-i", entrancePath,
      "-vf", `select=eq(n\\,${entranceFrames - 1}),scale=720:1280`,
      "-frames:v", "1", entranceLastFrame,
    ]);
    await execFileAsync("ffmpeg", [
      "-v", "error", "-y", "-i", heroPath,
      "-vf", "select=eq(n\\,0),scale=720:1280",
      "-frames:v", "1", heroFirstFrame,
    ]);
    const { stderr } = await execFileAsync("ffmpeg", [
      "-i", entranceLastFrame, "-i", heroFirstFrame,
      "-lavfi", "ssim", "-f", "null", "-",
    ]);
    const match = stderr.match(/All:([0-9.]+)/);
    assert.ok(match, "ffmpeg must report an SSIM score for the hero handoff");
    const similarity = Number(match[1]);
    assert.ok(
      similarity > 0.9,
      `curtain-to-hero handoff must stay visually continuous, got SSIM ${similarity}`,
    );
  } finally {
    await rm(framesDirectory, { recursive: true, force: true });
  }
});

test("keeps the final curtain frame above the envelope while the entrance fades", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.is-open \.envelope-idle-video\s*\{[^}]*opacity:\s*0\b/,
    "the idle envelope must stay hidden after the opening film ends",
  );
  assert.match(
    css,
    /\.is-open \.envelope-opening-video\s*\{[^}]*opacity:\s*1\b/,
    "the final curtain frame must remain above the envelope until the stage is gone",
  );
});

test("uses media-driven envelope and curtain entrances instead of CSS drapes", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/invitation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<video/);
  assert.match(page, /\/videos\/envelope-idle\.mp4/);
  assert.match(page, /\/videos\/entrance-opening\.mp4/);
  assert.match(page, /\/videos\/hero-loop\.mp4/);
  assert.match(page, /poster="\/videos\/hero-poster\.png"/);
  assert.match(page, /className="envelope-seal-button"/);
  assert.doesNotMatch(page, /<source src="\/videos\/curtain-opening\.mp4"/);
  assert.doesNotMatch(page, /className="envelope-copy"/);
  assert.doesNotMatch(page, /className="opening-copy"/);
  assert.doesNotMatch(page, /playCurtains/);
  assert.doesNotMatch(page, /hover: hover/);
  assert.doesNotMatch(page, /drape-left|drape-right/);
  assert.doesNotMatch(css, /\.drape-left|\.drape-right/);
  await access(new URL("../public/videos/envelope-idle.mp4", import.meta.url));
  await access(new URL("../public/videos/entrance-opening.mp4", import.meta.url));
  await access(new URL("../public/videos/envelope-closed.png", import.meta.url));
  await access(new URL("../public/videos/hero-poster.png", import.meta.url));
  await access(new URL("../public/videos/hero-loop.mp4", import.meta.url));

  const entranceDuration = await durationOf("../public/videos/entrance-opening.mp4");
  assert.ok(
    entranceDuration > 15 && entranceDuration < 16,
    `combined entrance must include the envelope reveal and the complete curtain opening, got ${entranceDuration}s`,
  );
});
