import type { JamStatus } from "../domain/types";

export const SUPPORTED_LOCALES = ["en", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export interface DurationForms {
  one: string;
  few: string;
  many: string;
}

export interface OgTranslations {
  projectTitle: string;
  monthlyChallengeLabel: string;
  monthlyEditionLabel: string;
  titleLineOne: string;
  titleLineTwo: string;
  tagline: string;
  defaultGiantLabel: string;
  roundLabel: (roundNumber: string) => string;
  roundImageAlt: (roundNumber: string, monthLabel: string) => string;
  defaultImageAlt: string;
}

export interface RulesTranslations {
  intro: {
    eyebrow: string;
    titleLineOne: string;
    titleLineTwo: string;
    paragraphs: readonly string[];
    decorativeLabel: string;
  };
  shortVersion: {
    label: string;
    points: readonly string[];
    note: string;
  };
  core: {
    heading: string;
    items: readonly { number: string; title: string; description: string }[];
  };
  allowed: {
    eyebrow: string;
    heading: string;
    items: readonly string[];
    paragraphs: readonly string[];
  };
  faq: {
    eyebrow: string;
    heading: string;
    items: readonly { question: string; answer: string }[];
  };
  origin: {
    eyebrow: string;
    heading: string;
    copy: string;
    linkLabel: string;
  };
  cta: {
    heading: string;
    copy: string;
    linkLabel: string;
  };
}

export interface Translations {
  common: {
    projectTitle: string;
    skipToContent: string;
    initialsFallback: string;
  };
  nav: {
    primaryLabel: string;
    mobileLabel: string;
    currentMonth: string;
    rules: string;
    archive: string;
    about: string;
    menu: string;
    openMenu: string;
  };
  language: {
    label: string;
    current: string;
    names: Record<Locale, string>;
    switchTo: (localeLabel: string) => string;
  };
  footer: {
    linksLabel: string;
    currentRound: string;
    rules: string;
    participate: string;
    archive: string;
    note: string;
  };
  home: {
    galleryTitle: string;
    gallerySubheading: string;
    galleryAside: string;
    archiveEyebrow: string;
    archiveTitle: string;
    archiveLink: string;
  };
  about: {
    label: string;
    headingLineOne: string;
    headingLineTwo: string;
    headingLineThree: string;
    firstParagraph: string;
    secondParagraph: string;
  };
  participation: {
    eyebrow: string;
    title: string;
    aside: string;
    note: string;
    rulesLink: string;
    steps: readonly { number: string; title: string; detail: string }[];
    uploadTo: (providerLabel: string) => string;
    supportedPlatform: string;
    genericPlatform: string;
  };
  hero: {
    roundLabel: (roundNumber: string) => string;
    demoBadge: string;
    titleLineOne: string;
    titleLineTwo: string;
    tagline: string;
    themeLabel: string;
    datesLabel: string;
    providersLabel: string;
    inGalleryLabel: string;
  };
  archive: {
    introEyebrow: string;
    introTitleLineOne: string;
    introTitleLineTwo: string;
    introCopy: string;
    listLabel: string;
    previewEyebrow: string;
    previewTitle: string;
    previewLink: string;
    firstRoundTitle: string;
    firstRoundCopy: string;
  };
  round: {
    archiveLink: string;
    gamesTitle: string;
    externalPages: (count: number) => string;
  };
  emptyGames: {
    title: string;
    copyLineOne: string;
    copyLineTwo: string;
  };
  game: {
    openAria: (title: string, isLatest: boolean) => string;
    coverAlt: (title: string) => string;
    fallbackCaptionLineOne: string;
    fallbackCaptionLineTwo: string;
    latestLabel: string;
    viewGame: string;
    newLabel: string;
    sourceTitle: (providerLabel: string) => string;
  };
  latest: {
    ariaLabel: string;
    label: string;
  };
  participationButtons: {
    joinCurrentRound: string;
    through: (providerLabel: string) => string;
    setupLink: string;
    enterThrough: (providerLabel: string) => string;
    joinLabels: (providerLabels: string[]) => string;
    linksWillAppear: (providerLabels: string) => string;
    linkWillAppear: (providerLabel: string) => string;
  };
  status: Record<JamStatus, string>;
  countdown: {
    status: string;
    untilStart: string;
    untilEnd: string;
    roundFinished: string;
    days: DurationForms;
  };
  theme: {
    pendingFallback: string;
    announcedDescription: (text: string) => string;
  };
  meta: {
    homeTitle: (monthLabel: string) => string;
    homeDescription: string;
    archiveTitle: string;
    archiveDescription: string;
    rulesTitle: string;
    rulesDescription: string;
    roundTitle: (monthLabel: string) => string;
    roundDescription: (monthLabel: string, themeDescription: string) => string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
  notFound: {
    eyebrow: string;
    titleLineOne: string;
    titleLineTwo: string;
    copy: string;
    homeLink: string;
  };
  rules: RulesTranslations;
  og: OgTranslations;
}
