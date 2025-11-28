/**
 * SingleMatching class for games with singular matches like SM or SR.
 */

import { Player } from '../players/player.js';

/**
 * Matching class for games with singular matches like SM or SR.
 * Behaves like a Map with additional helper methods.
 */
export class SingleMatching {
  private _data: Map<Player, Player | null>;

  constructor(dictionary: Map<Player, Player | null>) {
    this._data = new Map();

    for (const [key, value] of dictionary) {
      this._data.set(key, value);
    }
  }

  /**
   * Get a player's match.
   */
  get(player: Player): Player | null | undefined {
    return this._data.get(player);
  }

  /**
   * Check if a player is in the matching.
   */
  has(player: Player): boolean {
    return this._data.has(player);
  }

  /**
   * Set a player's match and update bidirectional consistency.
   */
  set(player: Player, newMatch: Player | null): void {
    if (!this._data.has(player)) {
      throw new Error(`${player} is not a key in this matching.`);
    }

    player.matching = newMatch;
    if (newMatch !== null) {
      newMatch.matching = player;
    }

    this._data.set(player, newMatch);
  }

  /**
   * Get all keys (players on one side).
   */
  keys(): IterableIterator<Player> {
    return this._data.keys();
  }

  /**
   * Get all values (matches).
   */
  values(): IterableIterator<Player | null> {
    return this._data.values();
  }

  /**
   * Get all entries.
   */
  entries(): IterableIterator<[Player, Player | null]> {
    return this._data.entries();
  }

  /**
   * Iterate over the matching.
   */
  [Symbol.iterator](): IterableIterator<[Player, Player | null]> {
    return this._data.entries();
  }

  /**
   * Get the number of entries.
   */
  get size(): number {
    return this._data.size;
  }

  /**
   * Convert to a plain object with string keys.
   */
  toRecord(): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const [key, value] of this._data) {
      result[String(key.name)] = value ? String(value.name) : null;
    }
    return result;
  }

  /**
   * Convert to JSON.
   */
  toJSON(): Record<string, string | null> {
    return this.toRecord();
  }

  toString(): string {
    return JSON.stringify(this.toRecord());
  }
}
