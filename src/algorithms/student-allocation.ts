/**
 * Functions for the SA algorithm.
 */

import { Player } from '../players/player.js';
import { Project } from '../players/project.js';
import { Supervisor } from '../players/supervisor.js';
import { deletePair, matchPair } from './util.js';

/**
 * Unmatch a student-project pair.
 */
function unmatchPair(student: Player, project: Project): void {
  student._unmatch();
  project._unmatch(student);
}

/**
 * Solve an instance of SA by treating it as a bi-level HR instance.
 *
 * A unique, stable and optimal matching is found for the given set of
 * students, projects and supervisors. The optimality of the matching
 * is found with respect to one party and is subsequently the worst
 * stable matching for the other.
 *
 * @param students - The students in the game.
 * @param projects - The projects in the game.
 * @param supervisors - The supervisors in the game.
 * @param optimal - Which party the matching should be optimised for.
 * @returns A Map where keys are projects and values are their student matches.
 */
export function studentAllocation(
  students: Player[],
  projects: Project[],
  supervisors: Supervisor[],
  optimal: 'student' | 'supervisor' = 'student'
): Map<Project, Player[]> {
  if (optimal === 'student') {
    return studentOptimal(students, projects);
  }
  return supervisorOptimal(projects, supervisors);
}

/**
 * Solve the instance of SA to be student-optimal.
 */
function studentOptimal(
  students: Player[],
  projects: Project[]
): Map<Project, Player[]> {
  const freeStudents = [...students];

  while (freeStudents.length > 0) {
    const student = freeStudents.pop()!;

    if (student.prefs.length === 0) {
      continue;
    }

    const project = student.getFavourite() as unknown as Project;
    const supervisor = project.supervisor!;

    matchPair(student, project as unknown as Player);

    if (project.matching.length > project.capacity) {
      const worst = project.getWorstMatch()!;
      unmatchPair(worst, project);
      freeStudents.push(worst);
    } else if (supervisor.matching.length > supervisor.capacity) {
      const worst = supervisor.getWorstMatch()!;
      const worstProject = worst.matching as unknown as Project;
      unmatchPair(worst, worstProject);
      freeStudents.push(worst);
    }

    if (project.matching.length === project.capacity) {
      const successors = project.getSuccessors();
      for (const successor of successors) {
        deletePair(project as unknown as Player, successor);
        if (successor.prefs.length === 0) {
          const idx = freeStudents.indexOf(successor);
          if (idx !== -1) {
            freeStudents.splice(idx, 1);
          }
        }
      }
    }

    if (supervisor.matching.length === supervisor.capacity) {
      const successors = supervisor.getSuccessors();
      for (const successor of successors) {
        const supervisorProjects = supervisor.projects.filter((p) =>
          successor.prefs.includes(p as unknown as Player)
        );

        for (const proj of supervisorProjects) {
          deletePair(proj as unknown as Player, successor);
        }

        if (successor.prefs.length === 0) {
          const idx = freeStudents.indexOf(successor);
          if (idx !== -1) {
            freeStudents.splice(idx, 1);
          }
        }
      }
    }
  }

  const result = new Map<Project, Player[]>();
  for (const project of projects) {
    result.set(project, project.matching);
  }
  return result;
}

/**
 * Solve the instance of SA to be supervisor-optimal.
 */
function supervisorOptimal(
  projects: Project[],
  supervisors: Supervisor[]
): Map<Project, Player[]> {
  let freeSupervisors = [...supervisors];

  while (freeSupervisors.length > 0) {
    const supervisor = freeSupervisors.pop()!;
    const favourite = supervisor.getFavouriteStudentProject();

    if (!favourite) {
      continue;
    }

    const [student, project] = favourite;

    if (student.matching) {
      const currMatch = student.matching as unknown as Project;
      unmatchPair(student, currMatch);
    }

    matchPair(student, project as unknown as Player);

    const successors = student.getSuccessors();
    for (const successor of successors) {
      deletePair(student, successor);
    }

    // Recompute free supervisors
    freeSupervisors = supervisors.filter(
      (s) => s.getFavouriteStudentProject() !== null
    );
  }

  const result = new Map<Project, Player[]>();
  for (const project of projects) {
    result.set(project, project.matching);
  }
  return result;
}
