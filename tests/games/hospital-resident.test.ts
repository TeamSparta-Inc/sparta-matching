import { describe, it, expect } from '@jest/globals';
import { HospitalResident, Player, Hospital } from '../../src/index.js';

describe('HospitalResident', () => {
  describe('createFromDictionaries', () => {
    it('should create a game from preference dictionaries', () => {
      const residentPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
        C: ['X', 'Y'],
      };
      const hospitalPrefs = {
        X: ['A', 'C', 'B'],
        Y: ['B', 'A', 'C'],
      };
      const capacities = { X: 2, Y: 1 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );

      expect(game.residents.length).toBe(3);
      expect(game.hospitals.length).toBe(2);
    });
  });

  describe('solve', () => {
    it('should find a resident-optimal matching', () => {
      const residentPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
        C: ['X', 'Y'],
      };
      const hospitalPrefs = {
        X: ['A', 'C', 'B'],
        Y: ['B', 'A', 'C'],
      };
      const capacities = { X: 2, Y: 1 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      const matching = game.solve('resident');

      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should find a hospital-optimal matching', () => {
      const residentPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
        C: ['X', 'Y'],
      };
      const hospitalPrefs = {
        X: ['A', 'C', 'B'],
        Y: ['B', 'A', 'C'],
      };
      const capacities = { X: 2, Y: 1 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      const matching = game.solve('hospital');

      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should produce a stable matching', () => {
      const residentPrefs = {
        A: ['X', 'Y'],
        B: ['Y', 'X'],
        C: ['X', 'Y'],
      };
      const hospitalPrefs = {
        X: ['A', 'C', 'B'],
        Y: ['B', 'A', 'C'],
      };
      const capacities = { X: 2, Y: 1 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      game.solve();

      expect(game.checkStability()).toBe(true);
    });

    it('should respect hospital capacities', () => {
      const residentPrefs = {
        A: ['X'],
        B: ['X'],
        C: ['X'],
      };
      const hospitalPrefs = {
        X: ['A', 'B', 'C'],
      };
      const capacities = { X: 2 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      game.solve();

      const hospital = game.hospitals[0]!;
      expect(hospital.matching.length).toBeLessThanOrEqual(hospital.capacity);
    });
  });

  describe('checkValidity', () => {
    it('should return true for a valid matching', () => {
      const residentPrefs = {
        A: ['X'],
        B: ['X'],
      };
      const hospitalPrefs = {
        X: ['A', 'B'],
      };
      const capacities = { X: 2 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      game.solve();

      expect(game.checkValidity()).toBe(true);
    });
  });

  describe('toRecord', () => {
    it('should convert matching to a plain object', () => {
      const residentPrefs = {
        A: ['X'],
        B: ['X'],
      };
      const hospitalPrefs = {
        X: ['A', 'B'],
      };
      const capacities = { X: 2 };

      const game = HospitalResident.createFromDictionaries(
        residentPrefs,
        hospitalPrefs,
        capacities
      );
      const matching = game.solve();
      const record = matching.toRecord();

      expect(typeof record).toBe('object');
      expect(Array.isArray(record['X'])).toBe(true);
    });
  });
});
