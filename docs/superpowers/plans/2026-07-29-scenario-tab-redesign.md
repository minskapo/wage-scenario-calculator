# 시나리오 탭 재설계 · 연 임금 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시나리오 탭을 "여러 시나리오 카드 비교" 구조에서 "직급별 인상액/인상률을 표 안에서 바로 입력하고 즉시 결과를 보는 단일 라이브 표"로 재설계하고, 현황/시나리오 탭에 연 임금 표시를 추가한다.

**Architecture:** `js/ui/status-tab.js`에 파생 표시값(×12)만 추가. `js/ui/scenario-tab.js`는 전면 재작성 — 구조적 변경(가상 직급 추가/삭제, 일괄 적용)은 표 전체를 다시 그리고, 값만 바뀌는 개별 행 입력(인상액/인상률 타이핑)은 해당 행의 결과 셀만 직접 갱신해 포커스를 유지한다. 계산 로직(`calculateNetPay`, `applyAdjustments`)은 기존 함수를 그대로 재사용하며 신규 계산 로직은 추가하지 않는다.

**Tech Stack:** 기존과 동일 — Vanilla JS (ES Modules), 순수 CSS, 빌드 도구 없음.

## Global Constraints

- 계산 로직(`js/calc/net-pay.js`, `js/calc/scenario.js`)은 변경하지 않는다 — 이번 작업은 UI 재구성뿐이다.
- 인상 조정은 `기본급` 항목에만 적용한다(직책수당은 조정 대상 아님).
- 인상액(원)↔인상률(%) 두 입력 필드는 그 행 안에서 서로 자동 변환되며, 사용자가 마지막으로 입력한 칸의 값을 원본으로 취급하고 반대편 칸은 그 값에서 파생된 표시값으로 취급한다. 프로그래밍적으로 반대편 칸의 값을 채울 때는 `input` 이벤트를 재발생시키지 않는다(무한 루프 방지, 값만 `.value`에 직접 대입).
- 상단 "전체 일괄 적용"의 인상액/인상률 두 칸은 서로 자동 변환되지 않는다 — 각각 독립적으로 모든 행에 적용된다.
- 가상 직급은 세션 중에만 유지되며 `js/data/wage-table.js` 등 실제 데이터 파일에는 저장하지 않는다. 가상 직급의 `items`는 `[{ name: '기본급', amount, taxable: true }]` 하나뿐이다.
- 개별 행의 인상액/인상률 입력(타이핑 중)은 표 전체를 다시 그리지 않는다 — 해당 행의 "인상 후" 4개 셀만 직접 갱신해 입력 포커스를 유지한다. 구조가 바뀌는 경우(가상 직급 추가/삭제, 전체 일괄 적용)만 표 전체를 다시 그린다.
- 연 임금은 `totalWage × 12`(세전, 연 총 급여)만 표시한다 — 연 실수령액은 표시하지 않는다.
- `renderScenarioTab(container, { wageTable, taxRules, getDependents })` — `getSelectedGrade`는 더 이상 받지 않는다. 반환값은 `{ refresh: () => void }`.
- 브라우저 자동화 도구가 이 환경에 없으므로, 각 태스크의 검증은 `node --check` 문법 검사 + 로컬 정적 서버 curl 구조 확인으로 한다.
- `window.prompt`/`confirm`/`alert`을 사용하지 않는다(기존 프로젝트 방침).

---

## File Structure Overview

```
js/
├── ui/
│   ├── status-tab.js      (수정 — 연 임금 표시 추가)
│   └── scenario-tab.js    (전면 재작성 — 라이브 표 + 가상 직급)
├── main.js                 (수정 — renderScenarioTab 호출부 단순화)
css/
└── style.css                (수정 — 신규 스타일 추가, 사용하지 않는 규칙 제거)
```

---

### Task 1: 현황 탭 — 연 임금 표시

**Files:**
- Modify: `js/ui/status-tab.js`

