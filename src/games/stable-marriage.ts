/**
 * The SM game class and supporting functions.
 */

import { stableMarriage } from '../algorithms/stable-marriage.js';
import { MatchingError } from '../errors.js';
import { SingleMatching } from '../matchings/single-matching.js';
import { Player } from '../players/player.js';
import type { SMOptimal } from '../types.js';

/**
 * Solver for the stable marriage problem (SM).
 */
export class StableMarriage {
  /** The suitors in the game */
  readonly suitors: Player[];

  /** The reviewers in the game */
  readonly reviewers: Player[];

  /** The matching result (after solve) */
  matching: SingleMatching | null = null;

  /** Blocking pairs found during stability check */
  blockingPairs: Array<[Player, Player]> | null = null;

  constructor(suitors: Player[], reviewers: Player[]) {
    // Deep copy all players
    const allPlayers = [...suitors, ...reviewers];
    const cloneMap = new Map<Player, Player>();

    for (const player of allPlayers) {
      cloneMap.set(player, new Player(player.name));
    }

    for (const player of allPlayers) {
      const clone = cloneMap.get(player)!;
      const clonedPrefs = player.prefs.map((p) => cloneMap.get(p)!);
      clone.setPrefs(clonedPrefs);
    }

    this.suitors = suitors.map((p) => cloneMap.get(p)!);
    this.reviewers = reviewers.map((p) => cloneMap.get(p)!);

    this.checkInputs();
  }

  /**
   * Create an instance of SM from two preference dictionaries.
   */
  static createFromDictionaries(
    suitorPrefs: Record<string, string[]>,
    reviewerPrefs: Record<string, string[]>
  ): StableMarriage {
    const [suitors, reviewers] = makePlayers(suitorPrefs, reviewerPrefs);
    return new StableMarriage(suitors, reviewers);
  }

  /**
   * Solve the instance of SM. Return the matching.
   * The party optimality can be controlled using the optimal parameter.
   */
  solve(optimal: SMOptimal = 'suitor'): SingleMatching {
    this.matching = new SingleMatching(
      stableMarriage(this.suitors, this.reviewers, optimal)
    );
    return this.matching;
  }

  /**
   * Check whether the current matching is valid.
   */
  checkValidity(): boolean {
    const unmatchedIssues = this.checkForUnmatchedPlayers();
    const notInMatchingIssues = this.checkForPlayersNotInMatching();
    const inconsistencyIssues = this.checkForInconsistentMatches();

    if (
      unmatchedIssues.length > 0 ||
      notInMatchingIssues.length > 0 ||
      inconsistencyIssues.length > 0
    ) {
      throw new MatchingError({
        unmatchedPlayers: unmatchedIssues,
        playersNotInMatching: notInMatchingIssues,
        inconsistentMatches: inconsistencyIssues,
      });
    }

    return true;
  }

  /**
   * Check for the existence of any blocking pairs.
   */
  checkStability(): boolean {
    const blockingPairs: Array<[Player, Player]> = [];

    for (const suitor of this.suitors) {
      for (const reviewer of this.reviewers) {
        if (
          suitor.matching &&
          reviewer.matching &&
          suitor.prefers(reviewer, suitor.matching) &&
          reviewer.prefers(suitor, reviewer.matching)
        ) {
          blockingPairs.push([suitor, reviewer]);
        }
      }
    }

    this.blockingPairs = blockingPairs;
    return blockingPairs.length === 0;
  }

  /**
   * Check that everyone has a match.
   */
  private checkForUnmatchedPlayers(): string[] {
    const issues: string[] = [];
    for (const player of [...this.suitors, ...this.reviewers]) {
      const issue = player.checkIfMatchIsUnacceptable(false);
      if (issue) {
        issues.push(issue);
      }
    }
    return issues;
  }

  /**
   * Check that everyone appears in the matching.
   */
  private checkForPlayersNotInMatching(): string[] {
    if (!this.matching) return [];

    const playersInMatching = new Set<Player>();
    for (const [key, value] of this.matching) {
      playersInMatching.add(key);
      if (value) playersInMatching.add(value);
    }

    const issues: string[] = [];
    for (const player of [...this.suitors, ...this.reviewers]) {
      if (!playersInMatching.has(player)) {
        issues.push(`${player} does not appear in matching.`);
      }
    }
    return issues;
  }

  /**
   * Check the matching is consistent with the players'.
   */
  private checkForInconsistentMatches(): string[] {
    if (!this.matching) return [];

    const issues: string[] = [];
    for (const [suitor, reviewer] of this.matching) {
      if (suitor.matching !== reviewer) {
        issues.push(
          `${suitor} is matched to ${suitor.matching} but the ` +
            `matching says they should be matched to ${reviewer}.`
        );
      }
    }
    return issues;
  }

  /**
   * Raise an error if any of the game's rules do not hold.
   */
  private checkInputs(): void {
    this.checkNumPlayers();
    for (const suitor of this.suitors) {
      this.checkPlayerRanks(suitor);
    }
    for (const reviewer of this.reviewers) {
      this.checkPlayerRanks(reviewer);
    }
  }

  /**
   * Check that the number of suitors and reviewers are equal.
   */
  private checkNumPlayers(): void {
    if (this.suitors.length !== this.reviewers.length) {
      throw new Error(
        'There must be an equal number of suitors and reviewers.'
      );
    }
  }

  /**
   * Check that a player has ranked all of the other group.
   */
  private checkPlayerRanks(player: Player): void {
    const others = this.suitors.includes(player)
      ? this.reviewers
      : this.suitors;
    const playerPrefSet = new Set(player.prefs);
    const othersSet = new Set(others);

    if (
      playerPrefSet.size !== othersSet.size ||
      ![...playerPrefSet].every((p) => othersSet.has(p))
    ) {
      throw new Error(
        `Every player must rank each name from the other group. ` +
          `${player}: ${player.prefs.map((p) => p.toString())} != ${others.map((p) => p.toString())}`
      );
    }
  }
}

/**
 * Make a set of suitors and reviewers from two dictionaries.
 */
function makePlayers(
  suitorPrefs: Record<string, string[]>,
  reviewerPrefs: Record<string, string[]>
): [Player[], Player[]] {
  const suitorDict = new Map<string, Player>();
  const reviewerDict = new Map<string, Player>();

  // Create Player instances
  for (const name of Object.keys(suitorPrefs)) {
    suitorDict.set(name, new Player(name));
  }
  for (const name of Object.keys(reviewerPrefs)) {
    reviewerDict.set(name, new Player(name));
  }

  // Set preferences
  for (const [name, suitor] of suitorDict) {
    const prefs = suitorPrefs[name]!.map((n) => reviewerDict.get(n)!);
    suitor.setPrefs(prefs);
  }
  for (const [name, reviewer] of reviewerDict) {
    const prefs = reviewerPrefs[name]!.map((n) => suitorDict.get(n)!);
    reviewer.setPrefs(prefs);
  }

  return [[...suitorDict.values()], [...reviewerDict.values()]];
}
