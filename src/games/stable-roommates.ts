/**
 * The SR game class and supporting functions.
 */

import { stableRoommates } from '../algorithms/stable-roommates.js';
import { MatchingError } from '../errors.js';
import { SingleMatching } from '../matchings/single-matching.js';
import { Player } from '../players/player.js';

/**
 * Solver for the stable roommates problem (SR).
 */
export class StableRoommates {
  /** The players in the game */
  readonly players: Player[];

  /** The matching result (after solve) */
  matching: SingleMatching | null = null;

  /** Blocking pairs found during stability check */
  blockingPairs: Array<[Player, Player]> | null = null;

  constructor(players: Player[]) {
    // Deep copy players
    const cloneMap = new Map<Player, Player>();

    for (const player of players) {
      cloneMap.set(player, new Player(player.name));
    }

    for (const player of players) {
      const clone = cloneMap.get(player)!;
      const clonedPrefs = player.prefs.map((p) => cloneMap.get(p)!);
      clone.setPrefs(clonedPrefs);
    }

    this.players = players.map((p) => cloneMap.get(p)!);

    this.checkInputs();
  }

  /**
   * Create an instance of SR from a preference dictionary.
   */
  static createFromDictionary(
    playerPrefs: Record<string, string[]>
  ): StableRoommates {
    const players = makePlayers(playerPrefs);
    return new StableRoommates(players);
  }

  /**
   * Attempt to solve the instance of SR. Return the matching.
   * Note: SR may not have a stable solution, in which case
   * some players will have null matches.
   */
  solve(): SingleMatching {
    this.matching = new SingleMatching(stableRoommates(this.players));
    return this.matching;
  }

  /**
   * Check whether the current matching is valid.
   */
  checkValidity(): boolean {
    const issues: string[] = [];

    for (const player of this.players) {
      const issue = player.checkIfMatchIsUnacceptable(false);
      if (issue) {
        issues.push(issue);
      }
    }

    if (issues.length > 0) {
      throw new MatchingError({ unmatchedPlayers: issues });
    }

    return true;
  }

  /**
   * Check for the stability of the current matching.
   * SR stability requires there to be no blocking pairs and all players to be matched.
   */
  checkStability(): boolean {
    if (!this.matching) {
      return false;
    }

    // Check if any player is unmatched
    for (const match of this.matching.values()) {
      if (match === null) {
        return false;
      }
    }

    const blockingPairs: Array<[Player, Player]> = [];

    for (const player of this.players) {
      const others = this.players.filter((p) => p !== player);

      for (const other of others) {
        // Skip if we already recorded this pair
        if (blockingPairs.some((pair) => pair[0] === other && pair[1] === player)) {
          continue;
        }

        const bothMatched = player.matching !== null && other.matching !== null;

        if (bothMatched) {
          const preferEachOther =
            player.prefers(other, player.matching!) &&
            other.prefers(player, other.matching!);

          if (preferEachOther) {
            blockingPairs.push([player, other]);
          }
        }
      }
    }

    this.blockingPairs = blockingPairs;
    return blockingPairs.length === 0;
  }

  /**
   * Check that all players have ranked all other players.
   */
  private checkInputs(): void {
    for (const player of this.players) {
      const others = new Set(this.players.filter((p) => p !== player));
      const prefSet = new Set(player.prefs);

      if (
        prefSet.size !== others.size ||
        ![...prefSet].every((p) => others.has(p))
      ) {
        throw new Error(
          `Every player must rank all other players. ${player}: ` +
            `${player.prefs.map((p) => p.toString())} is not a permutation of ` +
            `${[...others].map((p) => p.toString())}`
        );
      }
    }
  }
}

/**
 * Make a set of Player instances from the dictionary.
 */
function makePlayers(playerPrefs: Record<string, string[]>): Player[] {
  const playerDict = new Map<string, Player>();

  // Create Player instances
  for (const name of Object.keys(playerPrefs)) {
    playerDict.set(name, new Player(name));
  }

  // Set preferences
  for (const [name, player] of playerDict) {
    const prefs = playerPrefs[name]!.map((n) => playerDict.get(n)!);
    player.setPrefs(prefs);
  }

  return [...playerDict.values()];
}