**Interfaces:**
- 변경 없음 — `renderStatusTab(container, {wageTable, taxRules}) -> { getSelectedGrade, getDependents }` 그대로.

- [ ] **Step 1: `js/ui/status-tab.js`의 `render()` 함수 수정**

`render()` 함수 시작 부분(`const { insurance, tax } = selectedRow.netPayResult;` 다음 줄)에 아래 한 줄을 추가:

```js
    const annualWage = selectedRow.netPayResult.totalWage * 12;
```

요약 카드의 `summary-grid` 안, "임금 총액" 항목 바로 다음에 아래 항목을 추가(전체 `summary-grid` div를 아래로 교체):

```html
        <div class="summary-grid">
          <div><span class="summary-label">임금 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalWage)}</span></div>
          <div><span class="summary-label">연 임금</span><span class="summary-value">${formatWon(annualWage)}</span></div>
          <div><span class="summary-label">공제 총액</span><span class="summary-value">${formatWon(selectedRow.netPayResult.totalDeduction)}</span></div>
          <div><span class="summary-label">실수령액</span><span class="summary-value accent">${formatWon(selectedRow.netPayResult.netPay)}</span></div>
        </div>
```

전체 직급표의 `<thead>` 안, "임금 총액" 헤더 다음에 "연 임금" 헤더 추가(전체 `<thead>`를 아래로 교체):

```html
          <thead>
            <tr>
              <th>직급</th>
              ${itemNames.map((name) => `<th>${name}</th>`).join('')}
              <th>임금 총액</th>
              <th>연 임금</th>
              <th>공제 총액</th>
              <th>실수령액</th>
            </tr>
          </thead>
```

각 행(`tbody` 안 `rows.map(...)` 템플릿)의 "임금 총액" `<td>` 다음에 "연 임금" `<td>`를 추가(해당 `<tr>` 템플릿을 아래로 교체):

```html
              <tr data-grade="${row.grade}" class="${row.grade === selectedGrade ? 'row-selected' : ''}">
                <td>${row.grade}</td>
                ${row.items.map((item) => `<td>${formatWon(item.amount)}</td>`).join('')}
                <td>${formatWon(row.netPayResult.totalWage)}</td>
                <td>${formatWon(row.netPayResult.totalWage * 12)}</td>
                <td>${formatWon(row.netPayResult.totalDeduction)}</td>
                <td class="accent">${formatWon(row.netPayResult.netPay)}</td>
              </tr>
```

- [ ] **Step 2: 검증**

Run: `node --check js/ui/status-tab.js`
Expected: 문법 오류 없음

Run: (로컬 서버가 안 떠 있으면) `python3 -m http.server 8099 &`, 이후 `curl -s http://localhost:8099/js/ui/status-tab.js | grep -c "연 임금"`
Expected: `2` (요약 카드 라벨 1개 + 표 헤더 1개 — 문자열 "연 임금"이 정확히 두 곳에 나타나야 함)

Run: `node --test tests/*.test.mjs`
Expected: 13/13 PASS (이 태스크는 계산 로직을 건드리지 않음)

- [ ] **Step 3: Commit**

```bash
git add js/ui/status-tab.js
git commit -m "Add annual wage display to status tab"
```

---

### Task 2: 시나리오 탭 — 라이브 표 (실제 직급만)

**Files:**
- Modify: `js/ui/scenario-tab.js` (전체 내용 교체)

**Interfaces:**
- Consumes: `applyAdjustments`(`js/calc/scenario.js`, Task 5 of the original plan — already implemented), `calculateNetPay`(`js/calc/net-pay.js`), `formatWon`/`escapeHtml`(`js/ui/format.js`)
- Produces: `renderScenarioTab(container, { wageTable, taxRules, getDependents }) -> { refresh: () => void }`. Task 4(main.js 배선)가 이 시그니처를 그대로 사용한다. Task 3(가상 직급)이 이 파일을 계속 수정한다.

