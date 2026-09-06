import type {
  GameEntry,
  ProviderConfig,
  ProviderId,
} from "../domain/types";
import type { ProviderError } from "./errors";

export interface ProviderFetchOptions {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface ProviderJamStats {
  provider: ProviderId;
  participantsCount: number;
  submissionsCount?: number;
}

export interface ProviderRoundData {
  entries: GameEntry[];
  stats?: ProviderJamStats;
  statsError?: ProviderError;
}

export interface ProviderMeta {
  label: string;
  badgeLabel: string;
}

export interface GameProvider<TConfig extends ProviderConfig = ProviderConfig> {
  readonly id: ProviderId;
  fetchEntries(
    config: TConfig,
    options?: ProviderFetchOptions,
  ): Promise<GameEntry[]>;
  fetchJamStats?(
    config: TConfig,
    options?: ProviderFetchOptions,
  ): Promise<ProviderJamStats>;
  fetchRoundData?(
    config: TConfig,
    options?: ProviderFetchOptions,
  ): Promise<ProviderRoundData>;
  getParticipationUrl?(config: TConfig): string | undefined;
}
