# 임금인상 시나리오 계산기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노동조합 임금교섭 준비용 웹 계산기(현황/시나리오/추이/참고정보 4개 탭)를 순수 HTML/CSS/JS로 만들어 GitHub Pages에 배포한다.

**Architecture:** 빌드 도구 없는 정적 사이트. `js/data/*`(데이터) → `js/calc/*`(순수 계산 로직) → `js/charts/*`(SVG 차트) → `js/ui/*`(탭별 DOM 렌더링) → `js/main.js`(부트스트랩)의 단방향 의존 구조. 계산 로직은 Node 내장 테스트 러너(`node --test`)로 TDD, DOM 관련 코드는 브라우저 수동 확인으로 검증한다.

**Tech Stack:** Vanilla JS (ES Modules), 순수 CSS, Node.js 내장 테스트 러너(`node:test`, `node:assert`), 이미지 내보내기용 html2canvas(CDN, 예외적으로 허용된 유일한 외부 의존성).

## Global Constraints

- 빌드 도구/번들러/프레임워크 없음 — 브라우저는 `<script type="module">`로 파일을 그대로 로드한다.
- `package.json`은 `"type": "module"`과 테스트 스크립트만 가지며 배포 산출물에는 영향 없음(devDependency 없음).
- 색상: 베이스는 흑백·그레이 톤, 포인트 컬러는 `rgb(0, 188, 112)`.
- 실수령액 계산은 간이세액표 산출 공식을 재현한 근사치이며, 화면에 "간이 추정치이며 실제 명세서와 차이가 있을 수 있습니다" 안내 문구를 표시해야 한다.
- 이미지 내보내기는 html2canvas(CDN, 1개)만 예외적으로 허용한다. 그 외 외부 라이브러리는 추가하지 않는다.
- 임금체계는 호봉 없이 직급 5~8개 구조. 샘플 데이터는 직급 5개(`1급~5급`)를 사용하며, 실제 값은 조합이 제공하는 데이터로 추후 교체한다(이 계획에서는 다루지 않음).
- GitHub Pages는 저장소 루트를 Pages 소스로 사용하고 빌드 단계 없이 배포한다.
- 2026년 7월 기준 확인된 실데이터(최저임금 이력, 물가상승률, 협약임금인상률, 4대보험 요율)를 사용한다 — 출처는 각 데이터 파일에 주석으로 명시한다.

---

## File Structure Overview

```
/
├── index.html
├── css/style.css
├── package.json
├── README.md
├── js/
│   ├── data/
│   │   ├── tax-rules.js
│   │   ├── wage-table.js
│   │   └── reference-data.js
│   ├── calc/
│   │   ├── net-pay.js
│   │   └── scenario.js
│   ├── charts/
│   │   └── trend-chart.js
│   ├── ui/
│   │   ├── status-tab.js
│   │   ├── scenario-tab.js
│   │   ├── trend-tab.js
│   │   └── reference-tab.js
│   ├── export/
│   │   └── image-export.js
│   └── main.js
└── tests/
    ├── net-pay.test.mjs
    ├── scenario.test.mjs
    └── trend-chart.test.mjs
```

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `package.json`
- Create: `README.md`
- Create: `.gitignore`
- Create: `js/main.js`

**Interfaces:**
- Produces: 4개 탭 패널 DOM(`#tab-status`, `#tab-scenario`, `#tab-trend`, `#tab-reference`)과 탭 전환 동작. 이후 모든 UI 태스크가 이 패널에 콘텐츠를 채운다.

- [ ] **Step 1: `index.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>임금인상 시나리오 계산기</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <header class="app-header">
    <h1>임금인상 시나리오 계산기</h1>
    <p class="app-subtitle">현행 임금·실수령액부터 인상 시나리오 비교, 임금인상률 추이, 교섭 참고정보까지</p>
  </header>

  <nav class="tab-nav">
    <button class="tab-button active" data-tab="status" type="button">현황</button>
    <button class="tab-button" data-tab="scenario" type="button">시나리오</button>
    <button class="tab-button" data-tab="trend" type="button">추이</button>
    <button class="tab-button" data-tab="reference" type="button">참고정보</button>
  </nav>

  <main>
    <section id="tab-status" class="tab-panel active"></section>
    <section id="tab-scenario" class="tab-panel"></section>
    <section id="tab-trend" class="tab-panel"></section>
    <section id="tab-reference" class="tab-panel"></section>
  </main>

  <footer class="app-footer">
    <p>실수령액은 4대보험료와 근로소득 간이세액표 산출 공식을 적용한 추정치이며, 실제 급여명세서와 차이가 있을 수 있습니다.</p>
  </footer>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: `css/style.css` 작성**

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f7f7f7;
  --color-text: #111111;
  --color-muted: #666666;
  --color-border: #dddddd;
  --color-accent: rgb(0, 188, 112);
  --color-accent-bg: rgba(0, 188, 112, 0.12);
  --radius: 8px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
}

.app-header {
  padding: 24px 20px 8px;
  border-bottom: 1px solid var(--color-border);
}

.app-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.app-subtitle {
  margin: 0 0 16px;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.tab-nav {
  display: flex;
  gap: 4px;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab-button {
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 0.95rem;
  color: var(--color-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-button.active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
  font-weight: 600;
}

main {
  padding: 20px;
  max-width: 960px;
  margin: 0 auto;
}

.tab-panel {
  display: none;
}

.tab-panel.active {
  display: block;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
}

.card h2, .card h3 {
  margin-top: 0;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
}

table.wage-table, table.scenario-adjust-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  font-size: 0.9rem;
}

table.wage-table th, table.wage-table td,
table.scenario-adjust-table th, table.scenario-adjust-table td {
  border: 1px solid var(--color-border);
  padding: 8px 10px;
  text-align: right;
}

table.wage-table th:first-child, table.wage-table td:first-child,
table.scenario-adjust-table th:first-child, table.scenario-adjust-table td:first-child {
  text-align: left;
}

table.wage-table thead th {
  background: var(--color-surface);
}

tr.row-selected {
  background: var(--color-accent-bg);
}

.accent {
  color: var(--color-accent);
  font-weight: 600;
}

.summary-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-muted);
}

.summary-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
}

.btn {
  padding: 8px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: #ffffff;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-small {
  padding: 4px 8px;
  font-size: 0.8rem;
}

.btn:hover {
  border-color: var(--color-accent);
}

.export-btn {
  border-color: var(--color-accent);
  color: var(--color-accent);
  margin-top: 8px;
}

.scenario-card {
  border-left: 4px solid var(--color-accent);
}

.scenario-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.scenario-name-input {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.chart-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 0.85rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.chart-axis-label {
  font-size: 11px;
  fill: var(--color-muted);
}

.app-footer {
  padding: 16px 20px 32px;
  color: var(--color-muted);
  font-size: 0.8rem;
  max-width: 960px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  main {
    padding: 12px;
  }
}
```

- [ ] **Step 3: `js/main.js` 작성 (탭 전환만 우선 구현)**

```js
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
  });
});
```

- [ ] **Step 4: `package.json` 작성 (테스트 실행용, 배포에는 영향 없음)**

```json
{
  "name": "wage-scenario-calculator",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 5: `README.md` 작성**

```markdown
# 임금인상 시나리오 계산기

노동조합 임금교섭 준비용 웹 계산기입니다. 현행 임금·실수령액, 인상 시나리오 비교, 임금인상률 추이, 교섭 참고정보를 한 화면에서 확인할 수 있습니다.

## 로컬에서 미리보기

브라우저 ES 모듈은 `file://`로 열면 CORS 문제로 동작하지 않습니다. 로컬 정적 서버로 띄워서 확인하세요.

\`\`\`bash
python3 -m http.server 8000
# 이후 http://localhost:8000 접속
\`\`\`

## 계산 로직 테스트

\`\`\`bash
npm test
\`\`\`

## 배포

GitHub Pages가 저장소 루트를 정적 파일 그대로 서빙합니다. 별도 빌드 단계가 없습니다.

## 데이터 갱신

- `js/data/wage-table.js`: 직급별 임금테이블 (실제 조합 데이터로 교체 필요)
- `js/data/tax-rules.js`: 4대보험 요율, 소득세 계산 상수 (연도가 바뀌면 갱신)
- `js/data/reference-data.js`: 최저임금·물가상승률·산업평균 인상률·경영지표·조합 자체 인상률 이력
```

- [ ] **Step 6: `.gitignore` 작성**

```
.DS_Store
node_modules/
```

- [ ] **Step 7: 로컬 서버로 수동 확인**

Run: `python3 -m http.server 8000` (백그라운드 실행 후) 브라우저에서 `http://localhost:8000` 접속
Expected: 헤더, 4개 탭 버튼, 빈 패널이 보이고 탭 버튼 클릭 시 활성 탭이 그린 색상 밑줄로 전환됨 (패널 내용은 아직 비어 있음 — 정상)

- [ ] **Step 8: Commit**

```bash
git add index.html css/style.css package.json README.md .gitignore js/main.js
git commit -m "Add static site scaffold with tab navigation"
```

---

### Task 2: 세율 데이터 (`tax-rules.js`)

**Files:**
- Create: `js/data/tax-rules.js`
- Test: `tests/tax-rules.test.mjs`

**Interfaces:**
- Produces: `taxRules` 객체 — `insurance.{nationalPensionRate, nationalPensionFloor, nationalPensionCap, healthInsuranceRate, longTermCareRateOfHealth, employmentInsuranceRate}`, `incomeTax.{personalDeductionPerPerson, earnedIncomeDeductionBrackets[], taxBrackets[], earnedIncomeTaxCreditLowMax, earnedIncomeTaxCreditLowRate, earnedIncomeTaxCreditHighRate, earnedIncomeTaxCreditLowBase, earnedIncomeTaxCreditLimit{...}}`, `localIncomeTaxRate`. Task 4(`net-pay.js`)가 이 구조를 그대로 소비한다.

