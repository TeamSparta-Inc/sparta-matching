/**
 * Custom error and warning classes for the matching library.
 */

/**
 * Base error class for matching-related errors.
 */
export class MatchingError extends Error {
  readonly details: Record<string, unknown>;

  constructor(details: Record<string, unknown>) {
    const message = Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('; ');
    super(message);
    this.name = 'MatchingError';
    this.details = details;
  }
}

/**
 * Warning messages logged to console.
 * We use console.warn since JavaScript doesn't have a warnings system like Python.
 */
export function warnNoStableMatching(message: string): void {
  console.warn(`[NoStableMatchingWarning] ${message}`);
}

export function warnPreferencesChanged(message: string): void {
  console.warn(`[PreferencesChangedWarning] ${message}`);
}

export function warnCapacityChanged(message: string): void {
  console.warn(`[CapacityChangedWarning] ${message}`);
}

export function warnPlayerExcluded(message: string): void {
  console.warn(`[PlayerExcludedWarning] ${message}`);
}
