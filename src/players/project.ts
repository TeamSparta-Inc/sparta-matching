/**
 * The Project class for use in instances of SA.
 */

import type { PlayerName } from '../types.js';
import { Hospital } from './hospital.js';
import { Player } from './player.js';
import type { Supervisor } from './supervisor.js';

/**
 * Project player class for instances of SA.
 */
export class Project extends Hospital {
  /** The supervisor that runs the project */
  supervisor: Supervisor | null = null;

  constructor(name: PlayerName, capacity: number) {
    super(name, capacity);
  }

  /**
   * Remove a student from the project preference list.
   * This method also prompts the supervisor to attempt forgetting the student.
   */
  override _forget(student: Player): void {
    if (this.prefs.includes(student)) {
      this.prefs = this.prefs.filter((p) => p !== student);
      if (this.supervisor) {
        this.supervisor._forget(student);
      }
    }
  }

  /**
   * Match the project to the student.
   * This method also updates the project supervisor's matching to include the student.
   */
  override _match(student: Player): void {
    this.matching.push(student);
    this.matching.sort((a, b) => this.prefs.indexOf(a) - this.prefs.indexOf(b));
    if (this.supervisor) {
      this.supervisor._match(student);
    }
  }

  /**
   * Break the matching between the project and the student.
   * This method also breaks the matching between the student and the project supervisor.
   */
  override _unmatch(student: Player): void {
    this.matching = this.matching.filter((p) => p !== student);
    if (this.supervisor) {
      this.supervisor._unmatch(student);
    }
  }

  /**
   * Assign the supervisor to the project.
   * This method also updates the supervisor's project list.
   */
  setSupervisor(supervisor: Supervisor): void {
    this.supervisor = supervisor;
    if (!supervisor.projects.includes(this)) {
      supervisor.projects.push(this);
    }
  }
}
