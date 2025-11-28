/**
 * The HR game class and supporting functions.
 */

import { hospitalResident } from '../algorithms/hospital-resident.js';
import {
  MatchingError,
  warnPlayerExcluded,
  warnPreferencesChanged,
} from '../errors.js';
import { MultipleMatching } from '../matchings/multiple-matching.js';
import { Hospital } from '../players/hospital.js';
import { Player } from '../players/player.js';
import type { GameOptions, HROptimal } from '../types.js';

/**
 * Solver for the hospital-resident assignment problem (HR).
 */
export class HospitalResident {
  /** The residents in the game */
  residents: Player[];

  /** The hospitals in the game */
  hospitals: Hospital[];

  /** Whether to clean invalid preferences */
  clean: boolean;

  /** The matching result (after solve) */
  matching: MultipleMatching | null = null;

  /** Blocking pairs found during stability check */
  blockingPairs: Array<[Player, Hospital]> | null = null;

  /** Original residents list */
  protected _allResidents: Player[];

  /** Original hospitals list */
  protected _allHospitals: Hospital[];

  constructor(residents: Player[], hospitals: Hospital[], options: GameOptions = {}) {
    const { clean = false } = options;

    // Deep copy all players
    const residentCloneMap = new Map<Player, Player>();
    const hospitalCloneMap = new Map<Hospital, Hospital>();

    for (const resident of residents) {
      residentCloneMap.set(resident, new Player(resident.name));
    }
    for (const hospital of hospitals) {
      hospitalCloneMap.set(hospital, new Hospital(hospital.name, hospital.capacity));
    }

    // Set preferences for residents
    for (const resident of residents) {
      const clone = residentCloneMap.get(resident)!;
      const clonedPrefs = resident.prefs.map(
        (p) => hospitalCloneMap.get(p as unknown as Hospital) as unknown as Player
      );
      clone.setPrefs(clonedPrefs);
    }

    // Set preferences for hospitals
    for (const hospital of hospitals) {
      const clone = hospitalCloneMap.get(hospital)!;
      const clonedPrefs = hospital.prefs.map((p) => residentCloneMap.get(p)!);
      clone.setPrefs(clonedPrefs);
    }

    this.residents = residents.map((r) => residentCloneMap.get(r)!);
    this.hospitals = hospitals.map((h) => hospitalCloneMap.get(h)!);
    this.clean = clean;

    this._allResidents = [...this.residents];
    this._allHospitals = [...this.hospitals];

    this.checkInputs();
  }

  /**
   * Create an instance from a set of dictionaries.
   */
  static createFromDictionaries(
    residentPrefs: Record<string, string[]>,
    hospitalPrefs: Record<string, string[]>,
    capacities: Record<string, number>,
    options: GameOptions = {}
  ): HospitalResident {
    const [residents, hospitals] = makePlayers(
      residentPrefs,
      hospitalPrefs,
      capacities
    );
    return new HospitalResident(residents, hospitals, options);
  }

  /**
   * Solve the instance of HR. Return the matching.
   */
  solve(optimal: HROptimal = 'resident'): MultipleMatching {
    this.matching = new MultipleMatching(
      hospitalResident(this.residents, this.hospitals, optimal)
    );
    return this.matching;
  }

  /**
   * Check whether the current matching is valid.
   */
  checkValidity(): boolean {
    const unacceptableIssues = [
      ...this.checkForUnacceptableMatches('residents'),
      ...this.checkForUnacceptableMatches('hospitals'),
    ];

    const oversubscribedIssues = this.checkForOversubscribedPlayers('hospitals');

    if (unacceptableIssues.length > 0 || oversubscribedIssues.length > 0) {
      throw new MatchingError({
        unacceptableMatches: unacceptableIssues,
        oversubscribedHospitals: oversubscribedIssues,
      });
    }

    return true;
  }

