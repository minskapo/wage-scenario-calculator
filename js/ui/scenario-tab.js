import { applyAdjustments } from '../calc/scenario.js';
import { calculateNetPay } from '../calc/net-pay.js';
import { formatWon, escapeHtml, formatNumberInput, parseNumberInput } from './format.js';

export function renderScenarioTab(container, { wageTable, taxRules, getDependents, getYouthTaxReduction }) {
  let rowStates = wageTable.map((grade) => ({
    grade: grade.grade,
    isVirtual: false,
    items: grade.items,
    increaseAmount: 0,
    increaseRate: 0,
  }));
  let sortMode = 'custom'; // 'custom' | 'desc'(직급 높은 순) | 'asc'(직급 낮은 순)
  let draggedRow = null;

  function getBaseAmount(items) {
    return items.find((item) => item.name === '기본급')?.amount ?? 0;
  }

  function getBaseAnnualAmount(items) {
    const base = items.find((item) => item.name === '기본급');
    if (!base) return 0;
    return base.annualAmount ?? base.amount * 12;
  }

  function annualWageOf(items) {
    return items.reduce((sum, item) => sum + (item.annualAmount ?? item.amount * 12), 0);
  }

  function otherItemsAnnualTotal(items) {
    return items
      .filter((item) => item.name !== '기본급')
      .reduce((sum, item) => sum + (item.annualAmount ?? item.amount * 12), 0);
  }

  function computeCurrent(row) {
    return calculateNetPay(row.items, getDependents(), taxRules, { youthTaxReduction: getYouthTaxReduction() });
  }

  function computeAfterItems(row) {
    return applyAdjustments(row.items, [{ itemName: '기본급', type: 'fixed', value: row.increaseAmount }]);
  }

  function computeAfter(row) {
    return calculateNetPay(computeAfterItems(row), getDependents(), taxRules, {
      youthTaxReduction: getYouthTaxReduction(),
    });
  }

  function afterBaseAmount(row) {
    return getBaseAmount(row.items) + row.increaseAmount;
  }

  // 인상 후 항목은 applyAdjustments가 만든 새 amount만 정확하고 annualAmount는 조정 전 값이
  // 그대로 남아있으므로(applyAdjustments가 amount만 덮어씀), 연 임금은 매번 이렇게 직접 계산합니다.
  // afterBaseAmount(월)*12가 아니라 정확한 연 기본급(getBaseAnnualAmount)에 인상액*12를 더하는 방식으로
  // 계산해야, 인상액이 0일 때 "인상 후 연 임금"이 "현재 연 임금"과 원 단위까지 완전히 같아집니다
  // (월 환산 반올림을 거치는 afterBaseAmount*12는 인상액 0에서도 협약 원문 숫자와 몇 원씩 어긋남).
  function afterAnnualWage(row) {
    return getBaseAnnualAmount(row.items) + row.increaseAmount * 12 + otherItemsAnnualTotal(row.items);
  }

  function setIncreaseFromTargetAnnualWage(row, targetAnnualWage) {
    const baseAnnual = getBaseAnnualAmount(row.items);
    const otherAnnual = otherItemsAnnualTotal(row.items);
    row.increaseAmount = Math.round((targetAnnualWage - otherAnnual - baseAnnual) / 12);
    const base = getBaseAmount(row.items);
    row.increaseRate = base === 0 ? 0 : Math.round((row.increaseAmount / base) * 1000) / 10;
  }

  function rateLabel(current, after) {
    if (current.netPay === 0) return '-';
    const rate = ((after.netPay - current.netPay) / current.netPay) * 100;
    return `${rate.toFixed(1)}%`;
  }

  // 표 전체(<table id="scenario-live-table">)에 한 번만 붙이는 위임 리스너입니다.
  // renderRows()는 <tbody>의 자식만 다시 그리므로(입력 중 포커스 유지 목적) table 요소 자체는
  // 그대로 남아있어 재부착 없이도 계속 동작합니다. 전체 일괄 적용/가상 직급 추가처럼
  // render()가 table 자체를 다시 만드는 경우에만 render()에서 다시 호출해 재부착합니다.
  function attachCellHighlight(table) {
    if (!table) return;
    table.addEventListener('click', (e) => {
      const cell = e.target.closest('td, th');
      if (!cell || !table.contains(cell)) return;

      table.querySelectorAll('.row-highlight, .col-highlight, .cell-highlight').forEach((el) => {
        el.classList.remove('row-highlight', 'col-highlight', 'cell-highlight');
      });

      const tr = cell.closest('tr');
      const colIndex = cell.cellIndex;
      table.querySelectorAll('tr').forEach((row) => {
        if (row === tr) row.classList.add('row-highlight');
        const colCell = row.children[colIndex];
        if (colCell) colCell.classList.add('col-highlight');
      });
      cell.classList.add('cell-highlight');
    });
  }

  function render() {
    container.innerHTML = `
      <div class="card">
        <h2>전체 일괄 적용</h2>
        <div class="bulk-apply-row">
          <label>인상액(원) <input type="text" inputmode="numeric" id="bulk-increase-amount" placeholder="예: 150,000" /></label>
          <label>인상률(%) <input type="number" id="bulk-increase-rate" step="0.1" placeholder="예: 5" /></label>
        </div>
      </div>
      <label class="sort-mode-label">
        정렬
        <select id="sort-mode-select">
          <option value="custom" ${sortMode === 'custom' ? 'selected' : ''}>기본 순서 (행을 드래그해서 변경 가능)</option>
          <option value="desc" ${sortMode === 'desc' ? 'selected' : ''}>직급 높은 순</option>
          <option value="asc" ${sortMode === 'asc' ? 'selected' : ''}>직급 낮은 순</option>
        </select>
      </label>
      <div id="scenario-export-target">
        <h3>임금인상 시나리오</h3>
        <div class="table-wrapper">
          <table class="wage-table" id="scenario-live-table">
            <thead>
              <tr>
                <th>직급</th>
                <th>현재 연 임금</th>
                <th>현재 월 기본급</th>
                <th>인상액(원)</th>
                <th>인상률(%)</th>
                <th>인상 후 연 임금</th>
                <th>인상 후 월 기본급</th>
              </tr>
            </thead>
            <tbody id="scenario-live-tbody"></tbody>
          </table>
        </div>
        <p class="export-disclaimer">* 부양가족 <span id="scenario-dependents-label"></span>인(본인 포함) 기준<span id="scenario-youth-tax-label"></span>. 인상액/인상률/인상 후 연 임금 중 아무 칸이나 입력하면 나머지 두 칸이 자동으로 맞춰집니다. 기본급/연 임금 숫자 위에 마우스를 올리면 월 실수령액을 볼 수 있습니다(간이 추정치이며 실제 급여명세서와 차이가 있을 수 있습니다).</p>
      </div>
      <div class="new-item-form">
        <input type="text" class="new-item-name" id="virtual-grade-name" placeholder="직급명" />
        <input type="text" inputmode="numeric" class="new-item-amount" id="virtual-grade-amount" placeholder="연 기본급(원)" value="0" />
        <button class="btn btn-small" id="add-virtual-grade-btn" type="button">+ 직급 추가</button>
      </div>
      <p class="new-item-error" id="virtual-grade-error"></p>
      <button class="btn export-btn" id="scenario-export-btn" type="button">이미지로 저장</button>
    `;

    renderRows();
    attachCellHighlight(container.querySelector('#scenario-live-table'));

    const bulkAmountInput = container.querySelector('#bulk-increase-amount');
    bulkAmountInput.addEventListener('input', (e) => {
      const amount = parseNumberInput(e.target.value);
      rowStates.forEach((row) => {
        row.increaseAmount = amount;
        const base = getBaseAmount(row.items);
        row.increaseRate = base === 0 ? 0 : Math.round((amount / base) * 1000) / 10;
      });
      renderRows();
    });
    bulkAmountInput.addEventListener('blur', (e) => {
      if (e.target.value.trim() === '') return;
      e.target.value = formatNumberInput(parseNumberInput(e.target.value));
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
      const annualAmount = parseNumberInput(amountInput.value);
      const amount = Math.round(annualAmount / 12);
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
          items: [{ name: '기본급', amount, annualAmount, taxable: true }],
          increaseAmount: 0,
          increaseRate: 0,
        },
      ];
      render();
    });

    container.querySelector('#virtual-grade-amount').addEventListener('blur', (e) => {
      if (e.target.value.trim() === '') return;
      e.target.value = formatNumberInput(parseNumberInput(e.target.value));
    });

    container.querySelector('#sort-mode-select').addEventListener('change', (e) => {
      sortMode = e.target.value;
      if (sortMode === 'desc') {
        rowStates = [...rowStates].sort((a, b) => annualWageOf(b.items) - annualWageOf(a.items));
      } else if (sortMode === 'asc') {
        rowStates = [...rowStates].sort((a, b) => annualWageOf(a.items) - annualWageOf(b.items));
      }
      renderRows();
    });
  }

  function renderRows() {
    const dependentsLabelEl = container.querySelector('#scenario-dependents-label');
    if (dependentsLabelEl) dependentsLabelEl.textContent = getDependents();

    const youthTaxLabelEl = container.querySelector('#scenario-youth-tax-label');
    if (youthTaxLabelEl) youthTaxLabelEl.textContent = getYouthTaxReduction() ? ', 청년 소득세 감면 적용' : '';

    const tbody = container.querySelector('#scenario-live-tbody');
    if (!tbody) return;

    tbody.innerHTML = rowStates
      .map((row) => {
        const current = computeCurrent(row);
        const after = computeAfter(row);
        return `
      <tr>
        <td>${escapeHtml(row.grade)}${row.isVirtual ? ' <button class="btn btn-small remove-virtual-btn" type="button">삭제</button>' : ''}</td>
        <td title="월 실수령액: ${formatWon(current.netPay)}">${formatWon(annualWageOf(row.items))}</td>
        <td title="월 실수령액: ${formatWon(current.netPay)}">${formatWon(getBaseAmount(row.items))}</td>
        <td><input type="text" inputmode="numeric" class="row-increase-amount" value="${formatNumberInput(row.increaseAmount)}" /></td>
        <td><input type="number" class="row-increase-rate" step="0.1" value="${row.increaseRate}" /></td>
        <td><input type="text" inputmode="numeric" class="row-after-annual" title="월 실수령액: ${formatWon(after.netPay)} (${rateLabel(current, after)})" value="${formatNumberInput(afterAnnualWage(row))}" /></td>
        <td class="cell-after-base" title="월 실수령액: ${formatWon(after.netPay)} (${rateLabel(current, after)})">${formatWon(afterBaseAmount(row))}</td>
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
      const afterAnnualInput = tr.querySelector('.row-after-annual');

      amountInput.addEventListener('input', (e) => {
        const amount = parseNumberInput(e.target.value);
        row.increaseAmount = amount;
        const base = getBaseAmount(row.items);
        row.increaseRate = base === 0 ? 0 : Math.round((amount / base) * 1000) / 10;
        rateInput.value = row.increaseRate;
        updateRowResultCells(tr, row, { skip: 'amount' });
      });
      amountInput.addEventListener('blur', (e) => {
        e.target.value = formatNumberInput(row.increaseAmount);
      });

      rateInput.addEventListener('input', (e) => {
        const rate = Number(e.target.value) || 0;
        row.increaseRate = rate;
        const base = getBaseAmount(row.items);
        row.increaseAmount = Math.round(base * (rate / 100));
        amountInput.value = formatNumberInput(row.increaseAmount);
        updateRowResultCells(tr, row, { skip: 'rate' });
      });

      afterAnnualInput.addEventListener('input', (e) => {
        const targetAnnualWage = parseNumberInput(e.target.value);
        setIncreaseFromTargetAnnualWage(row, targetAnnualWage);
        amountInput.value = formatNumberInput(row.increaseAmount);
        rateInput.value = row.increaseRate;
        updateRowResultCells(tr, row, { skip: 'annual' });
      });
      afterAnnualInput.addEventListener('blur', (e) => {
        e.target.value = formatNumberInput(afterAnnualWage(row));
      });

      const removeBtn = tr.querySelector('.remove-virtual-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          rowStates = rowStates.filter((r) => r !== row);
          renderRows();
        });
      }

      tr.setAttribute('draggable', 'true');

      tr.addEventListener('dragstart', () => {
        draggedRow = row;
        tr.classList.add('row-dragging');
      });

      tr.addEventListener('dragend', () => {
        draggedRow = null;
        tr.classList.remove('row-dragging');
      });

      tr.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      tr.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedRow || draggedRow === row) return;
        const fromIndex = rowStates.indexOf(draggedRow);
        const toIndex = rowStates.indexOf(row);
        const reordered = [...rowStates];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, draggedRow);
        rowStates = reordered;
        sortMode = 'custom';
        renderRows();
        const sortSelect = container.querySelector('#sort-mode-select');
        if (sortSelect) sortSelect.value = 'custom';
      });
    });
  }

  function updateRowResultCells(tr, row, { skip } = {}) {
    const current = computeCurrent(row);
    const after = computeAfter(row);
    const tooltip = `월 실수령액: ${formatWon(after.netPay)} (${rateLabel(current, after)})`;

    const baseCell = tr.querySelector('.cell-after-base');
    baseCell.textContent = formatWon(afterBaseAmount(row));
    baseCell.title = tooltip;

    const annualInput = tr.querySelector('.row-after-annual');
    annualInput.title = tooltip;
    if (skip !== 'annual') annualInput.value = formatNumberInput(afterAnnualWage(row));
  }

  render();

  return {
    refresh: () => renderRows(),
  };
}
