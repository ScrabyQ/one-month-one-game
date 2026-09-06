import type { Translations } from "./types";

export const en: Translations = {
  common: {
    projectTitle: "One Month — One Game",
    skipToContent: "Skip to content",
    initialsFallback: "OM",
  },
  nav: {
    primaryLabel: "Main navigation",
    mobileLabel: "Mobile navigation",
    currentMonth: "Current Month",
    rules: "Rules",
    archive: "Archive",
    about: "About",
    menu: "Menu",
    openMenu: "Open menu",
  },
  language: {
    label: "Language",
    current: "English",
    names: { en: "English", ru: "Russian" },
    switchTo: (localeLabel) => `Switch to ${localeLabel}`,
  },
  community: {
    telegramAriaLabel: "Open the Code & Polygons Telegram channel",
    telegramCaption: "Code & Polygons · Telegram",
  },
  footer: {
    linksLabel: "Footer links",
    currentRound: "Current Round",
    rules: "Rules",
    participate: "Join the Jam",
    archive: "Archive",
    note: "Static showcase of independent games",
  },
  home: {
    galleryTitle: "This Month's Gallery",
    gallerySubheading: "Games from the current round",
    galleryAside: "Every game is another finished story.",
    archiveEyebrow: "Traces of past months",
    archiveTitle: "Archive",
    archiveLink: "View the full archive",
  },
  about: {
    label: "About",
    headingLineOne: "MAKE IT.",
    headingLineTwo: "FINISH IT.",
    headingLineThree: "SHARE IT.",
    firstParagraph:
      "One Month — One Game is an ongoing challenge for game developers. Every month brings a new theme and another chance to finish a small project.",
    secondParagraph:
      "Engine, genre, and experience do not matter. Finish the game and share the result.",
  },
  participation: {
    eyebrow: "Participation",
    title: "How to Participate",
    aside: "Finish a small idea and share the result.",
    note: "Games appear here automatically after submission to the jam.",
    rulesLink: "Before submitting, read the full rules",
    steps: [
      { number: "01", title: "Make a game", detail: "One finished idea" },
      { number: "02", title: "Upload it", detail: "The game page stays on the platform" },
      { number: "03", title: "Submit to the jam", detail: "Add the game to the current round" },
      { number: "04", title: "Appear here", detail: "We will pull it in automatically" },
    ],
    uploadTo: (providerLabel) => `Upload it to ${providerLabel}`,
    supportedPlatform: "a supported platform",
    genericPlatform: "a platform",
  },
  hero: {
    roundLabel: (roundNumber) => `Round ${roundNumber}`,
    demoBadge: "DEMO DATA",
    titleLineOne: "One Month —",
    titleLineTwo: "One Game",
    tagline: "Make it. Finish it. Share it.",
    themeLabel: "Theme of the Month",
    datesLabel: "Round Dates",
    providersLabel: "Platforms",
    inGalleryLabel: "In the Gallery",
  },
  archive: {
    introEyebrow: "All rounds",
    introTitleLineOne: "Archive of",
    introTitleLineTwo: "finished ideas.",
    introCopy: "Every month stays here — with its theme and the games that made it to the finish line.",
    listLabel: "Round list",
    previewEyebrow: "Traces of past months",
    previewTitle: "Archive",
    previewLink: "View the full archive",
    firstRoundTitle: "This is the first round.",
    firstRoundCopy: "The archive will start growing next month.",
  },
  round: {
    archiveLink: "Archive",
    gamesTitle: "Round Games",
    externalPages: (count) => `${count} external game ${count === 1 ? "page" : "pages"}`,
  },
  emptyGames: {
    title: "Nothing here yet.",
    copyLineOne: "Be the first to",
    copyLineTwo: "finish a game this month.",
  },
  stats: {
    registrations: { one: "participant", few: "participants", many: "participants" },
    participants: { one: "participant", few: "participants", many: "participants" },
    submissions: { one: "submission", few: "submissions", many: "submissions" },
    registrationHint:
      "Total participants across platforms. The same participant may be counted on more than one platform.",
    statsUnavailable: "Participant stats unavailable",
  },
  game: {
    openAria: (title, isLatest) =>
      `Open ${title} on the external platform${isLatest ? ", latest addition" : ""}`,
    coverAlt: (title) => `Cover art for ${title}`,
    fallbackCaptionLineOne: "one month",
    fallbackCaptionLineTwo: "one game",
    latestLabel: "Latest addition",
    viewGame: "View Game",
    newLabel: "NEW",
    sourceTitle: (providerLabel) => `Source: ${providerLabel}`,
  },
  latest: {
    ariaLabel: "Latest addition",
    label: "Latest addition",
  },
  participationButtons: {
    joinCurrentRound: "Join the current round",
    through: (providerLabel) => `through ${providerLabel}`,
    setupLink: "The link will appear after setup",
    enterThrough: (providerLabel) => `Join the current round through ${providerLabel}`,
    joinLabels: (providerLabels) => providerLabels.join(" or "),
    linksWillAppear: (providerLabels) => `Participation links will appear after setting up ${providerLabels}.`,
    linkWillAppear: (providerLabel) => `The participation link will appear after setting up ${providerLabel}.`,
  },
  status: {
    upcoming: "Coming soon",
    active: "Live now",
    finished: "Finished",
  },
  countdown: {
    status: "Status",
    untilStart: "Until start",
    untilEnd: "Until end",
    roundFinished: "Round finished",
    days: { one: "day", few: "days", many: "days" },
  },
  theme: {
    pendingFallback: "The theme will appear at the start of the month",
    announcedDescription: (text) => `theme “${text}”`,
  },
  meta: {
    homeTitle: (monthLabel) => `${monthLabel} — One Month, One Game`,
    homeDescription: "A monthly challenge for game developers: one theme, one month, one finished game.",
    archiveTitle: "Archive — One Month, One Game",
    archiveDescription: "An archive of monthly rounds from the One Month — One Game challenge.",
    rulesTitle: "Rules — One Month, One Game",
    rulesDescription: "Rules and FAQ for the One Month — One Game monthly game development challenge.",
    roundTitle: (monthLabel) => `${monthLabel} — One Month, One Game`,
    roundDescription: (monthLabel, themeDescription) =>
      `${monthLabel}: ${themeDescription}, games, and participation links.`,
    notFoundTitle: "Page not found — One Month, One Game",
    notFoundDescription: "That page is not here, but there are plenty more games to discover.",
  },
  notFound: {
    eyebrow: "Error 404",
    titleLineOne: "The idea",
    titleLineTwo: "got lost.",
    copy: "Go back home and see what others have finished.",
    homeLink: "Back home",
  },
  rules: {
    intro: {
      eyebrow: "THE CHALLENGE",
      titleLineOne: "RULES OF",
      titleLineTwo: "THE CHALLENGE.",
      paragraphs: [
        "One Month — One Game is a relaxed, non-competitive challenge about finishing games regularly.",
        "Keep the scope small, make something playable, and share it before the round ends.",
      ],
      decorativeLabel: "01—09",
    },
    shortVersion: {
      label: "THE SHORT VERSION",
      points: [
        "Make one new game during the round.",
        "Keep it small.",
        "Make it playable.",
        "Share it.",
      ],
      note: "The monthly theme is optional.",
    },
    core: {
      heading: "CORE RULES",
      items: [
        {
          number: "01",
          title: "One round — one month",
          description: "Each round lasts one month. The goal is to finish and publish one small playable game before the round ends.",
        },
        {
          number: "02",
          title: "Make something new",
          description: "The submitted game should be made for the current round and must not have been published before the round began. Reusable systems, templates and general-purpose code are still allowed.",
        },
        {
          number: "03",
          title: "One game per person or team",
          description: "Each participant or team may submit one game per round. It is One Month — One Game, after all.",
        },
        {
          number: "04",
          title: "Submit something playable",
          description: "A submission does not need to be a polished commercial release, but there must be a playable version by the end of the round. Prototype, MVP and tiny game are all valid.",
        },
        {
          number: "05",
          title: "The theme is optional",
          description: "The monthly theme is inspiration, not a requirement. Follow it, bend it or ignore it completely.",
        },
        {
          number: "06",
          title: "Use the tools that help you finish",
          description: "Any engine, framework or workflow is welcome. Templates, reusable code, asset packs and AI tools are allowed.",
        },
        {
          number: "07",
          title: "Solo and teams are welcome",
          description: "You can participate alone or as a team. Digital games and tabletop games are both welcome.",
        },
        {
          number: "08",
          title: "People must be able to try it",
          description: "The challenge submission must provide a free way to play: a free build, browser version or meaningful free demo. You may still sell an expanded or full version separately.",
        },
        {
          number: "09",
          title: "Publish responsibly",
          description: "No NSFW or illegal submissions. You are responsible for having the right to publish the code, art, audio and other material included in your game.",
        },
      ],
    },
    allowed: {
      eyebrow: "WHAT IS ALLOWED",
      heading: "USE WHAT HELPS YOU FINISH.",
      items: [
        "Any engine",
        "Templates",
        "Reusable code",
        "Asset packs",
        "AI tools",
        "Solo or team",
        "Digital or tabletop",
      ],
      paragraphs: [
        "The challenge is about finishing games, not proving that every pixel and utility function was made from scratch.",
        "Just make sure you have the right to publish what you use.",
      ],
    },
    faq: {
      eyebrow: "FAQ",
      heading: "COMMON QUESTIONS",
      items: [
        {
          question: "Can I use code from an older project?",
          answer: "Yes — if it is reusable or general-purpose code such as utilities, systems, plugins, templates or boilerplate. Do not submit an existing finished game as a new entry.",
        },
        {
          question: "Can I use premade or purchased assets?",
          answer: "Yes. Free assets, purchased asset packs and your own existing assets are allowed as long as you have the right to use and publish them.",
        },
        {
          question: "Can I use AI tools?",
          answer: "Yes. AI coding tools, agents, generated images, audio and other AI-assisted workflows are allowed. You remain responsible for what you publish.",
        },
        {
          question: "Does the game have to follow the monthly theme?",
          answer: "No. The theme is completely optional. It exists as inspiration or an additional constraint if you want one.",
        },
        {
          question: "Does the game need to be finished?",
          answer: "It needs to be playable, not perfect. A tiny finished idea is better than a huge unfinished project.",
        },
        {
          question: "Can I continue developing the game after the round?",
          answer: "Absolutely. Update it, expand it or turn it into a commercial project. It simply cannot be submitted again as a new game in the next round.",
        },
        {
          question: "Can I update the submitted build after the deadline?",
          answer: "Yes. The challenge is meant to create games, not freeze them forever. The version available at the deadline should simply have been playable.",
        },
        {
          question: "Do I have to participate every month?",
          answer: "No. Join the months that work for you.",
        },
        {
          question: "What happens if I fail to finish?",
          answer: "Nothing. Join the next round and try again.",
        },
      ],
    },
    origin: {
      eyebrow: "ORIGIN",
      heading: "Inspired by One Game a Month.",
      copy: "This challenge was inspired by the relaxed, non-competitive One Game a Month jam on itch.io. We keep the same core idea — regularly finish small games — while adapting the rules for this community.",
      linkLabel: "View the original One Game a Month",
    },
    cta: {
      heading: "READY TO MAKE SOMETHING SMALL?",
      copy: "The next finished game matters more than the next perfect idea.",
      linkLabel: "Join the current round",
    },
  },
  myIndie: {
    challengeLabel: "GAMEDEV CHALLENGE",
  },
  og: {
    projectTitle: "ONE MONTH / ONE GAME",
    monthlyChallengeLabel: "MONTHLY CHALLENGE",
    monthlyEditionLabel: "MONTHLY EDITION",
    titleLineOne: "ONE MONTH —",
    titleLineTwo: "ONE GAME",
    tagline: "MAKE IT. FINISH IT. SHARE IT.",
    defaultGiantLabel: "ONE MONTH",
    roundLabel: (roundNumber) => `ROUND ${roundNumber}`,
    roundImageAlt: (roundNumber, monthLabel) =>
      `One Month / One Game, Round ${roundNumber}, ${monthLabel}`,
    defaultImageAlt: "One Month / One Game, monthly challenge",
  },
};
