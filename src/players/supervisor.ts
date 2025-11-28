/**
 * The Supervisor class for use in instances of SA.
 */

import type { PlayerName } from '../types.js';
import { Hospital } from './hospital.js';
import { Player } from './player.js';
import type { Project } from './project.js';

/**
 * Supervisor player class for instances of SA.
 */
export class Supervisor extends Hospital {
  /** The projects that the supervisor runs */
  projects: Project[] = [];

  constructor(name: PlayerName, capacity: number) {
    super(name, capacity);
  }

  /**
   * Attempt to forget the student.
   * A student is only removed if it is not ranked by any of the supervisor's projects.
   */
  override _forget(student: Player): void {
    const rankedByAnyProject = this.projects.some((project) =>
      project.prefs.includes(student)
    );

    if (this.prefs.includes(student) && !rankedByAnyProject) {
      this.prefs = this.prefs.filter((p) => p !== student);
    }
  }

  /**
   * Set the preference list for the supervisor.
   * This method also passes the preferences on to its projects
   * according to those students who ranked each project.
   */
  override setPrefs(students: Player[]): void {
    this.prefs = students;
    this._prefNames = students.map((s) => s.name);
    this._originalPrefs = [...students];

    for (const project of this.projects) {
      const acceptable = students.filter((student) =>
        student.prefs.includes(project as unknown as Player)
      );
      project.setPrefs(acceptable);
    }
  }

  /**
   * Get the supervisor's favourite viable student and their preferred project.
   *
   * A student is viable if they are not currently matched to, but
   * have a preference of, one of the supervisor's under-subscribed
   * projects. This method also returns the student's favourite
   * under-subscribed project. If no such student exists, return null.
   *
   * Note: This method has a different signature from Hospital.getFavourite()
   * because it returns a tuple of [student, project] rather than just a player.
   */
  getFavouriteStudentProject(): [Player, Project] | null {
    if (this.matching.length < this.capacity) {
      for (const student of this.prefs) {
        // In SA, student.prefs contains Projects (cast as Players for polymorphism)
        for (const pref of student.prefs) {
          // Check if this preference is one of our projects
          const project = this.projects.find(
            (p) => (p as unknown as Player) === pref
          );
          if (
            project &&
            !project.matching.includes(student) &&
            project.matching.length < project.capacity
          ) {
            return [student, project];
          }
        }
      }
    }
    return null;
  }
}