- [ ] **Step 1: `js/ui/scenario-tab.js`를 아래 내용으로 전체 교체**

```js
import { applyAdjustments } from '../calc/scenario.js';
import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon, escapeHtml } from './format.js';

export function renderScenarioTab(container, { wageTable, taxRules, getDependents }) {
  let rowStates = wageTable.map((grade) => ({
    grade: grade.grade,
    isVirtual: false,
    items: grade.items,
    increaseAmount: 0,
    increaseRate: 0,
  }));

  function getBaseAmount(items) {
    return items.find((item) => item.name === '기본급').amount;
  }

  function computeCurrent(row) {
    return calculateNetPay(row.items, getDependents(), taxRules);
  }

  function computeAfterItems(row) {
    return applyAdjustments(row.items, [{ itemName: '기본급', type: 'fixed', value: row.increaseAmount }]);
  }

  function computeAfter(row) {
    return calculateNetPay(computeAfterItems(row), getDependents(), taxRules);
  }

  function afterBaseAmount(row) {
    return getBaseAmount(row.items) + row.increaseAmount;
  }

  function rateLabel(current, after) {
    if (current.netPay === 0) return '-';
    const rate = ((after.netPay - current.netPay) / current.netPay) * 100;
    return `${rate.toFixed(1)}%`;
  }

  function render() {
    container.innerHTML = `
      <div class="card">
        <h2>전체 일괄 적용</h2>
        <div class="bulk-apply-row">
          <label>인상액(원) <input type="number" id="bulk-increase-amount" placeholder="예: 150000" /></label>
          <label>인상률(%) <input type="number" id="bulk-increase-rate" step="0.1" placeholder="예: 5" /></label>
        </div>
      </div>
      <div id="scenario-export-target">
        <div class="table-wrapper">
          <table class="wage-table" id="scenario-live-table">
            <thead>
              <tr>
                <th>직급</th>
                <th>현재 월 기본급</th>
                <th>현재 월 실수령액</th>
                <th>현재 연 임금</th>
                <th>인상액(원)</th>
                <th>인상률(%)</th>
                <th>인상 후 월 기본급</th>
                <th>인상 후 월 실수령액</th>
                <th>인상 후 연 임금</th>
                <th>실수령액 인상률</th>
              </tr>
            </thead>
            <tbody id="scenario-live-tbody"></tbody>
          </table>
        </div>
        <p class="export-disclaimer">* 부양가족 <span id="scenario-dependents-label"></span>인(본인 포함) 기준, 실수령액은 간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다.</p>
      </div>
      <button class="btn export-btn" id="scenario-export-btn" type="button">이미지로 저장</button>
    `;

    renderRows();

    container.querySelector('#bulk-increase-amount').addEventListener('input', (e) => {
      const amount = Number(e.target.value) || 0;
      rowStates.forEach((row) => {
        row.increaseAmount = amount;
        const base = getBaseAmount(row.items);
        row.increaseRate = base === 0 ? 0 : Math.round((amount / base) * 1000) / 10;
      });
      renderRows();
    });

    container.querySelector('#bulk-increase-rate').addEventListener('input', (e) => {
      const rate = Number(e.target.value) || 0;
      rowStates.forEach((row) => {
        row.increaseRate = rate;
        const base = getBaseAmount(row.items);
        row.increaseAmount = Math.round(base * (rate / 100));
      });
      renderRows();
    });

    const dependentsLabelEl = container.querySelector('#scenario-dependents-label');
    if (dependentsLabelEl) dependentsLabelEl.textContent = getDependents();
  }

  function renderRows() {
    const tbody = container.querySelector('#scenario-live-tbody');
    if (!tbody) return;

    tbody.innerHTML = rowStates
      .map((row) => {
        const current = computeCurrent(row);
        const after = computeAfter(row);
        return `
      <tr>
        <td>${escapeHtml(row.grade)}</td>
        <td>${formatWon(getBaseAmount(row.items))}</td>
        <td>${formatWon(current.netPay)}</td>
        <td>${formatWon(current.totalWage * 12)}</td>
        <td><input type="number" class="row-increase-amount" value="${row.increaseAmount}" /></td>
        <td><input type="number" class="row-increase-rate" step="0.1" value="${row.increaseRate}" /></td>
        <td class="cell-after-base">${formatWon(afterBaseAmount(row))}</td>
        <td class="cell-after-net accent">${formatWon(after.netPay)}</td>
        <td class="cell-after-annual">${formatWon(after.totalWage * 12)}</td>
        <td class="cell-after-rate">${rateLabel(current, after)}</td>
      </tr>
    `;
      })
      .join('');

    const trs = tbody.querySelectorAll('tr');
    rowStates.forEach((row, index) => {
      const tr = trs[index];
      if (!tr) return;

      const amountInput = tr.querySelector('.row-increase-amount');
      const rateInput = tr.querySelector('.row-increase-rate');

      amountInput.addEventListener('input', (e) => {
        const amount = Number(e.target.value) || 0;
        row.increaseAmount = amount;
        const base = getBaseAmount(row.items);
        row.increaseRate = base === 0 ? 0 : Math.round((amount / base) * 1000) / 10;
        rateInput.value = row.increaseRate;
        updateRowResultCells(tr, row);
      });

      rateInput.addEventListener('input', (e) => {
        const rate = Number(e.target.value) || 0;
        row.increaseRate = rate;
        const base = getBaseAmount(row.items);
        row.increaseAmount = Math.round(base * (rate / 100));
        amountInput.value = row.increaseAmount;
        updateRowResultCells(tr, row);
      });
    });
  }

  function updateRowResultCells(tr, row) {
    const current = computeCurrent(row);
    const after = computeAfter(row);
    tr.querySelector('.cell-after-base').textContent = formatWon(afterBaseAmount(row));
    tr.querySelector('.cell-after-net').textContent = formatWon(after.netPay);
    tr.querySelector('.cell-after-annual').textContent = formatWon(after.totalWage * 12);
    tr.querySelector('.cell-after-rate').textContent = rateLabel(current, after);
  }

  render();

  return {
    refresh: () => renderRows(),
  };
}
```

