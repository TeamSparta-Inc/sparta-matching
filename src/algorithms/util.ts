/**
 * Useful functions for the running of the various core algorithms.
 */

import type { Player } from '../players/player.js';

/**
 * Make a player forget another (and vice versa), deleting the pair from
 * further consideration in the game.
 */
export function deletePair(player: Player, other: Player): void {
  player._forget(other);
  other._forget(player);
}

/**
 * Match the players given by `player` and `other`.
 */
export function matchPair(player: Player, other: Player): void {
  player._match(other);
  other._match(player);
}
