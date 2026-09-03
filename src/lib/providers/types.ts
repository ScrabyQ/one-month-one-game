import type {
  GameEntry,
  ProviderConfig,
  ProviderId,
} from "../domain/types";

export interface ProviderFetchOptions {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
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
  getParticipationUrl?(config: TConfig): string | undefined;
}