- [ ] **Step 1: 실패하는 스모크 테스트 작성**

```js
// tests/tax-rules.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taxRules } from '../js/data/tax-rules.js';

test('taxRules has required insurance rates', () => {
  assert.equal(taxRules.insurance.nationalPensionRate, 0.0475);
  assert.equal(taxRules.insurance.healthInsuranceRate, 0.03595);
  assert.equal(taxRules.insurance.longTermCareRateOfHealth, 0.1295);
  assert.equal(taxRules.insurance.employmentInsuranceRate, 0.009);
});

test('taxRules income tax brackets cover from 0 to Infinity without gaps', () => {
  const brackets = taxRules.incomeTax.taxBrackets;
  assert.equal(brackets[0].from, 0);
  assert.equal(brackets[brackets.length - 1].upTo, Infinity);
  for (let i = 1; i < brackets.length; i++) {
    assert.equal(brackets[i].from, brackets[i - 1].upTo, `gap between bracket ${i - 1} and ${i}`);
  }
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test tests/tax-rules.test.mjs`
Expected: FAIL (`Cannot find module '../js/data/tax-rules.js'`)

- [ ] **Step 3: `js/data/tax-rules.js` 작성**

```js
// 2026년 7월~2027년 6월 기준 4대보험 요율/국민연금 상하한액.
// 출처: 국민연금공단(nps.or.kr) 2026.7 기준소득월액 상하한 고시, 2026년 4대보험 요율 안내(고용노동부 발표 기준 정리자료).
// 근로소득세 계산은 국세청 근로소득 간이세액표 산출에 쓰이는 계산식(근로소득공제 → 인적공제 → 종합소득세율표 → 근로소득세액공제)을 재현한 것으로,
// 실제 간이세액표 조견표 값과 약간의 차이가 있을 수 있는 근사치입니다.
export const taxRules = {
  year: 2026,
  effectivePeriod: '2026-07 ~ 2027-06',
  insurance: {
    nationalPensionRate: 0.0475,
    nationalPensionFloor: 410000,
    nationalPensionCap: 6590000,
    healthInsuranceRate: 0.03595,
    longTermCareRateOfHealth: 0.1295,
    employmentInsuranceRate: 0.009,
  },
  incomeTax: {
    personalDeductionPerPerson: 1500000,
    earnedIncomeDeductionBrackets: [
      { from: 0, upTo: 5000000, base: 0, rate: 0.7 },
      { from: 5000000, upTo: 15000000, base: 3500000, rate: 0.4 },
      { from: 15000000, upTo: 45000000, base: 7500000, rate: 0.15 },
      { from: 45000000, upTo: 100000000, base: 12000000, rate: 0.05 },
      { from: 100000000, upTo: Infinity, base: 14750000, rate: 0.02 },
    ],
    taxBrackets: [
      { from: 0, upTo: 14000000, base: 0, rate: 0.06 },
      { from: 14000000, upTo: 50000000, base: 840000, rate: 0.15 },
      { from: 50000000, upTo: 88000000, base: 6240000, rate: 0.24 },
      { from: 88000000, upTo: 150000000, base: 15360000, rate: 0.35 },
      { from: 150000000, upTo: 300000000, base: 37060000, rate: 0.38 },
      { from: 300000000, upTo: 500000000, base: 94060000, rate: 0.4 },
      { from: 500000000, upTo: 1000000000, base: 174060000, rate: 0.42 },
      { from: 1000000000, upTo: Infinity, base: 384060000, rate: 0.45 },
    ],
    earnedIncomeTaxCreditLowMax: 1300000,
    earnedIncomeTaxCreditLowRate: 0.55,
    earnedIncomeTaxCreditHighRate: 0.3,
    earnedIncomeTaxCreditLowBase: 715000,
    earnedIncomeTaxCreditLimit: {
      tier1Max: 33000000,
      tier1Limit: 740000,
      tier2Max: 70000000,
      tier2Base: 740000,
      tier2Rate: 0.008,
      tier2Min: 660000,
      tier3Base: 660000,
      tier3Rate: 0.5,
      tier3Min: 500000,
    },
  },
  localIncomeTaxRate: 0.1,
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/tax-rules.test.mjs`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add js/data/tax-rules.js tests/tax-rules.test.mjs
git commit -m "Add 2026 insurance/income-tax rule constants"
```

---

### Task 3: 임금테이블·참고정보 데이터

**Files:**
- Create: `js/data/wage-table.js`
- Create: `js/data/reference-data.js`
- Test: `tests/data-schema.test.mjs`

**Interfaces:**
- Produces: `wageTable` = `[{ grade: string, items: [{ name: string, amount: number, taxable: boolean }] }]` (5개 직급, 실제 조합 데이터로 추후 교체 예정). `referenceData` = `{ minimumWage[], cpi[], industryAverageIncrease[], companyFinancials[], unionWageHistory[] }`. Task 4~11이 이 두 데이터를 그대로 소비한다.

- [ ] **Step 1: 실패하는 스키마 테스트 작성**

```js
// tests/data-schema.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wageTable } from '../js/data/wage-table.js';
import { referenceData } from '../js/data/reference-data.js';

test('wageTable has 5 grades, each with taxable/non-taxable items', () => {
  assert.equal(wageTable.length, 5);
  wageTable.forEach((grade) => {
    assert.ok(typeof grade.grade === 'string' && grade.grade.length > 0);
    assert.ok(Array.isArray(grade.items) && grade.items.length > 0);
    grade.items.forEach((item) => {
      assert.ok(typeof item.name === 'string');
      assert.ok(typeof item.amount === 'number');
      assert.ok(typeof item.taxable === 'boolean');
    });
  });
});

test('every grade shares the same item names (needed for table columns)', () => {
  const firstNames = wageTable[0].items.map((i) => i.name).sort();
  wageTable.forEach((grade) => {
    assert.deepEqual(grade.items.map((i) => i.name).sort(), firstNames);
  });
});

