export const FONT_OPTIONS = [
  {
    value: "ma-si-vardi",
    label: "Ma Si Vardi — დეკორატიული",
    stack: '"Ma Si Vardi", "Noto Serif Georgian", Georgia, serif',
  },
  {
    value: "noto-serif-georgian",
    label: "Noto Serif Georgian — კლასიკური",
    stack: '"Noto Serif Georgian", "SF Georgian", Georgia, serif',
  },
  {
    value: "cormorant",
    label: "Cormorant — მსუბუქი",
    stack: '"Cormorant Garamond", "Noto Serif Georgian", Georgia, serif',
  },
  {
    value: "system-serif",
    label: "System Serif — სადა",
    stack: 'Georgia, "Noto Serif Georgian", serif',
  },
] as const;

export type FontChoice = (typeof FONT_OPTIONS)[number]["value"];

export type InvitationContent = {
  meta: {
    title: string;
    description: string;
  };
  couple: {
    firstName: string;
    secondName: string;
    signature: string;
    monogram: string;
    calendarTitle: string;
  };
  event: {
    dateIso: string;
    dateLong: string;
    dateShort: string;
    dateNumber: string;
    month: string;
    year: string;
    day: string;
    time: string;
    venue: string;
    location: string;
  };
  entrance: {
    primaryLabel: string;
    secondaryLabel: string;
    ariaLabel: string;
  };
  hero: {
    eyebrow: string;
    guestFallback: string;
    copy: string;
    scrollLabel: string;
  };
  note: {
    kicker: string;
    seal: string;
    body: string;
  };
  dateSection: {
    kicker: string;
    calendarButton: string;
  };
  schedule: {
    kicker: string;
    title: string;
    items: Array<{
      time: string;
      title: string;
      detail: string;
    }>;
  };
  venue: {
    kicker: string;
  };
  dressCode: {
    kicker: string;
    title: string;
    body: string;
    paletteLabel: string;
    swatches: string[];
  };
  countdown: {
    kicker: string;
    ariaLabel: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  footer: {
    text: string;
    date: string;
  };
  theme: {
    displayFont: FontChoice;
    bodyFont: FontChoice;
    primaryText: string;
    secondaryText: string;
    accentText: string;
    lightText: string;
    ivory: string;
    paper: string;
    paleBlue: string;
    deepBlue: string;
    sage: string;
    darkSection: string;
  };
};

export const DEFAULT_INVITATION_CONTENT: InvitationContent = {
  meta: {
    title: "მეგი & უჩა | ქორწილის მოსაწვევი",
    description: "მეგისა და უჩას ქორწილის მოსაწვევი · 20 სექტემბერი, 2026",
  },
  couple: {
    firstName: "მეგი",
    secondName: "უჩა",
    signature: "მეგი და უჩა",
    monogram: "M & U",
    calendarTitle: "მეგი და უჩა — ქორწილი",
  },
  event: {
    dateIso: "2026-09-20T17:00:00+04:00",
    dateLong: "20 სექტემბერი, 2026",
    dateShort: "20 · 09 · 26",
    dateNumber: "20",
    month: "სექტემბერი",
    year: "2026",
    day: "კვირა",
    time: "17:00",
    venue: "წინანდლის მამული",
    location: "კახეთი, საქართველო",
  },
  entrance: {
    primaryLabel: "გახსენით მოსაწვევი",
    secondaryLabel: "click to open",
    ariaLabel: "მოწვევის გახსნა",
  },
  hero: {
    eyebrow: "მალე დავქორწინდებით",
    guestFallback: "ძვირფასო სტუმარო",
    copy: "ძალიან გვინდა, ეს დღე თქვენთან ერთად გავიზიაროთ",
    scrollLabel: "მოწვევის ნახვა",
  },
  note: {
    kicker: "ჩვენი ამბის ახალი თავი",
    seal: "მუ",
    body:
      "სიყვარულის ყველაზე ლამაზ დღეს თქვენთან ერთად აღნიშვნა გვინდა. გეპატიჟებით ჩვენს ქორწილში, სადაც ერთი პატარა სიტყვა, „კი“, მთელ ცხოვრებად იქცევა.",
  },
  dateSection: {
    kicker: "შეინახეთ ეს დღე",
    calendarButton: "კალენდარში დამატება",
  },
  schedule: {
    kicker: "ამ დღის რიტმი",
    title: "ერთად შევხვდეთ",
    items: [
      {
        time: "17:00",
        title: "სტუმრების მიღება",
        detail: "ერთი ჭიქა ცქრიალა და ბევრი ჩახუტება",
      },
      {
        time: "17:30",
        title: "ცერემონია",
        detail: "ჩვენი „კი“ ყველაზე საყვარელი ადამიანების წინაშე",
      },
      {
        time: "18:30",
        title: "ვახშამი და ცეკვა",
        detail: "დარჩით მანამდე, სანამ მუსიკა არ გაჩერდება",
      },
    ],
  },
  venue: {
    kicker: "შეხვედრის ადგილი",
  },
  dressCode: {
    kicker: "Dress code",
    title: "საღამოს ფორმალური",
    body:
      "მოხარული ვიქნებით, თუ არჩევანს ბუნებრივ, რბილ ტონებზე შეაჩერებთ. თეთრი პატარძალს დავუტოვოთ.",
    paletteLabel: "რეკომენდებული ფერები",
    swatches: ["#c8b69b", "#80907a", "#a9bdca", "#d8b6a7", "#344c65"],
  },
  countdown: {
    kicker: "ჩვენს დღემდე დარჩა",
    ariaLabel: "ქორწილამდე დარჩენილი დრო",
    days: "დღე",
    hours: "საათი",
    minutes: "წუთი",
    seconds: "წამი",
  },
  footer: {
    text: "ამ დღემდე ერთად მოვედით.\nამ დღიდან ერთად მივდივართ.",
    date: "20 · 09 · 2026",
  },
  theme: {
    displayFont: "ma-si-vardi",
    bodyFont: "noto-serif-georgian",
    primaryText: "#173253",
    secondaryText: "#304b69",
    accentText: "#ad8a52",
    lightText: "#ece7dd",
    ivory: "#f7f2e8",
    paper: "#f3ecdf",
    paleBlue: "#dce8f1",
    deepBlue: "#adc2d1",
    sage: "#74816d",
    darkSection: "#173253",
  },
};

const FONT_VALUES = new Set<string>(FONT_OPTIONS.map((option) => option.value));
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function text(value: unknown, fallback: string, maxLength = 600): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;
}

