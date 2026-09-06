import type { ProviderId, ProviderRoundStats, RoundStats } from "../domain/types";
import type { ProviderJamStats } from "../providers/types";

type ProviderStatsRecord = ProviderJamStats | ProviderRoundStats;

export function aggregateProviderStats(
  providerStats: readonly ProviderStatsRecord[],
): RoundStats {
  const providers = providerStats.map((stats) => ({ ...stats }));
  const hasCompleteSubmissionCounts =
    providers.length > 0 && providers.every((stats) => stats.submissionsCount !== undefined);

  return {
    registrationsCount: providers.reduce(
      (total, stats) => total + stats.participantsCount,
      0,
    ),
    ...(hasCompleteSubmissionCounts
      ? {
          submissionsCount: providers.reduce(
            (total, stats) => total + (stats.submissionsCount ?? 0),
            0,
          ),
        }
      : {}),
    providers,
  };
}

export function mergeProviderStats(
  enabledProviders: readonly ProviderId[],
  freshStats: readonly ProviderJamStats[],
  cachedStats: readonly ProviderRoundStats[] = [],
): RoundStats | undefined {
  if (enabledProviders.length === 0) return undefined;

  const freshByProvider = new Map(freshStats.map((stats) => [stats.provider, stats]));
  const cachedByProvider = new Map(cachedStats.map((stats) => [stats.provider, stats]));
  const resolvedStats: ProviderStatsRecord[] = [];

  for (const provider of enabledProviders) {
    const stats = freshByProvider.get(provider) ?? cachedByProvider.get(provider);
    if (!stats) return undefined;
    resolvedStats.push(stats);
  }

  return aggregateProviderStats(resolvedStats);
}
