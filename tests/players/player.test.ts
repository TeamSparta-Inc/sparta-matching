import { describe, it, expect, beforeEach } from '@jest/globals';
import { Player } from '../../src/index.js';

describe('Player', () => {
  let playerA: Player;
  let playerB: Player;
  let playerC: Player;

  beforeEach(() => {
    playerA = new Player('A');
    playerB = new Player('B');
    playerC = new Player('C');
  });

  describe('constructor', () => {
    it('should create a player with the given name', () => {
      expect(playerA.name).toBe('A');
    });

    it('should initialize with empty preferences', () => {
      expect(playerA.prefs).toEqual([]);
    });

    it('should initialize as unmatched', () => {
      expect(playerA.matching).toBeNull();
    });
  });

  describe('setPrefs', () => {
    it('should set preferences', () => {
      playerA.setPrefs([playerB, playerC]);
      expect(playerA.prefs).toEqual([playerB, playerC]);
    });

    it('should update _prefNames', () => {
      playerA.setPrefs([playerB, playerC]);
      expect(playerA._prefNames).toEqual(['B', 'C']);
    });

    it('should set _originalPrefs only once', () => {
      playerA.setPrefs([playerB, playerC]);
      playerA.setPrefs([playerC, playerB]);
      expect(playerA._originalPrefs).toEqual([playerB, playerC]);
    });
  });

  describe('prefers', () => {
    beforeEach(() => {
      playerA.setPrefs([playerB, playerC]);
    });

    it('should return true if player prefers first over second', () => {
      expect(playerA.prefers(playerB, playerC)).toBe(true);
    });

    it('should return false if player prefers second over first', () => {
      expect(playerA.prefers(playerC, playerB)).toBe(false);
    });
  });

  describe('_match', () => {
    it('should set matching', () => {
      playerA._match(playerB);
      expect(playerA.matching).toBe(playerB);
    });
  });

  describe('_unmatch', () => {
    it('should clear matching', () => {
      playerA._match(playerB);
      playerA._unmatch();
      expect(playerA.matching).toBeNull();
    });
  });

  describe('_forget', () => {
    it('should remove a player from preferences', () => {
      playerA.setPrefs([playerB, playerC]);
      playerA._forget(playerB);
      expect(playerA.prefs).toEqual([playerC]);
    });
  });

  describe('getFavourite', () => {
    it('should return the first preference', () => {
      playerA.setPrefs([playerB, playerC]);
      expect(playerA.getFavourite()).toBe(playerB);
    });
  });

  describe('getSuccessors', () => {
    it('should return players after current match', () => {
      playerA.setPrefs([playerB, playerC]);
      playerA._match(playerB);
      expect(playerA.getSuccessors()).toEqual([playerC]);
    });
  });

  describe('checkIfMatchIsUnacceptable', () => {
    it('should return null for acceptable match', () => {
      playerA.setPrefs([playerB]);
      playerA._match(playerB);
      expect(playerA.checkIfMatchIsUnacceptable()).toBeNull();
    });

    it('should return message for unmatched player when not okay', () => {
      const result = playerA.checkIfMatchIsUnacceptable(false);
      expect(result).toContain('unmatched');
    });

    it('should return null for unmatched player when okay', () => {
      expect(playerA.checkIfMatchIsUnacceptable(true)).toBeNull();
    });

    it('should return message for match not in preferences', () => {
      playerA.setPrefs([playerB]);
      playerA._match(playerC);
      const result = playerA.checkIfMatchIsUnacceptable();
      expect(result).toContain('do not appear');
    });
  });

  describe('toString', () => {
    it('should return the name as string', () => {
      expect(playerA.toString()).toBe('A');
    });
  });
});
