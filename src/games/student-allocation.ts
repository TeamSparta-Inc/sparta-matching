/**
 * The SA game class and supporting functions.
 */

import { studentAllocation } from '../algorithms/student-allocation.js';
import {
  MatchingError,
  warnCapacityChanged,
  warnPreferencesChanged,
} from '../errors.js';
import { MultipleMatching } from '../matchings/multiple-matching.js';
import { Hospital } from '../players/hospital.js';
import { Player } from '../players/player.js';
import { Project } from '../players/project.js';
import { Supervisor } from '../players/supervisor.js';
import type { GameOptions, SAOptimal } from '../types.js';
import { HospitalResident } from './hospital-resident.js';

/**
 * Solver for the student-allocation problem (SA).
 */
export class StudentAllocation extends HospitalResident {
  /** The students in the game */
  students: Player[];

  /** The projects in the game */
  projects: Project[];

  /** The supervisors in the game */
  supervisors: Supervisor[];

  constructor(
    students: Player[],
    projects: Project[],
    supervisors: Supervisor[],
    options: GameOptions = {}
  ) {
    const { clean = false } = options;

    // Deep copy all players
    const studentCloneMap = new Map<Player, Player>();
    const projectCloneMap = new Map<Project, Project>();
    const supervisorCloneMap = new Map<Supervisor, Supervisor>();

    // Create clones
    for (const student of students) {
      studentCloneMap.set(student, new Player(student.name));
    }
    for (const project of projects) {
      projectCloneMap.set(project, new Project(project.name, project.capacity));
    }
    for (const supervisor of supervisors) {
      supervisorCloneMap.set(
        supervisor,
        new Supervisor(supervisor.name, supervisor.capacity)
      );
    }

    // Link projects to supervisors
    for (const project of projects) {
      const clonedProject = projectCloneMap.get(project)!;
      if (project.supervisor) {
        const clonedSupervisor = supervisorCloneMap.get(project.supervisor)!;
        clonedProject.setSupervisor(clonedSupervisor);
      }
    }

    // Set student preferences (to projects)
    for (const student of students) {
      const clone = studentCloneMap.get(student)!;
      const clonedPrefs = student.prefs.map(
        (p) => projectCloneMap.get(p as unknown as Project) as unknown as Player
      );
      clone.setPrefs(clonedPrefs);
    }

    // Set supervisor preferences (to students) - this also sets project prefs
    for (const supervisor of supervisors) {
      const clone = supervisorCloneMap.get(supervisor)!;
      const clonedPrefs = supervisor.prefs.map((p) => studentCloneMap.get(p)!);
      clone.setPrefs(clonedPrefs);
    }

    const clonedStudents = students.map((s) => studentCloneMap.get(s)!);
    const clonedProjects = projects.map((p) => projectCloneMap.get(p)!);
    const clonedSupervisors = supervisors.map((s) => supervisorCloneMap.get(s)!);

    // Initialize parent class fields directly without calling parent constructor's checkInputs
    // We handle our own checkInputs at the end
    super([], [], { clean: false }); // Pass empty arrays to avoid parent validation

    this.students = clonedStudents;
    this.projects = clonedProjects;
    this.supervisors = clonedSupervisors;
    this.residents = clonedStudents;
    this.hospitals = clonedProjects as unknown as Hospital[];
    this.clean = clean;

    this._allResidents = [...clonedStudents];
    this._allHospitals = [...clonedProjects] as unknown as Hospital[];

    this.checkInputs();
  }

  /**
   * Create an instance of SA from a set of dictionaries.
   */
  static override createFromDictionaries(
    studentPrefs: Record<string, string[]>,
    supervisorPrefs: Record<string, string[]>,
    projectSupervisors: Record<string, string>,
    projectCapacities: Record<string, number>,
    supervisorCapacities: Record<string, number>,
    options: GameOptions = {}
  ): StudentAllocation {
    const [students, projects, supervisors] = makePlayers(
      studentPrefs,
      supervisorPrefs,
      projectSupervisors,
      projectCapacities,
      supervisorCapacities
    );
    return new StudentAllocation(students, projects, supervisors, options);
  }

  /**
   * Solve the instance of SA.
   * @param optimal - 'student' or 'supervisor' for which party to optimize
   */
  // @ts-expect-error - SA uses different optimality options than HR
  override solve(optimal: SAOptimal = 'student'): MultipleMatching {
    this.matching = new MultipleMatching(
      studentAllocation(
        this.students,
        this.projects,
        this.supervisors,
        optimal
      )
    );
    return this.matching;
  }

