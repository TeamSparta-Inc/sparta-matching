# sparta-matching

Matching algorithms for stable marriage, hospital-resident, stable roommates, and student allocation problems.

A TypeScript/JavaScript port of the Python [matching](https://github.com/daffidwilde/matching) library.

## Installation

```bash
npm install sparta-matching
```

## Quick Start

### Stable Marriage Problem

```typescript
import { StableMarriage } from 'sparta-matching';

const game = StableMarriage.createFromDictionaries(
  {
    A: ['X', 'Y', 'Z'],
    B: ['Y', 'X', 'Z'],
    C: ['Y', 'Z', 'X'],
  },
  {
    X: ['B', 'A', 'C'],
    Y: ['A', 'B', 'C'],
    Z: ['A', 'B', 'C'],
  }
);

const matching = game.solve();
console.log(matching.toRecord());
// { A: 'Y', B: 'X', C: 'Z' }
```

### Hospital-Resident Problem

```typescript
import { HospitalResident } from 'sparta-matching';

const game = HospitalResident.createFromDictionaries(
  {
    A: ['CityHospital', 'Memorial'],
    B: ['Memorial', 'CityHospital'],
    C: ['CityHospital'],
  },
  {
    CityHospital: ['A', 'C', 'B'],
    Memorial: ['B', 'A'],
  },
  {
    CityHospital: 2,
    Memorial: 1,
  }
);

const matching = game.solve();
console.log(matching.toRecord());
// { CityHospital: ['A', 'C'], Memorial: ['B'] }
```

### Stable Roommates Problem

```typescript
import { StableRoommates } from 'sparta-matching';

const game = StableRoommates.createFromDictionary({
  A: ['B', 'C', 'D'],
  B: ['A', 'C', 'D'],
  C: ['A', 'B', 'D'],
  D: ['A', 'B', 'C'],
});

const matching = game.solve();
console.log(matching.toRecord());
// { A: 'B', B: 'A', C: 'D', D: 'C' }
```

### Student Allocation Problem

```typescript
import { StudentAllocation } from 'sparta-matching';

const game = StudentAllocation.createFromDictionaries(
  // Student preferences (over projects)
  {
    A: ['P1', 'P2'],
    B: ['P2', 'P1'],
    C: ['P1'],
  },
  // Supervisor preferences (over students)
  {
    S1: ['A', 'B', 'C'],
  },
  // Project -> Supervisor mapping
  { P1: 'S1', P2: 'S1' },
  // Project capacities
  { P1: 2, P2: 1 },
  // Supervisor capacities
  { S1: 3 }
);

const matching = game.solve();
console.log(matching.toRecord());
// { P1: ['A', 'C'], P2: ['B'] }
```

## Features

- **Stable Marriage (SM)**: Gale-Shapley algorithm for bipartite 1:1 matching
- **Hospital-Resident (HR)**: Many-to-one matching with capacities
- **Stable Roommates (SR)**: Irving's algorithm for symmetric 1:1 matching
- **Student Allocation (SA)**: Two-level hierarchical matching

All algorithms support:
- Party-optimal solutions (suitor/reviewer, resident/hospital, student/supervisor)
- Validity checking
- Stability checking (blocking pair detection)

## API Reference

### StableMarriage

```typescript
// Create from dictionaries
const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);

// Or create from Player objects
const game = new StableMarriage(suitors, reviewers);

// Solve
const matching = game.solve('suitor'); // or 'reviewer'

// Check validity and stability
game.checkValidity(); // throws MatchingError if invalid
game.checkStability(); // returns boolean, sets game.blockingPairs

// Convert result
matching.toRecord(); // { 'A': 'X', 'B': 'Y', ... }
```

### HospitalResident

```typescript
const game = HospitalResident.createFromDictionaries(
  residentPrefs,
  hospitalPrefs,
  capacities,
  { clean: false } // options
);

const matching = game.solve('resident'); // or 'hospital'
```

### StableRoommates

```typescript
const game = StableRoommates.createFromDictionary(playerPrefs);
const matching = game.solve();
// Note: may return null values if no stable matching exists
```

### StudentAllocation

```typescript
const game = StudentAllocation.createFromDictionaries(
  studentPrefs,
  supervisorPrefs,
  projectSupervisors,
  projectCapacities,
  supervisorCapacities
);

const matching = game.solve('student'); // or 'supervisor'
```

## License

MIT
