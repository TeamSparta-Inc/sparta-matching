/**
 * Functions for the SM algorithm.
 */

import { Player } from '../players/player.js';
import { deletePair, matchPair } from './util.js';

/**
 * Unmatch a (suitor, reviewer) pair.
 */
function unmatchPair(suitor: Player, reviewer: Player): void {
  suitor._unmatch();
  reviewer._unmatch();
}

/**
 * An extended version of the original Gale-Shapley algorithm.
 *
 * This version makes use of the inherent structures of SM instances. A
 * unique, stable and optimal matching is found for any valid set of
 * suitors and reviewers. The optimality of the matching is with
 * respect to one party and is subsequently the worst stable matching
 * for the other.
 *
 * @param suitors - The suitors in the game. Each must rank all reviewers.
 * @param reviewers - The reviewers in the game. Each must rank all suitors.
 * @param optimal - Which party the matching should be optimised for.
 * @returns A Map where the keys are suitors, and the values are their match in reviewers.
 */
export function stableMarriage(
  suitors: Player[],
  reviewers: Player[],
  optimal: 'suitor' | 'reviewer' = 'suitor'
): Map<Player, Player | null> {
  let proposers = suitors;

  if (optimal.toLowerCase() === 'reviewer') {
    proposers = reviewers;
  }

  const freeSuitors = [...proposers];

  while (freeSuitors.length > 0) {
    const suitor = freeSuitors.pop()!;
    const reviewer = suitor.getFavourite();

    if (reviewer.matching) {
      const currentMatch = reviewer.matching;
      unmatchPair(currentMatch, reviewer);
      freeSuitors.push(currentMatch);
    }

    matchPair(suitor, reviewer);

    const successors = reviewer.getSuccessors();
    for (const successor of successors) {
      deletePair(successor, reviewer);
    }
  }

  // Build result map using original suitors
  const result = new Map<Player, Player | null>();
  for (const s of suitors) {
    result.set(s, s.matching);
  }

  return result;
}
