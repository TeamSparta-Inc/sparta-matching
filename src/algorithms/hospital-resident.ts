/**
 * Functions for the HR algorithm.
 */

import { Hospital } from '../players/hospital.js';
import { Player } from '../players/player.js';
import { deletePair, matchPair } from './util.js';

/**
 * Unmatch a (resident, hospital) pair.
 */
function unmatchPair(resident: Player, hospital: Hospital): void {
  resident._unmatch();
  hospital._unmatch(resident);
}

/**
 * Check if a hospital is willing and able to take an applicant.
 */
function checkAvailable(hospital: Hospital): boolean {
  const hasCapacity = hospital.matching.length < hospital.capacity;
  const hasAvailableResidents =
    hospital.prefs.filter((p) => !hospital.matching.includes(p)).length > 0;
  return hasCapacity && hasAvailableResidents;
}

/**
 * Solve an instance of HR using an adapted Gale-Shapley algorithm.
 *
 * A unique, stable and optimal matching is found for the given set of
 * residents and hospitals. The optimality of the matching is found with
 * respect to one party and is subsequently the worst stable matching for the other.
 *
 * @param residents - The residents in the game.
 * @param hospitals - The hospitals in the game.
 * @param optimal - Which party the matching should be optimised for.
 * @returns A Map where keys are hospitals and values are their resident matches.
 */
export function hospitalResident(
  residents: Player[],
  hospitals: Hospital[],
  optimal: 'resident' | 'hospital' = 'resident'
): Map<Hospital, Player[]> {
  if (optimal === 'resident') {
    return residentOptimal(residents, hospitals);
  }
  return hospitalOptimal(hospitals);
}

/**
 * Solve the instance of HR to be resident-optimal.
 */
function residentOptimal(
  residents: Player[],
  hospitals: Hospital[]
): Map<Hospital, Player[]> {
  const freeResidents = [...residents];

  while (freeResidents.length > 0) {
    const resident = freeResidents.pop()!;

    if (resident.prefs.length === 0) {
      continue;
    }

    const hospital = resident.getFavourite() as unknown as Hospital;

    if (hospital.matching.length === hospital.capacity) {
      const worst = hospital.getWorstMatch()!;
      unmatchPair(worst, hospital);
      freeResidents.push(worst);
    }

    matchPair(resident, hospital as unknown as Player);

    if (hospital.matching.length === hospital.capacity) {
      const successors = hospital.getSuccessors();
      for (const successor of successors) {
        deletePair(hospital as unknown as Player, successor);
        if (successor.prefs.length === 0 && freeResidents.includes(successor)) {
          const idx = freeResidents.indexOf(successor);
          freeResidents.splice(idx, 1);
        }
      }
    }
  }

  const result = new Map<Hospital, Player[]>();
  for (const hospital of hospitals) {
    result.set(hospital, hospital.matching);
  }
  return result;
}

/**
 * Solve the instance of HR to be hospital-optimal.
 */
function hospitalOptimal(hospitals: Hospital[]): Map<Hospital, Player[]> {
  const freeHospitals = [...hospitals];

  while (freeHospitals.length > 0) {
    const hospital = freeHospitals.pop()!;
    const resident = hospital.getFavourite();

    if (!resident) {
      continue;
    }

    if (resident.matching) {
      const currentMatch = resident.matching as unknown as Hospital;
      unmatchPair(resident, currentMatch);
      if (!freeHospitals.includes(currentMatch)) {
        freeHospitals.push(currentMatch);
      }
    }

    matchPair(resident, hospital as unknown as Player);

    if (checkAvailable(hospital)) {
      freeHospitals.push(hospital);
    }

    const successors = resident.getSuccessors();
    for (const successor of successors) {
      deletePair(resident, successor);
      const successorHospital = successor as unknown as Hospital;
      if (
        !checkAvailable(successorHospital) &&
        freeHospitals.includes(successorHospital)
      ) {
        const idx = freeHospitals.indexOf(successorHospital);
        freeHospitals.splice(idx, 1);
      }
    }
  }

  const result = new Map<Hospital, Player[]>();
  for (const hospital of hospitals) {
    result.set(hospital, hospital.matching);
  }
  return result;
}