test('referenceData has all four reference datasets populated', () => {
  assert.ok(referenceData.minimumWage.length >= 5);
  assert.ok(referenceData.cpi.length >= 5);
  assert.ok(referenceData.industryAverageIncrease.length >= 3);
  assert.ok(referenceData.unionWageHistory.length >= 1);
  assert.ok(Array.isArray(referenceData.companyFinancials));
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test tests/data-schema.test.mjs`
Expected: FAIL (모듈을 찾을 수 없음)

- [ ] **Step 3: `js/data/wage-table.js` 작성 (예시 데이터 — 실제 조합 임금테이블로 교체 필요)**

```js
// 예시(샘플) 데이터입니다. 실제 조합 임금테이블/임금협약서 내용으로 반드시 교체해야 합니다.
// 이 사업장은 호봉제가 아니며 직급 단위로 임금이 결정됩니다.
export const wageTable = [
  {
    grade: '5급',
    items: [
      { name: '기본급', amount: 2200000, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '4급',
    items: [
      { name: '기본급', amount: 2500000, taxable: true },
      { name: '직책수당', amount: 0, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '3급',
    items: [
      { name: '기본급', amount: 2900000, taxable: true },
      { name: '직책수당', amount: 100000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '2급',
    items: [
      { name: '기본급', amount: 3400000, taxable: true },
      { name: '직책수당', amount: 200000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
  {
    grade: '1급',
    items: [
      { name: '기본급', amount: 4000000, taxable: true },
      { name: '직책수당', amount: 300000, taxable: true },
      { name: '식대', amount: 200000, taxable: false },
    ],
  },
];
```

- [ ] **Step 4: `js/data/reference-data.js` 작성 (2026년 7월 기준 확인된 실데이터)**

```js
export const referenceData = {
  // 출처: 고용노동부 최저임금 고시 (moel.go.kr), 2026년 최저임금 10,320원(전년 대비 +2.9%) 확정.
  minimumWage: [
    { year: 2017, hourlyWage: 6470, increaseRate: null },
    { year: 2018, hourlyWage: 7530, increaseRate: 16.4 },
    { year: 2019, hourlyWage: 8350, increaseRate: 10.9 },
    { year: 2020, hourlyWage: 8590, increaseRate: 2.9 },
    { year: 2021, hourlyWage: 8720, increaseRate: 1.5 },
    { year: 2022, hourlyWage: 9160, increaseRate: 5.05 },
    { year: 2023, hourlyWage: 9620, increaseRate: 5.0 },
    { year: 2024, hourlyWage: 9860, increaseRate: 2.5 },
    { year: 2025, hourlyWage: 10030, increaseRate: 1.7 },
    { year: 2026, hourlyWage: 10320, increaseRate: 2.9 },
  ],

  // 출처: 통계청 소비자물가동향(kostat.go.kr), 전년 대비 연간 상승률.
  cpi: [
    { year: 2017, increaseRate: 1.9 },
    { year: 2018, increaseRate: 1.5 },
    { year: 2019, increaseRate: 0.4 },
    { year: 2020, increaseRate: 0.5 },
    { year: 2021, increaseRate: 2.5 },
    { year: 2022, increaseRate: 5.1 },
    { year: 2023, increaseRate: 3.6 },
    { year: 2024, increaseRate: 2.3 },
    { year: 2025, increaseRate: 2.1 },
  ],

  // 출처: 고용노동부 임금결정현황조사 - 상용근로자 100인 이상 사업장 협약임금인상률(전산업, 임금총액 기준).
  // 2025년 확정치는 발표 후 업데이트가 필요합니다.
  industryAverageIncrease: [
    { year: 2021, rate: 3.6 },
    { year: 2022, rate: 4.7 },
    { year: 2023, rate: 4.2 },
    { year: 2024, rate: 3.6 },
  ],

  // 사용자가 직접 입력해 관리하는 항목입니다. 예시로 비워둡니다.
  companyFinancials: [],

  // 예시(샘플) 데이터입니다. 실제 조합 임금협약 이력으로 교체해야 합니다.
  unionWageHistory: [
    { year: 2023, type: '정률', rate: 4.5, note: '' },
    { year: 2024, type: '정률+정액', rate: 3.8, note: '기본급 3.0% + 일괄 5만원' },
    { year: 2025, type: '정률', rate: 2.9, note: '' },
  ],
};
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `node --test tests/data-schema.test.mjs`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add js/data/wage-table.js js/data/reference-data.js tests/data-schema.test.mjs
git commit -m "Add sample wage table and reference dataset"
```

---

### Task 4: 실수령액 계산 (`net-pay.js`)

**Files:**
- Create: `js/calc/net-pay.js`
- Test: `tests/net-pay.test.mjs`

**Interfaces:**
- Consumes: `taxRules` (Task 2), 임금 항목 배열 `[{name, amount, taxable}]` (Task 3와 동일한 shape)
- Produces: `calculateNetPay(items, dependents, taxRules) -> { totalWage, taxableGross, nonTaxable, insurance: {nationalPension, healthInsurance, longTermCare, employmentInsurance, total}, tax: {incomeTax, localIncomeTax, total}, totalDeduction, netPay }`. Task 7(현황 탭), Task 10(시나리오 탭)이 이 함수를 그대로 호출한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/net-pay.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateNetPay } from '../js/calc/net-pay.js';
import { taxRules } from '../js/data/tax-rules.js';

test('calculateNetPay: 월 300만원(과세), 부양가족 1인 기준', () => {
  const items = [{ name: '기본급', amount: 3000000, taxable: true }];
  const result = calculateNetPay(items, 1, taxRules);

  assert.equal(result.totalWage, 3000000);
  assert.equal(result.taxableGross, 3000000);
  assert.equal(result.nonTaxable, 0);
  assert.equal(result.insurance.nationalPension, 142500);
  assert.equal(result.insurance.healthInsurance, 107850);
  assert.equal(result.insurance.longTermCare, 13960);
  assert.equal(result.insurance.employmentInsurance, 27000);
  assert.equal(result.insurance.total, 291310);
  assert.equal(result.tax.incomeTax, 133000);
  assert.equal(result.tax.localIncomeTax, 13300);
  assert.equal(result.tax.total, 146300);
  assert.equal(result.totalDeduction, 437610);
  assert.equal(result.netPay, 2562390);
});

test('calculateNetPay: 비과세 항목은 소득세·보험료 산정에서 제외되지만 총 임금에는 포함된다', () => {
  const items = [
    { name: '기본급', amount: 2800000, taxable: true },
    { name: '식대', amount: 200000, taxable: false },
  ];
  const result = calculateNetPay(items, 1, taxRules);

  assert.equal(result.totalWage, 3000000);
  assert.equal(result.taxableGross, 2800000);
  assert.equal(result.nonTaxable, 200000);
  assert.equal(result.netPay, result.totalWage - result.totalDeduction);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test tests/net-pay.test.mjs`
Expected: FAIL (`Cannot find module '../js/calc/net-pay.js'`)

- [ ] **Step 3: `js/calc/net-pay.js` 구현**

```js
function floorTo(value, unit) {
  return Math.floor(value / unit) * unit;
}

function findBracket(brackets, amount) {
  return brackets.find((b) => amount <= b.upTo);
}

export function sumTotalWage(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function sumTaxableGross(items) {
  return items.filter((item) => item.taxable).reduce((sum, item) => sum + item.amount, 0);
}

export function sumNonTaxable(items) {
  return items.filter((item) => !item.taxable).reduce((sum, item) => sum + item.amount, 0);
}

export function calcInsurance(monthlyTaxableGross, taxRules) {
  const { insurance } = taxRules;
  const pensionBase = Math.min(
    Math.max(monthlyTaxableGross, insurance.nationalPensionFloor),
    insurance.nationalPensionCap
  );
  const nationalPension = floorTo(pensionBase * insurance.nationalPensionRate, 10);
  const healthInsurance = floorTo(monthlyTaxableGross * insurance.healthInsuranceRate, 10);
  const longTermCare = floorTo(healthInsurance * insurance.longTermCareRateOfHealth, 10);
  const employmentInsurance = floorTo(monthlyTaxableGross * insurance.employmentInsuranceRate, 10);
  const total = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  return { nationalPension, healthInsurance, longTermCare, employmentInsurance, total };
}

export function calcIncomeTax(monthlyTaxableGross, dependents, taxRules) {
  const { incomeTax } = taxRules;
  const annualGross = monthlyTaxableGross * 12;

  const deductionBracket = findBracket(incomeTax.earnedIncomeDeductionBrackets, annualGross);
  const earnedIncomeDeduction =
    deductionBracket.base + (annualGross - deductionBracket.from) * deductionBracket.rate;
  const earnedIncomeAmount = annualGross - earnedIncomeDeduction;

  const personalDeduction = dependents * incomeTax.personalDeductionPerPerson;
  const taxBase = Math.max(earnedIncomeAmount - personalDeduction, 0);

  const taxBracket = findBracket(incomeTax.taxBrackets, taxBase);
  const calculatedTax = taxBracket.base + (taxBase - taxBracket.from) * taxBracket.rate;

  const credit =
    calculatedTax <= incomeTax.earnedIncomeTaxCreditLowMax
      ? calculatedTax * incomeTax.earnedIncomeTaxCreditLowRate
      : incomeTax.earnedIncomeTaxCreditLowBase +
        (calculatedTax - incomeTax.earnedIncomeTaxCreditLowMax) * incomeTax.earnedIncomeTaxCreditHighRate;

  const limitCfg = incomeTax.earnedIncomeTaxCreditLimit;
  const creditLimit =
    annualGross <= limitCfg.tier1Max
      ? limitCfg.tier1Limit
      : annualGross <= limitCfg.tier2Max
      ? Math.max(limitCfg.tier2Base - (annualGross - limitCfg.tier1Max) * limitCfg.tier2Rate, limitCfg.tier2Min)
      : Math.max(limitCfg.tier3Base - (annualGross - limitCfg.tier2Max) * limitCfg.tier3Rate, limitCfg.tier3Min);

  const finalCredit = Math.min(credit, creditLimit);
  const annualFinalTax = Math.max(calculatedTax - finalCredit, 0);

  const incomeTaxMonthly = floorTo(annualFinalTax / 12, 1000);
  const localIncomeTaxMonthly = floorTo(incomeTaxMonthly * taxRules.localIncomeTaxRate, 10);

  return {
    incomeTax: incomeTaxMonthly,
    localIncomeTax: localIncomeTaxMonthly,
    total: incomeTaxMonthly + localIncomeTaxMonthly,
  };
}

export function calculateNetPay(items, dependents, taxRules) {
  const totalWage = sumTotalWage(items);
  const taxableGross = sumTaxableGross(items);
  const nonTaxable = sumNonTaxable(items);

  const insurance = calcInsurance(taxableGross, taxRules);
  const tax = calcIncomeTax(taxableGross, dependents, taxRules);

  const totalDeduction = insurance.total + tax.total;
  const netPay = totalWage - totalDeduction;

  return { totalWage, taxableGross, nonTaxable, insurance, tax, totalDeduction, netPay };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/net-pay.test.mjs`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add js/calc/net-pay.js tests/net-pay.test.mjs
git commit -m "Implement net pay calculation (insurance + income tax)"
```

---

### Task 5: 시나리오 적용 로직 (`scenario.js`)

**Files:**
- Create: `js/calc/scenario.js`
- Test: `tests/scenario.test.mjs`

**Interfaces:**
- Consumes: 임금 항목 배열 `[{name, amount, taxable}]` (Task 3)
- Produces: `applyAdjustments(items, adjustments) -> items`, `addItem(items, newItem) -> items`, `applyScenarioToGrade(items, scenario) -> items`, `applyScenarioToWageTable(wageTable, scenario) -> wageTable`. `scenario` shape: `{ name: string, adjustments: [{itemName, type: 'percent'|'fixed', value}], newItems: [{name, amount, taxable}] }`. Task 10(시나리오 탭)이 이 4개 함수를 그대로 사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```js
// tests/scenario.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAdjustments,
  addItem,
  applyScenarioToGrade,
  applyScenarioToWageTable,
} from '../js/calc/scenario.js';

const baseItems = [
  { name: '기본급', amount: 2500000, taxable: true },
  { name: '직책수당', amount: 200000, taxable: true },
  { name: '식대', amount: 200000, taxable: false },
];

test('applyAdjustments: 정률과 정액을 항목별로 다르게 적용', () => {
  const result = applyAdjustments(baseItems, [
    { itemName: '기본급', type: 'percent', value: 5 },
    { itemName: '직책수당', type: 'fixed', value: 10000 },
  ]);
  assert.equal(result.find((i) => i.name === '기본급').amount, 2625000);
  assert.equal(result.find((i) => i.name === '직책수당').amount, 210000);
  assert.equal(result.find((i) => i.name === '식대').amount, 200000);
  assert.equal(baseItems.find((i) => i.name === '기본급').amount, 2500000, '원본 배열은 변경되지 않아야 함');
});

test('addItem: 새 항목을 추가하고, 중복 이름은 에러를 던진다', () => {
  const result = addItem(baseItems, { name: '명절수당', amount: 100000, taxable: true });
  assert.equal(result.length, 4);
  assert.equal(result.find((i) => i.name === '명절수당').amount, 100000);
  assert.throws(() => addItem(baseItems, { name: '기본급', amount: 1, taxable: true }));
});

test('applyScenarioToGrade: 신설 항목 추가 후 인상 적용까지 한 번에 처리', () => {
  const scenario = {
    name: '조합안',
    adjustments: [{ itemName: '기본급', type: 'percent', value: 5 }],
    newItems: [{ name: '명절수당', amount: 100000, taxable: true }],
  };
  const result = applyScenarioToGrade(baseItems, scenario);
  assert.equal(result.length, 4);
  assert.equal(result.find((i) => i.name === '기본급').amount, 2625000);
  assert.equal(result.find((i) => i.name === '명절수당').amount, 100000);
});

test('applyScenarioToWageTable: 전체 직급표에 동일 시나리오를 일괄 적용', () => {
  const wageTable = [
    { grade: '1급', items: baseItems },
    { grade: '2급', items: [{ name: '기본급', amount: 3000000, taxable: true }] },
  ];
  const scenario = { name: '조합안', adjustments: [{ itemName: '기본급', type: 'percent', value: 10 }], newItems: [] };
  const result = applyScenarioToWageTable(wageTable, scenario);
  assert.equal(result[0].items.find((i) => i.name === '기본급').amount, 2750000);
  assert.equal(result[1].items.find((i) => i.name === '기본급').amount, 3300000);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test tests/scenario.test.mjs`
Expected: FAIL (`Cannot find module '../js/calc/scenario.js'`)

- [ ] **Step 3: `js/calc/scenario.js` 구현**

```js
export function applyAdjustments(items, adjustments) {
  const adjustmentMap = new Map(adjustments.map((a) => [a.itemName, a]));
  return items.map((item) => {
    const adjustment = adjustmentMap.get(item.name);
    if (!adjustment) return { ...item };
    const newAmount =
      adjustment.type === 'percent'
        ? Math.round(item.amount * (1 + adjustment.value / 100))
        : item.amount + adjustment.value;
    return { ...item, amount: newAmount };
  });
}

export function addItem(items, newItem) {
  if (items.some((item) => item.name === newItem.name)) {
    throw new Error(`이미 존재하는 항목입니다: ${newItem.name}`);
  }
  return [...items, { ...newItem }];
}

export function applyScenarioToGrade(items, scenario) {
  const withNewItems = (scenario.newItems || []).reduce((acc, newItem) => addItem(acc, newItem), items);
  return applyAdjustments(withNewItems, scenario.adjustments || []);
}

export function applyScenarioToWageTable(wageTable, scenario) {
  return wageTable.map((grade) => ({
    ...grade,
    items: applyScenarioToGrade(grade.items, scenario),
  }));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/scenario.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add js/calc/scenario.js tests/scenario.test.mjs
git commit -m "Implement scenario adjustment logic"
```

---

### Task 6: 추이 차트 렌더러 (`trend-chart.js`)

**Files:**
- Create: `js/charts/trend-chart.js`
- Test: `tests/trend-chart.test.mjs`

**Interfaces:**
- Produces: `computeDomain(series) -> {xMin, xMax, yMin, yMax}`, `scalePoint(point, domain, range) -> {px, py}` (순수 함수, Node 테스트 대상), `renderLineChart(container, series, options) -> SVGElement` (DOM 필요, 브라우저에서 수동 확인). `series` shape: `[{label, color, data: [{x, y}]}]`. Task 8(추이 탭), Task 9(참고정보 탭)이 `renderLineChart`를 그대로 사용한다.

- [ ] **Step 1: 순수 함수(`computeDomain`, `scalePoint`)에 대한 실패 테스트 작성**

```js
// tests/trend-chart.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDomain, scalePoint } from '../js/charts/trend-chart.js';

test('computeDomain: y축 최소값은 0 이하로, 최대값은 10% 여유를 둔다', () => {
  const series = [{ data: [{ x: 2020, y: 2 }, { x: 2021, y: 8 }] }];
  const domain = computeDomain(series);
  assert.equal(domain.xMin, 2020);
  assert.equal(domain.xMax, 2021);
  assert.equal(domain.yMin, 0);
  assert.equal(domain.yMax, 8.8);
});

test('scalePoint: 도메인 좌표를 픽셀 좌표로 변환한다', () => {
  const domain = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
  const range = { left: 0, right: 100, top: 0, bottom: 100 };
  const result = scalePoint({ x: 5, y: 5 }, domain, range);
  assert.equal(result.px, 50);
  assert.equal(result.py, 50);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test tests/trend-chart.test.mjs`
Expected: FAIL (`Cannot find module '../js/charts/trend-chart.js'`)

- [ ] **Step 3: `js/charts/trend-chart.js` 구현 (순수 함수 + SVG 렌더링)**

```js
const SVG_NS = 'http://www.w3.org/2000/svg';

export function computeDomain(series) {
  const points = series.flatMap((s) => s.data);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(0, ...ys),
    yMax: Math.max(...ys) * 1.1,
  };
}

export function scalePoint(point, domain, range) {
  const xRatio = domain.xMax === domain.xMin ? 0 : (point.x - domain.xMin) / (domain.xMax - domain.xMin);
  const yRatio = domain.yMax === domain.yMin ? 0 : (point.y - domain.yMin) / (domain.yMax - domain.yMin);
  const px = range.left + xRatio * (range.right - range.left);
  const py = range.bottom - yRatio * (range.bottom - range.top);
  return { px, py };
}

function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  return e;
}

export function buildLineChartSvg(series, options = {}) {
  const width = options.width ?? 640;
  const height = options.height ?? 320;
  const padding = { left: 50, right: 20, top: 20, bottom: 40 };
  const range = { left: padding.left, right: width - padding.right, top: padding.top, bottom: height - padding.bottom };
  const domain = computeDomain(series);

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, class: 'trend-chart' });

  svg.appendChild(svgEl('line', { x1: range.left, y1: range.bottom, x2: range.right, y2: range.bottom, stroke: '#999999' }));
  svg.appendChild(svgEl('line', { x1: range.left, y1: range.top, x2: range.left, y2: range.bottom, stroke: '#999999' }));

  const uniqueYears = [...new Set(series.flatMap((s) => s.data.map((p) => p.x)))].sort((a, b) => a - b);
  uniqueYears.forEach((year) => {
    const { px } = scalePoint({ x: year, y: domain.yMin }, domain, range);
    const label = svgEl('text', { x: px, y: range.bottom + 16, 'text-anchor': 'middle', class: 'chart-axis-label' });
    label.textContent = year;
    svg.appendChild(label);
  });

  series.forEach((s) => {
    const sortedData = [...s.data].sort((a, b) => a.x - b.x);
    const pathD = sortedData
      .map((p, i) => {
        const { px, py } = scalePoint(p, domain, range);
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
      })
      .join(' ');
    svg.appendChild(svgEl('path', { d: pathD, fill: 'none', stroke: s.color || '#111111', 'stroke-width': 2 }));
    sortedData.forEach((p) => {
      const { px, py } = scalePoint(p, domain, range);
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: 3, fill: s.color || '#111111' }));
    });
  });

  return svg;
}

export function renderLineChart(container, series, options) {
  container.innerHTML = '';
  const svg = buildLineChartSvg(series, options);
  container.appendChild(svg);
  return svg;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/trend-chart.test.mjs`
Expected: PASS (2 tests) — `buildLineChartSvg`/`renderLineChart`는 `document`가 필요해 Node 테스트 대상이 아니며, Task 8~9에서 브라우저로 시각 확인한다.

- [ ] **Step 5: Commit**

```bash
git add js/charts/trend-chart.js tests/trend-chart.test.mjs
git commit -m "Add SVG line chart renderer for trend/reference tabs"
```

---

### Task 7: 현황 탭 UI

**Files:**
- Create: `js/ui/status-tab.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `wageTable`(Task 3), `taxRules`(Task 2), `calculateNetPay`(Task 4)
- Produces: `renderStatusTab(container, {wageTable, taxRules}) -> { getSelectedGrade: () => string }`. Task 10(시나리오 탭)이 `getSelectedGrade`를 사용하고, Task 11(내보내기)이 `#status-export-btn`/`#status-table-wrapper` DOM id를 사용한다.

- [ ] **Step 1: `js/ui/status-tab.js` 작성**

```js
import { calculateNetPay } from '../calc/net-pay.js';

function formatWon(amount) {
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

export function renderStatusTab(container, { wageTable, taxRules }) {
  let selectedGrade = wageTable[0].grade;

  function computeRows() {
    return wageTable.map((grade) => ({
      grade: grade.grade,
      items: grade.items,
      netPayResult: calculateNetPay(grade.items, 1, taxRules),
    }));
  }

  function render() {
    const rows = computeRows();
    const selectedRow = rows.find((r) => r.grade === selectedGrade);
    const itemNames = wageTable[0].items.map((item) => item.name);

    container.innerHTML = `
      <div class="card summary-card">
        <h2>${selectedRow.grade} 기준 요약</h2>
        <div class="summary-grid">
          <div><span class="summary-label">임금 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalWage)}</span></div>
          <div><span class="summary-label">공제 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalDeduction)}</span></div>
          <div><span class="summary-label">실수령액</span><span class="summary-value accent">${formatWon(selectedRow.netPayResult.netPay)}</span></div>
        </div>
      </div>
      <div class="table-wrapper" id="status-table-wrapper">
        <table class="wage-table">
          <thead>
            <tr>
              <th>직급</th>
              ${itemNames.map((name) => `<th>${name}</th>`).join('')}
              <th>임금 총액</th>
              <th>공제 총액</th>
              <th>실수령액</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr data-grade="${row.grade}" class="${row.grade === selectedGrade ? 'row-selected' : ''}">
                <td>${row.grade}</td>
                ${row.items.map((item) => `<td>${formatWon(item.amount)}</td>`).join('')}
                <td>${formatWon(row.netPayResult.totalWage)}</td>
                <td>${formatWon(row.netPayResult.totalDeduction)}</td>
                <td class="accent">${formatWon(row.netPayResult.netPay)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <button class="btn export-btn" id="status-export-btn" type="button">이미지로 저장</button>
    `;

    container.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('click', () => {
        selectedGrade = row.dataset.grade;
        render();
      });
    });
  }

  render();

  return {
    getSelectedGrade: () => selectedGrade,
  };
}
```

- [ ] **Step 2: `js/main.js`에 현황 탭 연결**

`js/main.js` 맨 위에 import를 추가하고, 탭 전환 코드 아래에 렌더 호출을 추가한다:

```js
import { wageTable } from './data/wage-table.js';
import { taxRules } from './data/tax-rules.js';
import { renderStatusTab } from './ui/status-tab.js';

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
  });
});

const statusApi = renderStatusTab(document.getElementById('tab-status'), { wageTable, taxRules });
```

- [ ] **Step 3: 브라우저에서 수동 확인**

Run: (로컬 서버가 떠 있지 않다면) `python3 -m http.server 8000`, 브라우저에서 `http://localhost:8000` 새로고침
Expected: 현황 탭에 5개 직급 전체가 표로 보이고, 기본으로 `5급` 행이 그린 배경으로 강조되어 있으며 상단 요약 카드에 5급 기준 금액이 표시됨. 다른 행을 클릭하면 강조와 요약 카드가 즉시 바뀜.

- [ ] **Step 4: Commit**

```bash
git add js/ui/status-tab.js js/main.js
git commit -m "Add status tab: full wage table with selectable grade"
```

---

### Task 8: 추이 탭 UI

**Files:**
- Create: `js/ui/trend-tab.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `referenceData.unionWageHistory`(Task 3), `renderLineChart`(Task 6)
- Produces: `renderTrendTab(container, {referenceData})` (반환값 없음)

- [ ] **Step 1: `js/ui/trend-tab.js` 작성**

```js
import { renderLineChart } from '../charts/trend-chart.js';

export function renderTrendTab(container, { referenceData }) {
  container.innerHTML = `
    <div class="card">
      <h2>조합 자체 임금인상률 추이</h2>
      <div id="union-trend-chart"></div>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>인상 방식</th><th>인상률</th><th>비고</th></tr></thead>
        <tbody>
          ${referenceData.unionWageHistory
            .map(
              (row) => `
            <tr>
              <td>${row.year}</td>
              <td>${row.type}</td>
              <td>${row.rate}%</td>
              <td>${row.note || '-'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  renderLineChart(
    container.querySelector('#union-trend-chart'),
    [
      {
        label: '조합 임금인상률',
        color: 'rgb(0, 188, 112)',
        data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
      },
    ],
    { width: 640, height: 320 }
  );
}
```

- [ ] **Step 2: `js/main.js`에 연결**

```js
import { referenceData } from './data/reference-data.js';
import { renderTrendTab } from './ui/trend-tab.js';

renderTrendTab(document.getElementById('tab-trend'), { referenceData });
```

(이미 존재하는 `renderStatusTab(...)` 호출 다음 줄에 추가)

- [ ] **Step 3: 브라우저에서 수동 확인**

Expected: 추이 탭 클릭 시 2023~2025년 3개 점을 잇는 그린 라인 차트와 하단에 동일 데이터 표가 보임.

- [ ] **Step 4: Commit**

```bash
git add js/ui/trend-tab.js js/main.js
git commit -m "Add trend tab: union wage increase history chart"
```

---

### Task 9: 참고정보 탭 UI

**Files:**
- Create: `js/ui/reference-tab.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `referenceData`(Task 3, 전체 필드), `renderLineChart`(Task 6)
- Produces: `renderReferenceTab(container, {referenceData})` (반환값 없음)

- [ ] **Step 1: `js/ui/reference-tab.js` 작성**

```js
import { renderLineChart } from '../charts/trend-chart.js';

export function renderReferenceTab(container, { referenceData }) {
  container.innerHTML = `
    <div class="card">
      <h2>인상률 비교 (조합 · 최저임금 · 물가상승률 · 산업평균)</h2>
      <div id="reference-overlay-chart"></div>
      <div class="chart-legend">
        <span class="legend-item"><i style="background: rgb(0,188,112)"></i>조합</span>
        <span class="legend-item"><i style="background: #111111"></i>최저임금</span>
        <span class="legend-item"><i style="background: #999999"></i>물가상승률</span>
        <span class="legend-item"><i style="background: #cccccc"></i>산업평균(협약임금)</span>
      </div>
    </div>
    <div class="card">
      <h2>역대 최저임금 인상률</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>시급</th><th>인상률</th></tr></thead>
        <tbody>
          ${referenceData.minimumWage
            .map(
              (row) =>
                `<tr><td>${row.year}</td><td>${row.hourlyWage.toLocaleString('ko-KR')}원</td><td>${row.increaseRate ?? '-'}%</td></tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>소비자물가상승률</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>물가상승률</th></tr></thead>
        <tbody>
          ${referenceData.cpi.map((row) => `<tr><td>${row.year}</td><td>${row.increaseRate}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>동종/전산업 평균 임금인상률 (협약임금인상률, 100인 이상 사업장)</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>인상률</th></tr></thead>
        <tbody>
          ${referenceData.industryAverageIncrease.map((row) => `<tr><td>${row.year}</td><td>${row.rate}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card">
      <h2>기업 경영지표</h2>
      <table class="wage-table">
        <thead><tr><th>연도</th><th>영업이익</th><th>당기순이익</th></tr></thead>
        <tbody>
          ${
            referenceData.companyFinancials.length
              ? referenceData.companyFinancials
                  .map(
                    (row) =>
                      `<tr><td>${row.year}</td><td>${row.operatingProfit.toLocaleString('ko-KR')}원</td><td>${row.netProfit.toLocaleString('ko-KR')}원</td></tr>`
                  )
                  .join('')
              : '<tr><td colspan="3">등록된 경영지표가 없습니다. js/data/reference-data.js의 companyFinancials 배열에 값을 추가하세요.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  const series = [
    {
      label: '조합',
      color: 'rgb(0, 188, 112)',
      data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
    },
    {
      label: '최저임금',
      color: '#111111',
      data: referenceData.minimumWage
        .filter((row) => row.increaseRate != null)
        .map((row) => ({ x: row.year, y: row.increaseRate })),
    },
    {
      label: '물가상승률',
      color: '#999999',
      data: referenceData.cpi.map((row) => ({ x: row.year, y: row.increaseRate })),
    },
    {
      label: '산업평균',
      color: '#cccccc',
      data: referenceData.industryAverageIncrease.map((row) => ({ x: row.year, y: row.rate })),
    },
  ];

  renderLineChart(container.querySelector('#reference-overlay-chart'), series, { width: 640, height: 320 });
}
```

- [ ] **Step 2: `js/main.js`에 연결**

```js
import { renderReferenceTab } from './ui/reference-tab.js';

renderReferenceTab(document.getElementById('tab-reference'), { referenceData });
```

(`renderTrendTab(...)` 호출 다음 줄에 추가)

- [ ] **Step 3: 브라우저에서 수동 확인**

Expected: 참고정보 탭에 4개 시리즈가 겹친 라인 차트(범례 포함)와 4개의 데이터 표(최저임금/물가상승률/산업평균/경영지표)가 순서대로 보임. 경영지표 표에는 "등록된 경영지표가 없습니다" 안내가 보임(정상 — companyFinancials가 빈 배열).

- [ ] **Step 4: Commit**

```bash
git add js/ui/reference-tab.js js/main.js
git commit -m "Add reference tab: minimum wage, CPI, industry, financials"
```

---

### Task 10: 시나리오 탭 UI

**Files:**
- Create: `js/ui/scenario-tab.js`
- Modify: `js/main.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `wageTable`(Task 3), `taxRules`(Task 2), `calculateNetPay`(Task 4), `applyScenarioToGrade`(Task 5), `statusApi.getSelectedGrade`(Task 7)
- Produces: `renderScenarioTab(container, {wageTable, taxRules, getSelectedGrade}) -> { refreshComparison: () => void }`. Task 11이 `refreshComparison`을 탭 전환 시 호출하고, `#scenario-export-target`/`#scenario-export-btn`을 내보내기에 사용한다.

- [ ] **Step 1: `js/ui/scenario-tab.js` 작성**

```js
import { applyScenarioToGrade } from '../calc/scenario.js';
import { calculateNetPay } from '../calc/net-pay.js';

function formatWon(amount) {
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

let nextScenarioId = 1;

function createScenario() {
  const id = nextScenarioId++;
  return { id, name: `시나리오 ${id}`, adjustments: [], newItems: [] };
}

export function renderScenarioTab(container, { wageTable, taxRules, getSelectedGrade }) {
  const itemNames = wageTable[0].items.map((item) => item.name);
  let scenarios = [createScenario()];

  function render() {
    container.innerHTML = `
      <button class="btn" id="add-scenario-btn" type="button">+ 시나리오 추가</button>
      <div id="scenario-builders"></div>
      <div id="scenario-export-target">
        <div class="table-wrapper">
          <h3>전체 직급 실수령액 비교</h3>
          <table class="wage-table" id="scenario-full-table"></table>
        </div>
        <div class="table-wrapper">
          <h3>선택 직급(<span id="selected-grade-label"></span>) 상세 비교</h3>
          <table class="wage-table" id="scenario-detail-table"></table>
        </div>
      </div>
      <button class="btn export-btn" id="scenario-export-btn" type="button">이미지로 저장</button>
    `;

    const buildersEl = container.querySelector('#scenario-builders');
    scenarios.forEach((scenario) => {
      buildersEl.appendChild(renderScenarioBuilder(scenario));
    });

    container.querySelector('#add-scenario-btn').addEventListener('click', () => {
      scenarios = [...scenarios, createScenario()];
      render();
    });

    renderTables();
  }

  function renderScenarioBuilder(scenario) {
    const el = document.createElement('div');
    el.className = 'card scenario-card';
    el.innerHTML = `
      <div class="scenario-card-header">
        <input type="text" class="scenario-name-input" value="${scenario.name}" />
        <button class="btn btn-small remove-scenario-btn" type="button">삭제</button>
      </div>
      <table class="scenario-adjust-table">
        <thead><tr><th>항목</th><th>방식</th><th>값</th></tr></thead>
        <tbody>
          ${itemNames
            .map((name) => {
              const existing = scenario.adjustments.find((a) => a.itemName === name);
              return `
              <tr data-item-name="${name}">
                <td>${name}</td>
                <td>
                  <select class="adjust-type">
                    <option value="percent" ${existing?.type === 'percent' ? 'selected' : ''}>정률(%)</option>
                    <option value="fixed" ${existing?.type === 'fixed' ? 'selected' : ''}>정액(원)</option>
                  </select>
                </td>
                <td><input type="number" class="adjust-value" value="${existing?.value ?? 0}" /></td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
      <div class="new-item-form">
        <input type="text" class="new-item-name" placeholder="새 항목 이름" />
        <input type="number" class="new-item-amount" placeholder="금액(원)" value="0" />
        <button class="btn btn-small add-item-btn" type="button">+ 추가</button>
      </div>
      ${
        scenario.newItems.length
          ? `<ul class="new-items-list">
              ${scenario.newItems
                .map(
                  (item, idx) =>
                    `<li>${item.name}: ${item.amount.toLocaleString('ko-KR')}원 <button class="btn btn-small remove-new-item-btn" data-idx="${idx}" type="button">삭제</button></li>`
                )
                .join('')}
            </ul>`
          : ''
      }
    `;

    el.querySelector('.scenario-name-input').addEventListener('input', (e) => {
      scenario.name = e.target.value;
      renderTables();
    });

    el.querySelector('.remove-scenario-btn').addEventListener('click', () => {
      scenarios = scenarios.filter((s) => s.id !== scenario.id);
      render();
    });

    el.querySelectorAll('tbody tr').forEach((row) => {
      const itemName = row.dataset.itemName;
      const typeSelect = row.querySelector('.adjust-type');
      const valueInput = row.querySelector('.adjust-value');

      function updateAdjustment() {
        const value = Number(valueInput.value) || 0;
        const type = typeSelect.value;
        scenario.adjustments = scenario.adjustments.filter((a) => a.itemName !== itemName);
        if (value !== 0) {
          scenario.adjustments.push({ itemName, type, value });
        }
        renderTables();
      }

      typeSelect.addEventListener('change', updateAdjustment);
      valueInput.addEventListener('input', updateAdjustment);
    });

    el.querySelector('.add-item-btn').addEventListener('click', () => {
      const nameInput = el.querySelector('.new-item-name');
      const amountInput = el.querySelector('.new-item-amount');
      const name = nameInput.value.trim();
      const amount = Number(amountInput.value) || 0;
      if (!name) return;
      scenario.newItems.push({ name, amount, taxable: true });
      render();
    });

    el.querySelectorAll('.remove-new-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        scenario.newItems.splice(idx, 1);
        render();
      });
    });

    return el;
  }

  function renderFullComparisonTable() {
    const tableEl = container.querySelector('#scenario-full-table');
    if (!tableEl) return;

    const rows = wageTable.map((grade) => {
      const baseNetPay = calculateNetPay(grade.items, 1, taxRules);
      const perScenario = scenarios.map((scenario) => {
        const items = applyScenarioToGrade(grade.items, scenario);
        return calculateNetPay(items, 1, taxRules);
      });
      return { grade: grade.grade, baseNetPay, perScenario };
    });

    tableEl.innerHTML = `
      <thead>
        <tr>
          <th>직급</th>
          <th>현행 실수령액</th>
          ${scenarios.map((s) => `<th>${s.name}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${row.grade}</td>
            <td>${formatWon(row.baseNetPay.netPay)}</td>
            ${row.perScenario.map((np) => `<td class="accent">${formatWon(np.netPay)}</td>`).join('')}
          </tr>
        `
          )
          .join('')}
      </tbody>
    `;
  }

  function renderDetailComparisonTable(selectedGrade) {
    const tableEl = container.querySelector('#scenario-detail-table');
    if (!tableEl) return;

    const baseGrade = wageTable.find((g) => g.grade === selectedGrade);
    const baseNetPay = calculateNetPay(baseGrade.items, 1, taxRules);

    const scenarioResults = scenarios.map((scenario) => {
      const items = applyScenarioToGrade(baseGrade.items, scenario);
      return { scenario, netPayResult: calculateNetPay(items, 1, taxRules) };
    });

    tableEl.innerHTML = `
      <thead>
        <tr>
          <th>구분</th>
          <th>임금 총액</th>
          <th>실수령액</th>
          <th>인상액(실수령 기준)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>현행</td>
          <td>${formatWon(baseNetPay.totalWage)}</td>
          <td class="accent">${formatWon(baseNetPay.netPay)}</td>
          <td>-</td>
        </tr>
        ${scenarioResults
          .map(
            ({ scenario, netPayResult }) => `
          <tr>
            <td>${scenario.name}</td>
            <td>${formatWon(netPayResult.totalWage)}</td>
            <td class="accent">${formatWon(netPayResult.netPay)}</td>
            <td>${formatWon(netPayResult.netPay - baseNetPay.netPay)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    `;
  }

  function renderTables() {
    const selectedGrade = getSelectedGrade();
    const labelEl = container.querySelector('#selected-grade-label');
    if (labelEl) labelEl.textContent = selectedGrade;
    renderFullComparisonTable();
    renderDetailComparisonTable(selectedGrade);
  }

  render();

  return {
    refreshComparison: renderTables,
  };
}
```

- [ ] **Step 2: `css/style.css`에 새 항목 입력 폼 스타일 추가**

파일 끝에 추가:

```css
.new-item-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}

.new-item-name {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.new-item-amount {
  width: 140px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.new-items-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  font-size: 0.85rem;
}

.new-items-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border);
}
```

- [ ] **Step 3: `js/main.js`에 연결하고 탭 전환 시 시나리오 비교를 새로고침하도록 재구성**

`js/main.js`를 다음과 같이 재구성한다(렌더 호출을 모두 위로, 탭 전환 리스너는 아래로 이동):

```js
import { wageTable } from './data/wage-table.js';
import { taxRules } from './data/tax-rules.js';
import { referenceData } from './data/reference-data.js';
import { renderStatusTab } from './ui/status-tab.js';
import { renderScenarioTab } from './ui/scenario-tab.js';
import { renderTrendTab } from './ui/trend-tab.js';
import { renderReferenceTab } from './ui/reference-tab.js';

const statusApi = renderStatusTab(document.getElementById('tab-status'), { wageTable, taxRules });
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getSelectedGrade: statusApi.getSelectedGrade,
});
renderTrendTab(document.getElementById('tab-trend'), { referenceData });
renderReferenceTab(document.getElementById('tab-reference'), { referenceData });

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === button));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
    if (target === 'scenario') {
      scenarioApi.refreshComparison();
    }
  });
});
```

- [ ] **Step 4: 브라우저에서 수동 확인**

체크리스트:
1. 시나리오 탭에서 "시나리오 1"의 기본급 행에 정률 5 입력 → 전체 직급 실수령액 비교 표와 선택 직급 상세 비교 표가 즉시 갱신되는지 확인
2. "+ 시나리오 추가"로 시나리오 2개 이상 만들어 표 컬럼이 나란히 늘어나는지 확인
3. 새 항목 입력 폼에 이름·금액을 입력하고 "+ 추가" 클릭 → 목록에 항목이 추가되고 전체 직급 실수령액이 반영되는지 확인
4. 현황 탭에서 다른 직급 행을 클릭한 뒤 시나리오 탭으로 이동 → "선택 직급 상세 비교" 제목과 표가 새로 선택한 직급 기준으로 갱신되는지 확인

Expected: 위 4가지 모두 정상 동작

- [ ] **Step 5: Commit**

```bash
git add js/ui/scenario-tab.js js/main.js
git commit -m "Add scenario tab: multi-scenario builder and comparison tables"
```

---

### Task 11: 이미지 내보내기

**Files:**
- Create: `js/export/image-export.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: 전역 `window.html2canvas`(index.html의 CDN 스크립트, Task 1), DOM id `#status-export-btn`/`#status-table-wrapper`(Task 7), `#scenario-export-btn`/`#scenario-export-target`(Task 10)
- Produces: `attachExportButton(button, targetElement, filename)` (반환값 없음)

- [ ] **Step 1: `js/export/image-export.js` 작성**

```js
export function attachExportButton(button, targetElement, filename) {
  button.addEventListener('click', async () => {
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '저장 중...';
    try {
      const canvas = await window.html2canvas(targetElement, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}
```

- [ ] **Step 2: `js/main.js` 맨 아래에 연결**

```js
import { attachExportButton } from './export/image-export.js';

attachExportButton(
  document.getElementById('status-export-btn'),
  document.getElementById('status-table-wrapper'),
  '현행임금현황.png'
);
attachExportButton(
  document.getElementById('scenario-export-btn'),
  document.getElementById('scenario-export-target'),
  '임금인상시나리오비교.png'
);
```

- [ ] **Step 3: 브라우저에서 수동 확인**

Run: 현황 탭에서 "이미지로 저장" 클릭, 시나리오 탭에서 "이미지로 저장" 클릭
Expected: 각각 `현행임금현황.png`, `임금인상시나리오비교.png` 파일이 다운로드되고, 열어보면 해당 표가 흰 배경에 선명하게 캡처되어 있음

- [ ] **Step 4: Commit**

```bash
git add js/export/image-export.js js/main.js
git commit -m "Add PNG export for status and scenario tables"
```

---

### Task 12: GitHub Pages 배포 및 최종 점검

**Files:**
- Modify: `README.md` (배포 안내 보강)

**Interfaces:**
- 없음 (배포 설정 + 수동 QA)

- [ ] **Step 1: 전체 계산 로직 테스트 재실행**

Run: `npm test`
Expected: 모든 테스트(`tax-rules`, `data-schema`, `net-pay`, `scenario`, `trend-chart`) PASS

- [ ] **Step 2: 저장소를 GitHub에 push (아직 안 했다면) 하고 GitHub Pages 설정**

GitHub 저장소 Settings → Pages → Source를 "Deploy from a branch"로 설정하고 브랜치를 `main`, 폴더를 `/ (root)`로 지정한다. (이 리포지토리의 원격 저장소가 아직 없다면 사용자에게 GitHub 저장소 생성 여부를 먼저 확인한다.)

- [ ] **Step 3: 배포된 URL로 전체 기능 수동 QA**

체크리스트:
1. 현황 탭 — 5개 직급 전체 표시, 행 클릭 시 강조·요약 카드 갱신
2. 시나리오 탭 — 시나리오 추가/삭제, 정률·정액 혼합 적용, 신규 항목 추가, 전체/상세 비교 표 갱신
3. 추이 탭 — 조합 자체 인상률 라인 차트와 표
4. 참고정보 탭 — 4개 시리즈 오버레이 차트 + 4개 데이터 표
5. 이미지 저장 버튼 2곳 모두 다운로드 동작
6. 모바일 폭(브라우저 개발자도구 반응형 모드)에서 표가 가로 스크롤되는지 확인
7. 하단 "간이 추정치" 안내 문구가 모든 화면에서 보이는지 확인

Expected: 7개 항목 모두 정상

- [ ] **Step 4: README에 배포 URL 및 데이터 교체 안내 보강**

`README.md`의 "데이터 갱신" 섹션 아래에 다음을 추가:

```markdown

## 실제 조합 데이터로 교체하기

1. `js/data/wage-table.js`의 `wageTable` 배열을 실제 직급별 임금테이블로 교체
2. `js/data/reference-data.js`의 `unionWageHistory`를 실제 임금협약 이력으로 교체, `companyFinancials`에 경영지표 입력
3. 연도가 바뀌면 `js/data/reference-data.js`의 `minimumWage`/`cpi`/`industryAverageIncrease`에 새 연도 데이터 추가
4. 4대보험 요율이 바뀌면 `js/data/tax-rules.js` 갱신
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "Document data-refresh steps and manual QA checklist"
```

---

---

### Task 13: 부양가족 입력 · 공제내역 세부표시 · 인상률(%) 컬럼

> Added after the final whole-branch review, per human decision, to close scope gaps against the original design spec (`docs/superpowers/specs/2026-07-29-wage-scenario-calculator-design.md` §6①②, §7③).

**Files:**
- Modify: `js/ui/status-tab.js`
- Modify: `js/ui/scenario-tab.js`
- Modify: `js/main.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `calculateNetPay` (Task 4) — its return already includes `insurance`/`tax` breakdown objects, unused until now.
- Produces: `renderStatusTab(...)` now returns `{ getSelectedGrade, getDependents: () => number }`. `renderScenarioTab` now requires an additional `getDependents` field in its options object and uses it everywhere it previously hardcoded `1`.

- [ ] **Step 1: Add a 부양가족 수 input and deduction breakdown to `js/ui/status-tab.js`**

Replace the whole file with:

```js
import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon } from './format.js';

export function renderStatusTab(container, { wageTable, taxRules }) {
  let selectedGrade = wageTable[0].grade;
  let dependents = 1;

  function computeRows() {
    return wageTable.map((grade) => ({
      grade: grade.grade,
      items: grade.items,
      netPayResult: calculateNetPay(grade.items, dependents, taxRules),
    }));
  }

  function render() {
    const rows = computeRows();
    const selectedRow = rows.find((r) => r.grade === selectedGrade);
    const itemNames = wageTable[0].items.map((item) => item.name);
    const { insurance, tax } = selectedRow.netPayResult;

    container.innerHTML = `
      <div class="card summary-card">
        <h2>${selectedRow.grade} 기준 요약</h2>
        <label class="dependents-label">
          부양가족 수(본인 포함)
          <input type="number" id="dependents-input" min="1" step="1" value="${dependents}" />
        </label>
        <div class="summary-grid">
          <div><span class="summary-label">임금 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalWage)}</span></div>
          <div><span class="summary-label">공제 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalDeduction)}</span></div>
          <div><span class="summary-label">실수령액</span><span class="summary-value accent">${formatWon(selectedRow.netPayResult.netPay)}</span></div>
        </div>
        <details class="deduction-breakdown">
          <summary>공제 내역 보기</summary>
          <ul>
            <li>국민연금: ${formatWon(insurance.nationalPension)}</li>
            <li>건강보험: ${formatWon(insurance.healthInsurance)}</li>
            <li>장기요양보험: ${formatWon(insurance.longTermCare)}</li>
            <li>고용보험: ${formatWon(insurance.employmentInsurance)}</li>
            <li>소득세: ${formatWon(tax.incomeTax)}</li>
            <li>지방소득세: ${formatWon(tax.localIncomeTax)}</li>
          </ul>
        </details>
      </div>
      <div class="table-wrapper" id="status-table-wrapper">
        <table class="wage-table">
          <thead>
            <tr>
              <th>직급</th>
              ${itemNames.map((name) => `<th>${name}</th>`).join('')}
              <th>임금 총액</th>
              <th>공제 총액</th>
              <th>실수령액</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr data-grade="${row.grade}" class="${row.grade === selectedGrade ? 'row-selected' : ''}">
                <td>${row.grade}</td>
                ${row.items.map((item) => `<td>${formatWon(item.amount)}</td>`).join('')}
                <td>${formatWon(row.netPayResult.totalWage)}</td>
                <td>${formatWon(row.netPayResult.totalDeduction)}</td>
                <td class="accent">${formatWon(row.netPayResult.netPay)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <p class="export-disclaimer">* 실수령액은 간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다.</p>
      </div>
      <button class="btn export-btn" id="status-export-btn" type="button">이미지로 저장</button>
    `;

    container.querySelectorAll('tbody tr').forEach((row) => {
      row.addEventListener('click', () => {
        selectedGrade = row.dataset.grade;
        render();
      });
    });

    container.querySelector('#dependents-input').addEventListener('change', (e) => {
      const value = Number(e.target.value);
      dependents = value >= 1 ? value : 1;
      render();
    });
  }

  render();

  return {
    getSelectedGrade: () => selectedGrade,
    getDependents: () => dependents,
  };
}
```

Note: the dependents input uses the `change` event (fires on blur/Enter), not `input`, so a full-`innerHTML` re-render doesn't fight the user mid-keystroke.

- [ ] **Step 2: Consume `getDependents` and add 인상률(%) + a deduction-breakdown comparison table in `js/ui/scenario-tab.js`**

Change the function signature (line 12) from:
```js
export function renderScenarioTab(container, { wageTable, taxRules, getSelectedGrade }) {
```
to:
```js
export function renderScenarioTab(container, { wageTable, taxRules, getSelectedGrade, getDependents }) {
```

In `render()`, add a third table wrapper inside `#scenario-export-target`, after the existing "선택 직급 상세 비교" wrapper and before the `export-disclaimer` paragraph:
```html
<div class="table-wrapper">
  <h3>공제 내역 비교 (선택 직급 기준)</h3>
  <table class="wage-table" id="scenario-breakdown-table"></table>
</div>
```

In `renderFullComparisonTable`, replace both `calculateNetPay(grade.items, 1, taxRules)` and `calculateNetPay(items, 1, taxRules)` with `calculateNetPay(grade.items, getDependents(), taxRules)` / `calculateNetPay(items, getDependents(), taxRules)` respectively (same two call sites, just swap the hardcoded `1` for `getDependents()`).

Replace `renderDetailComparisonTable` entirely with:
```js
  function renderDetailComparisonTable(selectedGrade) {
    const tableEl = container.querySelector('#scenario-detail-table');
    if (!tableEl) return;

    const baseGrade = wageTable.find((g) => g.grade === selectedGrade);
    const dependents = getDependents();
    const baseNetPay = calculateNetPay(baseGrade.items, dependents, taxRules);

    const scenarioResults = scenarios.map((scenario) => {
      const items = applyScenarioToGrade(baseGrade.items, scenario);
      return { scenario, netPayResult: calculateNetPay(items, dependents, taxRules) };
    });

    function increaseRateLabel(netPay) {
      if (baseNetPay.netPay === 0) return '-';
      const rate = ((netPay - baseNetPay.netPay) / baseNetPay.netPay) * 100;
      return `${rate.toFixed(1)}%`;
    }

    tableEl.innerHTML = `
      <thead>
        <tr>
          <th>구분</th>
          <th>임금 총액</th>
          <th>실수령액</th>
          <th>인상액(실수령 기준)</th>
          <th>인상률(실수령 기준)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>현행</td>
          <td>${formatWon(baseNetPay.totalWage)}</td>
          <td class="accent">${formatWon(baseNetPay.netPay)}</td>
          <td>-</td>
          <td>-</td>
        </tr>
        ${scenarioResults
          .map(
            ({ scenario, netPayResult }) => `
          <tr>
            <td>${escapeHtml(scenario.name)}</td>
            <td>${formatWon(netPayResult.totalWage)}</td>
            <td class="accent">${formatWon(netPayResult.netPay)}</td>
            <td>${formatWon(netPayResult.netPay - baseNetPay.netPay)}</td>
            <td>${increaseRateLabel(netPayResult.netPay)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    `;

    renderDeductionBreakdownTable(baseNetPay, scenarioResults);
  }

  function renderDeductionBreakdownTable(baseNetPay, scenarioResults) {
    const tableEl = container.querySelector('#scenario-breakdown-table');
    if (!tableEl) return;

    const rows = [
      { label: '국민연금', pick: (r) => r.insurance.nationalPension },
      { label: '건강보험', pick: (r) => r.insurance.healthInsurance },
      { label: '장기요양보험', pick: (r) => r.insurance.longTermCare },
      { label: '고용보험', pick: (r) => r.insurance.employmentInsurance },
      { label: '소득세', pick: (r) => r.tax.incomeTax },
      { label: '지방소득세', pick: (r) => r.tax.localIncomeTax },
    ];

    tableEl.innerHTML = `
      <thead>
        <tr>
          <th>공제 항목</th>
          <th>현행</th>
          ${scenarioResults.map(({ scenario }) => `<th>${escapeHtml(scenario.name)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${row.label}</td>
            <td>${formatWon(row.pick(baseNetPay))}</td>
            ${scenarioResults.map(({ netPayResult }) => `<td>${formatWon(row.pick(netPayResult))}</td>`).join('')}
          </tr>
        `
          )
          .join('')}
      </tbody>
    `;
  }
```

- [ ] **Step 3: Wire `getDependents` through in `js/main.js`**

Change the `renderScenarioTab` call (currently lines 11-15) to add one field:
```js
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getSelectedGrade: statusApi.getSelectedGrade,
  getDependents: statusApi.getDependents,
});
```

- [ ] **Step 4: Add CSS for the new elements**

Append to `css/style.css`:
```css
.dependents-label {
  display: block;
  margin: 8px 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.dependents-label input {
  margin-left: 8px;
  width: 60px;
  padding: 4px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.deduction-breakdown {
  margin-top: 12px;
  font-size: 0.85rem;
}

.deduction-breakdown summary {
  cursor: pointer;
  color: var(--color-muted);
}

.deduction-breakdown ul {
  margin: 8px 0 0;
  padding-left: 20px;
}
```

- [ ] **Step 5: Manual verification**

Run the full test suite (`node --test tests/*.test.mjs`) — expect 13/13 still passing (this task touches no calc-layer or chart-math logic, only UI). Then verify by code reading / local server + curl: does `renderStatusTab` return `getDependents`? Does `renderScenarioTab`'s two comparison-table functions read `getDependents()` instead of hardcoding `1`? Does the new `#scenario-breakdown-table` appear inside `#scenario-export-target` (so it's captured by the PNG export)?

- [ ] **Step 6: Commit**

```bash
git add js/ui/status-tab.js js/ui/scenario-tab.js js/main.js css/style.css
git commit -m "Add dependents input, deduction breakdown, and increase-rate column"
```

---

### Task 14: 시나리오 복제 · 추이 탭 툴팁 · 추이/참고정보 탭 내보내기

> Added after the final whole-branch review, per human decision, to close scope gaps against the original design spec §6②③, §9.

**Files:**
- Modify: `js/ui/scenario-tab.js`
- Modify: `js/charts/trend-chart.js`
- Modify: `js/ui/trend-tab.js`
- Modify: `js/ui/reference-tab.js`
- Modify: `js/main.js`
- Modify: `css/style.css`

**Interfaces:**
- Produces: `buildLineChartSvg`/`renderLineChart` (Task 6) gain an optional `options.onPointClick(series, point)` callback, invoked when a chart point is clicked. Backward compatible — existing callers that don't pass it are unaffected.

- [ ] **Step 1: Add a 복제(clone) button to each scenario card in `js/ui/scenario-tab.js`**

In `renderScenarioBuilder`, change the header markup from:
```html
      <div class="scenario-card-header">
        <input type="text" class="scenario-name-input" value="${escapeHtml(scenario.name)}" />
        <button class="btn btn-small remove-scenario-btn" type="button">삭제</button>
      </div>
```
to:
```html
      <div class="scenario-card-header">
        <input type="text" class="scenario-name-input" value="${escapeHtml(scenario.name)}" />
        <button class="btn btn-small clone-scenario-btn" type="button">복제</button>
        <button class="btn btn-small remove-scenario-btn" type="button">삭제</button>
      </div>
```

Add a new listener next to the existing `.remove-scenario-btn` listener:
```js
    el.querySelector('.clone-scenario-btn').addEventListener('click', () => {
      const clone = {
        id: nextScenarioId++,
        name: `${scenario.name} (복제)`,
        adjustments: scenario.adjustments.map((a) => ({ ...a })),
        newItems: scenario.newItems.map((item) => ({ ...item })),
      };
      const index = scenarios.findIndex((s) => s.id === scenario.id);
      scenarios = [...scenarios.slice(0, index + 1), clone, ...scenarios.slice(index + 1)];
      render();
    });
```

- [ ] **Step 2: Add click-to-inspect support to `js/charts/trend-chart.js`**

In `buildLineChartSvg`, inside the `series.forEach((s) => { ... sortedData.forEach((p) => { ... }) })` block, replace:
```js
    sortedData.forEach((p) => {
      const { px, py } = scalePoint(p, domain, range);
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: 3, fill: s.color || '#111111' }));
    });
```
with:
```js
    sortedData.forEach((p) => {
      const { px, py } = scalePoint(p, domain, range);
      const circle = svgEl('circle', { cx: px, cy: py, r: 4, fill: s.color || '#111111' });
      if (options.onPointClick) {
        circle.style.cursor = 'pointer';
        circle.addEventListener('click', () => options.onPointClick(s, p));
      }
      svg.appendChild(circle);
    });
```

Do not change `computeDomain` or `scalePoint` — their unit tests must keep passing unmodified.

- [ ] **Step 3: Wire the tooltip and an export target/button into `js/ui/trend-tab.js`**

Replace the whole file with:
```js
import { renderLineChart } from '../charts/trend-chart.js';

export function renderTrendTab(container, { referenceData }) {
  container.innerHTML = `
    <div id="trend-export-target">
      <div class="card">
        <h2>조합 자체 임금인상률 추이</h2>
        <div id="union-trend-chart"></div>
        <p id="union-trend-detail" class="chart-detail-message">그래프의 점을 클릭하면 해당 연도의 인상 방식 설명을 볼 수 있습니다.</p>
        <div class="table-wrapper">
          <table class="wage-table">
            <thead><tr><th>연도</th><th>인상 방식</th><th>인상률</th><th>비고</th></tr></thead>
            <tbody>
              ${referenceData.unionWageHistory
                .map(
                  (row) => `
                <tr>
                  <td>${row.year}</td>
                  <td>${row.type}</td>
                  <td>${row.rate}%</td>
                  <td>${row.note || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <button class="btn export-btn" id="trend-export-btn" type="button">이미지로 저장</button>
  `;

  const detailEl = container.querySelector('#union-trend-detail');

  renderLineChart(
    container.querySelector('#union-trend-chart'),
    [
      {
        label: '조합 임금인상률',
        color: 'rgb(0, 188, 112)',
        data: referenceData.unionWageHistory.map((row) => ({ x: row.year, y: row.rate })),
      },
    ],
    {
      width: 640,
      height: 320,
      onPointClick: (series, point) => {
        const row = referenceData.unionWageHistory.find((r) => r.year === point.x);
        if (!row || !detailEl) return;
        detailEl.textContent = `${row.year}년: ${row.type} 방식, 인상률 ${row.rate}%${row.note ? ` — ${row.note}` : ''}`;
      },
    }
  );
}
```

- [ ] **Step 4: Add an export target/button to `js/ui/reference-tab.js`**

Wrap the existing four `<div class="card">...</div>` blocks (unchanged internally) in a single `<div id="reference-export-target">...</div>`, and add an export button after it, mirroring trend-tab.js's structure. The file's `container.innerHTML = \`...\`` template becomes:
```html
    <div id="reference-export-target">
      <div class="card"> ... 인상률 비교 카드, unchanged ... </div>
      <div class="card"> ... 역대 최저임금 인상률 카드, unchanged ... </div>
      <div class="card"> ... 소비자물가상승률 카드, unchanged ... </div>
      <div class="card"> ... 동종/전산업 평균 임금인상률 카드, unchanged ... </div>
      <div class="card"> ... 기업 경영지표 카드, unchanged ... </div>
    </div>
    <button class="btn export-btn" id="reference-export-btn" type="button">이미지로 저장</button>
```
Only the wrapping changes — none of the five cards' internal markup changes. The `container.querySelector('#reference-overlay-chart')` call after the template stays exactly as-is (querySelector searches the whole container regardless of the new wrapper depth).

- [ ] **Step 5: Wire the two new export buttons in `js/main.js`**

Append after the existing two `attachExportButton(...)` calls:
```js
attachExportButton('trend-export-btn', 'trend-export-target', '임금인상률추이.png');
attachExportButton('reference-export-btn', 'reference-export-target', '교섭참고정보.png');
```

- [ ] **Step 6: Add CSS for the chart-detail message**

Append to `css/style.css`:
```css
.chart-detail-message {
  font-size: 0.85rem;
  color: var(--color-muted);
  margin: 8px 0;
}
```

- [ ] **Step 7: Manual verification**

Run `node --test tests/*.test.mjs` — expect 13/13 still passing (this task doesn't touch `computeDomain`/`scalePoint`, only the DOM-facing `buildLineChartSvg`). Verify by code reading: does cloning a scenario deep-copy `adjustments`/`newItems` (not share references with the original)? Do the two new export buttons reference ids that actually exist in the new trend-tab.js/reference-tab.js markup?

- [ ] **Step 8: Commit**

```bash
git add js/ui/scenario-tab.js js/charts/trend-chart.js js/ui/trend-tab.js js/ui/reference-tab.js js/main.js css/style.css
git commit -m "Add scenario cloning, trend chart tooltips, and trend/reference export buttons"
```

---

## Self-Review Notes

- **Spec coverage**: 설계 문서의 4개 탭(현황/시나리오/추이/참고정보), 실수령액 계산, 시나리오 정률/정액/항목추가, 이미지 내보내기, 디자인 시스템(흑백+그린), GitHub Pages 배포가 모두 Task 1~12에 매핑됨.
- **Type consistency**: `items` shape(`{name, amount, taxable}`)와 `scenario` shape(`{name, adjustments, newItems}`)를 Task 3~5~10에서 동일하게 사용. `calculateNetPay`/`applyScenarioToGrade`/`renderLineChart`의 함수 시그니처가 이후 태스크에서 정의한 것과 정확히 일치하도록 맞춤.
- **No placeholders**: 모든 데이터 파일은 실제 계산 가능한 값(2026년 확정 최저임금·요율 등 실데이터 또는 명시적으로 "예시" 표기된 샘플 임금테이블)을 담고 있음. 조합의 실제 임금테이블·임금협약 이력만 이 계획의 범위 밖(사용자 제공 예정)이며, 이는 설계 문서에도 Open Item으로 이미 명시됨.
