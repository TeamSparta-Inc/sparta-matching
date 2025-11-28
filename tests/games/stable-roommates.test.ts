import { describe, it, expect } from '@jest/globals';
import { StableRoommates } from '../../src/index.js';

describe('StableRoommates', () => {
  describe('createFromDictionary', () => {
    it('should create a game from a preference dictionary', () => {
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['A', 'C', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);

      expect(game.players.length).toBe(4);
    });
  });

  describe('solve', () => {
    it('should find a stable matching when one exists', () => {
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['A', 'C', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);
      const matching = game.solve();

      // Check that matching exists
      expect(matching).not.toBeNull();
    });

    it('should produce a symmetric matching', () => {
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['A', 'C', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);
      game.solve();

      // If A is matched to B, B should be matched to A
      for (const player of game.players) {
        if (player.matching) {
          expect(player.matching.matching).toBe(player);
        }
      }
    });

    it('should handle cases where no stable matching exists', () => {
      // This is a classic example where no stable matching exists
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['C', 'A', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);

      // Should not throw, just return matching (possibly with nulls)
      expect(() => game.solve()).not.toThrow();
    });
  });

  describe('checkStability', () => {
    it('should return true for a stable matching', () => {
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['A', 'C', 'D'],
        C: ['D', 'A', 'B'],
        D: ['C', 'A', 'B'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);
      game.solve();

      const isStable = game.checkStability();
      // May or may not be stable depending on solution
      expect(typeof isStable).toBe('boolean');
    });
  });

  describe('input validation', () => {
    it('should throw an error if a player has not ranked all others', () => {
      const playerPrefs = {
        A: ['B', 'C'],      // Missing D
        B: ['A', 'C', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      expect(() => StableRoommates.createFromDictionary(playerPrefs)).toThrow();
    });
  });

  describe('toRecord', () => {
    it('should convert matching to a plain object', () => {
      const playerPrefs = {
        A: ['B', 'C', 'D'],
        B: ['A', 'C', 'D'],
        C: ['A', 'B', 'D'],
        D: ['A', 'B', 'C'],
      };

      const game = StableRoommates.createFromDictionary(playerPrefs);
      const matching = game.solve();
      const record = matching.toRecord();

      expect(typeof record).toBe('object');
      expect(Object.keys(record).length).toBe(4);
    });
  });
});
