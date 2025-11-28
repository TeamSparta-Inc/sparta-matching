/**
 * The base Player class for use in various games.
 */

import type { PlayerName } from '../types.js';

/**
 * Generic single-match player class for instances of SM or SR.
 * This class is also used for residents in HR and students in SA.
 */
export class Player {
  readonly name: PlayerName;

  /** The player's current preferences */
  prefs: Player[] = [];

  /** The player's current match */
  matching: Player | null = null;

  /** List of preference names for quick lookup */
  _prefNames: PlayerName[] = [];

  /** Original preferences (immutable after first set) */
  _originalPrefs: Player[] | null = null;

  constructor(name: PlayerName) {
    this.name = name;
  }

  toString(): string {
    return String(this.name);
  }

  /**
   * Remove another player from this player's preference list.
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
   * Set the player's preferences to be a list of players.
   */
  setPrefs(players: Player[]): void {
    this.prefs = players;
    this._prefNames = players.map((p) => p.name);

    if (this._originalPrefs === null) {
      this._originalPrefs = [...players];
    }
  }

  /**
   * Determines whether the player prefers a player over some other player.
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
   * Assign the player to be matched to some other player.
   */
  _match(other: Player): void {
    this.matching = other;
  }

  /**
   * Set the player to be unmatched.
   */
  _unmatch(): void {
    this.matching = null;
  }

  /**
   * Get the player's favourite player.
   */
  getFavourite(): Player {
    return this.prefs[0]!;
  }

  /**
   * Get all the successors to the current match of the player.
   */
  getSuccessors(): Player[] {
    if (!this.matching) {
      return [];
    }
    const idx = this.prefs.indexOf(this.matching);
    return this.prefs.slice(idx + 1);
  }

  /**
   * Check the acceptability of the current match.
   * In some games, a player being unmatched does not invalidate the game.
   */
  checkIfMatchIsUnacceptable(unmatchedOkay = false): string | null {
    const other = this.matching;

    if (other === null && !unmatchedOkay) {
      return this.unmatchedMessage();
    }

    if (other !== null && !this.prefs.includes(other)) {
      return this.notInPreferencesMessage(other);
    }

    return null;
  }
}