- [ ] **Step 2: 검증**

Run: `node --check js/ui/scenario-tab.js`
Expected: 문법 오류 없음

Run: `node --test tests/*.test.mjs`
Expected: 13/13 PASS (이 태스크는 `applyAdjustments`/`calculateNetPay`를 새로운 방식으로 "호출"할 뿐, 그 함수들 자체는 건드리지 않음)

수동 계산 대조(코드 읽기로 확인, 실행 불필요): `wageTable[0]`은 `js/data/wage-table.js`의 `연구원 3급`(기본급 월 3,316,667원)이다. `increaseAmount=150000`을 대입하면 `afterBaseAmount`는 `3,316,667 + 150,000 = 3,466,667`이어야 한다. `computeAfterItems`가 `applyAdjustments(items, [{itemName:'기본급', type:'fixed', value:150000}])`를 호출하므로, `js/calc/scenario.js`의 `applyAdjustments` 구현(`item.amount + adjustment.value`, fixed 타입)과 정확히 일치한다.

- [ ] **Step 3: Commit**

```bash
git add js/ui/scenario-tab.js
git commit -m "Rewrite scenario tab as a single live inline-edit table"
```

---

### Task 3: 시나리오 탭 — 가상 직급 추가/삭제

**Files:**
- Modify: `js/ui/scenario-tab.js`

**Interfaces:**
- 변경 없음 — `renderScenarioTab`의 시그니처와 반환값은 Task 2와 동일하게 유지.

- [ ] **Step 1: 가상 직급 입력 폼을 템플릿에 추가**

`render()` 함수의 템플릿 문자열에서, `#scenario-export-target` div 안의 `<div class="table-wrapper">...</div>` 블록과 `<p class="export-disclaimer">` 사이에 아래를 삽입:

