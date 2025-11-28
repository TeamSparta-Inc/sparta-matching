/**
 * The Hospital class for use in instances of HR.
 */

import type { PlayerName } from '../types.js';
import { Player } from './player.js';

/**
 * Hospital player class for instances of HR.
 * A hospital can take multiple simultaneous matches and has a capacity.
 * The classes for projects and supervisors in SA inherit from this class.
 */
export class Hospital {
  readonly name: PlayerName;

  /** Maximum number of matches */
  capacity: number;

  /** Original capacity value */
  _originalCapacity: number;

  /** The hospital's current preferences */
  prefs: Player[] = [];

  /** List of preference names */
  _prefNames: PlayerName[] = [];

  /** Original preferences */
  _originalPrefs: Player[] | null = null;

  /** Current matches */
  matching: Player[] = [];

  constructor(name: PlayerName, capacity: number) {
    this.name = name;
    this.capacity = capacity;
    this._originalCapacity = capacity;
  }

  toString(): string {
    return String(this.name);
  }

  /**
   * Remove a player from the hospital's preference list.
   */
  _forget(other: Player): void {
    this.prefs = this.prefs.filter((p) => p !== other);
  }

  /**
   * Message to say the player is not matched.
   */
  unmatchedMessage(): string {
    return `${this} is unmatched.`;
  }

  /**
   * Message to say another player is an unacceptable match.
   */
  notInPreferencesMessage(other: Player): string {
    return (
      `${this} is matched to ${other} but they do not appear in their ` +
      `preference list: ${this.prefs.map((p) => p.toString())}.`
    );
  }

  /**
   * Message to say the hospital has too many matches.
   */
  oversubscribedMessage(): string {
    return (
      `${this} is matched to ${this.matching.map((p) => p.toString())} which is over their ` +
      `capacity of ${this.capacity}.`
    );
  }

  /**
   * Set the hospital's preferences.
   */
  setPrefs(players: Player[]): void {
    this.prefs = players;
    this._prefNames = players.map((p) => p.name);

    if (this._originalPrefs === null) {
      this._originalPrefs = [...players];
    }
  }

  /**
   * Determines whether the hospital prefers a player over some other player.
   */
  prefers(player: Player, other: Player): boolean {
    const prefs = this._originalPrefs;
    if (!prefs) {
      throw new Error('Preferences not set');
    }
    const playerIdx = prefs.indexOf(player);
    const otherIdx = prefs.indexOf(other);
    return playerIdx < otherIdx;
  }

  /**
   * Add resident to the hospital's matching, and then sort it.
   */
  _match(resident: Player): void {
    this.matching.push(resident);
    this.matching.sort((a, b) => this.prefs.indexOf(a) - this.prefs.indexOf(b));
  }

  /**
   * Remove resident from the hospital's matching.
   */
  _unmatch(resident: Player): void {
    this.matching = this.matching.filter((p) => p !== resident);
  }

  /**
   * Get the hospital's favourite resident outside their matching.
   * If no such resident exists, return null.
   */
  getFavourite(): Player | null {
    for (const player of this.prefs) {
      if (!this.matching.includes(player)) {
        return player;
      }
    }
    return null;
  }

  /**
   * Get the player's worst current match.
   * This method assumes that the hospital's matching is in order of their preference list.
   */
  getWorstMatch(): Player | null {
    if (this.matching.length === 0) {
      return null;
    }
    return this.matching[this.matching.length - 1]!;
  }

  /**
   * Get the successors to the player's worst current match.
   */
  getSuccessors(): Player[] {
    const worst = this.getWorstMatch();
    if (!worst) {
      return [];
    }
    const idx = this.prefs.indexOf(worst);
    return this.prefs.slice(idx + 1);
  }

  /**
   * Check the acceptability of the current matches.
   */
  checkIfMatchIsUnacceptable(): string[] {
    const issues: string[] = [];
    for (const other of this.matching) {
      if (!this.prefs.includes(other)) {
        issues.push(this.notInPreferencesMessage(other));
      }
    }
    return issues;
  }

  /**
   * Check whether the player has too many matches.
   */
  checkIfOversubscribed(): string | false {
    if (this.matching.length > this.capacity) {
      return this.oversubscribedMessage();
    }
    return false;
  }
}
