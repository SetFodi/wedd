"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  FONT_OPTIONS,
  type FontChoice,
  type InvitationContent,
} from "@/lib/invitation-content";

type Status = { tone: "idle" | "busy" | "success" | "error"; message: string };
type Field = { path: string; label: string; multiline?: boolean; hint?: string };
type FieldGroup = { title: string; eyebrow: string; fields: Field[] };

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "წყვილი და გვერდი",
    eyebrow: "Identity",
    fields: [
      { path: "couple.firstName", label: "პირველი სახელი" },
      { path: "couple.secondName", label: "მეორე სახელი" },
      { path: "couple.monogram", label: "ფუტერის მონოგრამა" },
      { path: "couple.calendarTitle", label: "კალენდრის ღონისძიების სახელი" },
      { path: "meta.title", label: "ბრაუზერის სათაური" },
      { path: "meta.description", label: "გაზიარების აღწერა", multiline: true },
    ],
  },
  {
    title: "კონვერტი და პირველი ეკრანი",
    eyebrow: "Entrance & hero",
    fields: [
      { path: "entrance.primaryLabel", label: "კონვერტის მთავარი მინიშნება" },
      { path: "entrance.secondaryLabel", label: "კონვერტის პატარა მინიშნება" },
      { path: "entrance.ariaLabel", label: "ღილაკის აღწერა" },
      { path: "hero.eyebrow", label: "ზედა წარწერა" },
      { path: "hero.guestFallback", label: "სტუმრის ნაგულისხმევი მიმართვა", hint: "?to= ბმული ამ ტექსტს მხოლოდ კონკრეტული სტუმრისთვის შეცვლის." },
      { path: "hero.copy", label: "მთავარი ტექსტი", multiline: true },
      { path: "hero.scrollLabel", label: "ჩამოსვლის ღილაკი" },
      { path: "event.dateShort", label: "მოკლე თარიღი" },
    ],
  },
  {
    title: "მოსაწვევის წერილი",
    eyebrow: "Invitation note",
    fields: [
      { path: "note.kicker", label: "პატარა სათაური" },
      { path: "note.seal", label: "ბეჭდის ასოები" },
      { path: "note.body", label: "მოსაწვევის ტექსტი", multiline: true },
    ],
  },
  {
    title: "თარიღი და ადგილი",
    eyebrow: "Event details",
    fields: [
      { path: "event.dateIso", label: "ზუსტი თარიღი და დრო", hint: "ფორმატი: 2026-09-20T17:00:00+04:00" },
      { path: "event.dateLong", label: "სრული თარიღი" },
      { path: "event.dateNumber", label: "რიცხვი" },
      { path: "event.month", label: "თვე" },
      { path: "event.year", label: "წელი" },
      { path: "event.day", label: "კვირის დღე" },
      { path: "event.time", label: "დრო" },
      { path: "event.venue", label: "ადგილის სახელი" },
      { path: "event.location", label: "მისამართი / რეგიონი" },
      { path: "dateSection.kicker", label: "თარიღის ბლოკის პატარა სათაური" },
      { path: "dateSection.calendarButton", label: "კალენდრის ღილაკი" },
      { path: "venue.kicker", label: "ადგილის ბლოკის პატარა სათაური" },
    ],
  },
  {
    title: "დრესკოდი",
    eyebrow: "Dress code",
    fields: [
      { path: "dressCode.kicker", label: "პატარა სათაური" },
      { path: "dressCode.title", label: "სათაური" },
      { path: "dressCode.body", label: "აღწერა", multiline: true },
      { path: "dressCode.paletteLabel", label: "ფერების ხელმისაწვდომობის აღწერა" },
    ],
  },
  {
    title: "დათვლა და ფუტერი",
    eyebrow: "Countdown & footer",
    fields: [
      { path: "countdown.kicker", label: "დათვლის სათაური" },
      { path: "countdown.ariaLabel", label: "დათვლის ხელმისაწვდომობის აღწერა" },
      { path: "countdown.days", label: "დღეების ერთეული" },
      { path: "countdown.hours", label: "საათების ერთეული" },
      { path: "countdown.minutes", label: "წუთების ერთეული" },
      { path: "countdown.seconds", label: "წამების ერთეული" },
      { path: "footer.text", label: "ფუტერის ტექსტი", multiline: true, hint: "ახალი ხაზისთვის Enter გამოიყენეთ." },
      { path: "footer.date", label: "ფუტერის თარიღი" },
    ],
  },
];

const COLOR_FIELDS: Array<{ key: keyof InvitationContent["theme"]; label: string }> = [
  { key: "primaryText", label: "მთავარი ტექსტი" },
  { key: "secondaryText", label: "დამხმარე ტექსტი" },
  { key: "accentText", label: "აქცენტი / ოქროსფერი" },
  { key: "lightText", label: "ტექსტი მუქ ფონზე" },
  { key: "ivory", label: "ღია სპილოსძვლისფერი" },
  { key: "paper", label: "ქაღალდის ფონი" },
  { key: "paleBlue", label: "ღია ცისფერი" },
  { key: "deepBlue", label: "ღრმა ცისფერი" },
  { key: "sage", label: "სალბისფერი" },
  { key: "darkSection", label: "მუქი სექციის ფონი" },
];

