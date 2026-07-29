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