```html
        <div class="new-item-form">
          <input type="text" class="new-item-name" id="virtual-grade-name" placeholder="가상 직급명" />
          <input type="number" class="new-item-amount" id="virtual-grade-amount" placeholder="월 기본급(원)" value="0" />
          <button class="btn btn-small" id="add-virtual-grade-btn" type="button">+ 가상 직급 추가</button>
        </div>
        <p class="new-item-error" id="virtual-grade-error"></p>
```

- [ ] **Step 2: 가상 직급 추가 버튼 리스너 추가**

`render()` 함수 안, 기존 `#bulk-increase-rate` 리스너 등록 다음(그리고 `dependentsLabelEl` 처리 이전 또는 이후, 순서 무관)에 추가:

```js
    container.querySelector('#add-virtual-grade-btn').addEventListener('click', () => {
      const nameInput = container.querySelector('#virtual-grade-name');
      const amountInput = container.querySelector('#virtual-grade-amount');
      const errorEl = container.querySelector('#virtual-grade-error');
      const name = nameInput.value.trim();
      const amount = Number(amountInput.value) || 0;
      if (!name) return;
      const isDuplicate = rowStates.some((row) => row.grade === name);
      if (isDuplicate) {
        errorEl.textContent = `이미 존재하는 직급 이름입니다: ${name}`;
        return;
      }
      errorEl.textContent = '';
      rowStates = [
        ...rowStates,
        {
          grade: name,
          isVirtual: true,
          items: [{ name: '기본급', amount, taxable: true }],
          increaseAmount: 0,
          increaseRate: 0,
        },
      ];
      render();
    });
```

- [ ] **Step 3: 가상 직급 행에 삭제 버튼 표시**

`renderRows()` 함수 안, 각 행 템플릿의 첫 `<td>`를:
```js
        <td>${escapeHtml(row.grade)}</td>
```
아래로 교체:
```js
        <td>${escapeHtml(row.grade)}${row.isVirtual ? ' <button class="btn btn-small remove-virtual-btn" type="button">삭제</button>' : ''}</td>
```

- [ ] **Step 4: 삭제 버튼 리스너 추가**

`renderRows()` 함수 안, `rowStates.forEach((row, index) => { ... })` 루프 내부, `rateInput.addEventListener('input', ...)` 블록 다음에 추가:

```js
      const removeBtn = tr.querySelector('.remove-virtual-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          rowStates = rowStates.filter((r) => r !== row);
          renderRows();
        });
      }
```

- [ ] **Step 5: 검증**

Run: `node --check js/ui/scenario-tab.js`
Expected: 문법 오류 없음

Run: `node --test tests/*.test.mjs`
Expected: 13/13 PASS

코드 읽기로 확인: `add-virtual-grade-btn` 클릭 시 이름이 비어 있으면(`!name`) 아무 일도 일어나지 않는지, 기존 직급명(예: `연구원 3급`)과 같은 이름을 입력하면 `isDuplicate`가 `true`가 되어 에러 메시지만 뜨고 `rowStates`에 추가되지 않는지 코드를 다시 읽어 확인한다.

- [ ] **Step 6: Commit**

```bash
git add js/ui/scenario-tab.js
git commit -m "Add virtual grade addition/removal to scenario tab"
```

---

### Task 4: main.js 배선 정리 · CSS 정리 · 최종 검증

**Files:**
- Modify: `js/main.js`
- Modify: `css/style.css`

**Interfaces:**
- 없음 (배선 + 스타일 + 검증)

- [ ] **Step 1: `js/main.js`의 `renderScenarioTab` 호출부 단순화**

현재:
```js
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getSelectedGrade: statusApi.getSelectedGrade,
  getDependents: statusApi.getDependents,
});
```
아래로 교체(`getSelectedGrade` 줄 삭제):
```js
const scenarioApi = renderScenarioTab(document.getElementById('tab-scenario'), {
  wageTable,
  taxRules,
  getDependents: statusApi.getDependents,
});
```