  /**
   * Check whether the current matching is valid.
   */
  override checkValidity(): boolean {
    const unacceptableIssues = [
      ...this.checkForUnacceptableMatches('students'),
      ...this.checkForUnacceptableMatches('projects'),
      ...this.checkForUnacceptableMatches('supervisors'),
    ];

    const oversubscribedIssues = [
      ...this.checkForOversubscribedPlayersGeneric('projects'),
      ...this.checkForOversubscribedPlayersGeneric('supervisors'),
    ];

    if (unacceptableIssues.length > 0 || oversubscribedIssues.length > 0) {
      throw new MatchingError({
        unacceptableMatches: unacceptableIssues,
        oversubscribedPlayers: oversubscribedIssues,
      });
    }

    return true;
  }

  /**
   * Check that no one has an unacceptable match.
   */
  protected override checkForUnacceptableMatches(
    party: 'students' | 'projects' | 'supervisors' | 'residents' | 'hospitals'
  ): string[] {
    const issues: string[] = [];
    let players: Array<Player | Project | Supervisor>;

    switch (party) {
      case 'students':
      case 'residents':
        players = this.students;
        break;
      case 'projects':
      case 'hospitals':
        players = this.projects;
        break;
      case 'supervisors':
        players = this.supervisors;
        break;
      default:
        players = [];
    }

    for (const player of players) {
      if (player instanceof Project || player instanceof Supervisor) {
        const playerIssues = player.checkIfMatchIsUnacceptable();
        issues.push(...playerIssues);
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
   * Check that no player is over-subscribed.
   */
  private checkForOversubscribedPlayersGeneric(
    party: 'projects' | 'supervisors'
  ): string[] {
    const issues: string[] = [];
    const players = party === 'projects' ? this.projects : this.supervisors;

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
  override checkStability(): boolean {
    const blockingPairs: Array<[Player, Project]> = [];

    for (const student of this.students) {
      for (const project of this.projects) {
        if (
          student.prefs.includes(project as unknown as Player) &&
          checkStudentUnhappy(student, project) &&
          checkProjectUnhappy(project, student)
        ) {
          blockingPairs.push([student, project]);
        }
      }
    }

    this.blockingPairs = blockingPairs as Array<[Player, any]>;
    return blockingPairs.length === 0;
  }

  /**
   * Check if any rules of the game have been broken.
   */
  protected override checkInputs(): void {
    // Skip if called from parent constructor before our fields are initialized
    if (!this.students || !this.projects || !this.supervisors) {
      return;
    }

    this.checkInputsPlayerPrefsUniqueGeneric('students');
    this.checkInputsPlayerPrefsUniqueGeneric('projects');
    this.checkInputsPlayerPrefsUniqueGeneric('supervisors');

    this.checkInputsPlayerPrefsAllInPartyGeneric('students', 'projects');
    this.checkInputsPlayerPrefsNonemptyGeneric('students', 'projects');

    this.checkInputsPlayerPrefsAllInPartyGeneric('supervisors', 'students');
    this.checkInputsPlayerPrefsNonemptyGeneric('supervisors', 'students');

    this.checkInputsPlayerPrefsAllReciprocatedSA('projects');
    this.checkInputsPlayerReciprocatedAllPrefsSA('projects', 'students');
    this.checkInputsPlayerPrefsNonemptyGeneric('projects', 'students');

    this.checkInputsPlayerPrefsAllReciprocatedSA('supervisors');
    this.checkInputsPlayerReciprocatedAllPrefsSA('supervisors', 'students');
    this.checkInputsPlayerPrefsNonemptyGeneric('supervisors', 'students');

    this.checkInputsPlayerCapacityGeneric('projects', 'students');
    this.checkInputsPlayerCapacityGeneric('supervisors', 'students');
    this.checkInputsSupervisorCapacitiesSufficient();
    this.checkInputsSupervisorCapacitiesNecessary();
  }

  private checkInputsPlayerPrefsUniqueGeneric(
    party: 'students' | 'projects' | 'supervisors'
  ): void {
    let players: Array<Player | Project | Supervisor>;

    switch (party) {
      case 'students':
        players = this.students;
        break;
      case 'projects':
        players = this.projects;
        break;
      case 'supervisors':
        players = this.supervisors;
        break;
      default:
        players = [];
    }

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

  private checkInputsPlayerPrefsAllInPartyGeneric(
    party: 'students' | 'supervisors',
    otherParty: 'projects' | 'students'
  ): void {
    const players = party === 'students' ? this.students : this.supervisors;
    const others =
      otherParty === 'projects'
        ? (this.projects as unknown as Player[])
        : this.students;

    for (const player of players) {
      for (const other of player.prefs) {
        if (!others.includes(other as Player)) {
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

  private checkInputsPlayerPrefsNonemptyGeneric(
    party: 'students' | 'projects' | 'supervisors',
    otherParty: 'projects' | 'students'
  ): void {
    let players: Array<Player | Project | Supervisor>;

    switch (party) {
      case 'students':
        players = this.students;
        break;
      case 'projects':
        players = this.projects;
        break;
      case 'supervisors':
        players = this.supervisors;
        break;
    }

    for (const player of players) {
      if (player.prefs.length === 0) {
        if (this.clean) {
          this.removePlayerSA(player, party, otherParty);
        }
      }
    }
  }

  private checkInputsPlayerPrefsAllReciprocatedSA(
    party: 'projects' | 'supervisors'
  ): void {
    if (party === 'supervisors') {
      for (const supervisor of this.supervisors) {
        for (const student of supervisor.prefs) {
          const studentPrefsSupervisors = new Set(
            student.prefs.map(
              (p) => (p as unknown as Project).supervisor
            )
          );

          if (!studentPrefsSupervisors.has(supervisor)) {
            warnPreferencesChanged(
              `${supervisor} ranked ${student} but they did not rank any of their projects.`
            );

            if (this.clean) {
              for (const project of supervisor.projects) {
                project._forget(student);
              }
            }
          }
        }
      }
    } else {
      for (const project of this.projects) {
        for (const other of project.prefs) {
          if (!other.prefs.includes(project as unknown as Player)) {
            warnPreferencesChanged(
              `${project} ranked ${other} but they did not.`
            );
            if (this.clean) {
              project._forget(other);
            }
          }
        }
      }
    }
  }

  private checkInputsPlayerReciprocatedAllPrefsSA(
    party: 'projects' | 'supervisors',
    _otherParty: 'students'
  ): void {
    if (party === 'supervisors') {
      for (const supervisor of this.supervisors) {
        const studentsThatRanked = this.students.filter((student) =>
          supervisor.projects.some((project) =>
            student.prefs.includes(project as unknown as Player)
          )
        );

        for (const student of studentsThatRanked) {
          if (!supervisor.prefs.includes(student)) {
            warnPreferencesChanged(
              `${student} ranked a project provided by ${supervisor} but they did not.`
            );

            if (this.clean) {
              const projectsInCommon = supervisor.projects.filter((p) =>
                student.prefs.includes(p as unknown as Player)
              );
              for (const project of projectsInCommon) {
                student._forget(project as unknown as Player);
              }
            }
          }
        }
      }
    } else {
      for (const project of this.projects) {
        const studentsThatRanked = this.students.filter((s) =>
          s.prefs.includes(project as unknown as Player)
        );

        for (const student of studentsThatRanked) {
          if (!project.prefs.includes(student)) {
            warnPreferencesChanged(
              `${student} ranked ${project} but they did not.`
            );
            if (this.clean) {
              student._forget(project as unknown as Player);
            }
          }
        }
      }
    }
  }

  private checkInputsPlayerCapacityGeneric(
    party: 'projects' | 'supervisors',
    otherParty: 'students'
  ): void {
    const players = party === 'projects' ? this.projects : this.supervisors;

    for (const player of players) {
      if (player.capacity < 1) {
        if (this.clean) {
          this.removePlayerSA(player, party, otherParty);
        }
      }
    }
  }

  /**
   * Check each supervisor has space for its largest project.
   */
  private checkInputsSupervisorCapacitiesSufficient(): void {
    for (const supervisor of this.supervisors) {
      for (const project of supervisor.projects) {
        if (project.capacity > supervisor.capacity) {
          warnCapacityChanged(
            `${project} has a capacity of ${project.capacity} ` +
              `but its supervisor has a capacity of ${supervisor.capacity}.`
          );

          if (this.clean) {
            project.capacity = supervisor.capacity;
          }
        }
      }
    }
  }

  /**
   * Check each supervisor has no surplus given their projects.
   */
  private checkInputsSupervisorCapacitiesNecessary(): void {
    for (const supervisor of this.supervisors) {
      const totalProjectCapacity = supervisor.projects.reduce(
        (sum, p) => sum + p.capacity,
        0
      );

      if (supervisor.capacity > totalProjectCapacity) {
        warnCapacityChanged(
          `${supervisor} has a capacity of ${supervisor.capacity} ` +
            `but their projects have a capacity of ${totalProjectCapacity}`
        );

        if (this.clean) {
          supervisor.capacity = totalProjectCapacity;
        }
      }
    }
  }

  /**
   * Remove a player from the game.
   */
  private removePlayerSA(
    player: Player | Project | Supervisor,
    playerParty: 'students' | 'projects' | 'supervisors',
    _otherParty: 'projects' | 'students'
  ): void {
    if (playerParty === 'supervisors') {
      this.supervisors = this.supervisors.filter((s) => s !== player);
      const supervisor = player as Supervisor;
      for (const project of supervisor.projects) {
        this.removePlayerSA(project, 'projects', 'students');
      }
    } else if (playerParty === 'projects') {
      this.projects = this.projects.filter((p) => p !== player);
      for (const student of this.students) {
        if (student.prefs.includes(player as unknown as Player)) {
          student._forget(player as unknown as Player);
        }
      }
    } else {
      this.students = this.students.filter((s) => s !== player);
      for (const project of this.projects) {
        if (project.prefs.includes(player as Player)) {
          project._forget(player as Player);
        }
      }
    }
  }
}

/**
 * Check whether a student is unhappy given a project.
 */
function checkStudentUnhappy(student: Player, project: Project): boolean {
  return (
    student.matching === null ||
    student.prefers(project as unknown as Player, student.matching)
  );
}

/**
 * Check whether a project is unhappy given a student.
 */
function checkProjectUnhappy(project: Project, student: Player): boolean {
  const supervisor = project.supervisor!;

  const projectUndersubscribed = project.matching.length < project.capacity;
  const bothUndersubscribed =
    projectUndersubscribed &&
    supervisor.matching.length < supervisor.capacity;

  const supervisorFull = supervisor.matching.length === supervisor.capacity;

  const swapAvailable =
    (supervisor.matching.includes(student) &&
      student.matching !== (project as unknown as Player)) ||
    (supervisor.getWorstMatch() !== null &&
      supervisor.prefers(student, supervisor.getWorstMatch()!));

  const projectUpsettingSupervisor =
    project.matching.length === project.capacity &&
    project.getWorstMatch() !== null &&
    supervisor.prefers(student, project.getWorstMatch()!);

  return (
    bothUndersubscribed ||
    (projectUndersubscribed && supervisorFull && swapAvailable) ||
    projectUpsettingSupervisor
  );
}

/**
 * Make a set of students, projects and supervisors.
 */
function makePlayers(
  studentPrefs: Record<string, string[]>,
  supervisorPrefs: Record<string, string[]>,
  projectSupervisors: Record<string, string>,
  projectCapacities: Record<string, number>,
  supervisorCapacities: Record<string, number>
): [Player[], Project[], Supervisor[]] {
  const studentDict = new Map<string, Player>();
  const projectDict = new Map<string, Project>();
  const supervisorDict = new Map<string, Supervisor>();

  // Create instances
  for (const name of Object.keys(studentPrefs)) {
    studentDict.set(name, new Player(name));
  }

  for (const projectName of Object.keys(projectSupervisors)) {
    projectDict.set(projectName, new Project(projectName, projectCapacities[projectName]!));
  }

  for (const [name, capacity] of Object.entries(supervisorCapacities)) {
    supervisorDict.set(name, new Supervisor(name, capacity));
  }

  // Link projects to supervisors
  for (const [projectName, supervisorName] of Object.entries(projectSupervisors)) {
    const project = projectDict.get(projectName)!;
    const supervisor = supervisorDict.get(supervisorName)!;
    project.setSupervisor(supervisor);
  }

  // Set student preferences
  for (const [name, student] of studentDict) {
    const prefs = studentPrefs[name]!.map(
      (p) => projectDict.get(p) as unknown as Player
    );
    student.setPrefs(prefs);
  }

  // Set supervisor preferences (this also sets project prefs)
  for (const [name, supervisor] of supervisorDict) {
    const prefs = supervisorPrefs[name]!.map((s) => studentDict.get(s)!);
    supervisor.setPrefs(prefs);
  }

  return [
    [...studentDict.values()],
    [...projectDict.values()],
    [...supervisorDict.values()],
  ];
}