function valueAt(content: InvitationContent, path: string): string {
  let current: unknown = content;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : "";
}

function changedAt(content: InvitationContent, path: string, value: string): InvitationContent {
  const next = structuredClone(content) as unknown as Record<string, unknown>;
  const parts = path.split(".");
  let current = next;
  parts.slice(0, -1).forEach((part) => {
    current = current[part] as Record<string, unknown>;
  });
  current[parts.at(-1)!] = value;
  return next as unknown as InvitationContent;
}

function EditorField({
  field,
  content,
  onChange,
}: {
  field: Field;
  content: InvitationContent;
  onChange: (next: InvitationContent) => void;
}) {
  const id = `field-${field.path.replaceAll(".", "-")}`;
  const value = valueAt(content, field.path);
  return (
    <label className="admin-field" htmlFor={id}>
      <span>{field.label}</span>
      {field.multiline ? (
        <textarea id={id} rows={4} value={value} onChange={(event) => onChange(changedAt(content, field.path, event.target.value))} />
      ) : (
        <input id={id} value={value} onChange={(event) => onChange(changedAt(content, field.path, event.target.value))} />
      )}
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}

export default function AdminEditor({
  initiallyAuthenticated,
  initialContent,
}: {
  initiallyAuthenticated: boolean;
  initialContent: InvitationContent | null;
}) {
  const [authenticated, setAuthenticated] = useState(initiallyAuthenticated);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<InvitationContent | null>(initialContent);
  const [status, setStatus] = useState<Status>(
    initiallyAuthenticated && !initialContent
      ? { tone: "error", message: "მონაცემთა საცავი ჯერ მზად არ არის. განაახლეთ გვერდი." }
      : { tone: "idle", message: "" },
  );

  const loadContent = useCallback(async () => {
    setStatus({ tone: "busy", message: "მონაცემები იტვირთება…" });
    const response = await fetch("/api/admin/invitation", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      setContent(null);
      setStatus({ tone: "idle", message: "" });
      return;
    }
    const result = (await response.json()) as { content?: InvitationContent; error?: string };
    if (!response.ok || !result.content) {
      setStatus({ tone: "error", message: result.error ?? "მონაცემები ვერ ჩაიტვირთა." });
      return;
    }
    setContent(result.content);
    setStatus({ tone: "idle", message: "" });
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setStatus({ tone: "busy", message: "მოწმდება…" });
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus({ tone: "error", message: result.error ?? "შესვლა ვერ მოხერხდა." });
      return;
    }
    setPassword("");
    setAuthenticated(true);
    await loadContent();
  };

  const save = async () => {
    if (!content) return;
    setStatus({ tone: "busy", message: "ცვლილებები ინახება…" });
    const response = await fetch("/api/admin/invitation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const result = (await response.json()) as { content?: InvitationContent; error?: string };
    if (response.status === 401) {
      setAuthenticated(false);
      setContent(null);
      setStatus({ tone: "error", message: "სესია დასრულდა. შედით ხელახლა." });
      return;
    }
    if (!response.ok || !result.content) {
      setStatus({ tone: "error", message: result.error ?? "შენახვა ვერ მოხერხდა." });
      return;
    }
    setContent(result.content);
    setStatus({ tone: "success", message: "ცვლილებები გამოქვეყნდა." });
  };

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setContent(null);
    setStatus({ tone: "idle", message: "" });
  };

  if (!authenticated) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login-card" onSubmit={login}>
          <p className="admin-eyebrow">Private editor</p>
          <div className="admin-mark">M <i>&amp;</i> U</div>
          <h1>მოსაწვევის მართვა</h1>
          <p>შეიყვანეთ პაროლი ტექსტისა და დიზაინის შესაცვლელად.</p>
          <label>
            <span>პაროლი</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit" disabled={status.tone === "busy"}>შესვლა</button>
          {status.message && <div className={`admin-status is-${status.tone}`} role="status">{status.message}</div>}
        </form>
      </main>
    );
  }

  if (!content) {
    return <main className="admin-loading" aria-live="polite">{status.message || "იტვირთება…"}</main>;
  }

  return (
    <main className="admin-app">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Megi & Ucha</p>
          <h1>მოსაწვევის მართვა</h1>
          <p>შეცვალეთ ტექსტი, თარიღები, ფონტები და ფერები. შენახვა პირდაპირ საჯარო გვერდს აახლებს.</p>
        </div>
        <nav aria-label="ადმინისტრატორის მოქმედებები">
          <a href="/" target="_blank" rel="noreferrer">მოსაწვევის ნახვა ↗</a>
          <button type="button" onClick={logout}>გასვლა</button>
        </nav>
      </header>

      <div className="admin-layout">
        <div className="admin-sections">
          {FIELD_GROUPS.map((group, groupIndex) => (
            <section className="admin-panel" key={group.title}>
              <div className="admin-panel-heading">
                <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                <div><p>{group.eyebrow}</p><h2>{group.title}</h2></div>
              </div>
              <div className="admin-grid">
                {group.fields.map((field) => <EditorField key={field.path} field={field} content={content} onChange={setContent} />)}
              </div>
              {group.title === "მოსაწვევის წერილი" && (
                <label className="admin-field admin-signature-field">
                  <span>ხელმოწერა</span>
                  <input value={content.couple.signature} onChange={(event) => setContent({ ...content, couple: { ...content.couple, signature: event.target.value } })} />
                </label>
              )}
              {group.title === "დრესკოდი" && (
                <div className="admin-swatches">
                  <p>დრესკოდის ფერები</p>
                  <div>{content.dressCode.swatches.map((swatch, index) => (
                    <label key={`${index}-${swatch}`}><input type="color" value={swatch} onChange={(event) => {
                      const swatches = [...content.dressCode.swatches];
                      swatches[index] = event.target.value;
                      setContent({ ...content, dressCode: { ...content.dressCode, swatches } });
                    }} /><span>{swatch}</span></label>
                  ))}</div>
                </div>
              )}
            </section>
          ))}

          <section className="admin-panel">
            <div className="admin-panel-heading"><span>07</span><div><p>Timeline</p><h2>დღის განრიგი</h2></div></div>
            <div className="admin-grid">
              <EditorField field={{ path: "schedule.kicker", label: "პატარა სათაური" }} content={content} onChange={setContent} />
              <EditorField field={{ path: "schedule.title", label: "სათაური" }} content={content} onChange={setContent} />
            </div>
            <div className="admin-timeline-list">
              {content.schedule.items.map((item, index) => (
                <div className="admin-timeline-item" key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <label>დრო<input value={item.time} onChange={(event) => {
                    const items = structuredClone(content.schedule.items);
                    items[index].time = event.target.value;
                    setContent({ ...content, schedule: { ...content.schedule, items } });
                  }} /></label>
                  <label>სათაური<input value={item.title} onChange={(event) => {
                    const items = structuredClone(content.schedule.items);
                    items[index].title = event.target.value;
                    setContent({ ...content, schedule: { ...content.schedule, items } });
                  }} /></label>
                  <label>აღწერა<textarea rows={2} value={item.detail} onChange={(event) => {
                    const items = structuredClone(content.schedule.items);
                    items[index].detail = event.target.value;
                    setContent({ ...content, schedule: { ...content.schedule, items } });
                  }} /></label>
                  <button type="button" onClick={() => setContent({ ...content, schedule: { ...content.schedule, items: content.schedule.items.filter((_, itemIndex) => itemIndex !== index) } })} disabled={content.schedule.items.length <= 1}>წაშლა</button>
                </div>
              ))}
              <button className="admin-add-row" type="button" onClick={() => setContent({ ...content, schedule: { ...content.schedule, items: [...content.schedule.items, { time: "20:00", title: "ახალი ეტაპი", detail: "აღწერა" }] } })} disabled={content.schedule.items.length >= 8}>+ ეტაპის დამატება</button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><span>08</span><div><p>Visual system</p><h2>ფონტები და ფერები</h2></div></div>
            <div className="admin-font-grid">
              <label><span>სათაურების ფონტი</span><select value={content.theme.displayFont} onChange={(event) => setContent({ ...content, theme: { ...content.theme, displayFont: event.target.value as FontChoice } })}>{FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label><span>ძირითადი ტექსტის ფონტი</span><select value={content.theme.bodyFont} onChange={(event) => setContent({ ...content, theme: { ...content.theme, bodyFont: event.target.value as FontChoice } })}>{FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
            <div className="admin-color-grid">
              {COLOR_FIELDS.map(({ key, label }) => {
                const value = content.theme[key] as string;
                return <label key={key}><input type="color" value={value} onChange={(event) => setContent({ ...content, theme: { ...content.theme, [key]: event.target.value } })} /><span>{label}<small>{value}</small></span></label>;
              })}
            </div>
          </section>
        </div>

        <aside className="admin-publish-card">
          <p className="admin-eyebrow">Publish</p>
          <h2>მზად არის?</h2>
          <p>შენახვის შემდეგ ცვლილებები ყველა ახალ ვიზიტორს გამოუჩნდება.</p>
          <button type="button" onClick={save} disabled={status.tone === "busy"}>ცვლილებების შენახვა</button>
          {status.message && <div className={`admin-status is-${status.tone}`} role="status">{status.message}</div>}
        </aside>
      </div>
    </main>
  );
}
