import { describe, it, expect } from '@jest/globals';
import { StudentAllocation } from '../../src/index.js';

describe('StudentAllocation', () => {
  describe('createFromDictionaries', () => {
    it('should create a game from dictionaries', () => {
      const studentPrefs = {
        A: ['P1', 'P2'],
        B: ['P2', 'P1'],
        C: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C'],
      };
      const projectSupervisors = {
        P1: 'S1',
        P2: 'S1',
      };
      const projectCapacities = { P1: 2, P2: 1 };
      const supervisorCapacities = { S1: 3 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      expect(game.students.length).toBe(3);
      expect(game.projects.length).toBe(2);
      expect(game.supervisors.length).toBe(1);
    });
  });

  describe('solve', () => {
    it('should find a student-optimal matching', () => {
      const studentPrefs = {
        A: ['P1', 'P2'],
        B: ['P2', 'P1'],
        C: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C'],
      };
      const projectSupervisors = {
        P1: 'S1',
        P2: 'S1',
      };
      const projectCapacities = { P1: 2, P2: 1 };
      const supervisorCapacities = { S1: 3 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      const matching = game.solve('student');
      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should find a supervisor-optimal matching', () => {
      const studentPrefs = {
        A: ['P1', 'P2'],
        B: ['P2', 'P1'],
        C: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C'],
      };
      const projectSupervisors = {
        P1: 'S1',
        P2: 'S1',
      };
      const projectCapacities = { P1: 2, P2: 1 };
      const supervisorCapacities = { S1: 3 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      const matching = game.solve('supervisor');
      expect(() => game.checkValidity()).not.toThrow();
    });

    it('should produce a stable matching', () => {
      const studentPrefs = {
        A: ['P1', 'P2'],
        B: ['P2', 'P1'],
        C: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C'],
      };
      const projectSupervisors = {
        P1: 'S1',
        P2: 'S1',
      };
      const projectCapacities = { P1: 2, P2: 1 };
      const supervisorCapacities = { S1: 3 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      game.solve();
      expect(game.checkStability()).toBe(true);
    });

    it('should respect project capacities', () => {
      const studentPrefs = {
        A: ['P1'],
        B: ['P1'],
        C: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C'],
      };
      const projectSupervisors = {
        P1: 'S1',
      };
      const projectCapacities = { P1: 2 };
      const supervisorCapacities = { S1: 3 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      game.solve();

      const project = game.projects[0]!;
      expect(project.matching.length).toBeLessThanOrEqual(project.capacity);
    });

    it('should respect supervisor capacities', () => {
      const studentPrefs = {
        A: ['P1'],
        B: ['P2'],
        C: ['P1'],
        D: ['P2'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B', 'C', 'D'],
      };
      const projectSupervisors = {
        P1: 'S1',
        P2: 'S1',
      };
      const projectCapacities = { P1: 2, P2: 2 };
      const supervisorCapacities = { S1: 2 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      game.solve();

      const supervisor = game.supervisors[0]!;
      expect(supervisor.matching.length).toBeLessThanOrEqual(supervisor.capacity);
    });
  });

  describe('toRecord', () => {
    it('should convert matching to a plain object', () => {
      const studentPrefs = {
        A: ['P1'],
        B: ['P1'],
      };
      const supervisorPrefs = {
        S1: ['A', 'B'],
      };
      const projectSupervisors = {
        P1: 'S1',
      };
      const projectCapacities = { P1: 2 };
      const supervisorCapacities = { S1: 2 };

      const game = StudentAllocation.createFromDictionaries(
        studentPrefs,
        supervisorPrefs,
        projectSupervisors,
        projectCapacities,
        supervisorCapacities
      );

      const matching = game.solve();
      const record = matching.toRecord();

      expect(typeof record).toBe('object');
      expect(Array.isArray(record['P1'])).toBe(true);
    });
  });
});
