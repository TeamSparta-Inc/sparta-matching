/**
 * sparta-matching - Matching algorithms for stable marriage, hospital-resident,
 * stable roommates, and student allocation problems.
 *
 * TypeScript port of the Python `matching` library.
 *
 * @packageDocumentation
 */

// Players
export { Player } from './players/player.js';
export { Hospital } from './players/hospital.js';
export { Project } from './players/project.js';
export { Supervisor } from './players/supervisor.js';

// Matchings
export { SingleMatching } from './matchings/single-matching.js';
export { MultipleMatching } from './matchings/multiple-matching.js';

// Games
export { StableMarriage } from './games/stable-marriage.js';
export { HospitalResident } from './games/hospital-resident.js';
export { StableRoommates } from './games/stable-roommates.js';
export { StudentAllocation } from './games/student-allocation.js';

// Algorithms (for advanced usage)
export {
  stableMarriage,
  hospitalResident,
  stableRoommates,
  studentAllocation,
} from './algorithms/index.js';

// Errors
export { MatchingError } from './errors.js';

// Types
export type {
  PlayerName,
  SMOptimal,
  HROptimal,
  SAOptimal,
  GameOptions,
  ValidationIssue,
  StabilityResult,
} from './types.js';
