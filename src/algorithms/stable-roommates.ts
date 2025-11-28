/**
 * Functions for the SR algorithm (Irving's algorithm).
 */

import { warnNoStableMatching } from '../errors.js';
import { Player } from '../players/player.js';
import { deletePair } from './util.js';

/**
 * Make one-way proposals and forget unpreferable pairs.
 */
function firstPhase(players: Player[]): Player[] {
  const freePlayers = [...players];

  while (freePlayers.length > 0) {
    const player = freePlayers.pop()!;

    if (player.prefs.length === 0) {
      continue;
    }

    const favourite = player.getFavourite();

    const current = favourite.matching;
    if (current !== null) {
      favourite._unmatch();
      freePlayers.push(current);
    }

    favourite._match(player);

    for (const successor of favourite.getSuccessors()) {
      deletePair(successor, favourite);
      if (successor.prefs.length === 0 && freePlayers.includes(successor)) {
        const idx = freePlayers.indexOf(successor);
        freePlayers.splice(idx, 1);
      }
    }
  }

  return players;
}

/**
 * Locate a cycle of (least-preferable, second-choice) pairs.
 * Any such cycle will be removed from the game.
 */
function locateAllOrNothingCycle(player: Player): Array<[Player, Player]> {
  const lasts: Player[] = [player];
  const seconds: Player[] = [];

  let current = player;

  while (true) {
    const secondBest = current.prefs[1];
    if (!secondBest) {
      break;
    }

    const theirWorst = secondBest.prefs[secondBest.prefs.length - 1];
    if (!theirWorst) {
      break;
    }

    seconds.push(secondBest);
    lasts.push(theirWorst);

    current = theirWorst;

    // Check for cycle
    let count = 0;
    for (const p of lasts) {
      if (p === current) count++;
    }
    if (count > 1) {
      break;
    }
  }

  const idx = lasts.indexOf(current);
  const cycle: Array<[Player, Player]> = [];

  for (let i = idx + 1; i < lasts.length; i++) {
    cycle.push([lasts[i]!, seconds[i - 1]!]);
  }

  return cycle;
}

/**
 * Find the set of pairs to remove given an all-or-nothing cycle.
 *
 * Based on an all-or-nothing cycle (also referred to as a "rotation")
 * (x_1, y_1), ..., (x_n, y_n), for each i = 1, ..., n, one must delete
 * from the game all pairs (y_i, z) such that y_i prefers x_{i-1} to z
 * where subscripts are taken modulo n.
 */
function getPairsToDelete(cycle: Array<[Player, Player]>): Array<[Player, Player]> {
  const pairs: Array<[Player, Player]> = [];

  for (let i = 0; i < cycle.length; i++) {
    const right = cycle[i]![1];
    const leftIdx = (i - 1 + cycle.length) % cycle.length;
    const left = cycle[leftIdx]![0];

    const leftIdxInPrefs = right.prefs.indexOf(left);
    const successors = right.prefs.slice(leftIdxInPrefs + 1);

    for (const successor of successors) {
      const pair: [Player, Player] = [right, successor];
      const reversePair: [Player, Player] = [successor, right];

      // Check if pair or its reverse already exists
      const pairExists = pairs.some(
        (p) =>
          (p[0] === pair[0] && p[1] === pair[1]) ||
          (p[0] === reversePair[0] && p[1] === reversePair[1])
      );

      if (!pairExists) {
        pairs.push(pair);
      }
    }
  }

  return pairs;
}

/**
 * Locate and remove all-or-nothing cycles from the game.
 */
function secondPhase(players: Player[]): Player[] {
  // Find first player with more than one preference
  let player = players.find((p) => p.prefs.length > 1);

  while (player) {
    const cycle = locateAllOrNothingCycle(player);
    const pairs = getPairsToDelete(cycle);

    for (const [p, other] of pairs) {
      deletePair(p, other);
    }

    // Check if any player has empty preferences
    const emptyPlayers = players.filter((p) => p.prefs.length === 0);
    if (emptyPlayers.length > 0) {
      warnNoStableMatching(
        `The following players have emptied their preferences: ${emptyPlayers.map((p) => p.toString())}`
      );
      break;
    }

    // Find next player with more than one preference
    player = players.find((p) => p.prefs.length > 1);
  }

  // Final matching
  for (const p of players) {
    p._unmatch();
    if (p.prefs.length > 0) {
      p._match(p.getFavourite());
    }
  }

  return players;
}

/**
 * Irving's algorithm for finding a stable solution to SR.
 *
 * The algorithm finds stable solutions to instances of SR if one exists.
 * Otherwise, an incomplete matching is found (with null values).
 *
 * @param players - The players in the game. Each must rank all other players.
 * @returns A Map of matches where keys and values are both players.
 */
export function stableRoommates(players: Player[]): Map<Player, Player | null> {
  const processedPlayers = firstPhase(players);

  // Check for empty preferences after first phase
  const emptyPlayers = processedPlayers.filter((p) => p.prefs.length === 0);
  if (emptyPlayers.length > 0) {
    warnNoStableMatching(
      `The following players have been rejected by all others, ` +
        `emptying their preference list: ${emptyPlayers.map((p) => p.toString())}`
    );
  }

  // Only run second phase if there are players with multiple preferences
  if (processedPlayers.some((p) => p.prefs.length > 1)) {
    secondPhase(processedPlayers);
  }

  const result = new Map<Player, Player | null>();
  for (const player of players) {
    result.set(player, player.matching);
  }

  return result;
}
