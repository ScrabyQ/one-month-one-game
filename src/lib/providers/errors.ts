export class ProviderError extends Error {
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(message: string, options: { retryable?: boolean; cause?: unknown } = {}) {
    super(message);
    this.name = "ProviderError";
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderResponseError extends ProviderError {
  constructor(
    message: string,
    options: { retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message, options);
    this.name = "ProviderResponseError";
  }
}
