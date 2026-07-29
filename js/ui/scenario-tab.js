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
        <div class="new-item-form">
          <input type="text" class="new-item-name" id="virtual-grade-name" placeholder="가상 직급명" />
          <input type="number" class="new-item-amount" id="virtual-grade-amount" placeholder="월 기본급(원)" value="0" />
          <button class="btn btn-small" id="add-virtual-grade-btn" type="button">+ 가상 직급 추가</button>
        </div>
        <p class="new-item-error" id="virtual-grade-error"></p>
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
        <td>${escapeHtml(row.grade)}${row.isVirtual ? ' <button class="btn btn-small remove-virtual-btn" type="button">삭제</button>' : ''}</td>
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

      const removeBtn = tr.querySelector('.remove-virtual-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          rowStates = rowStates.filter((r) => r !== row);
          renderRows();
        });
      }
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