  /**
   * Check that no one in party has an unacceptable match.
   */
  protected checkForUnacceptableMatches(party: 'residents' | 'hospitals'): string[] {
    const issues: string[] = [];
    const players = party === 'residents' ? this.residents : this.hospitals;

    for (const player of players) {
      if (player instanceof Hospital) {
        const hospitalIssues = player.checkIfMatchIsUnacceptable();
        issues.push(...hospitalIssues);
      } else {
        const issue = player.checkIfMatchIsUnacceptable(true);
        if (issue) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }

  /**
   * Check that no player in party is over-subscribed.
   */
  protected checkForOversubscribedPlayers(_party: 'hospitals'): string[] {
    const issues: string[] = [];
    const players = this.hospitals;

    for (const player of players) {
      const issue = player.checkIfOversubscribed();
      if (issue) {
        issues.push(issue);
      }
    }

    return issues;
  }

  /**
   * Check for the existence of any blocking pairs.
   */
  checkStability(): boolean {
    const blockingPairs: Array<[Player, Hospital]> = [];

    for (const resident of this.residents) {
      for (const hospital of this.hospitals) {
        if (
          checkMutualPreference(resident, hospital) &&
          checkResidentUnhappy(resident, hospital) &&
          checkHospitalUnhappy(resident, hospital)
        ) {
          blockingPairs.push([resident, hospital]);
        }
      }
    }

    this.blockingPairs = blockingPairs;
    return blockingPairs.length === 0;
  }

  /**
   * Check if any rules of the game have been broken.
   */
  protected checkInputs(): void {
    this.checkInputsPlayerPrefsUnique('residents');
    this.checkInputsPlayerPrefsUnique('hospitals');

    this.checkInputsPlayerPrefsAllInParty('residents', 'hospitals');
    this.checkInputsPlayerPrefsAllInParty('hospitals', 'residents');

    this.checkInputsPlayerPrefsAllReciprocated('hospitals');
    this.checkInputsPlayerReciprocatedAllPrefs('hospitals', 'residents');

    this.checkInputsPlayerPrefsNonempty('residents', 'hospitals');
    this.checkInputsPlayerPrefsNonempty('hospitals', 'residents');

    this.checkInputsPlayerCapacity('hospitals', 'residents');
  }

  /**
   * Check that no one has ranked another player more than once.
   */
  protected checkInputsPlayerPrefsUnique(party: 'residents' | 'hospitals'): void {
    const players = party === 'residents' ? this.residents : this.hospitals;

    for (const player of players) {
      const uniquePrefs: Player[] = [];
      for (const other of player.prefs) {
        if (!uniquePrefs.includes(other)) {
          uniquePrefs.push(other);
        } else {
          warnPreferencesChanged(
            `${player} has ranked ${other} multiple times.`
          );
        }
      }

      if (this.clean) {
        player.setPrefs(uniquePrefs);
      }
    }
  }

  /**
   * Check that everyone has ranked a subset of the other party.
   */
  protected checkInputsPlayerPrefsAllInParty(
    party: 'residents' | 'hospitals',
    otherParty: 'residents' | 'hospitals'
  ): void {
    const players = party === 'residents' ? this.residents : this.hospitals;
    const others = otherParty === 'residents' ? this.residents : this.hospitals;

    for (const player of players) {
      for (const other of player.prefs) {
        if (!(others as Player[]).includes(other)) {
          warnPreferencesChanged(
            `${player} has ranked a non-${otherParty.slice(0, -1)}: ${other}.`
          );
          if (this.clean) {
            player._forget(other);
          }
        }
      }
    }
  }

  /**
   * Check everyone has only ranked players who ranked them.
   */
  protected checkInputsPlayerPrefsAllReciprocated(_party: 'hospitals'): void {
    for (const hospital of this.hospitals) {
      for (const other of hospital.prefs) {
        if (!other.prefs.includes(hospital as unknown as Player)) {
          warnPreferencesChanged(
            `${hospital} ranked ${other} but they did not.`
          );
          if (this.clean) {
            hospital._forget(other);
          }
        }
      }
    }
  }

  /**
   * Check everyone has ranked all the players who ranked them.
   */
  protected checkInputsPlayerReciprocatedAllPrefs(
    _party: 'hospitals',
    _otherParty: 'residents'
  ): void {
    for (const hospital of this.hospitals) {
      const residentsThatRanked = this.residents.filter((r) =>
        r.prefs.includes(hospital as unknown as Player)
      );

      for (const resident of residentsThatRanked) {
        if (!hospital.prefs.includes(resident)) {
          warnPreferencesChanged(
            `${resident} ranked ${hospital} but they did not.`
          );
          if (this.clean) {
            resident._forget(hospital as unknown as Player);
          }
        }
      }
    }
  }

  /**
   * Check that everyone has a nonempty preference list.
   */
  protected checkInputsPlayerPrefsNonempty(
    party: 'residents' | 'hospitals',
    otherParty: 'residents' | 'hospitals'
  ): void {
    const players = party === 'residents' ? this.residents : this.hospitals;

    for (const player of players) {
      if (player.prefs.length === 0) {
        warnPlayerExcluded(`${player} has an empty preference list.`);
        if (this.clean) {
          this.removePlayer(player, party, otherParty);
        }
      }
    }
  }

  /**
   * Check everyone has a capacity of at least one.
   */
  protected checkInputsPlayerCapacity(
    party: 'hospitals',
    otherParty: 'residents'
  ): void {
    for (const hospital of this.hospitals) {
      if (hospital.capacity < 1) {
        warnPlayerExcluded(`${hospital}`);
        if (this.clean) {
          this.removePlayer(hospital, party, otherParty);
        }
      }
    }
  }

  /**
   * Remove a player from the game.
   */
  protected removePlayer(
    player: Player | Hospital,
    playerParty: 'residents' | 'hospitals',
    otherParty: 'residents' | 'hospitals'
  ): void {
    if (playerParty === 'residents') {
      this.residents = this.residents.filter((p) => p !== player);
    } else {
      this.hospitals = this.hospitals.filter((p) => p !== player);
    }

    const others = otherParty === 'residents' ? this.residents : this.hospitals;
    for (const other of others) {
      if (other.prefs.includes(player as Player)) {
        other._forget(player as Player);
      }
    }
  }
}

/**
 * Check whether two players have a preference of each other.
 */
function checkMutualPreference(resident: Player, hospital: Hospital): boolean {
  return (
    hospital.prefs.includes(resident) &&
    resident.prefs.includes(hospital as unknown as Player)
  );
}

/**
 * Check whether a resident is unhappy given a hospital.
 */
function checkResidentUnhappy(resident: Player, hospital: Hospital): boolean {
  return (
    resident.matching === null ||
    resident.prefers(hospital as unknown as Player, resident.matching)
  );
}

/**
 * Check whether a hospital is unhappy given a resident.
 */
function checkHospitalUnhappy(resident: Player, hospital: Hospital): boolean {
  return (
    hospital.matching.length < hospital.capacity ||
    hospital.matching.some((match) => hospital.prefers(resident, match))
  );
}

/**
 * Make a set of residents and hospitals from the dictionaries.
 */
function makePlayers(
  residentPrefs: Record<string, string[]>,
  hospitalPrefs: Record<string, string[]>,
  capacities: Record<string, number>
): [Player[], Hospital[]] {
  const residentDict = new Map<string, Player>();
  const hospitalDict = new Map<string, Hospital>();

  // Create instances
  for (const name of Object.keys(residentPrefs)) {
    residentDict.set(name, new Player(name));
  }
  for (const name of Object.keys(hospitalPrefs)) {
    hospitalDict.set(name, new Hospital(name, capacities[name]!));
  }

  // Set preferences
  for (const [name, resident] of residentDict) {
    const prefs = residentPrefs[name]!.map(
      (n) => hospitalDict.get(n) as unknown as Player
    );
    resident.setPrefs(prefs);
  }
  for (const [name, hospital] of hospitalDict) {
    const prefs = hospitalPrefs[name]!.map((n) => residentDict.get(n)!);
    hospital.setPrefs(prefs);
  }

  return [[...residentDict.values()], [...hospitalDict.values()]];
}
