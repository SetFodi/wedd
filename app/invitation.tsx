"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  DEFAULT_INVITATION_CONTENT,
  fontStack,
  type InvitationContent,
} from "@/lib/invitation-content";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type IntroPhase = "envelope" | "envelope-opening" | "hero-revealing" | "opened";
type InvitationStyle = CSSProperties & Record<`--${string}`, string>;

const ENVELOPE_IDLE_HALF = 0.5;
const HERO_REVEAL_LEAD_SECONDS = 2.25;

function eventDate(dateIso: string): Date {
  const date = new Date(dateIso);
  return Number.isNaN(date.getTime())
    ? new Date(DEFAULT_INVITATION_CONTENT.event.dateIso)
    : date;
}

function getTimeLeft(dateIso: string): TimeLeft {
  const distance = Math.max(0, eventDate(dateIso).getTime() - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
  };
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getGuestFromLocation() {
  return new URLSearchParams(window.location.search).get("to")?.trim() || null;
}

function getDefaultGuest() {
  return null;
}

function calendarTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export default function Invitation({ content }: { content: InvitationContent }) {
  const [introPhase, setIntroPhase] = useState<IntroPhase>("envelope");
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const heroVideo = useRef<HTMLVideoElement>(null);
  const envelopeIdleVideo = useRef<HTMLVideoElement>(null);
  const envelopeVideo = useRef<HTMLVideoElement>(null);
  const personalizedGuest = useSyncExternalStore(
    subscribeToLocation,
    getGuestFromLocation,
    getDefaultGuest,
  );
  const guest = personalizedGuest || content.hero.guestFallback;
  const opened = introPhase === "opened";
  const heroVisible = opened || introPhase === "hero-revealing";
  const entranceVisible = !opened;

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(content.event.dateIso));
    const firstTick = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1_000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, [content.event.dateIso]);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        });
      },
      { threshold: 0.14 },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [opened]);

  const calendarHref = useMemo(() => {
    const startsAt = eventDate(content.event.dateIso);
    const endsAt = new Date(startsAt.getTime() + 6 * 60 * 60 * 1_000);
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${calendarTimestamp(startsAt)}`,
      `DTEND:${calendarTimestamp(endsAt)}`,
      `SUMMARY:${content.couple.calendarTitle}`,
      `LOCATION:${content.event.venue}, ${content.event.location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
  }, [content]);

  const themeStyle: InvitationStyle = {
    "--ink": content.theme.primaryText,
    "--ink-soft": content.theme.secondaryText,
    "--gold": content.theme.accentText,
    "--light-text": content.theme.lightText,
    "--ivory": content.theme.ivory,
    "--paper": content.theme.paper,
    "--blue": content.theme.paleBlue,
    "--blue-deep": content.theme.deepBlue,
    "--sage": content.theme.sage,
    "--dark-section": content.theme.darkSection,
    "--display": fontStack(content.theme.displayFont),
    "--serif": fontStack(content.theme.bodyFont),
  };

  const scrollToInvitation = () => {
    document.getElementById("invitation-note")?.scrollIntoView({ behavior: "smooth" });
  };

  const finishEntrance = () => {
    const video = heroVideo.current;
    if (video && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    }
    setIntroPhase("opened");
  };

  const openEnvelope = () => {
    if (introPhase !== "envelope") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroPhase("opened");
      return;
    }

    const idleVideo = envelopeIdleVideo.current;
    const video = envelopeVideo.current;
    if (!video) {
      finishEntrance();
      return;
    }

    if (idleVideo) {
      const idleTime = idleVideo.currentTime % (ENVELOPE_IDLE_HALF * 2);
      video.currentTime = idleTime <= ENVELOPE_IDLE_HALF
        ? idleTime
        : ENVELOPE_IDLE_HALF * 2 - idleTime;
      idleVideo.pause();
    } else {
      video.currentTime = 0;
    }

    setIntroPhase("envelope-opening");
    void video.play().catch(finishEntrance);
  };

  const revealHeroBeforeHandoff = () => {
    const video = envelopeVideo.current;
    if (
      introPhase !== "envelope-opening"
      || !video
      || !Number.isFinite(video.duration)
      || video.duration - video.currentTime > HERO_REVEAL_LEAD_SECONDS
    ) return;

    setIntroPhase("hero-revealing");
  };

  return (
    <main
      className={`invitation intro-${introPhase}${heroVisible ? " is-hero-visible" : ""}${opened ? " is-open" : ""}`}
      style={themeStyle}
    >
      <section className="hero" aria-labelledby="couple-name">
        <video
          ref={heroVideo}
          className="hero-loop-video"
          muted
          playsInline
          loop
          preload="auto"
          poster="/videos/hero-poster.png"
          aria-hidden="true"
        >
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">{content.hero.eyebrow}</p>
          <h1 id="couple-name">
            {content.couple.firstName} <span>&amp;</span> {content.couple.secondName}
          </h1>
          <div className="hero-rule" aria-hidden="true">
            <i />
            <b>{content.event.dateShort}</b>
            <i />
          </div>
          <p className="guest-name">{guest}</p>
          <p className="hero-copy">{content.hero.copy}</p>
          <button className="scroll-cue" type="button" onClick={scrollToInvitation}>
            <span>{content.hero.scrollLabel}</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="paper-section invitation-note" id="invitation-note">
        <div className="corner-flower corner-flower-left" aria-hidden="true" />
        <div className="corner-flower corner-flower-right" aria-hidden="true" />
        <div className="note-inner" data-reveal>
          <p className="section-kicker">{content.note.kicker}</p>
          <div className="seal" aria-hidden="true">{content.note.seal}</div>
          <h2>{guest},</h2>
          <p>{content.note.body}</p>
          <div className="signature">{content.couple.signature}</div>
        </div>
      </section>

      <section className="date-section">
        <div className="date-orbit" aria-hidden="true" />
        <div className="date-card" data-reveal>
          <p className="section-kicker">{content.dateSection.kicker}</p>
          <span className="date-number">{content.event.dateNumber}</span>
          <h2>{content.event.month}</h2>
          <p>{content.event.day} · {content.event.year} · {content.event.time}</p>
          <a href={calendarHref} download="wedding.ics">
            {content.dateSection.calendarButton}
          </a>
        </div>
      </section>

      <section className="venue-section">
        <div className="venue-card" data-reveal>
          <p className="section-kicker">{content.venue.kicker}</p>
          <h2>{content.event.venue}</h2>
          <p>{content.event.location}</p>
          <span>{content.event.dateLong}</span>
        </div>
      </section>

      <section className="schedule-section">
        <div className="schedule-panel">
          <div className="schedule-heading" data-reveal>
            <p className="section-kicker">{content.schedule.kicker}</p>
            <h2>{content.schedule.title}</h2>
          </div>
          <ol className="schedule" data-reveal>
            {content.schedule.items.map((item, index) => (
              <li key={`${item.time}-${index}`}>
                <time>{item.time}</time>
                <span><b>{item.title}</b><small>{item.detail}</small></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dress-section">
        <div data-reveal>
          <p className="section-kicker">{content.dressCode.kicker}</p>
          <h2>{content.dressCode.title}</h2>
          <p>{content.dressCode.body}</p>
          <div className="palette" aria-label={content.dressCode.paletteLabel}>
            {content.dressCode.swatches.map((swatch, index) => (
              <i key={`${swatch}-${index}`} style={{ background: swatch }} />
            ))}
          </div>
        </div>
      </section>

      <section className="countdown-section" aria-label={content.countdown.ariaLabel}>
        <div className="countdown-panel" data-reveal>
          <p className="section-kicker">{content.countdown.kicker}</p>
          <div className="countdown">
            {[
              [timeLeft?.days ?? "—", content.countdown.days],
              [timeLeft?.hours ?? "—", content.countdown.hours],
              [timeLeft?.minutes ?? "—", content.countdown.minutes],
              [timeLeft?.seconds ?? "—", content.countdown.seconds],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-card" data-reveal>
          <div className="footer-monogram" aria-hidden="true">{content.couple.monogram}</div>
          <p>{content.footer.text.split("\n").map((line, index, lines) => (
            <span key={`${line}-${index}`}>{line}{index < lines.length - 1 && <br />}</span>
          ))}</p>
          <small>{content.footer.date}</small>
        </div>
      </footer>

      <div className="envelope-stage" aria-hidden={!entranceVisible}>
        <video
          ref={envelopeIdleVideo}
          className="envelope-idle-video"
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          poster="/videos/envelope-closed.png"
        >
          <source src="/videos/envelope-idle.mp4" type="video/mp4" />
        </video>
        <video
          ref={envelopeVideo}
          className="envelope-opening-video"
          muted
          playsInline
          preload="auto"
          poster="/videos/envelope-closed.png"
          onTimeUpdate={revealHeroBeforeHandoff}
          onEnded={finishEntrance}
          onError={finishEntrance}
        >
          <source src="/videos/entrance-opening.mp4" type="video/mp4" />
        </video>
        <div className="envelope-open-cue" aria-hidden="true">
          <span>{content.entrance.primaryLabel}</span>
          <small>{content.entrance.secondaryLabel}</small>
        </div>
        <button
          className="envelope-seal-button"
          type="button"
          aria-label={content.entrance.ariaLabel}
          disabled={introPhase !== "envelope"}
          onClick={openEnvelope}
        />
      </div>
    </main>
  );
}