- [ ] **Step 2: 탭 클릭 리스너의 메서드명 변경**

현재:
```js
    if (target === 'scenario') {
      scenarioApi.refreshComparison();
    }
```
아래로 교체:
```js
    if (target === 'scenario') {
      scenarioApi.refresh();
    }
```

- [ ] **Step 3: `css/style.css`에서 사용하지 않게 된 규칙 제거**

`table.wage-table, table.scenario-adjust-table` 블록(3곳: 기본 스타일, `th/td` 패딩, `:first-child` 정렬)에서 `, table.scenario-adjust-table`과 `table.scenario-adjust-table th, table.scenario-adjust-table td`, `table.scenario-adjust-table th:first-child, table.scenario-adjust-table td:first-child` 부분을 제거해 아래 3개 블록으로 교체:

```css
table.wage-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  font-size: 0.9rem;
}

table.wage-table th, table.wage-table td {
  border: 1px solid var(--color-border);
  padding: 8px 10px;
  text-align: right;
}

table.wage-table th:first-child, table.wage-table td:first-child {
  text-align: left;
}
```

아래 3개 규칙 블록을 완전히 삭제한다(더 이상 어떤 HTML에서도 참조하지 않음):

```css
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
```

```css
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

- [ ] **Step 4: `css/style.css`에 새 스타일 추가**

파일 끝에 추가:

```css
.bulk-apply-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.bulk-apply-row label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.bulk-apply-row input {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  width: 140px;
}

#scenario-live-table input[type="number"] {
  width: 100px;
  padding: 4px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
```

- [ ] **Step 5: 전체 검증**

Run: `node --check js/main.js`
Expected: 문법 오류 없음

Run: `node --test tests/*.test.mjs`
Expected: 13/13 PASS

Run: `grep -rn "scenario-card\|scenario-name-input\|new-items-list\|scenario-adjust-table\|refreshComparison\|getSelectedGrade: statusApi" js/ css/`
Expected: 결과 없음(모두 제거되어 더 이상 참조되지 않음을 확인)

Run: (로컬 서버가 안 떠 있으면) `python3 -m http.server 8099 &`, 이후:
```bash
curl -s http://localhost:8099/index.html | grep -c 'tab-scenario\|tab-status'
curl -s http://localhost:8099/js/main.js | grep -c "getDependents: statusApi.getDependents"
curl -s http://localhost:8099/js/ui/scenario-tab.js | grep -c "bulk-increase-amount\|bulk-increase-rate\|virtual-grade-name\|virtual-grade-amount\|add-virtual-grade-btn"
```
Expected: 각각 0이 아닌 값(관련 id/문자열이 실제로 파일에 존재함을 구조적으로 확인)

- [ ] **Step 6: Commit**

```bash
git add js/main.js css/style.css
git commit -m "Wire simplified scenario tab into main.js and clean up unused CSS"
```

---

## Self-Review Notes

- **Spec coverage:** 설계 문서의 모든 섹션(연 임금 표시, 일괄 적용 인상액/인상률, 행별 인상액↔인상률 자동 변환, 라이브 갱신/포커스 유지, 가상 직급 추가/삭제, 제거되는 기능, 인터페이스 변경)이 Task 1~4에 매핑됨.
- **Placeholder scan:** 모든 코드 블록이 실행 가능한 완전한 코드다. TBD/TODO 없음.
- **Type consistency:** `renderScenarioTab(container, {wageTable, taxRules, getDependents}) -> {refresh}` 시그니처가 Task 2에서 정의되고 Task 3(같은 파일 계속 수정)과 Task 4(main.js 소비)에서 정확히 동일하게 사용됨. `row.increaseAmount`/`row.increaseRate`/`row.items`/`row.isVirtual`/`row.grade` 필드명이 Task 2~3 전체에서 일관됨.
