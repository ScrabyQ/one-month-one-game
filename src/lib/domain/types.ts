export type ProviderId = "itch" | "myindie" | (string & {});

export type JamStatus = "upcoming" | "active" | "finished";

export type JamThemeState = "announced" | "pending";

export type JamDataMode = "live" | "demo";

export interface GameEntry {
  id: string;
  provider: ProviderId;
  providerEntryId?: string;
  providerGameId?: string;
  title: string;
  author: {
    name: string;
    id?: string;
    alias?: string;
    url?: string;
  };
  url: string;
  slug?: string;
  score?: number | null;
  coverUrl?: string;
  description?: string;
  submittedAt?: string;
  tags?: string[];
  platforms?: string[];
}

export interface GameSnapshot {
  roundId: string;
  syncedAt: string;
  games: GameEntry[];
}

export type ItchProviderConfig =
  | {
      type: "itch";
      enabled: true;
      jamId: number;
      jamUrl: string;
    }
  | {
      type: "itch";
      enabled: false;
      jamId: null;
      jamUrl: string;
    };

export type MyIndieProviderConfig = {
  type: "myindie";
  enabled: boolean;
  jamAlias: string;
  jamUrl: string;
};

// Add future provider-specific config variants here without changing UI models.
export type ProviderConfig = ItchProviderConfig | MyIndieProviderConfig;

export interface JamRound {
  id: string;
  slug: string;
  title: string;
  monthLabel: string;
  theme: string;
  themeState: JamThemeState;
  themeAnnouncement?: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  providers: ProviderConfig[];
  dataMode?: JamDataMode;
}
