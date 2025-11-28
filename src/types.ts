/**
 * Shared type definitions for the matching library.
 */

/** Player identifier type */
export type PlayerName = string | number;

/** Optimality options for Stable Marriage */
export type SMOptimal = 'suitor' | 'reviewer';

/** Optimality options for Hospital Resident */
export type HROptimal = 'resident' | 'hospital';

/** Optimality options for Student Allocation */
export type SAOptimal = 'student' | 'supervisor';

/** Game options */
export interface GameOptions {
  /** If true, automatically clean invalid preferences */
  clean?: boolean;
}

/** Validation issue details */
export interface ValidationIssue {
  type: string;
  message: string;
}

/** Stability check result */
export interface StabilityResult<P> {
  isStable: boolean;
  blockingPairs: Array<[P, P]>;
}

/** Forward declaration interfaces to break circular dependencies */
export interface IPlayer {
  name: PlayerName;
  prefs: IPlayer[];
  matching: IPlayer | IPlayer[] | null;
  _originalPrefs: IPlayer[] | null;
  _prefNames: PlayerName[];

  setPrefs(players: IPlayer[]): void;
  prefers(player: IPlayer, other: IPlayer): boolean;
  _match(other: IPlayer): void;
  _unmatch(other?: IPlayer): void;
  _forget(other: IPlayer): void;
  getFavourite(): IPlayer | null;
  getSuccessors(): IPlayer[];
  checkIfMatchIsUnacceptable(unmatchedOkay?: boolean): string | string[] | null;
}

export interface IHospital extends IPlayer {
  capacity: number;
  _originalCapacity: number;
  matching: IPlayer[];

  getWorstMatch(): IPlayer | null;
  checkIfOversubscribed(): string | false;
}

export interface IProject extends IHospital {
  supervisor: ISupervisor | null;
  setSupervisor(supervisor: ISupervisor): void;
}

export interface ISupervisor extends IHospital {
  projects: IProject[];
  getFavouriteStudentProject(): [IPlayer, IProject] | null;
}
