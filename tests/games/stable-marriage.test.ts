import { describe, it, expect } from '@jest/globals';
import { StableMarriage, Player } from '../../src/index.js';

describe('StableMarriage', () => {
  describe('createFromDictionaries', () => {
    it('should create a game from preference dictionaries', () => {
      const suitorPrefs = {
        A: ['X', 'Y', 'Z'],
        B: ['Y', 'X', 'Z'],
        C: ['Y', 'Z', 'X'],
      };
      const reviewerPrefs = {
        X: ['B', 'A', 'C'],
        Y: ['A', 'B', 'C'],
        Z: ['A', 'B', 'C'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);

      expect(game.suitors.length).toBe(3);
      expect(game.reviewers.length).toBe(3);
    });
  });

  describe('solve', () => {
    it('should find a suitor-optimal matching', () => {
      const suitorPrefs = {
        A: ['X', 'Y', 'Z'],
        B: ['Y', 'X', 'Z'],
        C: ['Y', 'Z', 'X'],
      };
      const reviewerPrefs = {
        X: ['B', 'A', 'C'],
        Y: ['A', 'B', 'C'],
        Z: ['A', 'B', 'C'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      const matching = game.solve('suitor');

      // Each suitor should have a match
      for (const suitor of game.suitors) {
        expect(suitor.matching).not.toBeNull();
      }

      // The matching should be valid
      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should find a reviewer-optimal matching', () => {
      const suitorPrefs = {
        A: ['X', 'Y', 'Z'],
        B: ['Y', 'X', 'Z'],
        C: ['Y', 'Z', 'X'],
      };
      const reviewerPrefs = {
        X: ['B', 'A', 'C'],
        Y: ['A', 'B', 'C'],
        Z: ['A', 'B', 'C'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      const matching = game.solve('reviewer');

      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should produce a stable matching', () => {
      const suitorPrefs = {
        A: ['X', 'Y', 'Z'],
        B: ['Y', 'X', 'Z'],
        C: ['Y', 'Z', 'X'],
      };
      const reviewerPrefs = {
        X: ['B', 'A', 'C'],
        Y: ['A', 'B', 'C'],
        Z: ['A', 'B', 'C'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      game.solve();

      expect(game.checkStability()).toBe(true);
      expect(game.blockingPairs).toEqual([]);
    });
  });

  describe('checkValidity', () => {
    it('should return true for a valid matching', () => {
      const suitorPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
      };
      const reviewerPrefs = {
        X: ['A', 'B'],
        Y: ['B', 'A'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      game.solve();

      expect(game.checkValidity()).toBe(true);
    });
  });

  describe('checkStability', () => {
    it('should detect blocking pairs in unstable matchings', () => {
      const suitorPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
      };
      const reviewerPrefs = {
        X: ['A', 'B'],
        Y: ['B', 'A'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      game.solve();

      const isStable = game.checkStability();
      expect(isStable).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should throw an error if number of suitors and reviewers differ', () => {
      const suitor = new Player('A');
      const reviewer1 = new Player('X');
      const reviewer2 = new Player('Y');

      suitor.setPrefs([reviewer1, reviewer2]);
      reviewer1.setPrefs([suitor]);
      reviewer2.setPrefs([suitor]);

      expect(() => new StableMarriage([suitor], [reviewer1, reviewer2])).toThrow();
    });

    it('should throw an error if a player has not ranked all others', () => {
      const suitor1 = new Player('A');
      const suitor2 = new Player('B');
      const reviewer1 = new Player('X');
      const reviewer2 = new Player('Y');

      // A only ranks X, not Y
      suitor1.setPrefs([reviewer1]);
      suitor2.setPrefs([reviewer1, reviewer2]);
      reviewer1.setPrefs([suitor1, suitor2]);
      reviewer2.setPrefs([suitor1, suitor2]);

      expect(() => new StableMarriage([suitor1, suitor2], [reviewer1, reviewer2])).toThrow();
    });
  });

  describe('toRecord', () => {
    it('should convert matching to a plain object', () => {
      const suitorPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
      };
      const reviewerPrefs = {
        X: ['A', 'B'],
        Y: ['B', 'A'],
      };

      const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
      const matching = game.solve();
      const record = matching.toRecord();

      expect(typeof record).toBe('object');
      expect(Object.keys(record).length).toBe(2);
    });
  });
});
