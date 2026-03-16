# sparta-matching

안정 매칭(Stable Matching) 알고리즘을 구현한 TypeScript/JavaScript 패키지입니다.

Python [matching](https://github.com/daffidwilde/matching) 라이브러리를 TypeScript로 포팅하였으며, Stable Marriage, Hospital-Resident, Stable Roommates, Student Allocation 문제를 지원합니다.

## Background

이 패키지는 **spartacareer-backend**의 **바로인턴(monthly-intern)** 서비스에서 **기업과 인턴 간의 매칭**을 수행하기 위해 개발되었습니다.

바로인턴 서비스의 매칭 문제는 [Hospital-Resident Problem (HR)](https://en.wikipedia.org/wiki/Hospital-resident_problem)에 해당합니다:

| HR 모델 | 바로인턴 서비스 | 설명 |
|---------|---------------|------|
| Hospital | 기업 (Company) | 여러 명의 인턴을 채용할 수 있는 주체 (capacity 보유) |
| Resident | 인턴 (Intern) | 하나의 기업에 배정되는 주체 |
| Hospital Capacity | 채용 인원 | 기업이 수용할 수 있는 최대 인턴 수 |
| Preference List | 선호도 목록 | 각 기업/인턴이 상대방에 대해 매긴 순위 |

내부적으로 [Gale-Shapley 알고리즘](https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm)의 확장 버전을 사용하여, 양측 모두에게 안정적인(stable) 매칭 결과를 생성합니다. 안정적 매칭이란, 현재 매칭보다 서로를 더 선호하는 쌍(blocking pair)이 존재하지 않는 매칭을 의미합니다.

### Origin

이 패키지는 원래 Python으로 작성된 [matching](https://github.com/daffidwilde/matching)(by Henry Wilde)을 기반으로 합니다. spartacareer-backend가 Node.js 기반이므로, 별도 Python 프로세스 없이 매칭 로직을 직접 호출하기 위해 TypeScript로 포팅하였습니다.

## Installation

```bash
npm install sparta-matching
```

## Quick Start

### 기업-인턴 매칭 (Hospital-Resident Problem)

바로인턴 서비스에서 사용하는 핵심 매칭 방식입니다.

```typescript
import { HospitalResident } from 'sparta-matching';

const game = HospitalResident.createFromDictionaries(
  // 인턴 선호도: 각 인턴이 선호하는 기업 순서
  {
    '인턴A': ['스파르타', '네이버'],
    '인턴B': ['네이버', '스파르타'],
    '인턴C': ['스파르타'],
  },
  // 기업 선호도: 각 기업이 선호하는 인턴 순서
  {
    '스파르타': ['인턴A', '인턴C', '인턴B'],
    '네이버': ['인턴B', '인턴A'],
  },
  // 기업별 채용 인원 (capacity)
  {
    '스파르타': 2,
    '네이버': 1,
  }
);

const matching = game.solve();
console.log(matching.toRecord());
// { '스파르타': ['인턴A', '인턴C'], '네이버': ['인턴B'] }
```

`solve()` 메서드의 인자로 최적화 방향을 지정할 수 있습니다:
- `'resident'` (기본값): 인턴 최적 매칭 — 인턴 측에 가장 유리한 안정 매칭
- `'hospital'`: 기업 최적 매칭 — 기업 측에 가장 유리한 안정 매칭

```typescript
const internOptimal = game.solve('resident');   // 인턴 최적
const companyOptimal = game.solve('hospital');   // 기업 최적
```

### Stable Marriage Problem

1:1 이분 매칭 문제입니다.

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

### Stable Roommates Problem

대칭적 1:1 매칭 문제입니다 (이분 그래프가 아닌 경우).

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

지도교수-프로젝트-학생 간의 계층적 다대일 매칭 문제입니다.

```typescript
import { StudentAllocation } from 'sparta-matching';

const game = StudentAllocation.createFromDictionaries(
  // 학생 선호도 (프로젝트 기준)
  {
    A: ['P1', 'P2'],
    B: ['P2', 'P1'],
    C: ['P1'],
  },
  // 지도교수 선호도 (학생 기준)
  {
    S1: ['A', 'B', 'C'],
  },
  // 프로젝트 → 지도교수 매핑
  { P1: 'S1', P2: 'S1' },
  // 프로젝트별 수용 인원
  { P1: 2, P2: 1 },
  // 지도교수별 수용 인원
  { S1: 3 }
);

const matching = game.solve();
console.log(matching.toRecord());
// { P1: ['A', 'C'], P2: ['B'] }
```

## Features

- **Stable Marriage (SM)**: Gale-Shapley 알고리즘 기반 이분 1:1 매칭
- **Hospital-Resident (HR)**: 용량(capacity) 제한이 있는 다대일 매칭
- **Stable Roommates (SR)**: Irving 알고리즘 기반 대칭 1:1 매칭
- **Student Allocation (SA)**: 2단계 계층 구조의 다대일 매칭

모든 알고리즘 공통 지원:
- 양측 최적 해(Party-optimal solutions) 선택 가능
- 매칭 유효성 검증 (`checkValidity`)
- 안정성 검증 — blocking pair 탐지 (`checkStability`)

## API Reference

### HospitalResident

```typescript
// 딕셔너리에서 생성
const game = HospitalResident.createFromDictionaries(
  residentPrefs,    // 인턴/레지던트 선호도
  hospitalPrefs,    // 기업/병원 선호도
  capacities,       // 기업/병원별 수용 인원
  { clean: false }  // 옵션: true면 잘못된 선호도 자동 정리
);

// 매칭 실행
const matching = game.solve('resident'); // 'resident' 또는 'hospital'

// 유효성 검증 (잘못된 매칭 시 MatchingError throw)
game.checkValidity();

// 안정성 검증 (blocking pair 존재 여부)
game.checkStability(); // returns boolean, sets game.blockingPairs

// 결과 변환
matching.toRecord(); // { '스파르타': ['인턴A', '인턴C'], '네이버': ['인턴B'] }
```

### StableMarriage

```typescript
const game = StableMarriage.createFromDictionaries(suitorPrefs, reviewerPrefs);
const matching = game.solve('suitor'); // 'suitor' 또는 'reviewer'

game.checkValidity();
game.checkStability();

matching.toRecord(); // { 'A': 'X', 'B': 'Y', ... }
```

### StableRoommates

```typescript
const game = StableRoommates.createFromDictionary(playerPrefs);
const matching = game.solve();
// 안정 매칭이 존재하지 않을 경우 null 값 포함 가능
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

const matching = game.solve('student'); // 'student' 또는 'supervisor'
```

## Development

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 테스트
npm test

# 타입 검사
npm run typecheck
```

## References

- [Original Python matching library](https://github.com/daffidwilde/matching) by Henry Wilde
- [Gale-Shapley Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm)
- [Hospital-Resident Problem (Wikipedia)](https://en.wikipedia.org/wiki/Hospital-resident_problem)
- [Stable Marriage Problem (Wikipedia)](https://en.wikipedia.org/wiki/Stable_marriage_problem)
- [Stable Roommates Problem (Wikipedia)](https://en.wikipedia.org/wiki/Stable_roommates_problem)

## License

MIT
