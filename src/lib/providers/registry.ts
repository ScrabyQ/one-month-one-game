import type { ProviderConfig, ProviderId } from "../domain/types";
import { ItchProvider } from "./itch/itch-provider";
import type { GameProvider, ProviderMeta } from "./types";

interface RegisteredProvider {
  adapter: GameProvider<ProviderConfig>;
  meta: ProviderMeta;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, RegisteredProvider>();

  register(adapter: GameProvider<ProviderConfig>, meta: ProviderMeta): void {
    if (this.providers.has(adapter.id)) {
      throw new Error(`Provider ${adapter.id} is already registered`);
    }
    this.providers.set(adapter.id, { adapter, meta });
  }

  get(providerId: ProviderId): GameProvider<ProviderConfig> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`No provider registered for ${providerId}`);
    return provider.adapter;
  }

  getMeta(providerId: ProviderId): ProviderMeta {
    return (
      this.providers.get(providerId)?.meta ?? {
        label: providerId,
        badgeLabel: providerId.toUpperCase(),
      }
    );
  }

  getParticipationUrl(config: ProviderConfig): string | undefined {
    const provider = this.get(config.type);
    return provider.getParticipationUrl?.(config);
  }
}

export const providerRegistry = new ProviderRegistry();

providerRegistry.register(new ItchProvider(), {
  label: "itch.io",
  badgeLabel: "ITCH.IO",
});