function font(value: unknown, fallback: FontChoice): FontChoice {
  return typeof value === "string" && FONT_VALUES.has(value)
    ? (value as FontChoice)
    : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeInvitationContent(value: unknown): InvitationContent {
  const root = record(value);
  const meta = record(root.meta);
  const couple = record(root.couple);
  const event = record(root.event);
  const entrance = record(root.entrance);
  const hero = record(root.hero);
  const note = record(root.note);
  const dateSection = record(root.dateSection);
  const schedule = record(root.schedule);
  const venue = record(root.venue);
  const dressCode = record(root.dressCode);
  const countdown = record(root.countdown);
  const footer = record(root.footer);
  const theme = record(root.theme);

  const scheduleItems = Array.isArray(schedule.items)
    ? schedule.items.slice(0, 8).map((item, index) => {
        const source = record(item);
        const fallback =
          DEFAULT_INVITATION_CONTENT.schedule.items[index] ??
          DEFAULT_INVITATION_CONTENT.schedule.items.at(-1)!;
        return {
          time: text(source.time, fallback.time, 24),
          title: text(source.title, fallback.title, 120),
          detail: text(source.detail, fallback.detail, 300),
        };
      })
    : DEFAULT_INVITATION_CONTENT.schedule.items;

  const swatches = Array.isArray(dressCode.swatches)
    ? dressCode.swatches.slice(0, 8).map((item, index) =>
        color(item, DEFAULT_INVITATION_CONTENT.dressCode.swatches[index] ?? "#c8b69b"),
      )
    : DEFAULT_INVITATION_CONTENT.dressCode.swatches;

  return {
    meta: {
      title: text(meta.title, DEFAULT_INVITATION_CONTENT.meta.title, 160),
      description: text(meta.description, DEFAULT_INVITATION_CONTENT.meta.description, 300),
    },
    couple: {
      firstName: text(couple.firstName, DEFAULT_INVITATION_CONTENT.couple.firstName, 80),
      secondName: text(couple.secondName, DEFAULT_INVITATION_CONTENT.couple.secondName, 80),
      signature: text(couple.signature, DEFAULT_INVITATION_CONTENT.couple.signature, 120),
      monogram: text(couple.monogram, DEFAULT_INVITATION_CONTENT.couple.monogram, 40),
      calendarTitle: text(couple.calendarTitle, DEFAULT_INVITATION_CONTENT.couple.calendarTitle, 160),
    },
    event: {
      dateIso: text(event.dateIso, DEFAULT_INVITATION_CONTENT.event.dateIso, 60),
      dateLong: text(event.dateLong, DEFAULT_INVITATION_CONTENT.event.dateLong, 100),
      dateShort: text(event.dateShort, DEFAULT_INVITATION_CONTENT.event.dateShort, 40),
      dateNumber: text(event.dateNumber, DEFAULT_INVITATION_CONTENT.event.dateNumber, 8),
      month: text(event.month, DEFAULT_INVITATION_CONTENT.event.month, 40),
      year: text(event.year, DEFAULT_INVITATION_CONTENT.event.year, 8),
      day: text(event.day, DEFAULT_INVITATION_CONTENT.event.day, 40),
      time: text(event.time, DEFAULT_INVITATION_CONTENT.event.time, 16),
      venue: text(event.venue, DEFAULT_INVITATION_CONTENT.event.venue, 140),
      location: text(event.location, DEFAULT_INVITATION_CONTENT.event.location, 160),
    },
    entrance: {
      primaryLabel: text(entrance.primaryLabel, DEFAULT_INVITATION_CONTENT.entrance.primaryLabel, 100),
      secondaryLabel: text(entrance.secondaryLabel, DEFAULT_INVITATION_CONTENT.entrance.secondaryLabel, 100),
      ariaLabel: text(entrance.ariaLabel, DEFAULT_INVITATION_CONTENT.entrance.ariaLabel, 100),
    },
    hero: {
      eyebrow: text(hero.eyebrow, DEFAULT_INVITATION_CONTENT.hero.eyebrow, 120),
      guestFallback: text(hero.guestFallback, DEFAULT_INVITATION_CONTENT.hero.guestFallback, 120),
      copy: text(hero.copy, DEFAULT_INVITATION_CONTENT.hero.copy, 300),
      scrollLabel: text(hero.scrollLabel, DEFAULT_INVITATION_CONTENT.hero.scrollLabel, 100),
    },
    note: {
      kicker: text(note.kicker, DEFAULT_INVITATION_CONTENT.note.kicker, 120),
      seal: text(note.seal, DEFAULT_INVITATION_CONTENT.note.seal, 20),
      body: text(note.body, DEFAULT_INVITATION_CONTENT.note.body, 800),
    },
    dateSection: {
      kicker: text(dateSection.kicker, DEFAULT_INVITATION_CONTENT.dateSection.kicker, 120),
      calendarButton: text(dateSection.calendarButton, DEFAULT_INVITATION_CONTENT.dateSection.calendarButton, 120),
    },
    schedule: {
      kicker: text(schedule.kicker, DEFAULT_INVITATION_CONTENT.schedule.kicker, 120),
      title: text(schedule.title, DEFAULT_INVITATION_CONTENT.schedule.title, 120),
      items: scheduleItems.length ? scheduleItems : DEFAULT_INVITATION_CONTENT.schedule.items,
    },
    venue: {
      kicker: text(venue.kicker, DEFAULT_INVITATION_CONTENT.venue.kicker, 120),
    },
    dressCode: {
      kicker: text(dressCode.kicker, DEFAULT_INVITATION_CONTENT.dressCode.kicker, 120),
      title: text(dressCode.title, DEFAULT_INVITATION_CONTENT.dressCode.title, 120),
      body: text(dressCode.body, DEFAULT_INVITATION_CONTENT.dressCode.body, 600),
      paletteLabel: text(dressCode.paletteLabel, DEFAULT_INVITATION_CONTENT.dressCode.paletteLabel, 120),
      swatches: swatches.length ? swatches : DEFAULT_INVITATION_CONTENT.dressCode.swatches,
    },
    countdown: {
      kicker: text(countdown.kicker, DEFAULT_INVITATION_CONTENT.countdown.kicker, 120),
      ariaLabel: text(countdown.ariaLabel, DEFAULT_INVITATION_CONTENT.countdown.ariaLabel, 120),
      days: text(countdown.days, DEFAULT_INVITATION_CONTENT.countdown.days, 40),
      hours: text(countdown.hours, DEFAULT_INVITATION_CONTENT.countdown.hours, 40),
      minutes: text(countdown.minutes, DEFAULT_INVITATION_CONTENT.countdown.minutes, 40),
      seconds: text(countdown.seconds, DEFAULT_INVITATION_CONTENT.countdown.seconds, 40),
    },
    footer: {
      text: text(footer.text, DEFAULT_INVITATION_CONTENT.footer.text, 400),
      date: text(footer.date, DEFAULT_INVITATION_CONTENT.footer.date, 60),
    },
    theme: {
      displayFont: font(theme.displayFont, DEFAULT_INVITATION_CONTENT.theme.displayFont),
      bodyFont: font(theme.bodyFont, DEFAULT_INVITATION_CONTENT.theme.bodyFont),
      primaryText: color(theme.primaryText, DEFAULT_INVITATION_CONTENT.theme.primaryText),
      secondaryText: color(theme.secondaryText, DEFAULT_INVITATION_CONTENT.theme.secondaryText),
      accentText: color(theme.accentText, DEFAULT_INVITATION_CONTENT.theme.accentText),
      lightText: color(theme.lightText, DEFAULT_INVITATION_CONTENT.theme.lightText),
      ivory: color(theme.ivory, DEFAULT_INVITATION_CONTENT.theme.ivory),
      paper: color(theme.paper, DEFAULT_INVITATION_CONTENT.theme.paper),
      paleBlue: color(theme.paleBlue, DEFAULT_INVITATION_CONTENT.theme.paleBlue),
      deepBlue: color(theme.deepBlue, DEFAULT_INVITATION_CONTENT.theme.deepBlue),
      sage: color(theme.sage, DEFAULT_INVITATION_CONTENT.theme.sage),
      darkSection: color(theme.darkSection, DEFAULT_INVITATION_CONTENT.theme.darkSection),
    },
  };
}

export function fontStack(choice: FontChoice): string {
  return FONT_OPTIONS.find((option) => option.value === choice)?.stack ?? FONT_OPTIONS[0].stack;
}
