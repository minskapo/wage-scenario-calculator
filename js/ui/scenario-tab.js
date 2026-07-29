import { applyScenarioToGrade } from '../calc/scenario.js';
import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon, escapeHtml } from './format.js';

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
        <p class="export-disclaimer">* 실수령액은 간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다.</p>
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
        <input type="text" class="scenario-name-input" value="${escapeHtml(scenario.name)}" />
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
      <p class="new-item-error"></p>
      ${
        scenario.newItems.length
          ? `<ul class="new-items-list">
              ${scenario.newItems
                .map(
                  (item, idx) =>
                    `<li>${escapeHtml(item.name)}: ${item.amount.toLocaleString('ko-KR')}원 <button class="btn btn-small remove-new-item-btn" data-idx="${idx}" type="button">삭제</button></li>`
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
      const errorEl = el.querySelector('.new-item-error');
      const name = nameInput.value.trim();
      const amount = Number(amountInput.value) || 0;
      if (!name) return;
      const isDuplicate =
        itemNames.includes(name) || scenario.newItems.some((item) => item.name === name);
      if (isDuplicate) {
        if (errorEl) errorEl.textContent = `이미 존재하는 항목 이름입니다: ${name}`;
        return;
      }
      if (errorEl) errorEl.textContent = '';
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
          ${scenarios.map((s) => `<th>${escapeHtml(s.name)}</th>`).join('')}
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
            <td>${escapeHtml(scenario.name)}</td>
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
