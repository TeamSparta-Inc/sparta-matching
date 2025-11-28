/**
 * MultipleMatching class for games with multiple matches like HR or SA.
 */

import { Hospital } from '../players/hospital.js';
import { Player } from '../players/player.js';

/**
 * Matching class for games with multiple matches like HR or SA.
 * Behaves like a Map with additional helper methods.
 */
export class MultipleMatching {
  private _data: Map<Hospital, Player[]>;

  constructor(dictionary: Map<Hospital, Player[]>) {
    this._data = new Map();

    for (const [key, value] of dictionary) {
      this._data.set(key, value);
    }
  }

  /**
   * Get a hospital's matches.
   */
  get(hospital: Hospital): Player[] | undefined {
    return this._data.get(hospital);
  }

  /**
   * Check if a hospital is in the matching.
   */
  has(hospital: Hospital): boolean {
    return this._data.has(hospital);
  }

  /**
   * Set a hospital's matches and update bidirectional consistency.
   */
  set(hospital: Hospital, newMatches: Player[]): void {
    if (!this._data.has(hospital)) {
      throw new Error(`${hospital} is not a key in this matching.`);
    }

    hospital.matching = newMatches;
    for (const player of newMatches) {
      player.matching = hospital as unknown as Player;
    }

    this._data.set(hospital, newMatches);
  }

  /**
   * Get all keys (hospitals).
   */
  keys(): IterableIterator<Hospital> {
    return this._data.keys();
  }

  /**
   * Get all values (lists of residents).
   */
  values(): IterableIterator<Player[]> {
    return this._data.values();
  }

  /**
   * Get all entries.
   */
  entries(): IterableIterator<[Hospital, Player[]]> {
    return this._data.entries();
  }

  /**
   * Iterate over the matching.
   */
  [Symbol.iterator](): IterableIterator<[Hospital, Player[]]> {
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
  toRecord(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [key, value] of this._data) {
      result[String(key.name)] = value.map((p) => String(p.name));
    }
    return result;
  }

  /**
   * Convert to JSON.
   */
  toJSON(): Record<string, string[]> {
    return this.toRecord();
  }

  toString(): string {
    return JSON.stringify(this.toRecord());
  }
}
